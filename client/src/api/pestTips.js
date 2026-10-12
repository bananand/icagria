// src/api/pestTips.js
// Pest and Disease Tips API functions matching API.md §16.
import apiClient from './client';

/**
 * Fetch agronomic pest management tips for crops growing on the farmer's farm.
 * GET /pest-tips
 * @param {{ farmId: string }} params
 * @returns {Promise<{ disclaimer: string, data: Array<{ cropName: string, pests: Array<{ name: string, tips: Array<string> }> }> }>}
 */
export async function getPestTips(params) {
  const res = await apiClient.get('/pest-tips', { params });
  return {
    disclaimer: res.data.disclaimer,
    data: res.data.data,
  };
}
