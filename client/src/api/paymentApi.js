import API from './axiosInstance';

export const processPayment = (data) => API.post('/payments/checkout', data);
