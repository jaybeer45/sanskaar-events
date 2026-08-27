// src/services/axios.instance.js
import axios from 'axios';

const USE_MOCK = !import.meta.env.VITE_API_BASE_URL;
if (import.meta.env.DEV) {
  console.log("USE_MOCK:", USE_MOCK);
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor: Inject auth token ──────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sanskaar_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle errors globally ────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Only treat this as "session expired" if a token actually existed.
      // Otherwise a failed login/signup attempt (invalid credentials) would
      // incorrectly force-redirect to /login before the form could show the error.
      const hadToken = !!localStorage.getItem('sanskaar_token');
      localStorage.removeItem('sanskaar_token');
      if (hadToken) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { USE_MOCK };
export default axiosInstance;