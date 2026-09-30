import { apiClient, cleanParams } from './client';

export const designationsApi = {
  getDesignations: async (params) => {
    const res = await apiClient.get('/designations', { params: cleanParams(params) });
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/designations/${id}`);
    return res.data;
  },
  createDesignation: async (data) => {
    const res = await apiClient.post('/designations', data);
    return res.data;
  },
  updateDesignation: async (id, data) => {
    const res = await apiClient.put(`/designations/${id}`, data);
    return res.data;
  },
  setStatus: async (id, active) => {
    const res = await apiClient.patch(`/designations/${id}/status`, null, { params: { active } });
    return res.data;
  },
  deleteDesignation: async (id) => {
    await apiClient.delete(`/designations/${id}`);
  }
};
