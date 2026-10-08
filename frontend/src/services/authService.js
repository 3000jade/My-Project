import apiClient from './apiClient';

/**
 * Evaluates role hierarchy and admin superuser bypass.
 */
export const hasRole = (user, roleOrRoles) => {
  if (!user || !user.role) return false;
  if (user.role === 'admin') return true; // Superuser bypass
  
  if (Array.isArray(roleOrRoles)) {
    return roleOrRoles.includes(user.role);
  }
  return user.role === roleOrRoles;
};

/**
 * Evaluates fine-grained capabilities with admin override.
 */
export const can = (user, permission) => {
  if (!user || !user.role) return false;
  if (user.role === 'admin') return true; // Admin bypass
  
  return Boolean(user.permissions && user.permissions.includes(permission));
};

export const hasPermission = can;

export const authService = {
  /**
   * Log in user via Express Backend
   */
  async loginWithCredentials(email, password, rememberMe) {
    if (!password) throw new Error('Password is required');
    const payload = { email, password };
    if (rememberMe) payload.rememberMe = rememberMe;
    const response = await apiClient.post('/auth/login', payload);
    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }
    return response.data; // returns { user, token, etc. }
  },

  // Backward compatible alias
  login(email, password) {
    return this.loginWithCredentials(email, password);
  },

  /**
   * Log in user via Google OAuth SSO
   */
  async googleLogin(idToken, role = 'agent') {
    const response = await apiClient.post('/auth/google', { idToken, role });
    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }
    return response.data;
  },

  /**
   * Register new user via Express Backend
   */
  async registerUser(payload) {
    const response = await apiClient.post('/auth/register', payload);
    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }
    return response.data;
  },

  // Backward compatible alias
  register(email, password, metadata = {}) {
    return this.registerUser({
      email,
      password,
      fullName: metadata.fullName,
      role: metadata.role || 'agent'
    });
  },

  /**
   * Verify token and fetch authenticated user from Express Backend
   */
  async validateSession() {
    const token = apiClient.getToken();
    if (!token) return null;

    try {
      const response = await apiClient.get('/auth/me');
      return response?.data?.user || null;
    } catch (err) {
      // If token is expired or invalid, clear it
      apiClient.clearToken();
      return null;
    }
  },

  // Backward compatible alias
  getCurrentUser() {
    return this.validateSession();
  },

  /**
   * Refresh the access token
   */
  async refreshSession(refreshToken) {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }
    return response.data;
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
