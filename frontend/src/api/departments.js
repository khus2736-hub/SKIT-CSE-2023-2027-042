import { apiClient, cleanParams } from './client';

export const departmentsApi = {
  getDepartments: async (params) => {
    const res = await apiClient.get('/departments', { params: cleanParams(params) });
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/departments/${id}`);
    return res.data;
  },
  createDepartment: async (data) => {
    const res = await apiClient.post('/departments', data);
    return res.data;
  },
  updateDepartment: async (id, data) => {
    const res = await apiClient.put(`/departments/${id}`, data);
    return res.data;
  },
  setStatus: async (id, active) => {
    const res = await apiClient.patch(`/departments/${id}/status`, null, { params: { active } });
    return res.data;
  },
  deleteDepartment: async (id) => {
    await apiClient.delete(`/departments/${id}`);
  }
};
