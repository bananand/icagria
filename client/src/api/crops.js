// src/api/crops.js
// Crop guide API functions matching API.md §5.
import apiClient from './client';

/**
 * Fetch all crops, optionally filtered by type or search query.
 * GET /crops
 * @param {{ type?: 'tuber'|'legume', search?: string }} [params]
 * @returns {Promise<Array<object>>}
 */
export async function getCrops(params = {}) {
  const res = await apiClient.get('/crops', { params });
  return res.data.data;
}

/**
 * Fetch a single crop by ID.
 * GET /crops/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getCropById(id) {
  const res = await apiClient.get(`/crops/${id}`);
  return res.data.data;
}

/**
 * Create a new crop (Admin only).
 * POST /crops
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function createCrop(payload) {
  const res = await apiClient.post('/crops', payload);
  return res.data.data;
}

/**
 * Update a crop (Admin only).
 * PUT /crops/:id
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function updateCrop(id, payload) {
  const res = await apiClient.put(`/crops/${id}`, payload);
  return res.data.data;
}

/**
 * Delete a crop (Admin only).
 * DELETE /crops/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function deleteCrop(id) {
  const res = await apiClient.delete(`/crops/${id}`);
  return res.data;
}
