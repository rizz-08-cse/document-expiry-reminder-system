import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('doc_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('doc_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/profile');
        if (response.success && response.user) {
          setUser(response.user);
          localStorage.setItem('doc_user', JSON.stringify(response.user));
        } else {
          logout();
        }
      } catch (err) {
        console.warn('[AuthContext] Session expired or invalid:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const saveAuthSession = (authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem('doc_token', authToken);
    localStorage.setItem('doc_user', JSON.stringify(authUser));
  };

  const login = async (phoneOrEmail, password) => {
    const response = await api.post('/auth/login', {
      identifier: phoneOrEmail,
      password
    });

    if (response.success) {
      saveAuthSession(response.token, response.user);
    }
    return response;
  };

  const adminLogin = async (identifier, password) => {
    const response = await api.post('/auth/admin/login', {
      email: identifier,
      phone: identifier,
      password
    });

    if (response.success) {
      saveAuthSession(response.token, response.user);
    }
    return response;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.success) {
      saveAuthSession(response.token, response.user);
    }
    return response;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('doc_token');
    localStorage.removeItem('doc_user');
  };

  const updateProfile = async (updateData) => {
    const response = await api.put('/auth/profile', updateData);
    if (response.success && response.user) {
      setUser(response.user);
      localStorage.setItem('doc_user', JSON.stringify(response.user));
    }
    return response;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(token && user),
        isAdmin: user?.role === 'admin',
        isCustomer: user?.role === 'customer',
        login,
        adminLogin,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
