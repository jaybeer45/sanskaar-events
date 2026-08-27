import axiosInstance from './axios.instance';

export const planningRequestService = {
  create: (data) => axiosInstance.post('/requests', data),

  getMine: () => axiosInstance.get('/requests/mine'),

  getByReference: (reference) =>
    axiosInstance.get(`/requests/${reference}`),

  getMatches: (reference) =>
    axiosInstance.get(`/requests/${reference}/matches`),

  approveMatch: (reference, matchId) =>
    axiosInstance.post(`/requests/${reference}/approve`, { matchId }),
};