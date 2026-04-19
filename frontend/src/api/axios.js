import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for cookie-based authentication
});

// Handle token refresh using secure cookies
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await api.post('/auth/refresh', {});
        localStorage.setItem('lastActivityTime', Date.now().toString());

        return api(originalRequest);
      } catch (refreshError) {
        // On refresh failure, clear all auth data and redirect to login
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivityTime');

        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'refresh-failed' } }));

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden errors

    return Promise.reject(error);
  }
);

export default api;
