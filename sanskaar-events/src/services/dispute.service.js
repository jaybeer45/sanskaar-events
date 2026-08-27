import axiosInstance  from "./axios.instance";

export const disputeService = {
    getForBooking : (bookingId) => axiosInstance.get(`/vendor-bookings/${bookingId}/disputes`) ,
    raise : (bookingId , data)=> axiosInstance.post(`/vendor-bookings/${bookingId}/disputes`, data )
}