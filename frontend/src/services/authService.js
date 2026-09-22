// ==============================================================================
// Authentication Service
// Communicates EXCLUSIVELY with the Express Backend (/api/auth)
// ==============================================================================

import apiClient from './apiClient';

export const authService = {
  /**
   * Log in user via Express Backend
   */
  async login(email, password) {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }
    return response.data;
  },

  /**
   * Register new user via Express Backend
   */
  async register(email, password, metadata = {}) {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      fullName: metadata.fullName,
      role: metadata.role || 'agent',
    });
    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }
    return response.data;
  },

  /**
   * Verify token and fetch authenticated user from Express Backend
   */
  async getCurrentUser() {
    const token = apiClient.getToken();
    if (!token) return null;

    try {
      const response = await apiClient.get('/auth/me');
      return response?.data || null;
    } catch (err) {
      // If token is expired or invalid, clear it
      apiClient.clearToken();
      return null;
    }
  },

  /**
   * Log out user and clear stored token
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      apiClient.clearToken();
    }
  },

  isAuthenticated() {
    return Boolean(apiClient.getToken());
  },
};

export default authService;
