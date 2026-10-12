// src/api/bookings.js
// Farmer Input Orders and Consultation Bookings API functions matching API.md §15.
import apiClient from './client';

/**
 * Create a new product or consultation booking (Farmer only).
 * POST /bookings
 * @param {{ type: 'product'|'consultation', product?: string, quantity?: number, scheduledAt?: string, notes?: string }} payload
 * @returns {Promise<object>}
 */
export async function createBooking(payload) {
  const res = await apiClient.post('/bookings', payload);
  return res.data.data;
}

/**
 * Fetch bookings (farmer sees own, admin sees all).
 * GET /bookings
 * @param {{ type?: 'product'|'consultation', status?: 'pending'|'confirmed'|'delivered'|'cancelled' }} [params]
 * @returns {Promise<Array<object>>}
 */
export async function getBookings(params = {}) {
  const res = await apiClient.get('/bookings', { params });
  return res.data.data;
}

/**
 * Cancel a pending booking (Farmer owner only).
 * PUT /bookings/:id/cancel
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function cancelBooking(id) {
  const res = await apiClient.put(`/bookings/${id}/cancel`);
  return res.data.data;
}

/**
 * Update booking status (Admin only).
 * PUT /bookings/:id/status
 * @param {string} id
 * @param {{ status: 'confirmed'|'delivered'|'cancelled' }} payload
 * @returns {Promise<object>}
 */
export async function updateBookingStatus(id, payload) {
  const res = await apiClient.put(`/bookings/${id}/status`, payload);
  return res.data.data;
}
