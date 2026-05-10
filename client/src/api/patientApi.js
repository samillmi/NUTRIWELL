import api from './axiosInstance';

export const getPatientProfile  = ()     => api.get('/patients/profile');
export const updatePatientProfile=(data) => api.patch('/patients/profile', data);
export const logMetrics          =(data) => api.post('/patients/metrics', data);
