const API_BASE_URL = 'http://127.0.0.1:5000';

export const api = {
  // Placeholder for any categories if needed by frontend
  async getCategories() {
    return [{ id: 'Textile', name: 'Textile' }, { id: 'Ceramic', name: 'Ceramic' }, { id: 'Metal', name: 'Metal' }];
  },

  async getProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return await response.json();
    } catch (error) {
      console.error('getProducts Error:', error);
      throw error;
    }
  },

  async getStats(productId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('getStats Error:', error);
      throw error;
    }
  },

  async calibrate(productId, files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/calibrate`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Calibration failed');
      return await response.json();
    } catch (error) {
      console.error('Calibration Error:', error);
      throw error;
    }
  },

  async inspect(productId, file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/inspect`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Inspection inference failed');
      }
      return await response.json(); // { anomaly_score, pass, heatmap_base64 }
    } catch (error) {
      console.error('Inspection Error:', error);
      throw error;
    }
  },

  async getReport(productId, productCategory, anomalyScore, heatmapBase64) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_category: productCategory,
          anomaly_score: anomalyScore,
          heatmap_base64: heatmapBase64
        })
      });
      if (!response.ok) throw new Error('Failed to generate report');
      return await response.json(); // { defect_type, location, cause_explanation, suggested_fix }
    } catch (error) {
      console.error('Report Error:', error);
      throw error;
    }
  }
};
