import api from './axiosInstance';

export const scanFood    = (formData) =>
  api.post('/ai/scan', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getScanHistory = (params) => api.get('/ai/scan/history', { params });
export const getScanById    = (id)     => api.get(`/ai/scan/${id}`);

export const chatbot = (payload) => api.post('/ai/chatbot', payload);
