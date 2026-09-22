import { createContext, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const authData = await authService.getCurrentUser();
        if (mounted && authData?.user) {
          setUser(authData.user);
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    const authData = await authService.login(email, password);
    setUser(authData.user);
    return authData;
  };

  const register = async (email, password, metadata) => {
    setError(null);
    const authData = await authService.register(email, password, metadata);
    setUser(authData.user);
    return authData;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
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
