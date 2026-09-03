// src/services/bookings.service.js
import axiosInstance, { USE_MOCK } from './axios.instance';


export const bookingsService = {
  create: async (data) => {
    if (USE_MOCK) {
      const amount = data.amount ?? 0;
      const gst = Math.round(amount * 0.18);
      return {
        data: {
          _id: `bkg-${Date.now()}`,
          ticketCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
          ...data,
          amount,
          gst,
          totalAmount: amount + gst,
          paymentStatus: amount === 0 ? 'paid' : 'pending',
          status: 'confirmed',
        },
      };
    }
    return axiosInstance.post('/bookings', data);
  },

  getById: async (id) => {
    if (USE_MOCK) return { data: { _id: id } };
    return axiosInstance.get(`/bookings/${id}`);
  },

  createOrder: async (id) => {
    if (USE_MOCK) {
      return { data: { orderId: `order_mock_${Date.now()}`, amount: 0, currency: 'INR', keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '' } };
    }
    return axiosInstance.post(`/bookings/${id}/create-order`);
  },

  verifyPayment: async (id, razorpayResponse) => {
    if (USE_MOCK) {
      return { data: { _id: id, paymentStatus: 'paid', paymentMethod: 'razorpay', razorpayPaymentId: razorpayResponse?.razorpay_payment_id || `mock_pay_${Date.now()}` } };
    }
    return axiosInstance.post(`/bookings/${id}/verify-payment`, razorpayResponse);
  },

  getMy: async () => {
    if (USE_MOCK) return { data: { results: [] } };
    return axiosInstance.get('/bookings/my');
  },

  cancel: async (id) => {
    if (USE_MOCK) {
      return { data: { success: true, refundPercent: 100, refundedPaise: 0, booking: { _id: id, status: 'cancelled' } } };
    }
    return axiosInstance.post(`/bookings/${id}/cancel`);
  },

  reschedule: async (id, newEventDateId) => {
    if (USE_MOCK) {
      return { data: { success: true, booking: { _id: id, eventDateId: newEventDateId, status: 'confirmed' } } };
    }
    return axiosInstance.post(`/bookings/${id}/reschedule`, { newEventDateId });
  },
};