import os
from flask import Flask, request, jsonify, flash
from flask_cors import CORS

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.secret_key = "supersecretkey"
CORS(app)

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

if __name__ == "__main__":
    app.run(debug=True, port=5005)