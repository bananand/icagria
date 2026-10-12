// src/api/farms.js
// Farms API functions matching API.md §6.
import apiClient from './client';

/**
 * Fetch farms (farmer sees own, admin sees all).
 * GET /farms
 * @returns {Promise<Array<object>>}
 */
export async function getFarms() {
  const res = await apiClient.get('/farms');
  return res.data.data;
}

/**
 * Fetch a single farm by ID.
 * GET /farms/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getFarmById(id) {
  const res = await apiClient.get(`/farms/${id}`);
  return res.data.data;
}

/**
 * Create a new farm.
 * POST /farms
 * @param {{ name: string, location: { text: string, lat?: number, lng?: number }, areaSize: number, mainCrop?: string, establishedDate?: string }} payload
 * @returns {Promise<object>}
 */
export async function createFarm(payload) {
  const res = await apiClient.post('/farms', payload);
  return res.data.data;
}

/**
 * Update a farm.
 * PUT /farms/:id
 * @param {string} id
 * @param {{ name?: string, location?: { text?: string, lat?: number, lng?: number }, areaSize?: number, mainCrop?: string, establishedDate?: string }} payload
 * @returns {Promise<object>}
 */
export async function updateFarm(id, payload) {
  const res = await apiClient.put(`/farms/${id}`, payload);
  return res.data.data;
}

/**
 * Delete a farm and cascade associated data.
 * DELETE /farms/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function deleteFarm(id) {
  const res = await apiClient.delete(`/farms/${id}`);
  return res.data;
}
