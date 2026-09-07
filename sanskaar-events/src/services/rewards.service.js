// src/services/rewards.service.js
import axiosInstance, { USE_MOCK } from './axios.instance';

export const rewardsService = {
  getMyCoupons: async () => {
    if (USE_MOCK) {
      return { data: { results: [] } };
    }
    return axiosInstance.get('/users/me/coupons');
  },
  getMyCoupons: async () => {
    if (USE_MOCK) return { data: { results: [] } };
    return axiosInstance.get('/users/me/coupons');
  },
  validateCoupon: async (code) => {
    if (USE_MOCK) return { data: { valid: true, valuePaise: 0, type: 'booking_reward' } };
    return axiosInstance.post('/users/me/coupons/validate', { code });
  },
};


