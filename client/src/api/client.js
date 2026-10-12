// src/api/client.js
// Axios instance with auth interceptors.

import axios from 'axios';

const TOKEN_KEY = 'icagria_token';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach Bearer token ────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 ───────────────────────────────────────
// We store a reference to the toast-push function so the interceptor can
// show a notification. It is injected by ToastProvider via setToastPusher().
let _pushToast = null;
export function setToastPusher(fn) {
  _pushToast = fn;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // On 401 for non-auth endpoints, expire the session.
    const isAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem(TOKEN_KEY);
      if (_pushToast) {
        _pushToast({
          message: 'Your session has expired. Please log in again.',
          type: 'error',
        });
      }
      // Navigate to login – use location replace so browser history is clean.
      window.location.replace('/login');
    }

    return Promise.reject(error);
  },
);

/**
 * Extract a user-facing error message from an Axios error.
 * @param {unknown} err
 * @returns {string}
 */
export function getErrorMessage(err) {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return 'Cannot reach the server. Is the backend running?';
  }
  return 'Something went wrong.';
}

export default apiClient;
