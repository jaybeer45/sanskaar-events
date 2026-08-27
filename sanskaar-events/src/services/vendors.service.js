// src/services/vendors.service.js
import axiosInstance, { USE_MOCK } from './axios.instance';
import mockVendors from '../mock/vendors.json';
import { normalizeId, normalizeIdList } from '../utils/normalizeId';

export const vendorsService = {
  getAll: async (params = {}) => {
    if (USE_MOCK) {
      let results = [...mockVendors];
      if (params.category && params.category !== 'all')
        results = results.filter((v) => v.category === params.category);
      if (params.verified) results = results.filter((v) => v.verified);
      if (params.search)
        results = results.filter((v) =>
          v.name.toLowerCase().includes(params.search.toLowerCase())
        );
      if (params.minRating)
        results = results.filter((v) => v.rating >= Number(params.minRating));
      return { data: { results, total: results.length } };
    }
   const res = await axiosInstance.get('/vendors', { params });
return { ...res, data: { ...res.data, results: normalizeIdList(res.data.results) } };
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const vendor = mockVendors.find((v) => v.id === id);
      if (!vendor) throw new Error('Vendor not found');
      return { data: vendor };
    }
   const res = await axiosInstance.get(`/vendors/${id}`);
return { ...res, data: normalizeId(res.data) };
  },

  requestQuote: async (vendorId, data) => {
    if (USE_MOCK)
      return { data: { success: true, message: 'Quote request sent! Vendor will contact you within 24 hours.' } };
    return axiosInstance.post(`/vendors/${vendorId}/quote`, data);
  },

  submitReview: async (vendorId, data) => {
    if (USE_MOCK) return { data: { success: true } };
    return axiosInstance.post(`/vendors/${vendorId}/reviews`, data);
  },
};
