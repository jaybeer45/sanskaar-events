import axiosInstance from './axios.instance';

export const quoteService = {
  create: (data) => axiosInstance.post('/quotes', data),
  getForRequest: (reference) => axiosInstance.get(`/quotes/for-request/${reference}`),
  accept: (quoteId) => axiosInstance.post(`/quotes/${quoteId}/accept`),
};