import os
import json
import uuid
from datetime import datetime
from flask import Flask, request, redirect, url_for, render_template, flash, jsonify
from flask_cors import CORS
from ai.calibrate import calibrate_product
from ai.inference import inspect_image
from ai.report import generate_defect_report

UPLOAD_FOLDER = "uploads"
DATA_FOLDER = "data"
STATS_FILE = os.path.join(DATA_FOLDER, "stats.json")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

app = Flask(__name__)
CORS(app)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.secret_key = "supersecretkey"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

def get_stats():
    if not os.path.exists(STATS_FILE):
        return {}
    try:
        with open(STATS_FILE, "r") as f:
            return json.load(f)
    except:
        return {}

def save_stats(stats):
    with open(STATS_FILE, "w") as f:
        json.dump(stats, f)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BILLING_HISTORY_FILE = os.path.join(BASE_DIR, "billing_history.json")
USERS_FILE = os.path.join(BASE_DIR, "users.json")
TEMPLATES_FILE = os.path.join(BASE_DIR, "templates.json")
INSPECTIONS_FILE = os.path.join(BASE_DIR, "inspections.json")

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

@app.route("/api/products", methods=["GET"])
def get_products():
    models_dir = "models"
    if not os.path.exists(models_dir):
        return jsonify({"products": []})
    
    products = [f[:-4] for f in os.listdir(models_dir) if f.endswith(".pkl")]
    return jsonify({"products": products})

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
    
    for f in files:
        if f and allowed_file(f.filename):
            f.save(os.path.join(product_dir, f.filename))
            
    try:
        calibrate_product(product_id, product_dir)
        return jsonify({"status": "success", "product_id": product_id})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/products/<product_id>/stats", methods=["GET"])
def get_product_stats(product_id):
    stats = get_stats()
    product_stats = stats.get(product_id, {"total_scanned": 0, "total_approved": 0, "total_defective": 0})
    return jsonify(product_stats)

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
        result = inspect_image(product_id, temp_path)
        
        # Update stats
        stats = get_stats()
        if product_id not in stats:
            stats[product_id] = {"total_scanned": 0, "total_approved": 0, "total_defective": 0}
            
        stats[product_id]["total_scanned"] += 1
        if result.get("pass", False):
            stats[product_id]["total_approved"] += 1
        else:
            stats[product_id]["total_defective"] += 1
            
        save_stats(stats)
        
        # --- start DB history logging ---
        templates = load_json(TEMPLATES_FILE)
        model_info = next((t for t in templates if t['id'] == product_id), {})
        model_accuracy = model_info.get('accuracy', 98.4)
        
        inspections = load_json(INSPECTIONS_FILE)
        new_entry = {
            "id": f"INS-{__import__('random').randint(1000, 9999)}",
            "templateName": product_id, 
            "category": "Detection", 
            "timestamp": datetime.now().isoformat(),
            "status": "pass" if result.get("pass", False) else "fail",
            "anomalyScore": result.get("anomaly_score", 0),
            "severity": "High" if not result.get("pass", False) else "Low",
            "modelAccuracy": model_accuracy,
            "likelyIssue": "Surface Discontinuity / Material Anomaly" if not result.get("pass", False) else "Consistent Surface"
        }
        inspections.insert(0, new_entry)
        save_json(INSPECTIONS_FILE, inspections)
        
        if os.path.exists(temp_path):
            os.remove(temp_path)

        result.update({
            "id": new_entry["id"],
            "templateName": model_info.get('name', product_id),
            "category": model_info.get('category', 'Detection'),
            "modelAccuracy": model_accuracy,
            "likelyIssue": new_entry["likelyIssue"],
            "severity": new_entry["severity"]
        })
        # --- end DB history logging ---
        
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/products/<product_id>/report", methods=["POST"])
def report_api(product_id):
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "Missing JSON body"}), 400
        
    product_category = data.get("product_category", "Unknown")
    anomaly_score = data.get("anomaly_score", 0.0)
    heatmap_base64 = data.get("heatmap_base64", "")
    
    report_json = generate_defect_report(product_id, product_category, anomaly_score, heatmap_base64)
    return jsonify(report_json)


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
    print("Exact request body being sent:", data)
    users = load_json(USERS_FILE)
    user = next((u for u in users if u.get('email') == data.get('email') and u.get('password') == data.get('password')), None)
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

@app.route("/api/inspections", methods=["GET"])
def get_inspections():
    return jsonify(load_json(INSPECTIONS_FILE))

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
    

    app.run(host="0.0.0.0", debug=True, port=5000)
