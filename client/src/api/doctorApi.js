import api from './axiosInstance';

export const getMyPatients   = ()       => api.get('/doctors/patients');
export const getDoctorPatients = (params) => api.get('/doctors/patients', { params });
export const getPublicDoctors  = ()       => api.get('/doctors/public');
export const getDoctorProfile= ()       => api.get('/doctors/profile');
export const updateDoctorProfile = (data) => api.patch('/doctors/profile', data);
