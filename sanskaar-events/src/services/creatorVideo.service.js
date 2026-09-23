// src/services/creatorVideo.service.js
import axiosInstance from './axios.instance';

export const creatorVideoService = {
  create: (payload) => axiosInstance.post('/creator-videos', payload),
  getMine: () => axiosInstance.get('/creator-videos/mine'),
 getByEvent: (eventId, page = 1, limit = 10) => axiosInstance.get(`/creator-videos/event/${eventId}`, { params: { page, limit } }),
  toggleLike: (videoId) => axiosInstance.post(`/creator-videos/${videoId}/like`),
  getComments: (videoId) => axiosInstance.get(`/creator-videos/${videoId}/comments`),
  addComment: (videoId, text, parentCommentId = null) => axiosInstance.post(`/creator-videos/${videoId}/comments`, { text, parentCommentId }),
  getLeaderboard: (eventId) => axiosInstance.get(`/creator-videos/leaderboard/${eventId}`),
  getReplies: (commentId) => axiosInstance.get(`/creator-videos/comments/${commentId}/replies`),
  incrementShare: (videoId) => axiosInstance.post(`/creator-videos/${videoId}/share`),
  deleteComment: (commentId) => axiosInstance.delete(`/creator-videos/comments/${commentId}`),
  delete: (id) => axiosInstance.delete(`/creator-videos/${id}`),
};