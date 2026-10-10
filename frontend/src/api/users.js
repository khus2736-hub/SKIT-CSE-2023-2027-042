import { apiClient, cleanParams } from './client';

export const usersApi = {
  getUsers: async (params) => {
    const res = await apiClient.get('/users', { params: cleanParams(params) });
    return res.data;
  },
  changeRole: async (id, role) => {
    const res = await apiClient.patch(`/users/${id}/role`, { role });
    return res.data;
  },
  resetPassword: async (id, newPassword) => {
    await apiClient.patch(`/users/${id}/reset-password`, { newPassword });
  }
};
