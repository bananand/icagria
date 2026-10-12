// src/api/admin.js
// Admin Management API functions matching API.md §4.
import apiClient from './client';

/**
 * Fetch platform statistics and overview summary (Admin only).
 * GET /admin/stats
 * @returns {Promise<{ counts: object, overview: Array<{ name: string, value: number }>, recentUsers: Array<object>, recentListings: Array<object>, recentProducts: Array<object> }>}
 */
export async function getAdminStats() {
  const res = await apiClient.get('/admin/stats');
  return res.data.data;
}

/**
 * Fetch user details and their associated activity counts (Admin only).
 * GET /admin/users/:id
 * @param {string} id
 * @returns {Promise<{ user: object, counts: { farms: number, listings: number, bookings: number } }>}
 */
export async function getAdminUserById(id) {
  const res = await apiClient.get(`/admin/users/${id}`);
  return res.data.data;
}

/**
 * Update user details and role (Admin only).
 * PUT /admin/users/:id
 * @param {string} id
 * @param {{ name?: string, phone?: string, address?: string, role?: 'farmer'|'buyer'|'admin' }} payload
 * @returns {Promise<object>}
 */
export async function updateAdminUser(id, payload) {
  const res = await apiClient.put(`/admin/users/${id}`, payload);
  return res.data.data;
}

/**
 * Delete a user and cascade delete associated records (Admin only).
 * DELETE /admin/users/:id
 * @param {string} id
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function deleteAdminUser(id) {
  const res = await apiClient.delete(`/admin/users/${id}`);
  return res.data;
}
