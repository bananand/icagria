// src/api/reports.js
// Agronomic Farm and Sales Reports API functions matching API.md §17.
import apiClient from './client';

/**
 * Fetch farm summary report for a specific farm over a days window.
 * GET /reports/farm-summary
 * @param {{ farmId: string, days?: number }} params
 * @returns {Promise<object>}
 */
export async function getFarmSummary(params) {
  const res = await apiClient.get('/reports/farm-summary', { params });
  return res.data.data;
}

/**
 * Fetch sales report for the authenticated farmer.
 * GET /reports/sales
 * @returns {Promise<object>}
 */
export async function getSalesReport() {
  const res = await apiClient.get('/reports/sales');
  return res.data.data;
}
