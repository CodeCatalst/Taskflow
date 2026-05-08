import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for cookie-based authentication
});

// Attach access token fallback for environments where cross-site cookies are blocked.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh using secure cookies with fallback to token-based auth
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestPath = originalRequest?.url || '';
    const isAuthEndpoint = requestPath.includes('/auth/login') || requestPath.includes('/auth/refresh');

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // HttpOnly cookies cannot be read from JS; use local fallback token if present.
        const refreshToken = localStorage.getItem('refreshToken');

        const refreshPayload = refreshToken ? { refreshToken } : {};

        const refreshResponse = await api.post('/auth/refresh', refreshPayload);
        
        localStorage.setItem('lastActivityTime', Date.now().toString());

        // If server sent tokens in response body (for cross-domain), extract them
        if (refreshResponse.data.accessToken && refreshResponse.data.refreshToken) {
          // Store tokens for fallback usage if cookies aren't persisted
          localStorage.setItem('accessToken', refreshResponse.data.accessToken);
          localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
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
