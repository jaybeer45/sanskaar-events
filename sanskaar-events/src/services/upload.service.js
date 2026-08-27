import axiosInstance from './axios.instance';

export const uploadService = {
  uploadEventImages: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return axiosInstance.post('/uploads/event-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadKycDocument: (file) => {
    const formData = new FormData();
    formData.append('document', file);
    return axiosInstance.post('/uploads/kyc-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};