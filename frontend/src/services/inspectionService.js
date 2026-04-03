import { inspections } from '../data/inspections';

export const getInspections = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...inspections]);
    }, 500);
  });
};

export const runInspection = async (imageData, templateId) => {
  return new Promise((resolve) => {
    // Simulate an inspection process
    setTimeout(() => {
      const mockResult = {
        id: `ins_${Date.now()}`,
        templateName: 'Mock Template',
        category: 'Mock Category',
        anomalyScore: Math.floor(Math.random() * 100),
        status: Math.random() > 0.5 ? 'pass' : 'fail',
        severity: Math.random() > 0.8 ? 'High' : (Math.random() > 0.4 ? 'Medium' : 'Low'),
        timestamp: new Date().toISOString(),
        likelyIssue: Math.random() > 0.5 ? 'None' : 'Detected possible irregular pattern'
      };
      
      // If it's a pass, normalize some outputs to look correct
      if (mockResult.status === 'pass') {
        mockResult.anomalyScore = Math.floor(Math.random() * 20);
        mockResult.severity = 'Low';
        mockResult.likelyIssue = 'None';
      } else {
        mockResult.anomalyScore = Math.floor(Math.random() * 60) + 40;
      }
      
      resolve(mockResult);
    }, 1500);
  });
};
