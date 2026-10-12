// src/api/devices.js
// Devices API functions matching API.md §8.
import apiClient from './client';

/**
 * Register a new device.
 * POST /devices
 * @param {{ farm: string, name: string, source?: 'simulated'|'hardware' }} payload
 * @returns {Promise<object>} device object (includes apiKey if source is hardware)
 */
export async function createDevice(payload) {
  const res = await apiClient.post('/devices', payload);
  return res.data.data;
}

/**
 * Fetch devices (farmer sees own, admin sees all), optionally filtered by farmId.
 * GET /devices
 * @param {{ farmId?: string }} [params]
 * @returns {Promise<Array<object>>}
 */
export async function getDevices(params = {}) {
  const res = await apiClient.get('/devices', { params });
  return res.data.data;
}

/**
 * Update device (name, status: 'active'|'inactive').
 * PUT /devices/:id
 * @param {string} id
 * @param {{ name?: string, status?: 'active'|'inactive' }} payload
 * @returns {Promise<object>} updated device object
 */
export async function updateDevice(id, payload) {
  const res = await apiClient.put(`/devices/${id}`, payload);
  return res.data.data;
}

/**
 * Regenerate API key for a hardware device.
 * POST /devices/:id/regenerate-key
 * @param {string} id
 * @returns {Promise<{ apiKey: string }>}
 */
export async function regenerateApiKey(id) {
  const res = await apiClient.post(`/devices/${id}/regenerate-key`);
  return res.data.data;
}

/**
 * Delete a device and cascade delete readings and alerts.
 * DELETE /devices/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function deleteDevice(id) {
  const res = await apiClient.delete(`/devices/${id}`);
  return res.data;
}
