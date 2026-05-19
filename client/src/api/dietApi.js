import api from './axiosInstance';

export const getDietPlans = (params) => api.get('/diet', { params });
export const getPublicPlans = () => api.get('/diet/public');
export const getDietPlanById = (id) => api.get(`/diet/${id}`);
export const createDietPlan = (data) => api.post('/diet', data);
export const updateDietPlan = (id, d) => api.put(`/diet/${id}`, d);
export const deleteDietPlan = (id) => api.delete(`/diet/${id}`);
export const submitFeedback = (id, data) => api.patch(`/diet/${id}/feedback`, data);
