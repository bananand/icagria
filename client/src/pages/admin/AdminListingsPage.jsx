// src/pages/admin/AdminListingsPage.jsx
// Admin Listings Management: status tabs (available, reserved, sold), listings table, delete with cascade confirmation.
import React, { useEffect, useState, useId } from 'react';
import {
  ShoppingBag,
  Search,
  Trash2,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';

import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBlock from '../../components/ui/ErrorBlock';
import { TableContainer, Th, Td } from '../../components/ui/Table';

import { getListings, deleteListing } from '../../api/listings';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/format';

const TABS = [
  { id: 'available', label: 'Available' },
  { id: 'reserved', label: 'Reserved' },
  { id: 'sold', label: 'Sold' },
];

export default function AdminListingsPage() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('available');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const searchInputId = useId();

  const loadListings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getListings({
        status: activeTab,
        limit: 100,
      });
      setListings(data.listings || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to load marketplace listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [activeTab]);

  const filteredListings = listings.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesCrop = (l.cropName || '').toLowerCase().includes(q);
    const matchesLocation = (l.location || '').toLowerCase().includes(q);
    const matchesSeller = (l.seller?.name || l.sellerName || '').toLowerCase().includes(q);
    return matchesCrop || matchesLocation || matchesSeller;
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteListing(deleteTarget._id);
      showToast('Listing deleted successfully', 'success');
      setListings((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to delete listing';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Marketplace Moderation"
        title="Harvest Listings Management"
        description="Review all farmer produce listings, inspect status availability, and moderate listings across the marketplace."
      />

      {/* Tabs and Search Header */}
      <section aria-label="Listing controls" className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <nav aria-label="Listing status tabs" className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={active}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    active
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Search bar */}
          <div className="w-full md:w-80 relative">
            <label htmlFor={searchInputId} className="sr-only">Search listings by crop, seller, or location</label>
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id={searchInputId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by crop, seller, location..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 bg-white"
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Spinner size="lg" className="text-green-700" />
          <p className="mt-4 text-sm font-medium">Loading {activeTab} listings...</p>
        </div>
      ) : error ? (
        <ErrorBlock message={error} onRetry={loadListings} />
      ) : filteredListings.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={40} />}
          title={`No ${activeTab} listings`}
          description={
            searchQuery
              ? 'No listings match your search keywords.'
              : `There are currently no produce listings marked as ${activeTab}.`
          }
        />
      ) : (
        <TableContainer>
          <thead className="bg-gray-50">
            <tr>
              <Th>Crop / Produce</Th>
              <Th>Seller</Th>
              <Th>Quantity</Th>
              <Th>Price / Unit</Th>
              <Th>Location</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
              {filteredListings.map((l) => (
                <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{l.cropName}</span>
                      <span className="text-xs text-gray-500 line-clamp-1 max-w-xs">{l.description || 'No description'}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span>{l.seller?.name || l.sellerName || 'Farmer'}</span>
                    </div>
                  </Td>
                  <Td className="text-sm font-medium text-gray-900">
                    {l.quantity} {l.unit}
                  </Td>
                  <Td className="text-sm text-gray-900 font-medium">
                    {formatCurrency(l.pricePerUnit)}/{l.unit}
                  </Td>
                  <Td className="text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {l.location || '—'}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={l.status || 'available'} />
                  </Td>
                  <Td className="text-xs text-gray-500">
                    {formatDate(l.createdAt)}
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(l)}
                      aria-label={`Delete listing for ${l.cropName}`}
                      className="text-gray-600 hover:text-red-700 p-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
        </TableContainer>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Harvest Listing"
        message={`Are you sure you want to delete the listing for "${deleteTarget?.cropName}"? Deleting this listing will also cascade delete all associated buyer inquiries.`}
        confirmText="Delete Listing"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </AppShell>
  );
}
