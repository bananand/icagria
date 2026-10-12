// src/api/users.js
// Users API functions matching API.md §3.
import apiClient from './client';

/**
 * Fetch users with optional role filter (Admin only).
 * GET /users
 * @param {{ role?: 'farmer'|'buyer'|'admin' }} [params]
 * @returns {Promise<Array<object>>}
 */
export async function getUsers(params = {}) {
  const res = await apiClient.get('/users', { params });
  return res.data.data;
}
