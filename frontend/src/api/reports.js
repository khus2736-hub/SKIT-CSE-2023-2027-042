import { apiClient, cleanParams } from './client';

export const reportsApi = {
  getEmployeesReport: async (params) => {
    const res = await apiClient.get('/reports/employees', { params: cleanParams(params) });
    return res.data;
  },
  getAttendanceReport: async (params) => {
    const res = await apiClient.get('/reports/attendance', { params: cleanParams(params) });
    return res.data;
  },
  getLeavesReport: async (params) => {
    const res = await apiClient.get('/reports/leaves', { params: cleanParams(params) });
    return res.data;
  },
  getTasksReport: async (params) => {
    const res = await apiClient.get('/reports/tasks', { params: cleanParams(params) });
    return res.data;
  }
};
