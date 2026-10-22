import { apiClient, cleanParams } from './client';

export const attendanceApi = {
  checkIn: async () => {
    const res = await apiClient.post('/attendance/check-in');
    return res.data;
  },
  checkOut: async () => {
    const res = await apiClient.post('/attendance/check-out');
    return res.data;
  },
  getToday: async () => {
    const res = await apiClient.get('/attendance/today');
    return res.status === 204 ? null : res.data;
  },
  getMyAttendance: async (params) => {
    const res = await apiClient.get('/attendance/my', { params: cleanParams(params) });
    return res.data;
  },
  getAttendanceAdmin: async (params) => {
    const res = await apiClient.get('/attendance', { params: cleanParams(params) });
    return res.data;
  }
};
