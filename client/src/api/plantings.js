// src/api/plantings.js
// Plantings API functions matching API.md §7.
import apiClient from './client';

/**
 * Fetch plantings (farmer sees own, admin sees all), optionally filtered by farmId.
 * GET /plantings
 * @param {{ farmId?: string }} [params]
 * @returns {Promise<Array<object>>}
 */
export async function getPlantings(params = {}) {
  const res = await apiClient.get('/plantings', { params });
  return res.data.data;
}

/**
 * Fetch a single planting by ID.
 * GET /plantings/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getPlantingById(id) {
  const res = await apiClient.get(`/plantings/${id}`);
  return res.data.data;
}

/**
 * Create a new planting.
 * POST /plantings
 * @param {{ farm: string, crop: string, variety?: string, quantity?: number, plantedDate?: string, expectedHarvestDate?: string }} payload
 * @returns {Promise<object>}
 */
export async function createPlanting(payload) {
  const res = await apiClient.post('/plantings', payload);
  return res.data.data;
}

/**
 * Update an existing planting.
 * PUT /plantings/:id
 * @param {string} id
 * @param {{ variety?: string, quantity?: number, plantedDate?: string, expectedHarvestDate?: string, status?: 'growing'|'harvested' }} payload
 * @returns {Promise<object>}
 */
export async function updatePlanting(id, payload) {
  const res = await apiClient.put(`/plantings/${id}`, payload);
  return res.data.data;
}

/**
 * Delete a planting.
 * DELETE /plantings/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function deletePlanting(id) {
  const res = await apiClient.delete(`/plantings/${id}`);
  return res.data;
}
