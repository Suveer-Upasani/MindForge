import os
from flask import Flask, request, redirect, url_for, render_template, flash

UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg"}

app = Flask(__name__)
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

if __name__ == "__main__":
    app.run(debug=True, port=5005)