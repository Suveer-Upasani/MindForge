# MindForge

MindForge is an AI-powered visual quality inspection SaaS platform. It leverages advanced computer vision to automatically detect, assess, and report manufacturing defects by learning the visual profile of "good" products.

It employs a few-shot feature-extraction pipeline (via ResNet50 in PyTorch without heavy deep-learning training architectures) calculating Mahalanobis distances (PaDiM) per patch region to find and heat-map anomalies locally on the CPU.

## Major Features

- **Automated Defect Detection**: High-precision anomaly detection using PaDiM (Patch Distribution Modeling).
- **Interactive Heatmaps**: Real-time visual overlays showing exactly where defects are detected.
- **Manual Status Override**: Human-in-the-loop validation allows operators to override AI decisions (Fail -> Pass) directly from the inspection view.
- **Real-time Statistics**: Dashboard with pass/fail ratios, historical tracking, and model-level metrics.

## Project Structure

The project is structured into two main applications:

- `frontend/`: React and Vite app containing the dashboard, historic visualization, and file-upload forms.
- `backend/`: Flask powered API running our Python inference and model calibration endpoints.

## Prerequisites

- [Node.js](https://nodejs.org/) (for Vite / React)
- [Python 3.9+](https://www.python.org/) 

## Setup & Run Instructions

### 1. Backend Setup

Open a terminal and navigate to the backend:

```bash
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Unix/Mac
# venv\Scripts\activate   # On Windows

# Install dependencies
pip install -r requirements.txt

# Start the Flask API
python app.py
```

### 2. Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend

# Install Node modules
npm install

# Start the React / Vite server
npm run dev
```

### 3. Testing the Inference Logic

You can test that the model hooks load properly natively via python. This proves the `torchvision.models.resnet50` initializes seamlessly.

```bash
cd backend
python test_model.py
```

## API Routes

### `POST /api/products/<product_id>/calibrate` 
Upload 10-20 "good" quality reference images of a product category. The backend extracts model features, calculates means & covariances and outputs a lightweight pickled statistical representation.

### `POST /api/products/<product_id>/inspect`
Upload a single target image for defect querying against the compiled model. Calculates the bounding map anomaly score returning a rendered raw base64 string heat-map locally.

### `POST /api/inspections/<inspection_id>/pass-override`
Allow a human operator to override an AI failure detection. Updates the global database and statistics to count the product as "Passed".
