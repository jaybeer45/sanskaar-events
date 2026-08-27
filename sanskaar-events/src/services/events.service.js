// src/services/events.service.js
import axiosInstance, { USE_MOCK } from './axios.instance';
import mockEvents from '../mock/events.json';


// "_id" ko "id" bana ke daal dete hain — isse baaki koi file badalni nahi padegi.
const normalize = (event) => (event?._id ? { ...event, id: event._id } : event);
const normalizeList = (events) => (events || []).map(normalize);

export const eventsService = {
  getAll: async (params = {}) => {
    if (USE_MOCK) {
      let results = [...mockEvents];
      if (params.category && params.category !== 'all')
        results = results.filter((e) => e.category === params.category);
      if (params.search)
        results = results.filter((e) =>
          e.title.toLowerCase().includes(params.search.toLowerCase())
        );
      if (params.isLive) results = results.filter((e) => e.isLive);
      if (params.tonight) results = results.filter((e) => e.isTonightEvent);
      return { data: { results, total: results.length } };
    }
    const res = await axiosInstance.get('/events', { params });
    return { ...res, data: { ...res.data, results: normalizeList(res.data.results) } };
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const event = mockEvents.find((e) => e.id === id);
      if (!event) throw new Error('Event not found');
      return { data: event };
    }
    const res = await axiosInstance.get(`/events/${id}`);
    return { ...res, data: normalize(res.data) };
  },

  getLiveNow: async () => {
    if (USE_MOCK) {
      const results = mockEvents.filter((e) => e.isLive);
      return { data: { results } };
    }
    const res = await axiosInstance.get('/events', { params: { isLive: true } });
    return { ...res, data: { ...res.data, results: normalizeList(res.data.results) } };
  },

  getTonight: async () => {
    if (USE_MOCK) {
      const results = mockEvents.filter((e) => e.isTonightEvent);
      return { data: { results } };
    }
    const res = await axiosInstance.get('/events/tonight');
    return { ...res, data: { ...res.data, results: normalizeList(res.data.results) } };
  },

  getVariants: async (eventId) => {
    if (USE_MOCK) return { data: { results: [] } }; // no mock variant data yet
    return axiosInstance.get(`/events/${eventId}/variants`);
  },
  getMine: () => axiosInstance.get('/events/mine'),
  createVariant: (eventId, data) => axiosInstance.post(`/events/${eventId}/variants`, data),

  create: async (data) => {
    if (USE_MOCK) return { data: { id: `evt-${Date.now()}`, ...data, status: 'pending' } };
    return axiosInstance.post('/events', data);
  },

  update: async (id, data) => {
    if (USE_MOCK) return { data: { id, ...data } };
    return axiosInstance.put(`/events/${id}`, data);
  },

  delete: async (id) => {
    if (USE_MOCK) return { data: { success: true } };
    return axiosInstance.delete(`/events/${id}`);
  },
};