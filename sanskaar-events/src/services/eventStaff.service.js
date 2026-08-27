import axiosInstance from './axios.instance';

export const eventStaffService = {
  invite: (eventId, email) => axiosInstance.post(`/events/${eventId}/staff`, { email }),
  list: (eventId) => axiosInstance.get(`/events/${eventId}/staff`),
  revoke: (eventId, staffId) => axiosInstance.delete(`/events/${eventId}/staff/${staffId}`),
  checkIn: (eventId, ticketCode) => axiosInstance.post(`/events/${eventId}/checkin`, { ticketCode }),
};