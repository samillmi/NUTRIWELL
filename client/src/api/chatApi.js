import api from './axiosInstance';

export const getUnreadCount = () =>
  api.get('/chat/unread/count');

export const getChatHistory = (partnerId, params) =>
  api.get(`/chat/${partnerId}`, { params });

export const deleteMessage = (messageId) =>
  api.delete(`/chat/message/${messageId}`);
