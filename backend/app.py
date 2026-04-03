import os
import shutil
from flask import Flask, request, jsonify, redirect, url_for, render_template, flash
from flask_cors import CORS
from ai.calibrate import calibrate_product
from ai.inference import inspect_image
from ai.report import generate_defect_report

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

app = Flask(__name__)
CORS(app)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.secret_key = "supersecretkey"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/", methods=["GET", "POST"])
def upload_file():
    if request.method == "POST":
        category = request.form.get("category")
        files = request.files.getlist("files")
        if not category:
            flash("Please select a category")
            return redirect(request.url)
        if not files or files[0].filename == "":
            flash("No file selected")
            return redirect(request.url)

        uploaded_files = []
        for file in files:
            if file and allowed_file(file.filename):
                filename = f"{category}_{file.filename}"
                filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                file.save(filepath)
                uploaded_files.append(filename)

        flash(f"Uploaded {len(uploaded_files)} file(s) successfully under category '{category}'!")
        return redirect(request.url)

    return render_template("index.html")

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