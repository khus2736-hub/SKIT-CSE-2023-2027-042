import { apiClient, cleanParams } from './client';

export const employeesApi = {
  getEmployees: async (params) => {
    const res = await apiClient.get('/employees', { params: cleanParams(params) });
    return res.data;
  },
  getAllActive: async () => {
    const res = await apiClient.get('/employees/all-active');
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/employees/${id}`);
    return res.data;
  },
  getMe: async () => {
    const res = await apiClient.get('/employees/me');
    return res.data;
  },
  createEmployee: async (data) => {
    const res = await apiClient.post('/employees', data);
    return res.data;
  },
  updateEmployee: async (id, data) => {
    const res = await apiClient.put(`/employees/${id}`, data);
    return res.data;
  },
  deactivate: async (id) => {
    const res = await apiClient.patch(`/employees/${id}/deactivate`);
    return res.data;
  },
  activate: async (id) => {
    const res = await apiClient.patch(`/employees/${id}/activate`);
    return res.data;
  }
};
