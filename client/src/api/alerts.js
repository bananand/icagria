// src/api/alerts.js
// Alerts API functions matching API.md §10.
import apiClient from './client';

/**
 * Fetch alerts for the authenticated user.
 * GET /alerts
 * @param {{ farmId?: string, unread?: boolean|string, limit?: number }} [params]
 * @returns {Promise<Array<object>>}
 */
export async function getAlerts(params = {}) {
  const res = await apiClient.get('/alerts', { params });
  return res.data.data;
}

/**
 * Fetch count of unread alerts.
 * GET /alerts/unread-count
 * @returns {Promise<{ count: number }>}
 */
export async function getUnreadAlertsCount() {
  const res = await apiClient.get('/alerts/unread-count');
  return res.data.data;
}

/**
 * Mark all user's alerts as read.
 * PUT /alerts/read-all
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function markAllAlertsRead() {
  const res = await apiClient.put('/alerts/read-all');
  return res.data;
}

/**
 * Mark a single alert as read.
 * PUT /alerts/:id/read
 * @param {string} id
 * @returns {Promise<object>} updated alert object
 */
export async function markAlertRead(id) {
  const res = await apiClient.put(`/alerts/${id}/read`);
  return res.data.data;
}

/**
 * Delete a single alert.
 * DELETE /alerts/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function deleteAlert(id) {
  const res = await apiClient.delete(`/alerts/${id}`);
  return res.data;
}

/**
 * Trigger alert scan on farm historical readings.
 * POST /alerts/scan
 * @param {{ farmId: string, days?: number }} payload
 * @returns {Promise<{ created: number, alreadyAlerted?: number, scanned?: number }>}
 */
export async function scanAlerts(payload) {
  const res = await apiClient.post('/alerts/scan', payload);
  return res.data.data;
}
