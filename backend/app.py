import os
import json
import uuid
import random
from datetime import datetime
from flask import Flask, request, redirect, url_for, render_template, flash, jsonify
from flask_cors import CORS

try:
    from ai.inference import inspect_image
    from ai.calibrate import calibrate_product
except ImportError:
    # Fallback for local dev if ai module isn't properly set up
    def inspect_image(product_id, path): return {"status": "fail", "anomaly_score": 75, "heatmap_base64": ""}
    def calibrate_product(product_id, path): pass

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

app = Flask(__name__)
CORS(app)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.secret_key = "supersecretkey"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs("models", exist_ok=True)
BILLING_HISTORY_FILE = "billing_history.json"
USERS_FILE = "users.json"
TEMPLATES_FILE = "templates.json"
INSPECTIONS_FILE = "inspections.json"

def load_json(filename, default=[]):
    if not os.path.exists(filename):
        return default
    with open(filename, "r") as f:
        try:
            return json.load(f)
        except:
            return default

def save_json(filename, data):
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)

def get_billing_history():
    return load_json(BILLING_HISTORY_FILE)

def save_to_billing_history(transaction):
    history = get_billing_history()
    transaction["date"] = datetime.now().isoformat()
    transaction["status"] = "success"
    history.insert(0, transaction)
    save_json(BILLING_HISTORY_FILE, history)
    return transaction

CATEGORIES = [
    {
        "id": "textile",
        "name": "Textile / Fabric",
        "shortDescription": "Woven materials including denim, silk, and synthetic blends.",
        "commonDefects": ["Thread pull", "Weave anomaly", "Stain detection", "Color drift"]
    },
    {
        "id": "ceramic",
        "name": "Ceramic Tile",
        "shortDescription": "Surface inspection for glaze uniformity and structural integrity.",
        "commonDefects": ["Glaze crack", "Kiln spot", "Edge chip", "Dimension error"]
    },
    {
        "id": "metal",
        "name": "Metal Surface",
        "shortDescription": "Industrial metal sheets, casings, and high-precision components.",
        "commonDefects": ["Scratch detection", "Dent identification", "Rust spotting", "Warping"]
    }
]

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/api/categories", methods=["GET"])
def get_categories():
    return jsonify(CATEGORIES)

# --- AUTH ROUTES ---

@app.route("/api/auth/signup", methods=["POST"])
def auth_signup():
    data = request.json
    users = load_json(USERS_FILE)
    if any(u['email'] == data['email'] for u in users):
        return jsonify({"error": "User already exists"}), 400
    
    new_user = {
        "id": str(uuid.uuid4()),
        "name": data.get("name", "New User"),
        "email": data["email"],
        "password": data["password"], # In real app, hash this!
        "role": data.get("role", "technician"),
        "company": data.get("company", "Independent"),
        "createdAt": datetime.now().isoformat()
    }
    users.append(new_user)
    save_json(USERS_FILE, users)
    return jsonify(new_user)

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.json
    users = load_json(USERS_FILE)
    user = next((u for u in users if u['email'] == data['email'] and u['password'] == data['password']), None)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401
    return jsonify(user)

# --- TEMPLATE ROUTES ---

@app.route("/api/templates", methods=["GET"])
def get_templates():
    return jsonify(load_json(TEMPLATES_FILE))

@app.route("/api/templates", methods=["POST"])
def create_template():
    data = request.json
    templates = load_json(TEMPLATES_FILE)
    new_template = {
        "id": f"tpl_{int(datetime.now().timestamp())}",
        "name": data["name"],
        "category": data["category"],
        "status": "draft",
        "referenceImageCount": 0,
        "updatedAt": datetime.now().isoformat()
    }
    templates.insert(0, new_template)
    save_json(TEMPLATES_FILE, templates)
    return jsonify(new_template)

@app.route("/api/upload", methods=["POST"])
def upload_file():
    category = request.form.get("category")
    files = request.files.getlist("files")
    
    if not category:
        return jsonify({"error": "No category provided"}), 400
    if not files:
        return jsonify({"error": "No files provided"}), 400

    uploaded_files = []
    for file in files:
        if file and allowed_file(file.filename):
            filename = f"{category}_{file.filename}"
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)
            uploaded_files.append(filename)

    import random

    # Placeholder logic for CV model integration
    # When CV is ready, process the uploaded_files here
    is_fail = random.choice([True, False])
    anomaly_score = random.randint(60, 100) if is_fail else random.randint(1, 20)
    severity = random.choice(["High", "Medium"]) if is_fail else "Low"
    likely_issue = "Surface Discontinuity / Material Anomaly" if is_fail else "None detected"

    return jsonify({
        "message": f"Successfully processed {len(uploaded_files)} files for category {category}",
        "files": uploaded_files,
        "inference": {
            "status": "fail" if is_fail else "pass",
            "anomalyScore": anomaly_score,
            "severity": severity,
            "likelyIssue": likely_issue
        }
    })

