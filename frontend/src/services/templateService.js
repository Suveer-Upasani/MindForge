import { templates } from '../data/templates';

export const getTemplates = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...templates]);
    }, 500);
  });
};

export const getTemplateById = async (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const template = templates.find((t) => t.id === id);
      resolve(template || null);
    }, 300);
  });
};

export const createTemplate = async (templateData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newTemplate = {
        id: `tpl_${Date.now()}`,
        ...templateData,
        referenceImageCount: 0,
        status: 'draft',
        updatedAt: new Date().toISOString()
      };
      resolve(newTemplate);
    }, 600);
  });
};
