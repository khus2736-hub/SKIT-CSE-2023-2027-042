import { apiClient, cleanParams } from './client';

export const tasksApi = {
  createTask: async (data) => {
    const res = await apiClient.post('/tasks', data);
    return res.data;
  },
  updateTask: async (id, data) => {
    const res = await apiClient.put(`/tasks/${id}`, data);
    return res.data;
  },
  deleteTask: async (id) => {
    await apiClient.delete(`/tasks/${id}`);
  },
  getTasksAdmin: async (params) => {
    const res = await apiClient.get('/tasks', { params: cleanParams(params) });
    return res.data;
  },
  getMyTasks: async (params) => {
    const res = await apiClient.get('/tasks/my', { params: cleanParams(params) });
    return res.data;
  },
  getById: async (id) => {
    const res = await apiClient.get(`/tasks/${id}`);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await apiClient.patch(`/tasks/${id}/status`, { status });
    return res.data;
  }
};
