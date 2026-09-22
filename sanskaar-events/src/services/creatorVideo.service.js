// src/services/creatorVideo.service.js
import axiosInstance from './axios.instance';

export const creatorVideoService = {
  create: (payload) => axiosInstance.post('/creator-videos', payload),
  getMine: () => axiosInstance.get('/creator-videos/mine'),
  getByEvent: (eventId) => axiosInstance.get(`/creator-videos/event/${eventId}`),
  toggleLike: (videoId) => axiosInstance.post(`/creator-videos/${videoId}/like`),
  getComments: (videoId) => axiosInstance.get(`/creator-videos/${videoId}/comments`),
  addComment: (videoId, text) => axiosInstance.post(`/creator-videos/${videoId}/comments`, { text }),
  incrementShare: (videoId) => axiosInstance.post(`/creator-videos/${videoId}/share`),
  incrementView: (videoId) => axiosInstance.post(`/creator-videos/${videoId}/view`),
  deleteComment: (commentId) => axiosInstance.delete(`/creator-videos/comments/${commentId}`),
  delete: (id) => axiosInstance.delete(`/creator-videos/${id}`),
};