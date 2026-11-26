import apiClient from './apiClient';

function persistAuthTokens(data) {
  if (data?.token) {
    apiClient.setToken(data.token);
  }
  if (data?.refreshToken && typeof window !== 'undefined') {
    try {
      localStorage.setItem('cp_refresh_token', data.refreshToken);
    } catch (err) {
      console.warn('[authService] Failed storing refresh token:', err);
    }
  }
  return data;
}

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

let inflightValidatePromise = null;

export const authService = {
  /**
   * Smart email-first lookup: returns { status: 'existing' | 'invited_agent' | 'new', email }
   */
  async identifyEmail(email) {
    const response = await apiClient.post('/auth/identify', { email });
    return response.data;
  },

  /**
   * Log in user via Express Backend
   */
  async loginWithCredentials(email, password, rememberMe) {
    if (!password) throw new Error('Password is required');
    const payload = { email, password };
    if (rememberMe) payload.rememberMe = rememberMe;
    const response = await apiClient.post('/auth/login', payload);
    return persistAuthTokens(response.data);
  },

  // Backward compatible alias
  login(email, password) {
    return this.loginWithCredentials(email, password);
  },

  /**
   * Log in user via Google OAuth SSO
   */
  async googleLogin(idToken, role = 'client') {
    const response = await apiClient.post('/auth/google', { idToken, role });
    return persistAuthTokens(response.data);
  },

  /**
   * Register new user via Express Backend
   */
  async registerUser(payload) {
    const response = await apiClient.post('/auth/register', payload);
    return persistAuthTokens(response.data);
  },

  /**
   * Initiate registration with 6-digit Email OTP dispatch
   */
  async initiateRegistrationOtp(payload) {
    const response = await apiClient.post('/auth/register-otp/initiate', payload);
    return response.data;
  },

  /**
   * Verify 6-digit email OTP first and receive a short-lived verification token
   */
  async verifyRegistrationEmail(email, otp) {
    const response = await apiClient.post('/auth/register-otp/verify-email', { email, otp });
    return response.data;
  },

  /**
   * Complete step-by-step client registration with verification token, phone, full name, password & optional photo
   */
  async completeRegistration(payload) {
    const response = await apiClient.post('/auth/register-otp/complete', payload);
    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }
    if (response?.data?.refreshToken && typeof window !== 'undefined') {
      try {
        localStorage.setItem('cp_refresh_token', response.data.refreshToken);
      } catch (err) {
        console.warn('[authService] Failed storing refresh token:', err);
      }
    }
    return response.data;
  },

  /**
   * Verify registration 6-digit Email OTP and establish session
   */
  async verifyRegistrationOtp(payload) {
    const response = await apiClient.post('/auth/register-otp/verify', payload);
    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }
    if (response?.data?.refreshToken && typeof window !== 'undefined') {
      try {
        localStorage.setItem('cp_refresh_token', response.data.refreshToken);
      } catch (err) {
        console.warn('[authService] Failed storing refresh token:', err);
      }
    }
    return response.data;
  },

  /**
   * Resend 6-digit registration verification OTP (supports email or phone channel)
   */
  async resendRegistrationOtp(email, channel) {
    const payload = channel ? { email, channel } : { email };
    const response = await apiClient.post('/auth/register-otp/resend', payload);
    return response.data;
  },

  // Backward compatible alias
  register(email, password, metadata = {}) {
    return this.registerUser({
      email,
      password,
      fullName: metadata.fullName,
      role: metadata.role || 'client'
    });
  },

  /**
   * Verify token and fetch authenticated user from Express Backend
   */
  async validateSession() {
    const token = apiClient.getToken();
    if (!token) return null;

    if (inflightValidatePromise) return inflightValidatePromise;

    inflightValidatePromise = (async () => {
      try {
        const response = await apiClient.get('/auth/me');
        const user = response?.data?.user;
        const profile = response?.data?.profile;
        if (!user) return null;

        return {
          ...user,
          profile: profile || user.profile,
          fullName:
            user.fullName ||
            profile?.full_name ||
            user.full_name ||
            user.user_metadata?.full_name ||
            (user.email ? user.email.split('@')[0] : 'User'),
        };
      } catch (err) {
        // If token is expired or invalid, clear it
        apiClient.clearToken();
        return null;
      } finally {
        inflightValidatePromise = null;
      }
    })();

    return inflightValidatePromise;
  },

  // Backward compatible alias
  getCurrentUser() {
    return this.validateSession();
  },

  /**
   * Retrieve the stored refresh token from local storage
   */
  getStoredRefreshToken() {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('cp_refresh_token');
    } catch {
      return null;
    }
  },

  /**
   * Refresh the access token
   */
  async refreshSession(refreshToken) {
    const tokenToUse = refreshToken || this.getStoredRefreshToken();
    if (!tokenToUse) {
      throw new Error('No refresh token available');
    }
    const response = await apiClient.post('/auth/refresh', { refreshToken: tokenToUse });
    if (response?.data?.token) {
      apiClient.setToken(response.data.token);
    }
    if (response?.data?.refreshToken && typeof window !== 'undefined') {
      try {
        localStorage.setItem('cp_refresh_token', response.data.refreshToken);
      } catch (err) {
        console.warn('[authService] Failed updating refresh token:', err);
      }
    }
    return response.data;
  },

  /**
   * Extend the server-authoritative idle timeout for the active session
   */
  async extendSession() {
    const response = await apiClient.post('/auth/extend-session');
    return response.data;
  },

  /**
   * Send password recovery reset email instructions
   */
  async forgotPassword(email, redirectTo) {
    const response = await apiClient.post('/auth/forgot-password', { email, redirectTo });
    return response.data;
  },

  /**
   * Complete password reset with token and new password
   */
  async resetPassword({ token, newPassword }) {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  /**
   * Resend account verification email
   */
  async resendVerification(email) {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  /**
   * Get active sessions for the current authenticated user
   */
  async getActiveSessions() {
    const response = await apiClient.get('/auth/sessions');
    return response.data;
  },

  /**
   * Revoke an active session
   */
  async revokeSession(sessionId) {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Revoke all active sessions for the current user
   */
  async revokeAllSessions() {
    const response = await apiClient.post('/auth/revoke-all');
    return response.data;
  },

  /**
   * Log out user and clear stored tokens
   */
  async logout() {
    inflightValidatePromise = null;
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      apiClient.clearToken();
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('cp_refresh_token');
        } catch {
          // ignore
        }
      }
    }
  },

  isAuthenticated() {
    return Boolean(apiClient.getToken());
  },
};

export default authService;
