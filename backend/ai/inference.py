import os
import pickle
import numpy as np
import cv2
import base64
from PIL import Image
from scipy.spatial.distance import mahalanobis
from .feature_extractor import FeatureExtractor

def inspect_image(product_id: str, image_path: str):
    """
    Extract features from input image, compute Mahalanobis distance per patch,
    normalize anomaly score, and generate base64 heatmap.
    """
    model_path = os.path.join('models', f'{product_id}.pkl')
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model for product {product_id} not found.")
        
    with open(model_path, 'rb') as f:
        model_data = pickle.load(f)
        
    mean = model_data['mean'] # (C, H*W)
    cov = model_data['cov']   # (C, C, H*W)
    H, W = model_data['grid_shape']
    C = mean.shape[0]
    
    extractor = FeatureExtractor()
    img = Image.open(image_path).convert('RGB')
    feat = extractor.extract(img) # (C, H, W)
    feat_flat = feat.reshape(C, H * W) # (C, H*W)
    
    distances = np.zeros(H * W)
    
    # Compute Mahalanobis distance per patch
    for i in range(H * W):
        x = feat_flat[:, i]
        mu = mean[:, i]
        sigma = cov[:, :, i]
        inv_sigma = np.linalg.inv(sigma)
        
        # mahalanobis function expects 1D arrays
        distances[i] = mahalanobis(x, mu, inv_sigma)
        
    # Reshape to spatial map
    score_map = distances.reshape(H, W)
    
    # Normalize score to 0-1 range (simplified: using typical range values or max distance)
    # A robust implementation would use calibration max validation distance.
    max_d = score_map.max()
    min_d = score_map.min()
    if max_d == min_d:
        normalized_map = np.zeros_like(score_map)
    else:
        normalized_map = (score_map - min_d) / (max_d - min_d)
        
    anomaly_score = float(score_map.max())
    # simplistic arbitrary threshold
    is_pass = anomaly_score < 25.0 
    
    # Heatmap visualization
    heatmap = (normalized_map * 255).astype(np.uint8)
    heatmap_resized = cv2.resize(heatmap, (224, 224), interpolation=cv2.INTER_CUBIC)
    # Apply colormap
    colormap_img = cv2.applyColorMap(heatmap_resized, cv2.COLORMAP_JET)
    
    # Encode to base64
    _, buffer = cv2.imencode('.png', colormap_img)
    heatmap_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return {
        "anomaly_score": anomaly_score,
        "pass": is_pass,
        "heatmap_base64": heatmap_base64
    }
