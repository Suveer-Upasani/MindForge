const API_BASE_URL = 'http://localhost:5005';

export const api = {
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async uploadInference(category, files) {
    const formData = new FormData();
    formData.append('category', category);
    files.forEach(file => formData.append('files', file));

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Inference upload failed');
      return await response.json();
    } catch (error) {
      console.error('Inference Error:', error);
      throw error;
    }
  }
};
