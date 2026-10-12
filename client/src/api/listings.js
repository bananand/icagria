// src/api/listings.js
// Harvest Marketplace Listings API functions matching API.md §12.
import apiClient from './client';

/**
 * Fetch marketplace listings.
 * GET /listings
 * @param {{ status?: string, crop?: string, search?: string, mine?: boolean|string, minPrice?: number, maxPrice?: number, sort?: 'price_asc'|'price_desc'|'date_desc', page?: number, limit?: number }} [params]
 * @returns {Promise<{ listings: Array<object>, page: number, pages: number, total: number }>}
 */
export async function getListings(params = {}) {
  const res = await apiClient.get('/listings', { params });
  return res.data.data;
}

/**
 * Fetch a single listing by ID.
 * GET /listings/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getListingById(id) {
  const res = await apiClient.get(`/listings/${id}`);
  return res.data.data;
}

/**
 * Create a new harvest listing (Farmer only).
 * POST /listings
 * @param {{ cropName: string, crop?: string, quantity: number, unit?: 'kg'|'ton', pricePerUnit: number, location?: string, description?: string }} payload
 * @returns {Promise<object>}
 */
export async function createListing(payload) {
  const res = await apiClient.post('/listings', payload);
  return res.data.data;
}

/**
 * Update a listing (Seller only).
 * PUT /listings/:id
 * @param {string} id
 * @param {{ cropName?: string, quantity?: number, unit?: 'kg'|'ton', pricePerUnit?: number, location?: string, description?: string, status?: 'available'|'reserved'|'sold' }} payload
 * @returns {Promise<object>}
 */
export async function updateListing(id, payload) {
  const res = await apiClient.put(`/listings/${id}`, payload);
  return res.data.data;
}

/**
 * Delete a listing (Seller only).
 * DELETE /listings/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function deleteListing(id) {
  const res = await apiClient.delete(`/listings/${id}`);
  return res.data;
}