@app.route("/api/products/<product_id>/calibrate", methods=["POST"])
def calibrate_api(product_id):
    files = request.files.getlist("files")
    if not files:
        return jsonify({"status": "error", "message": "No files uploaded"}), 400
        
    product_dir = os.path.join(app.config["UPLOAD_FOLDER"], product_id)
    os.makedirs(product_dir, exist_ok=True)
    
    uploaded_count = 0
    for f in files:
        if f and allowed_file(f.filename):
            f.save(os.path.join(product_dir, f.filename))
            uploaded_count += 1
            
    try:
        calib_stats = calibrate_product(product_id, product_dir)
        accuracy = calib_stats.get('accuracy', 98.4)
        
        # UPDATE TEMPLATE STATUS
        templates = load_json(TEMPLATES_FILE)
        updated = False
        for t in templates:
            if t['id'] == product_id:
                t['status'] = 'ready'
                t['referenceImageCount'] = uploaded_count
                t['accuracy'] = accuracy
                t['updatedAt'] = datetime.now().isoformat()
                updated = True
                break
        
        if updated:
            save_json(TEMPLATES_FILE, templates)
            
        return jsonify({
            "status": "success", 
            "product_id": product_id, 
            "image_count": uploaded_count,
            "accuracy": accuracy
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/products/<product_id>/report", methods=["POST"])
def report_api(product_id):
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "Missing JSON body"}), 400
        
    product_category = data.get("product_category", "Unknown")
    anomaly_score = data.get("anomaly_score", 0.0)
    
    # Simple report generation logic
    report_json = {
        "id": f"REP-{uuid.uuid4().hex[:6].upper()}",
        "product_id": product_id,
        "category": product_category,
        "anomaly_score": anomaly_score,
        "status": "fail" if anomaly_score > 25 else "pass",
        "timestamp": datetime.now().isoformat()
    }
    return jsonify(report_json)

@app.route("/api/inspections", methods=["GET"])
def get_inspections():
    return jsonify(load_json(INSPECTIONS_FILE))

@app.route("/api/products/<product_id>/inspect", methods=["POST"])
def inspect_api(product_id):
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No image provided"}), 400
        
    file = request.files["file"]
    if not file or not allowed_file(file.filename):
        return jsonify({"status": "error", "message": "Invalid file format"}), 400
        
    temp_path = os.path.join(app.config["UPLOAD_FOLDER"], f"temp_{file.filename}")
    file.save(temp_path)
    
    try:
        # Check if model exists
        model_path = os.path.join('models', f'{product_id}.pkl')
        if not os.path.exists(model_path):
            # Fallback for testing/simulation
            result = {
                "status": "pass" if random.random() > 0.3 else "fail",
                "anomaly_score": random.randint(5, 80),
                "heatmap_base64": ""
            }
        else:
            ai_output = inspect_image(product_id, temp_path)
            result = {
                "status": "pass" if ai_output["pass"] else "fail",
                "anomaly_score": round(ai_output["anomaly_score"], 2),
                "heatmap_base64": ai_output["heatmap_base64"]
            }
        
        # Log to inspection history asynchronously (simulated by updating JSON immediately but returning result faster)
        inspections = load_json(INSPECTIONS_FILE)
        templates = load_json(TEMPLATES_FILE)
        model_info = next((t for t in templates if t['id'] == product_id), {})
        model_accuracy = model_info.get('accuracy', 98.4)

        new_entry = {
            "id": f"INS-{random.randint(1000, 9999)}",
            "templateName": product_id, 
            "category": "Detection", 
            "timestamp": datetime.now().isoformat(),
            "status": result["status"],
            "anomalyScore": result["anomaly_score"],
            "severity": "High" if result["status"] == "fail" else "Low",
            "modelAccuracy": model_accuracy,
            "likelyIssue": "Surface Discontinuity / Material Anomaly" if result["status"] == "fail" else "Consistent Surface"
        }
        inspections.insert(0, new_entry)
        save_json(INSPECTIONS_FILE, inspections)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # Build full Telemetry package
        return jsonify({
            **result,
            "id": new_entry["id"],
            "templateName": model_info.get('name', product_id),
            "category": model_info.get('category', 'Detection'),
            "modelAccuracy": model_accuracy,
            "likelyIssue": new_entry["likelyIssue"],
            "severity": new_entry["severity"]
        })
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/billing/history", methods=["GET"])
def billing_history_api():
    return jsonify(get_billing_history())

@app.route("/api/billing/transaction", methods=["POST"])
def save_transaction_api():
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "No data provided"}), 400
    
    saved = save_to_billing_history(data)
    return jsonify({"status": "success", "transaction": saved})

if __name__ == "__main__":
    app.run(debug=True, port=5005)