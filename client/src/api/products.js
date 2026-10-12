// src/api/products.js
// Farm Supplies Products API functions matching API.md §14.
import apiClient from './client';

/**
 * Fetch available shop products with optional category and search filters.
 * GET /products
 * @param {{ category?: 'seeds'|'fertilizer'|'pesticide'|'equipment'|'other', search?: string }} [params]
 * @returns {Promise<Array<object>>}
 */
export async function getProducts(params = {}) {
  const res = await apiClient.get('/products', { params });
  return res.data.data;
}

/**
 * Fetch a single product by ID.
 * GET /products/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getProductById(id) {
  const res = await apiClient.get(`/products/${id}`);
  return res.data.data;
}

/**
 * Create a new product (Admin only).
 * POST /products
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function createProduct(payload) {
  const res = await apiClient.post('/products', payload);
  return res.data.data;
}

/**
 * Update a product (Admin only).
 * PUT /products/:id
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function updateProduct(id, payload) {
  const res = await apiClient.put(`/products/${id}`, payload);
  return res.data.data;
}

/**
 * Delete a product (Admin only).
 * DELETE /products/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function deleteProduct(id) {
  const res = await apiClient.delete(`/products/${id}`);
  return res.data;
}
