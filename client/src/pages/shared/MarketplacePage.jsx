// src/pages/shared/MarketplacePage.jsx
// Role-aware Harvest Marketplace:
// Buyers: Editorial grid, filters (search, crop, min/max price, sort), results count, pagination Load more, ListingDetail modal.
// Farmers: Two tabs ("My listings" and "Inquiries received"), create/edit listing modal with live total value,
// change status with sold confirmation rejecting pending inquiries, phone profile hint.

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import ErrorBlock from '../../components/ui/ErrorBlock';
import Spinner from '../../components/ui/Spinner';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadMore from '../../components/ui/LoadMore';
import { SkeletonCard } from '../../components/ui/Skeleton';
import ListingCard from '../../components/marketplace/ListingCard';
import ListingDetailModal from '../../components/marketplace/ListingDetailModal';
import { TableContainer, Th, Td } from '../../components/ui/Table';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../api/client';
import * as listingApi from '../../api/listings';
import * as inquiryApi from '../../api/inquiries';
import * as cropApi from '../../api/crops';
import {
  ShoppingBag,
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Inbox,
  Filter,
  Phone,
  AlertTriangle,
  ArrowUpDown,
  Tag,
  Clock,
  User,
} from 'lucide-react';

const INITIAL_CREATE_FORM = {
  cropName: '',
  crop: '',
  quantity: '',
  unit: 'kg',
  pricePerUnit: '',
  location: '',
  description: '',
};

