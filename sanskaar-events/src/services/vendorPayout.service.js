import axiosInstance  from './axios.instance'

export const vendorPayoutService = {
 getMyPayouts : ()=> axiosInstance.get('/vendors/me/payouts'),
  updateBankDetails: (data) => axiosInstance.patch('/vendors/me/bank-details', data),
} ;