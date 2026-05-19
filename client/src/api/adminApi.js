import api from './axiosInstance';

export const getAdminStats = () => api.get('/admin/stats');
export const getFinanceStats = () => api.get('/admin/finance');
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const verifyDoctor = (id) => api.patch(`/admin/doctors/${id}/verify`);
export const toggleUser = (id, data) => api.patch(`/admin/users/${id}`, data);
