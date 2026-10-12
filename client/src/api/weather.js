// src/api/weather.js
// Weather API functions matching API.md §11.
import apiClient from './client';

/**
 * Fetch current weather and 5-day forecast.
 * Provide either farmId OR city OR (lat AND lon).
 * GET /weather
 * @param {{ farmId?: string, city?: string, lat?: number, lon?: number }} params
 * @returns {Promise<object>}
 */
export async function getWeather(params) {
  const res = await apiClient.get('/weather', { params });
  return res.data.data;
}
