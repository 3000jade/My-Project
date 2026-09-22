import axios from 'axios';

// ==============================================================================
// Central Axios API Client
// Handles Base URL, Bearer Auth Token Injection, and Uniform ApiResponse Unwrapping
// ==============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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

// Response Interceptor: Automatically unwrap response.data and normalize errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Unwraps response payload directly
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
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

  async delete(endpoint, config = {}) {
    return axiosInstance.delete(endpoint, config);
  },

  async request(config) {
    return axiosInstance(config);
  },
};

export default apiClient;
