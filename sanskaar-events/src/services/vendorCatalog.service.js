import axiosInstance from './axios.instance';

export const vendorCatalogService = {
  // Vendor profile
  getMine: () => axiosInstance.get('/vendors/me'),
  register: (data) => axiosInstance.post('/vendors', data),
   getMyLeads: () => axiosInstance.get('/vendors/me/leads'),

  // Services
  getServices: (vendorId) => axiosInstance.get(`/vendors/${vendorId}/services`),
  createService: (vendorId, data) => axiosInstance.post(`/vendors/${vendorId}/services`, data),
  deleteService: (vendorId, serviceId) => axiosInstance.delete(`/vendors/${vendorId}/services/${serviceId}`),

  // Packages
  getPackages: (vendorId, serviceId) => axiosInstance.get(`/vendors/${vendorId}/services/${serviceId}/packages`),
  createPackage: (vendorId, serviceId, data) => axiosInstance.post(`/vendors/${vendorId}/services/${serviceId}/packages`, data),
  deletePackage: (vendorId, serviceId, packageId) => axiosInstance.delete(`/vendors/${vendorId}/services/${serviceId}/packages/${packageId}`),

  // Add-ons
  getAddons: (vendorId, packageId) => axiosInstance.get(`/vendors/${vendorId}/packages/${packageId}/addons`),
  createAddon: (vendorId, packageId, data) => axiosInstance.post(`/vendors/${vendorId}/packages/${packageId}/addons`, data),
  deleteAddon: (vendorId, packageId, addonId) => axiosInstance.delete(`/vendors/${vendorId}/packages/${packageId}/addons/${addonId}`),
 
  getMyBookings: (status) => axiosInstance.get('/vendors/me/bookings', { params: status ? { status } : {} }),
 updateBookingStatus: (bookingId, status) => axiosInstance.patch(`/vendors/me/bookings/${bookingId}/status`, { status }),

};