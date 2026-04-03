import { createContext, useContext, useState } from 'react';

const TemplateContext = createContext();

export const useTemplates = () => useContext(TemplateContext);

const MOCK_TEMPLATES = [
  { id: 't1', name: 'Raw Denim Weave', category: 'Textile', status: 'ready', referenceImageCount: 15, updatedAt: '2026-04-01T08:00:00Z' },
  { id: 't2', name: 'Matte Ceramic 300x300', category: 'Ceramic', status: 'ready', referenceImageCount: 12, updatedAt: '2026-03-31T14:30:00Z' },
  { id: 't3', name: 'Stainless Sheet Type A', category: 'Metal', status: 'draft', referenceImageCount: 0, updatedAt: '2026-04-02T11:20:00Z' },
];

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const addTemplate = (template) => {
    setTemplates(prev => [...prev, { ...template, id: `t${Date.now()}`, status: 'draft', referenceImageCount: 0, updatedAt: new Date().toISOString() }]);
  };

  const updateTemplateStatus = (id, status, count) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, status, referenceImageCount: count || t.referenceImageCount, updatedAt: new Date().toISOString() } : t));
  };

  return (
    <TemplateContext.Provider value={{ templates, selectedTemplate, setSelectedTemplate, addTemplate, updateTemplateStatus }}>
      {children}
    </TemplateContext.Provider>
  );
};
