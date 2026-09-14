// src/services/creatorVideo.service.js
import axiosInstance from './axios.instance';

export const creatorVideoService = {
  create: (payload) => axiosInstance.post('/creator-videos', payload),
  getMine: () => axiosInstance.get('/creator-videos/mine'),
  getByEvent: (eventId) => axiosInstance.get(`/creator-videos/event/${eventId}`),
  delete: (id) => axiosInstance.delete(`/creator-videos/${id}`),
};