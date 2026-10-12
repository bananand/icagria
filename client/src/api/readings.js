// src/api/readings.js
// Soil pH Readings API functions matching API.md §9.
import apiClient from './client';

/**
 * Simulate a reading for a farm device (Farmer only).
 * POST /readings/simulate
 * @param {{ deviceId: string, mode?: 'auto'|'low'|'high'|'normal' }} payload
 * @returns {Promise<{ reading: object, evaluation: object, alert: object|null }>}
 */
export async function simulateReading(payload) {
  const res = await apiClient.post('/readings/simulate', payload);
  return res.data.data;
}

/**
 * Fetch historical readings.
 * GET /readings
 * @param {{ farmId: string, deviceId?: string, days?: number, limit?: number }} params
 * @returns {Promise<{ readings: Array<object>, count: number, range: object|null }>}
 */
export async function getReadings(params) {
  const res = await apiClient.get('/readings', { params });
  return res.data.data;
}

/**
 * Fetch latest reading and crop status evaluations for a farm.
 * GET /readings/latest
 * @param {{ farmId: string }} params
 * @returns {Promise<{ farmId: string, farmName: string, reading: object|null, evaluation: object, cropStatuses: Array<object> }>}
 */
export async function getLatestReading(params) {
  const res = await apiClient.get('/readings/latest', { params });
  return res.data.data;
}

/**
 * Fetch reading statistics and daily trends.
 * GET /readings/summary
 * @param {{ farmId: string, days?: number, tzOffsetMinutes?: number }} params
 * @returns {Promise<{ days: number, count: number, min: number|null, max: number|null, avg: number|null, outOfRangeCount: number, inRangePercent: number, daily: Array<object> }>}
 */
export async function getReadingsSummary(params) {
  const res = await apiClient.get('/readings/summary', { params });
  return res.data.data;
}

/**
 * Delete a reading and its associated alert.
 * DELETE /readings/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function deleteReading(id) {
  const res = await apiClient.delete(`/readings/${id}`);
  return res.data;
}
