import axiosInstance from './axios.instance'

 export  const bookingMessageService = {
       getMessages : (bookingId) => axiosInstance.get(`/vendor-bookings/${bookingId}/messages`),
       sendMessage : (bookingId , data) => axiosInstance.post(`/vendor-bookings/${bookingId}/messages`, data)
}