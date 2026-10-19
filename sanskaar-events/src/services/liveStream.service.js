// src/services/liveStream.service.js
import axiosInstance from './axios.instance';

export const liveStreamService = {
    start: (eventId, title, filterCss) => axiosInstance.post('/live', { eventId, title, filterCss }),
    end: (streamId, peakViewers, heartsCount) => axiosInstance.patch(`/live/${streamId}/end`, { peakViewers, heartsCount }),
    getActiveForEvent: (eventId) => axiosInstance.get(`/live/event/${eventId}`),
};