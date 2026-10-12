// src/context/AuthContext.jsx
// Provides: user, token, loading, login, register, logout, updateProfile.
// Token is stored in localStorage under "icagria_token".

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const TOKEN_KEY = 'icagria_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true); // true while verifying token on mount

  // On mount: if token exists, verify it by calling GET /auth/me
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then((userData) => setUser(userData))
      .catch(() => {
        // Token invalid or expired — clear it
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []); // run once on mount

  /** Persist token helper */
  const _saveToken = useCallback((t) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }, []);

  /**
   * Log in.
   * @param {{ email, password }} credentials
   * @returns {Promise<object>} user object
   */
  const login = useCallback(async (credentials) => {
    const { token: t, user: u } = await authApi.login(credentials);
    _saveToken(t);
    setUser(u);
    return u;
  }, [_saveToken]);

  /**
   * Register a new account.
   * @param {object} payload
   * @returns {Promise<object>} user object
   */
  const register = useCallback(async (payload) => {
    const { token: t, user: u } = await authApi.register(payload);
    _saveToken(t);
    setUser(u);
    return u;
  }, [_saveToken]);

  /** Log out and clear all auth state. */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Update the current user's profile (name, phone, address).
   * @param {{ name?, phone?, address? }} payload
   * @returns {Promise<object>} updated user
   */
  const updateProfile = useCallback(async (payload) => {
    const updated = await authApi.updateMe(payload);
    setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — access the auth context.
 * Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
