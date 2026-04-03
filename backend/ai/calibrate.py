import os
import glob
import pickle
import numpy as np
from PIL import Image
from .feature_extractor import FeatureExtractor

def calibrate_product(product_id: str, image_folder_path: str):
    """
    Load good reference images, extract features, and fit a PaDiM model (mean + covariance).
    Saves the computed parameters to models/<product_id>.pkl.
    """
    extractor = FeatureExtractor()
    
    image_paths = glob.glob(os.path.join(image_folder_path, '*'))
    image_paths = [p for p in image_paths if p.lower().endswith(('.png', '.jpg', '.jpeg'))]
    
    if not image_paths:
        raise ValueError("No images found for calibration.")
        
    all_features = []
    
    for path in image_paths:
        img = Image.open(path).convert('RGB')
        feat = extractor.extract(img) # Shape: (C, H, W)
        all_features.append(feat)
        
    # Shape: (N, C, H, W) where C=1536, H=28, W=28
    features = np.stack(all_features, axis=0) 
    N, C, H, W = features.shape
    
    # Reshape to compute statistics per patch position
    # Shape: (N, C, H*W)
    features_flat = features.reshape(N, C, H * W)
    
    mean = np.mean(features_flat, axis=0) # Shape: (C, H*W)
    cov = np.zeros((C, C, H * W))
    
    # Compute covariance matrix per spatial location
    I = np.identity(C)
    for i in range(H * W):
        patch_features = features_flat[:, :, i] # (N, C)
        cov_matrix = np.cov(patch_features, rowvar=False) # (C, C)
        # Add regularization term to make it invertible
        cov[:, :, i] = cov_matrix + 0.01 * I
        
    # Save model
    model_data = {
        'mean': mean,
        'cov': cov,
        'grid_shape': (H, W)
    }
    
    os.makedirs('models', exist_ok=True)
    model_path = os.path.join('models', f'{product_id}.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
        
    return model_path
