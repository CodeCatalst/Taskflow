import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for cookie-based authentication
});

// Handle token refresh using secure cookies with fallback to token-based auth
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // For cross-domain requests, send refresh token in body as fallback
        // since cookies may not be sent with credentials: 'include'
        const refreshToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('refreshToken='))
          ?.split('=')[1];

        const refreshPayload = refreshToken ? { refreshToken } : {};

        const refreshResponse = await api.post('/auth/refresh', refreshPayload);
        
        localStorage.setItem('lastActivityTime', Date.now().toString());

        // If server sent tokens in response body (for cross-domain), extract them
        if (refreshResponse.data.accessToken && refreshResponse.data.refreshToken) {
          // Store tokens for fallback usage if cookies aren't persisted
          localStorage.setItem('accessToken', refreshResponse.data.accessToken);
          localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
        }

        return api(originalRequest);
      } catch (refreshError) {
        // On refresh failure, clear all auth data and redirect to login
        localStorage.removeItem('user');
        localStorage.removeItem('lastActivityTime');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

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
