import axiosInstance from './axios.instance';

export const venuesService = {
  getMine: () => axiosInstance.get('/venues/mine'),
  create: (data) => axiosInstance.post('/venues', data),
};