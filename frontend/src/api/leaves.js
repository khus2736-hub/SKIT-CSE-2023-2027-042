import { apiClient, cleanParams } from './client';

export const leavesApi = {
  applyLeave: async (data) => {
    const res = await apiClient.post('/leaves', data);
    return res.data;
  },
  getMyLeaves: async (params) => {
    const res = await apiClient.get('/leaves/my', { params: cleanParams(params) });
    return res.data;
  },
  cancelLeave: async (id) => {
    const res = await apiClient.patch(`/leaves/${id}/cancel`);
    return res.data;
  },
  getLeavesAdmin: async (params) => {
    const res = await apiClient.get('/leaves', { params: cleanParams(params) });
    return res.data;
  },
  reviewLeave: async (id, data) => {
    const res = await apiClient.patch(`/leaves/${id}/review`, data);
    return res.data;
  }
};
