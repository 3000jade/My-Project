import axios from 'axios';
import { executeSerializedRefresh } from './sessionCoordinator';

// ==============================================================================
// Central Axios API Client
// Handles Base URL, Bearer Auth Token Injection, and Uniform ApiResponse Unwrapping
// ==============================================================================

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').trim().replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically inject Bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('cp_auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Non-browser or storage restricted environment
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automatically unwrap response.data, refresh on 401 when refresh token exists, and normalize errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Unwraps response payload directly
    return response.data;
  },
  async (error) => {
    const originalConfig = error.config;
    const url = originalConfig?.url || '';
    const isAuthBypassRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/logout');

    if (error.response?.status === 401) {
      let storedRefreshToken = null;
      try {
        storedRefreshToken = localStorage.getItem('cp_refresh_token');
      } catch {
        // Non-browser environment
      }

      if (originalConfig && !originalConfig._retry && !isAuthBypassRoute && storedRefreshToken) {
        originalConfig._retry = true;
        try {
          const refreshed = await executeSerializedRefresh(async () => {
            const res = await axiosInstance.post('/auth/refresh', {
              refreshToken: storedRefreshToken,
            });
            return res?.data || res;
          });
          if (refreshed?.token) {
            localStorage.setItem('cp_auth_token', refreshed.token);
            if (refreshed.refreshToken) {
              localStorage.setItem('cp_refresh_token', refreshed.refreshToken);
            }
            originalConfig.headers = originalConfig.headers || {};
            originalConfig.headers.Authorization = `Bearer ${refreshed.token}`;
            return axiosInstance(originalConfig);
          }
        } catch {
          // Refresh failed; fall through to token cleanup
        }
      }

      try {
        localStorage.removeItem('cp_auth_token');
      } catch {
        // Non-browser or storage restricted environment
      }
    }
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Network request failed';
    const customError = new Error(message);
    customError.status = error.response?.status;
    customError.data = error.response?.data;
    return Promise.reject(customError);
  }
);

export const apiClient = {
  getToken() {
    try {
      return localStorage.getItem('cp_auth_token');
    } catch {
      return null;
    }
  },

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem('cp_auth_token', token);
      } else {
        localStorage.removeItem('cp_auth_token');
      }
    } catch {
      // Non-browser or storage restricted environment
    }
  },

  clearToken() {
    this.setToken(null);
  },

  async get(endpoint, config = {}) {
    return axiosInstance.get(endpoint, config);
  },

  async post(endpoint, data, config = {}) {
    return axiosInstance.post(endpoint, data, config);
  },

  async put(endpoint, data, config = {}) {
    return axiosInstance.put(endpoint, data, config);
  },

  async patch(endpoint, data, config = {}) {
    return axiosInstance.patch(endpoint, data, config);
  },

  async delete(endpoint, config = {}) {
    return axiosInstance.delete(endpoint, config);
  },

  async request(config) {
    return axiosInstance(config);
  },
};

export default apiClient;
