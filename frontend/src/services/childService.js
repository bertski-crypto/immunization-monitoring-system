import api from './api';

const childService = {
  getAll: async (params = {}) => {
    const response = await api.get('/children', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/children/${id}`);
    return response.data;
  },

  create: async (childData) => {
    const response = await api.post('/children', childData);
    return response.data;
  },

  update: async (id, childData) => {
    const response = await api.put(`/children/${id}`, childData);
    return response.data;
  },

  archive: async (id) => {
    const response = await api.patch(`/children/${id}/archive`);
    return response.data;
  },

  getImmunizationHistory: async (id) => {
    const response = await api.get(`/children/${id}/immunization-history`);
    return response.data;
  },

  search: async (query) => {
    const response = await api.get('/children/search', { params: { q: query } });
    return response.data;
  },
};

export default childService;
