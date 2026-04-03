import os
from flask import Flask, request, redirect, url_for, render_template, flash, jsonify
from flask_cors import CORS

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

app = Flask(__name__)
CORS(app)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.secret_key = "supersecretkey"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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
        return jsonify({"status": "error", "message": str(e)}), 500

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
        os.remove(temp_path)
        return jsonify(result)
    except Exception as e:
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

if __name__ == "__main__":
    app.run(debug=True, port=5005)