import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * AuthContext — Global authentication state for the entire app.
 *
 * WHAT IS CONTEXT? (viva answer):
 * "React Context lets us share data across all components without passing
 *  props down through every level. We wrap our app in AuthProvider, and
 *  any component can call useAuth() to access the logged-in user, login
 *  function, logout function, etc."
 *
 * HOW AUTH FLOW WORKS:
 * 1. User registers or logs in → server returns a JWT token
 * 2. We store the token in localStorage (survives page refresh)
 * 3. Our Axios interceptor (api.js) attaches it to every API request
 * 4. On app load, we call /api/auth/me to verify the stored token
 * 5. If the token is invalid/expired, we clear it and show the login page
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // True while checking stored token
  const [error, setError] = useState(null);

  // ──── Check if user is already logged in (on app mount) ────
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('anvaya_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch {
      // Token is invalid or expired — clear it
      localStorage.removeItem('anvaya_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ──── Register ────
  const register = async (name, email, password, role) => {
    setError(null);
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
      });

      if (response.data.success) {
        const { user: userData, token } = response.data.data;
        localStorage.setItem('anvaya_token', token);
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  };

  // ──── Login ────
  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { user: userData, token } = response.data.data;
        localStorage.setItem('anvaya_token', token);
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  };

  // ──── Logout ────
  const logout = () => {
    localStorage.removeItem('anvaya_token');
    setUser(null);
    setError(null);
  };

  // ──── Clear Error ────
  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    clearError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth() — Custom hook to access auth state from any component.
 * Usage: const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
