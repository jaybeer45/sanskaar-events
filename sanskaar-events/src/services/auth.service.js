// src/services/auth.service.js
import axiosInstance, { USE_MOCK } from './axios.instance';

const MOCK_USERS = [
  { id: 'u-001', name: 'Aryan Singh', email: 'aryan@example.com', role: 'user',      avatar: 'https://picsum.photos/seed/user1/80/80', savedEvents: [], phone: '+91-9876543210' },
  { id: 'u-002', name: 'Admin Sanskaar', email: 'admin@sanskaar.com', role: 'admin',  avatar: 'https://picsum.photos/seed/admin/80/80', savedEvents: [], phone: '+91-9000000001' },
  { id: 'u-003', name: 'Priya Organizer', email: 'priya@org.com', role: 'organizer', avatar: 'https://picsum.photos/seed/org/80/80',    savedEvents: [], phone: '+91-9000000002' },
];

const MOCK_OTP_CODE = '123456';
const OTP_STORE = new Map();

const REGISTERED_USERS = [];

const makeToken = (userId) => btoa(`mock_token_${userId}_${Date.now()}`);
const getUserIdFromToken = (token) => {
  try {
    const decoded = atob(token); // "mock_token_u-001_1690000000000"
    const parts = decoded.split('_');
    return parts[2]; // user id
  } catch {
    return null;
  }
};

export const authService = {
  login: async ({ email, password }) => {
    if (USE_MOCK) {
      const normalizedInput = email.replace(/[\s-]/g, '').replace(/^\+91/, '');
      const user = [...MOCK_USERS, ...REGISTERED_USERS].find((u) => {
        const normalizedPhone = u.phone?.replace(/[\s-]/g, '').replace(/^\+91/, '');
        return u.email === email || normalizedPhone === normalizedInput;
      });
      if (!user) throw new Error('Invalid credentials');

      const token = makeToken(user.id);
      return { data: { user, token } };
    }
    return axiosInstance.post('/auth/login', { email, password });
  },

  register: async (data) => {
    if (USE_MOCK) {
      const emailExists = [...MOCK_USERS, ...REGISTERED_USERS].some((u) => u.email === data.email);
      if (emailExists) throw new Error('An account with this email already exists.');

      const user = {
        id: `u-${Date.now()}`,
        ...data,
        role: 'user',
        avatar: `https://picsum.photos/seed/${Date.now()}/80/80`,
        savedEvents: [],
      };
      REGISTERED_USERS.push(user);
      const token = makeToken(user.id);
      return { data: { user, token } };
    }
    return axiosInstance.post('/auth/register', data);
  },

  getProfile: async () => {
    if (USE_MOCK) {
      const token = localStorage.getItem('sanskaar_token');
      if (!token) throw new Error('Not authenticated');

      const userId = getUserIdFromToken(token);
      const user = [...MOCK_USERS, ...REGISTERED_USERS].find((u) => u.id === userId);
      if (!user) throw new Error('User not found');

      return { data: user };
    }
    return axiosInstance.get('/auth/me');
  },

  sendOtp: async (identifier) => {
  if (USE_MOCK) {
    OTP_STORE.set(identifier, { code: MOCK_OTP_CODE, expiresAt: Date.now() + 5 * 60 * 1000 });
    return { data: { success: true } };
  }
  return axiosInstance.post('/auth/send-otp', { identifier });
},

verifyOtp: async (identifier, code) => {
  if (USE_MOCK) {
    const entry = OTP_STORE.get(identifier);
    if (!entry) throw new Error('No OTP was sent.');
    if (Date.now() > entry.expiresAt) throw new Error('OTP expired.');
    if (code !== entry.code) throw new Error('Incorrect OTP.');
    OTP_STORE.delete(identifier);
    return { data: { success: true } };
  }
  return axiosInstance.post('/auth/verify-otp', { identifier, code });
},

  logout: async () => {
    if (USE_MOCK) return { data: { success: true } };
    return axiosInstance.post('/auth/logout');
  },

  resetPassword: async (identifier, newPassword) => {
  if (USE_MOCK) {
    const user = [...MOCK_USERS, ...REGISTERED_USERS].find(
      (u) => u.email === identifier || u.phone === identifier
    );
    if (!user) throw new Error('No account found with this email/phone.');
    user.password = newPassword; // mock update, in-memory only
    return { data: { success: true } };
  }
  return axiosInstance.post('/auth/reset-password', { identifier, newPassword });
},

  saveEvent: async (userId, eventId) => {
    if (USE_MOCK) return { data: { success: true } };
    return axiosInstance.post(`/users/${userId}/saved-events`, { eventId });
  },

  unsaveEvent: async (userId, eventId) => {
    if (USE_MOCK) return { data: { success: true } };
    return axiosInstance.delete(`/users/${userId}/saved-events/${eventId}`);
  },

  updateProfile: async (userId, data) => {
    if (USE_MOCK) {
      const user = [...MOCK_USERS, ...REGISTERED_USERS].find((u) => u.id === userId);
      if (!user) throw new Error('User not found');
      Object.assign(user, data);
      return { data: user };
    }
    return axiosInstance.put(`/users/${userId}`, data);
  },

  recordConsent: async (userId, { type, version, accepted }) => {
    if (USE_MOCK) return { data: { success: true, consents: [] } };
    return axiosInstance.post(`/users/${userId}/consents`, { type, version, accepted });
  },

  getConsents: async (userId) => {
    if (USE_MOCK) return { data: { consents: [] } };
    return axiosInstance.get(`/users/${userId}/consents`);
  },
};