export default function MarketplacePage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const isFarmer = user?.role === 'farmer';
  const isBuyer = user?.role === 'buyer' || user?.role === 'admin';

  // Available Crops for Filter / Create Listing
  const [availableCrops, setAvailableCrops] = useState([]);
  useEffect(() => {
    cropApi.getCrops().then(setAvailableCrops).catch(() => setAvailableCrops([]));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // BUYER VIEW STATE (Editorial Catalog)
  // ─────────────────────────────────────────────────────────────────────────────
  const [buyerListings, setBuyerListings] = useState([]);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const [buyerLoadingMore, setBuyerLoadingMore] = useState(false);
  const [buyerPage, setBuyerPage] = useState(1);
  const [buyerPages, setBuyerPages] = useState(1);
  const [buyerTotal, setBuyerTotal] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  // Detail Modal for Buyer
  const [selectedListingDetail, setSelectedListingDetail] = useState(null);

  const fetchBuyerListings = useCallback(
    async (pageToLoad = 1, append = false) => {
      if (pageToLoad === 1) {
        setBuyerLoading(true);
      } else {
        setBuyerLoadingMore(true);
      }

      try {
        const params = {
          page: pageToLoad,
          limit: 12,
          status: 'available',
          sort: sortBy,
        };

        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (selectedCropFilter) params.crop = selectedCropFilter;
        if (minPrice !== '') params.minPrice = Number(minPrice);
        if (maxPrice !== '') params.maxPrice = Number(maxPrice);

        const data = await listingApi.getListings(params);

        if (append) {
          setBuyerListings((prev) => [...prev, ...(data.listings || [])]);
        } else {
          setBuyerListings(data.listings || []);
        }

        setBuyerPage(data.page || 1);
        setBuyerPages(data.pages || 1);
        setBuyerTotal(data.total || 0);
      } catch (err) {
        push({ message: getErrorMessage(err), type: 'error' });
      } finally {
        setBuyerLoading(false);
        setBuyerLoadingMore(false);
      }
    },
    [searchQuery, selectedCropFilter, minPrice, maxPrice, sortBy]
  );

  useEffect(() => {
    if (isBuyer) {
      fetchBuyerListings(1, false);
    }
  }, [isBuyer, fetchBuyerListings]);

  const handleClearBuyerFilters = () => {
    setSearchQuery('');
    setSelectedCropFilter('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('date_desc');
  };

  const handleLoadMore = () => {
    if (buyerPage < buyerPages && !buyerLoadingMore) {
      fetchBuyerListings(buyerPage + 1, true);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // FARMER VIEW STATE (Tabs: My Listings & Inquiries Received)
  // ─────────────────────────────────────────────────────────────────────────────
  const currentFarmerTab = searchParams.get('tab') === 'inquiries' ? 'inquiries' : 'listings';

  const handleFarmerTabChange = (tab) => {
    setSearchParams({ tab });
  };

  // Tab 1: My Listings
  const [myListings, setMyListings] = useState([]);
  const [loadingMyListings, setLoadingMyListings] = useState(false);

  const loadMyListings = useCallback(async () => {
    setLoadingMyListings(true);
    try {
      const data = await listingApi.getListings({ mine: true, limit: 100 });
      setMyListings(data.listings || []);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
      setMyListings([]);
    } finally {
      setLoadingMyListings(false);
    }
  }, []);

  useEffect(() => {
    if (isFarmer && currentFarmerTab === 'listings') {
      loadMyListings();
    }
  }, [isFarmer, currentFarmerTab, loadMyListings]);

  // Create / Edit Listing Modal
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [listingForm, setListingForm] = useState(INITIAL_CREATE_FORM);
  const [listingFormErrors, setListingFormErrors] = useState({});
  const [submittingListing, setSubmittingListing] = useState(false);
  const [listingApiError, setListingApiError] = useState('');

  // Status Change Dialog (with Reject Inquiries warning for "sold")
  const [statusChangeTarget, setStatusChangeTarget] = useState(null);
  const [targetNewStatus, setTargetNewStatus] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  // Delete Listing Dialog
  const [deleteListingTarget, setDeleteListingTarget] = useState(null);
  const [deletingListing, setDeletingListing] = useState(false);

  // Tab 2: Inquiries Received
  const [farmerInquiries, setFarmerInquiries] = useState([]);
  const [loadingFarmerInquiries, setLoadingFarmerInquiries] = useState(false);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
  const [inquiryListingFilter, setInquiryListingFilter] = useState('');
  const [updatingInquiryId, setUpdatingInquiryId] = useState(null);

  const loadFarmerInquiries = useCallback(async () => {
    setLoadingFarmerInquiries(true);
    try {
      const params = {};
      if (inquiryStatusFilter !== 'all') params.status = inquiryStatusFilter;
      if (inquiryListingFilter) params.listingId = inquiryListingFilter;
      const data = await inquiryApi.getInquiries(params);
      setFarmerInquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
      setFarmerInquiries([]);
    } finally {
      setLoadingFarmerInquiries(false);
    }
  }, [inquiryStatusFilter, inquiryListingFilter]);

  useEffect(() => {
    if (isFarmer && currentFarmerTab === 'inquiries') {
      loadFarmerInquiries();
    }
  }, [isFarmer, currentFarmerTab, loadFarmerInquiries]);

  // ─────────────────────────────────────────────────────────────────────────────
  // FARMER LISTING ACTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const openCreateListingModal = () => {
    setEditingListing(null);
    setListingForm(INITIAL_CREATE_FORM);
    setListingFormErrors({});
    setListingApiError('');
    setListingModalOpen(true);
  };

  const openEditListingModal = (listing) => {
    if (listing.status === 'sold') {
      push({ message: 'Sold listings cannot be modified.', type: 'info' });
      return;
    }
    setEditingListing(listing);
    setListingForm({
      cropName: listing.cropName || '',
      crop: listing.crop?._id || (typeof listing.crop === 'string' ? listing.crop : ''),
      quantity: listing.quantity != null ? String(listing.quantity) : '',
      unit: listing.unit || 'kg',
      pricePerUnit: listing.pricePerUnit != null ? String(listing.pricePerUnit) : '',
      location: listing.location || '',
      description: listing.description || '',
    });
    setListingFormErrors({});
    setListingApiError('');
    setListingModalOpen(true);
  };

  const handleCropSelectChange = (cropId) => {
    const selected = availableCrops.find((c) => c._id === cropId);
    setListingForm((prev) => ({
      ...prev,
      crop: cropId,
      cropName: selected ? selected.name : prev.cropName,
    }));
  };

  const computedTotalValue = useMemo(() => {
    const q = Number(listingForm.quantity);
    const p = Number(listingForm.pricePerUnit);
    if (!isNaN(q) && !isNaN(p) && q > 0 && p > 0) {
      return q * p;
    }
    return 0;
  }, [listingForm.quantity, listingForm.pricePerUnit]);

  const validateListingForm = () => {
    const errs = {};
    if (!listingForm.cropName.trim()) {
      errs.cropName = 'Crop name is required';
    }
    const q = Number(listingForm.quantity);
    if (!listingForm.quantity || isNaN(q) || q <= 0) {
      errs.quantity = 'Quantity must be greater than 0';
    }
    const p = Number(listingForm.pricePerUnit);
    if (!listingForm.pricePerUnit || isNaN(p) || p <= 0) {
      errs.pricePerUnit = 'Price per unit must be greater than 0';
    }
    setListingFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleListingSubmit = async (e) => {
    e.preventDefault();
    setListingApiError('');
    if (!validateListingForm()) return;

    setSubmittingListing(true);
    try {
      const payload = {
        cropName: listingForm.cropName.trim(),
        crop: listingForm.crop || undefined,
        quantity: Number(listingForm.quantity),
        unit: listingForm.unit || 'kg',
        pricePerUnit: Number(listingForm.pricePerUnit),
        location: listingForm.location.trim() || undefined,
        description: listingForm.description.trim() || undefined,
      };

      if (editingListing) {
        await listingApi.updateListing(editingListing._id, payload);
        push({ message: 'Listing updated successfully.', type: 'success' });
      } else {
        await listingApi.createListing(payload);
        push({ message: 'Harvest listing published.', type: 'success' });
      }

      await loadMyListings();
      setListingModalOpen(false);
    } catch (err) {
      setListingApiError(getErrorMessage(err));
    } finally {
      setSubmittingListing(false);
    }
  };

  const handleInitiateStatusChange = (listing, newStatus) => {
    if (listing.status === 'sold') {
      push({ message: 'Sold listings cannot be modified.', type: 'info' });
      return;
    }
    setStatusChangeTarget(listing);
    setTargetNewStatus(newStatus);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusChangeTarget || !targetNewStatus) return;
    setChangingStatus(true);
    try {
      await listingApi.updateListing(statusChangeTarget._id, { status: targetNewStatus });
      push({
        message:
          targetNewStatus === 'sold'
            ? 'Listing marked as sold. All pending inquiries were rejected.'
            : `Listing status updated to ${targetNewStatus}.`,
        type: 'success',
      });
      setStatusChangeTarget(null);
      setTargetNewStatus('');
      await loadMyListings();
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setChangingStatus(false);
    }
  };

  const handleDeleteListingConfirm = async () => {
    if (!deleteListingTarget) return;
    setDeletingListing(true);
    try {
      await listingApi.deleteListing(deleteListingTarget._id);
      push({ message: 'Listing and its inquiries deleted.', type: 'success' });
      setDeleteListingTarget(null);
      await loadMyListings();
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setDeletingListing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // INQUIRY ACTIONS (Farmer Accept / Reject)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleUpdateInquiryStatus = async (inquiryId, status) => {
    setUpdatingInquiryId(inquiryId);
    try {
      await inquiryApi.updateInquiryStatus(inquiryId, { status });
      if (status === 'accepted') {
        push({
          message: 'Inquiry accepted. Listing is now reserved for this buyer.',
          type: 'success',
        });
      } else {
        push({ message: 'Inquiry rejected.', type: 'info' });
      }
      await loadFarmerInquiries();
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setUpdatingInquiryId(null);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Direct Agriculture"
        title="Harvest Marketplace"
        description={
          isFarmer
            ? 'Manage your harvest listings, track orders, and respond directly to registered buyers.'
            : 'Source freshly harvested tubers and legumes directly from verified smallholder farmers.'
        }
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* BUYER CATALOG VIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {!isFarmer && (
        <section aria-label="Buyer harvest marketplace">
          {/* Filter Bar */}
          <div className="bg-white border border-gray-200 rounded p-4 mb-6 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search by Crop Name */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search crop name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>

              {/* Crop Catalog Select */}
              <Select
                value={selectedCropFilter}
                onChange={(e) => setSelectedCropFilter(e.target.value)}
                className="py-1.5 text-sm"
              >
                <option value="">All Crop Types</option>
                {availableCrops.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </Select>

              {/* Min Price */}
              <Input
                type="number"
                min="0"
                placeholder="Min Price (IDR)"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="py-1.5 text-sm"
              />

              {/* Max Price */}
              <Input
                type="number"
                min="0"
                placeholder="Max Price (IDR)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="py-1.5 text-sm"
              />

              {/* Sort By */}
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1.5 text-sm"
              >
                <option value="date_desc">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
              <span>
                Showing <strong>{buyerListings.length}</strong> of <strong>{buyerTotal}</strong> available listings
              </span>
              {(searchQuery || selectedCropFilter || minPrice || maxPrice || sortBy !== 'date_desc') && (
                <button
                  type="button"
                  onClick={handleClearBuyerFilters}
                  className="text-green-700 hover:text-green-900 underline font-medium cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Results Grid */}
          {buyerLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : buyerListings.length === 0 ? (
            <div className="border border-gray-200 rounded bg-white">
              <EmptyState
                icon={<ShoppingBag size={40} className="text-gray-400" />}
                title="No listings match your filters"
                description="Try adjusting your search criteria, price range, or crop type."
                actionLabel="Clear all filters"
                onAction={handleClearBuyerFilters}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {buyerListings.map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    onClick={() => setSelectedListingDetail(listing)}
                  />
                ))}
              </div>

              {/* Load More Pagination */}
              <LoadMore
                onClick={handleLoadMore}
                loading={buyerLoadingMore}
                hasMore={buyerPage < buyerPages}
              />
            </>
          )}

          {/* Buyer Listing Detail & Inquiry Modal */}
          <ListingDetailModal
            listing={selectedListingDetail}
            open={Boolean(selectedListingDetail)}
            onClose={() => setSelectedListingDetail(null)}
            onInquirySent={() => fetchBuyerListings(1, false)}
          />
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FARMER VIEW (TABS: MY LISTINGS & INQUIRIES RECEIVED) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isFarmer && (
        <section aria-label="Farmer harvest management">
          {/* Profile Phone Number Hint */}
          {!user?.phone && (
            <div className="border border-amber-200 bg-amber-50/80 rounded p-3 mb-6 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-amber-800 shrink-0" />
                <span>Add your phone number in Profile so accepted buyers can contact you</span>
              </div>
              <Link to="/app/profile" className="font-semibold underline hover:text-green-900">
                Go to Profile →
              </Link>
            </div>
          )}

          {/* Farmer Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => handleFarmerTabChange('listings')}
              className={[
                'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 focus-ring',
                currentFarmerTab === 'listings'
                  ? 'border-green-900 text-green-900 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300',
              ].join(' ')}
            >
              <Tag size={16} aria-hidden="true" />
              My listings
            </button>
            <button
              onClick={() => handleFarmerTabChange('inquiries')}
              className={[
                'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 focus-ring',
                currentFarmerTab === 'inquiries'
                  ? 'border-green-900 text-green-900 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300',
              ].join(' ')}
            >
              <Inbox size={16} aria-hidden="true" />
              Inquiries received
            </button>
          </div>

          {/* ── TAB 1: MY LISTINGS ── */}
          {currentFarmerTab === 'listings' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500">
                  {myListings.length} {myListings.length === 1 ? 'batch' : 'batches'} published
                </p>
                <Button variant="primary" onClick={openCreateListingModal}>
                  <Plus size={16} className="mr-1" /> Create listing
                </Button>
              </div>

              {loadingMyListings ? (
                <div className="py-24 flex justify-center">
                  <Spinner size="lg" />
                </div>
              ) : myListings.length === 0 ? (
                <div className="border border-gray-200 rounded bg-white">
                  <EmptyState
                    icon={<Tag size={40} className="text-gray-400" />}
                    title="No harvest listings yet"
                    description="Publish your available tubers or legumes to connect with prospective buyers."
                    actionLabel="Create first listing"
                    onAction={openCreateListingModal}
                  />
                </div>
              ) : (
                <TableContainer>
                  <thead>
                    <tr>
                      <Th>Crop</Th>
                      <Th>Quantity</Th>
                      <Th>Unit Price</Th>
                      <Th>Total Value</Th>
                      <Th>Status</Th>
                      <Th>Created Date</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {myListings.map((l) => {
                      const isSold = l.status === 'sold';
                      return (
                        <tr key={l._id} className="hover:bg-gray-50/50 transition-colors">
                          <Td className="font-medium text-gray-900">
                            <div>
                              <span>{l.cropName}</span>
                              {l.location && (
                                <p className="text-xs text-gray-400 mt-0.5">{l.location}</p>
                              )}
                            </div>
                          </Td>
                          <Td>{l.quantity} {l.unit || 'kg'}</Td>
                          <Td>{formatCurrency(l.pricePerUnit)} / {l.unit || 'kg'}</Td>
                          <Td className="font-semibold text-green-900">
                            {formatCurrency(l.quantity * l.pricePerUnit)}
                          </Td>
                          <Td>
                            <StatusBadge status={l.status} />
                          </Td>
                          <Td>{formatDate(l.createdAt)}</Td>
                          <Td>
                            <div className="flex items-center gap-2">
                              {/* Change Status Dropdown */}
                              {!isSold ? (
                                <select
                                  aria-label={`Change status for ${l.cropName}`}
                                  value={l.status}
                                  onChange={(e) => handleInitiateStatusChange(l, e.target.value)}
                                  className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-green-700"
                                >
                                  <option value="available">Available</option>
                                  <option value="reserved">Reserved</option>
                                  <option value="sold">Sold</option>
                                </select>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Locked (Sold)</span>
                              )}

                              {/* Edit Action */}
                              <button
                                onClick={() => openEditListingModal(l)}
                                disabled={isSold}
                                className="p-1.5 text-gray-500 hover:text-green-900 focus-ring rounded disabled:opacity-40 disabled:cursor-not-allowed"
                                title={isSold ? 'Sold listings cannot be modified' : 'Edit listing'}
                                aria-label={`Edit ${l.cropName}`}
                              >
                                <Pencil size={15} />
                              </button>

                              {/* Delete Action */}
                              <button
                                onClick={() => setDeleteListingTarget(l)}
                                disabled={isSold}
                                className="p-1.5 text-gray-500 hover:text-red-700 focus-ring rounded disabled:opacity-40 disabled:cursor-not-allowed"
                                title={isSold ? 'Sold listings cannot be deleted' : 'Delete listing'}
                                aria-label={`Delete ${l.cropName}`}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </TableContainer>
              )}
            </div>
          )}

          {/* ── TAB 2: INQUIRIES RECEIVED ── */}
          {currentFarmerTab === 'inquiries' && (
            <div>
              {/* Filter Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Status:</span>
                    <div className="inline-flex rounded border border-gray-200 bg-white p-0.5">
                      {['all', 'pending', 'accepted', 'rejected'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setInquiryStatusFilter(s)}
                          className={[
                            'px-3 py-1 text-xs rounded transition-colors capitalize font-medium',
                            inquiryStatusFilter === s
                              ? 'bg-green-900 text-white'
                              : 'text-gray-600 hover:text-green-900 hover:bg-green-50',
                          ].join(' ')}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter by Specific Listing */}
                  <Select
                    value={inquiryListingFilter}
                    onChange={(e) => setInquiryListingFilter(e.target.value)}
                    className="w-56 py-1 text-xs"
                    aria-label="Filter by listing"
                  >
                    <option value="">All My Listings</option>
                    {myListings.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.cropName} ({l.quantity} {l.unit})
                      </option>
                    ))}
                  </Select>
                </div>

                <p className="text-xs text-gray-400">
                  {farmerInquiries.length} {farmerInquiries.length === 1 ? 'inquiry' : 'inquiries'} received
                </p>
              </div>

              {loadingFarmerInquiries ? (
                <div className="py-24 flex justify-center">
                  <Spinner size="lg" />
                </div>
              ) : farmerInquiries.length === 0 ? (
                <div className="border border-gray-200 rounded bg-white">
                  <EmptyState
                    icon={<Inbox size={40} className="text-gray-400" />}
                    title="No inquiries found"
                    description="When buyers send inquiries regarding your harvest listings, they will appear here."
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {farmerInquiries.map((inq) => {
                    const isPending = inq.status === 'pending';
                    const listing = inq.listing;
                    const buyer = inq.buyer;

                    return (
                      <article
                        key={inq._id}
                        className={[
                          'border rounded p-5 bg-white flex flex-col gap-3 transition-colors',
                          isPending ? 'border-amber-200 bg-amber-50/20' : 'border-gray-200',
                        ].join(' ')}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-100">
                          <div>
                            <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                              Listing: {listing?.cropName || 'Batch'}
                            </span>
                            <h3 className="font-serif text-lg font-semibold text-gray-900 mt-0.5">
                              {buyer?.name || 'Prospective Buyer'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                              {buyer?.email && <span>{buyer.email}</span>}
                              {buyer?.phone && <span>• {buyer.phone}</span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <StatusBadge status={inq.status} />
                            <span className="text-xs text-gray-400">
                              {formatDateTime(inq.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Quantity and Message */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
                          <div>
                            <span className="text-gray-400 uppercase tracking-wider block font-medium">Requested Quantity</span>
                            <span className="font-semibold text-gray-900 text-sm mt-0.5 block">
                              {inq.quantity != null ? `${inq.quantity} ${listing?.unit || 'kg'}` : `Full batch (${listing?.quantity} ${listing?.unit || 'kg'})`}
                            </span>
                          </div>

                          <div className="md:col-span-2">
                            <span className="text-gray-400 uppercase tracking-wider block font-medium">Buyer Note</span>
                            <p className="text-gray-800 italic mt-0.5">
                              {inq.message ? `"${inq.message}"` : 'No note provided.'}
                            </p>
                          </div>
                        </div>

                        {/* Accept / Reject Actions for Pending Inquiries */}
                        {isPending && (
                          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpdateInquiryStatus(inq._id, 'rejected')}
                              disabled={updatingInquiryId === inq._id}
                              className="text-xs text-red-700 hover:bg-red-50 border-gray-200"
                            >
                              <XCircle size={14} className="mr-1" />
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleUpdateInquiryStatus(inq._id, 'accepted')}
                              disabled={updatingInquiryId === inq._id}
                              loading={updatingInquiryId === inq._id}
                              className="text-xs"
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Accept inquiry
                            </Button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* CREATE / EDIT LISTING MODAL */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <Modal
            open={listingModalOpen}
            onClose={() => !submittingListing && setListingModalOpen(false)}
            title={editingListing ? 'Edit harvest listing' : 'Create harvest listing'}
            maxWidth="max-w-md"
          >
            <form onSubmit={handleListingSubmit} className="flex flex-col gap-4">
              <ErrorBlock error={listingApiError} />

              {/* Optional Crop Catalog Picker */}
              <FormField
                label="Crop catalog preset (optional)"
                htmlFor="create-listing-crop-preset"
                helperText="Auto-fills the crop name and links standard botanical attributes."
              >
                <Select
                  id="create-listing-crop-preset"
                  value={listingForm.crop}
                  onChange={(e) => handleCropSelectChange(e.target.value)}
                  disabled={submittingListing}
                >
                  <option value="">Custom crop</option>
                  {availableCrops.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </Select>
              </FormField>

              {/* Crop Name */}
              <FormField
                label="Crop name"
                htmlFor="create-listing-crop-name"
                required
                error={listingFormErrors.cropName}
              >
                <Input
                  id="create-listing-crop-name"
                  placeholder="e.g. Sweet Potato (Cilembu)"
                  value={listingForm.cropName}
                  onChange={(e) => setListingForm({ ...listingForm, cropName: e.target.value })}
                  error={Boolean(listingFormErrors.cropName)}
                  disabled={submittingListing}
                />
              </FormField>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Quantity"
                  htmlFor="create-listing-quantity"
                  required
                  error={listingFormErrors.quantity}
                >
                  <Input
                    id="create-listing-quantity"
                    type="number"
                    min="1"
                    step="any"
                    placeholder="e.g. 500"
                    value={listingForm.quantity}
                    onChange={(e) => setListingForm({ ...listingForm, quantity: e.target.value })}
                    error={Boolean(listingFormErrors.quantity)}
                    disabled={submittingListing}
                  />
                </FormField>

                <FormField
                  label="Unit"
                  htmlFor="create-listing-unit"
                  required
                >
                  <Select
                    id="create-listing-unit"
                    value={listingForm.unit}
                    onChange={(e) => setListingForm({ ...listingForm, unit: e.target.value })}
                    disabled={submittingListing}
                  >
                    <option value="kg">kg</option>
                    <option value="ton">ton</option>
                  </Select>
                </FormField>
              </div>

              {/* Price per unit */}
              <FormField
                label={`Price per ${listingForm.unit || 'kg'} in IDR`}
                htmlFor="create-listing-price"
                required
                error={listingFormErrors.pricePerUnit}
              >
                <Input
                  id="create-listing-price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 8000"
                  value={listingForm.pricePerUnit}
                  onChange={(e) => setListingForm({ ...listingForm, pricePerUnit: e.target.value })}
                  error={Boolean(listingFormErrors.pricePerUnit)}
                  disabled={submittingListing}
                />
              </FormField>

              {/* Live computed total value */}
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs flex items-center justify-between">
                <span className="text-gray-500 font-medium">Estimated Batch Total Value:</span>
                <span className="font-serif font-bold text-green-900 text-sm">
                  {formatCurrency(computedTotalValue)}
                </span>
              </div>

              {/* Location */}
              <FormField
                label="Location text"
                htmlFor="create-listing-location"
                helperText="e.g. Bogor, West Java"
              >
                <Input
                  id="create-listing-location"
                  placeholder="Bogor, West Java"
                  value={listingForm.location}
                  onChange={(e) => setListingForm({ ...listingForm, location: e.target.value })}
                  disabled={submittingListing}
                />
              </FormField>

              {/* Description */}
              <FormField
                label="Harvest description (optional)"
                htmlFor="create-listing-description"
                helperText="Grading, packaging, moisture, or harvest timeframe."
              >
                <Textarea
                  id="create-listing-description"
                  rows={2}
                  placeholder="Freshly harvested tubers, washed and graded..."
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  disabled={submittingListing}
                />
              </FormField>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setListingModalOpen(false)}
                  disabled={submittingListing}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={submittingListing}
                  disabled={submittingListing}
                >
                  {editingListing ? 'Save changes' : 'Publish listing'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* CONFIRM STATUS CHANGE TO SOLD */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <ConfirmDialog
            open={Boolean(statusChangeTarget)}
            onClose={() => !changingStatus && setStatusChangeTarget(null)}
            onConfirm={handleConfirmStatusChange}
            title={targetNewStatus === 'sold' ? 'Mark listing as Sold?' : `Change status to ${targetNewStatus}?`}
            message={
              targetNewStatus === 'sold'
                ? `Marking "${statusChangeTarget?.cropName}" as sold will automatically reject all pending inquiries on this batch and make this listing read-only.`
                : `Are you sure you want to mark "${statusChangeTarget?.cropName}" as ${targetNewStatus}?`
            }
            confirmLabel={targetNewStatus === 'sold' ? 'Mark sold' : 'Update status'}
            confirmVariant="primary"
            loading={changingStatus}
          />

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* CONFIRM DELETE LISTING */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <ConfirmDialog
            open={Boolean(deleteListingTarget)}
            onClose={() => !deletingListing && setDeleteListingTarget(null)}
            onConfirm={handleDeleteListingConfirm}
            title="Delete harvest listing?"
            message={`Are you sure you want to delete "${deleteListingTarget?.cropName}"? All associated buyer inquiries will also be deleted.`}
            confirmLabel="Delete listing"
            confirmVariant="primary"
            loading={deletingListing}
          />
        </section>
      )}
    </AppShell>
  );
}
