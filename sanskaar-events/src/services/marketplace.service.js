// src/services/marketplace.service.js
import axiosInstance, { USE_MOCK } from './axios.instance';
import mockVendors from '../mock/vendors.json';

export const marketplaceService = {
  submitLeadRequest: async (data) => {
    if (USE_MOCK) {
      // Simulate vendor match based on service type
      const categoryMap = {
        birthday: 'birthday-org', haldi: 'haldi-eng', engagement: 'haldi-eng',
        wedding: 'event-planner', anniversary: 'surprise-date',
        'secret-date': 'surprise-date', 'surprise-party': 'birthday-org',
        honeymoon: 'honeymoon', corporate: 'event-planner',
        'kids-party': 'birthday-org',
      };
      const vendorCategory = categoryMap[data.serviceType] || 'event-planner';
      const matches = mockVendors.filter((v) => v.category === vendorCategory).slice(0, 3);
      return {
        data: {
          success: true,
          requestId: `req-${Date.now()}`,
          message: 'Your request has been sent to matching vendors!',
          matchedVendors: matches,
        },
      };
    }
    return axiosInstance.post('/marketplace/lead', data);
  },
  approveMatch: (reference, matchId) => axiosInstance.post(`/requests/${reference}/approve`, { matchId }),


  getMatches: async (requestId) => {
    if (USE_MOCK) return { data: { vendors: mockVendors.slice(0, 3) } };
    return axiosInstance.get(`/marketplace/lead/${requestId}/matches`);
  },
};
