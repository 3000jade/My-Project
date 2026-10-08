import { createContext, useContext, useEffect, useState } from 'react';
import { authService, hasRole as authHasRole, can as authCan } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    return () => {
      mounted = false;
    };
  }, []);

  const loginWithCredentials = async (email, password, rememberMe) => {
    setError(null);
    const authData = await authService.loginWithCredentials(email, password, rememberMe);
    setUser(authData.user);
    return authData;
  };

  const registerUser = async (payload) => {
    setError(null);
    const authData = await authService.registerUser(payload);
    setUser(authData.user);
    return authData;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setError(null);
  };

  const validateSession = async () => {
    const authUser = await authService.validateSession();
    setUser(authUser);
    return authUser;
  };

  const refreshSession = async (refreshToken) => {
    setError(null);
    const authData = await authService.refreshSession(refreshToken);
    setUser(authData.user);
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
