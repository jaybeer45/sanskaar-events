import axiosInstance from './axios.instance';

export const vendorPaymentService = {
  getByQuote: (quoteId) => axiosInstance.get(`/vendor-bookings/by-quote/${quoteId}`),
  createAdvanceOrder: (bookingId) => axiosInstance.post(`/vendor-bookings/${bookingId}/advance/order`),
  verifyAdvancePayment: (bookingId, razorpayResponse) =>
    axiosInstance.post(`/vendor-bookings/${bookingId}/advance/verify`, razorpayResponse),
  createBalanceOrder: (bookingId) => axiosInstance.post(`/vendor-bookings/${bookingId}/balance/order`),
  verifyBalancePayment: (bookingId, razorpayResponse) =>
    axiosInstance.post(`/vendor-bookings/${bookingId}/balance/verify`, razorpayResponse),
};