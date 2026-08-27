// // src/services/organizer.service.js
import axiosInstance from './axios.instance';





export const organizerService = {
  register: (data) => axiosInstance.post('/organizers', data),
  getMe: () => axiosInstance.get('/organizers/me'),
  submitKyc: (organizerId, data) => axiosInstance.post(`/organizers/${organizerId}/kyc`, data),
  sendContactOtp: (organizerId, field) => axiosInstance.post(`/organizers/${organizerId}/contact-otp/send`, { field }),
  verifyContactOtp: (organizerId, field, code) => axiosInstance.post(`/organizers/${organizerId}/contact-otp/verify`, { field, code }),
};