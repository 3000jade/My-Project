import { createContext, useContext, useEffect, useState } from 'react';
import { authService, hasRole as authHasRole, can as authCan } from '../services/authService';
import { sessionCoordinator } from '../services/sessionCoordinator';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [idleWarning, setIdleWarning] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const authUser = await authService.validateSession();
        if (mounted && authUser) {
          setUser(authUser);
        } else if (mounted) {
          setUser(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();

    const unsubscribe = sessionCoordinator.subscribeSessionEvents((event) => {
      if (!mounted) return;
      if (event.type === 'LOGOUT' || event.type === 'ROLE_REVOKED') {
        setUser(null);
        setIdleWarning(false);
      } else if (event.type === 'ACCOUNT_SWITCH' && event.user) {
        setUser(event.user);
      } else if (event.type === 'IDLE_WARNING') {
        setIdleWarning(true);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithCredentials = async (email, password, rememberMe) => {
    setError(null);
    const authData = await authService.loginWithCredentials(email, password, rememberMe);
    if (user && authData.user && user.id !== authData.user.id) {
      sessionCoordinator.broadcastSessionEvent('ACCOUNT_SWITCH', { user: authData.user });
    }
    setUser(authData.user);
    setIdleWarning(false);
    return authData;
  };

  const registerUser = async (payload) => {
    setError(null);
    const authData = await authService.registerUser(payload);
    setUser(authData.user);
    return authData;
  };

  const logout = async () => {
    sessionCoordinator.broadcastSessionEvent('LOGOUT');
    await authService.logout();
    setUser(null);
    setError(null);
    setIdleWarning(false);
  };

  const validateSession = async () => {
    const authUser = await authService.validateSession();
    setUser(authUser);
    return authUser;
  };

  const refreshSession = async (refreshToken) => {
    setError(null);
    const authData = await sessionCoordinator.executeSerializedRefresh(() =>
      authService.refreshSession(refreshToken)
    );
    setUser(authData.user);
    setIdleWarning(false);
    return authData;
  };

  // Keep backward compatibility
  const login = loginWithCredentials;
  const register = async (email, password, metadata) => {
    return registerUser({ email, password, fullName: metadata?.fullName, role: metadata?.role });
  };
  const googleLogin = async (idToken, role = 'agent') => {
    setError(null);
    const authData = await authService.googleLogin(idToken, role);
    setUser(authData.user);
    return authData;
  };

  const hasRole = (role) => authHasRole(user, role);
  const can = (perm) => authCan(user, perm);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    error,
    idleWarning,
    loginWithCredentials,
    registerUser,
    logout,
    refreshSession,
    validateSession,
    hasRole,
    can,
    // Aliases
    login,
    register,
    googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      idleWarning: false,
      hasRole: () => false,
      can: () => false,
      logout: async () => {},
    };
  }
  return context;
}

export default AuthContext;
