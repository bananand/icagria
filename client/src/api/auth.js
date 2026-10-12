// src/api/auth.js
// Authentication API functions matching API.md §2.
import apiClient from './client';

/**
 * Register a new farmer or buyer account.
 * POST /auth/register
 * @param {{ name, email, password, confirmPassword, role, phone? }} payload
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function register(payload) {
  const res = await apiClient.post('/auth/register', payload);
  return res.data.data; // unwrap { success, data }
}

/**
 * Log in with email and password.
 * POST /auth/login
 * @param {{ email, password }} payload
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function login(payload) {
  const res = await apiClient.post('/auth/login', payload);
  return res.data.data;
}

/**
 * Fetch the authenticated user's profile.
 * GET /auth/me
 * @returns {Promise<object>} User object
 */
export async function getMe() {
  const res = await apiClient.get('/auth/me');
  return res.data.data;
}

/**
 * Update the authenticated user's profile.
 * PUT /auth/me
 * @param {{ name?, phone?, address? }} payload
 * @returns {Promise<object>} Updated user object
 */
export async function updateMe(payload) {
  const res = await apiClient.put('/auth/me', payload);
  return res.data.data;
}
