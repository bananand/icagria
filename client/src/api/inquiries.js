// src/api/inquiries.js
// Harvest Marketplace Inquiries API functions matching API.md §13.
import apiClient from './client';

/**
 * Fetch inquiries (buyer sees own, farmer sees inquiries on their listings, admin sees all).
 * GET /inquiries
 * @param {{ status?: 'pending'|'accepted'|'rejected', listingId?: string }} [params]
 * @returns {Promise<Array<object>>}
 */
export async function getInquiries(params = {}) {
  const res = await apiClient.get('/inquiries', { params });
  return res.data.data;
}

/**
 * Create an inquiry on an available listing (Buyer only).
 * POST /inquiries
 * @param {{ listing: string, quantity?: number, message?: string }} payload
 * @returns {Promise<object>}
 */
export async function createInquiry(payload) {
  const res = await apiClient.post('/inquiries', payload);
  return res.data.data;
}

/**
 * Accept or reject an inquiry (Listing seller only).
 * PUT /inquiries/:id/status
 * @param {string} id
 * @param {{ status: 'accepted'|'rejected' }} payload
 * @returns {Promise<object>}
 */
export async function updateInquiryStatus(id, payload) {
  const res = await apiClient.put(`/inquiries/${id}/status`, payload);
  return res.data.data;
}

/**
 * Delete / cancel a pending inquiry (Buyer only).
 * DELETE /inquiries/:id
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function deleteInquiry(id) {
  const res = await apiClient.delete(`/inquiries/${id}`);
  return res.data;
}
