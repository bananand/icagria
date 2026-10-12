// src/pages/farmer/ShopPage.jsx
// Farmer Supplies & Services:
// Tab 1: Inputs (Product catalog, search, category filter, order modal with stepper & server total disclaimer, out of stock handling)
// Tab 2: Expert consultation (Future datetime validation, notes, creation)
// Tab 3: My orders (Bookings table, cancel pending dialog restoring stock, type/status filter)

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { SkeletonCard } from '../../components/ui/Skeleton';
import { TableContainer, Th, Td } from '../../components/ui/Table';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import * as productApi from '../../api/products';
import * as bookingApi from '../../api/bookings';
import {
  ShoppingBag,
  Package,
  Calendar,
  Search,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'seeds', label: 'Seeds' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'pesticide', label: 'Pesticide' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
];

export default function ShopPage() {
  const { push } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('tab') || 'inputs';
  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 1: INPUTS (PRODUCTS)
  // ─────────────────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productCategory, setProductCategory] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Order Product Modal State
  const [orderingProduct, setOrderingProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderNotes, setOrderNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderApiError, setOrderApiError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params = {};
      if (productCategory) params.category = productCategory;
      if (productSearch.trim()) params.search = productSearch.trim();
      const data = await productApi.getProducts(params);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [productCategory, productSearch]);

  useEffect(() => {
    if (currentTab === 'inputs') {
      loadProducts();
    }
  }, [currentTab, loadProducts]);

  const openOrderModal = (prod) => {
    if (prod.stock <= 0) return;
    setOrderingProduct(prod);
    setOrderQuantity(1);
    setOrderNotes('');
    setOrderApiError('');
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (!orderingProduct) return;
    setOrderApiError('');

    if (orderQuantity < 1 || orderQuantity > orderingProduct.stock) {
      setOrderApiError(`Quantity must be between 1 and ${orderingProduct.stock}`);
      return;
    }

    setSubmittingOrder(true);
    try {
      await bookingApi.createBooking({
        type: 'product',
        product: orderingProduct._id,
        quantity: orderQuantity,
        notes: orderNotes.trim() || undefined,
      });

      push({
        message: `Order placed for ${orderQuantity} × ${orderingProduct.name}!`,
        type: 'success',
      });

      setOrderingProduct(null);
      await loadProducts();
    } catch (err) {
      setOrderApiError(getErrorMessage(err));
      // Refresh products to sync real-time stock
      await loadProducts();
    } finally {
      setSubmittingOrder(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 2: EXPERT CONSULTATION
  // ─────────────────────────────────────────────────────────────────────────────
  const [consultDate, setConsultDate] = useState('');
  const [consultNotes, setConsultNotes] = useState('');
  const [submittingConsult, setSubmittingConsult] = useState(false);
  const [consultError, setConsultError] = useState('');
  const consultDateInputRef = useRef(null);

  // Compute local current datetime string formatted for min attribute YYYY-MM-DDTHH:mm
  const getMinConsultDatetime = () => {
    const now = new Date();
    // Offset local timezone
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const handleConsultDateChange = (val) => {
    setConsultDate(val);
    if (!val) {
      setConsultError('');
      return;
    }
    const scheduled = new Date(val);
    if (!isNaN(scheduled.getTime()) && scheduled.getTime() >= Date.now() + 60 * 1000) {
      setConsultError('');
    }
  };

  const handleConsultSubmit = async (e) => {
    e.preventDefault();
    setConsultError('');

    if (!consultDate) {
      const msg = 'Please pick a date and time for the consultation.';
      setConsultError(msg);
      push({ message: msg, type: 'error' });
      consultDateInputRef.current?.focus();
      return;
    }

    const scheduled = new Date(consultDate);
    if (isNaN(scheduled.getTime())) {
      const msg = 'Invalid date format.';
      setConsultError(msg);
      push({ message: msg, type: 'error' });
      consultDateInputRef.current?.focus();
      return;
    }

    // Must be at least 1 minute in the future
    if (scheduled.getTime() < Date.now() + 60 * 1000) {
      const msg = 'Consultation time must be at least 1 minute in the future.';
      setConsultError(msg);
      push({ message: msg, type: 'error' });
      consultDateInputRef.current?.focus();
      return;
    }

    setSubmittingConsult(true);
    try {
      await bookingApi.createBooking({
        type: 'consultation',
        scheduledAt: scheduled.toISOString(),
        notes: consultNotes.trim() || undefined,
      });

      push({
        message: 'Consultation session scheduled. An agronomy specialist will review your request.',
        type: 'success',
      });

      setConsultDate('');
      setConsultNotes('');
      // Navigate to My Orders
      handleTabChange('orders');
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setConsultError(errorMsg);
      push({ message: errorMsg, type: 'error' });
      consultDateInputRef.current?.focus();
    } finally {
      setSubmittingConsult(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 3: MY ORDERS (BOOKINGS)
  // ─────────────────────────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  // Cancel Booking Dialog
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const params = {};
      if (orderTypeFilter) params.type = orderTypeFilter;
      if (orderStatusFilter) params.status = orderStatusFilter;
      const data = await bookingApi.getBookings(params);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [orderTypeFilter, orderStatusFilter]);

  useEffect(() => {
    if (currentTab === 'orders') {
      loadBookings();
    }
  }, [currentTab, loadBookings]);

  const handleCancelBookingConfirm = async () => {
    if (!cancelTarget) return;
    setCancellingBooking(true);
    try {
      await bookingApi.cancelBooking(cancelTarget._id);
      push({
        message:
          cancelTarget.type === 'product'
            ? 'Order cancelled. Inventory has been returned to stock.'
            : 'Consultation booking cancelled.',
        type: 'success',
      });
      setCancelTarget(null);
      await loadBookings();
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setCancellingBooking(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Agricultural Supplies & Advisory"
        title="Shop & Services"
        description="Source verified fertilizers, seeds, and equipment, or schedule personal agronomic consultations."
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => handleTabChange('inputs')}
          className={[
            'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 focus-ring',
            currentTab === 'inputs'
              ? 'border-green-900 text-green-900 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300',
          ].join(' ')}
        >
          <Package size={16} aria-hidden="true" />
          Inputs
        </button>
        <button
          onClick={() => handleTabChange('consultation')}
          className={[
            'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 focus-ring',
            currentTab === 'consultation'
              ? 'border-green-900 text-green-900 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300',
          ].join(' ')}
        >
          <Calendar size={16} aria-hidden="true" />
          Expert consultation
        </button>
        <button
          onClick={() => handleTabChange('orders')}
          className={[
            'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 focus-ring',
            currentTab === 'orders'
              ? 'border-green-900 text-green-900 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300',
          ].join(' ')}
        >
          <ShoppingBag size={16} aria-hidden="true" />
          My orders
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: INPUTS (PRODUCT CATALOG) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentTab === 'inputs' && (
        <section aria-label="Farm inputs catalog">
          {/* Filter Bar */}
          <div className="bg-white border border-gray-200 rounded p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative min-w-[240px]">
                <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700"
                />
              </div>

              {/* Category Filter */}
              <Select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="w-48 py-1.5 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            <p className="text-xs text-gray-500">
              {products.length} {products.length === 1 ? 'item' : 'items'} available
            </p>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="border border-gray-200 rounded bg-white">
              <EmptyState
                icon={<Package size={40} className="text-gray-400" />}
                title="No products found"
                description="Try selecting a different category or clearing your search keywords."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((prod) => {
                const inStock = prod.stock > 0;
                return (
                  <article
                    key={prod._id}
                    className="border border-gray-200 rounded overflow-hidden flex flex-col bg-white"
                  >
                    {/* 3:2 Image block */}
                    <div className="aspect-[3/2] bg-green-100 flex items-center justify-center relative">
                      <span className="font-serif text-5xl text-green-700 select-none" aria-hidden="true">
                        {prod.name ? prod.name[0] : 'P'}
                      </span>
                      <span className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/90 text-green-900 border border-gray-200">
                        {prod.category}
                      </span>
                    </div>

                    <div className="p-4 flex flex-col flex-1 gap-2">
                      <h3 className="font-serif text-base font-semibold text-gray-900 leading-snug">
                        {prod.name}
                      </h3>

                      {prod.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      )}

                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="font-serif font-bold text-base text-green-900">
                            {formatCurrency(prod.price)}
                          </p>
                          <p className={[
                            'text-[11px] font-medium mt-0.5',
                            inStock ? 'text-gray-500' : 'text-red-700 font-semibold',
                          ].join(' ')}>
                            {inStock ? `In stock: ${prod.stock}` : 'Out of stock'}
                          </p>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          disabled={!inStock}
                          onClick={() => openOrderModal(prod)}
                        >
                          Order
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Order Modal with Stepper */}
          <Modal
            open={Boolean(orderingProduct)}
            onClose={() => !submittingOrder && setOrderingProduct(null)}
            title="Order farm input"
            maxWidth="max-w-md"
          >
            {orderingProduct && (
              <form onSubmit={handleConfirmOrder} className="flex flex-col gap-4">
                <ErrorBlock error={orderApiError} />

                <div className="bg-gray-50 p-3 rounded border border-gray-200 flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Product</span>
                  <p className="font-serif font-semibold text-gray-900 text-base">{orderingProduct.name}</p>
                  <p className="text-xs text-gray-600">{formatCurrency(orderingProduct.price)} per unit</p>
                </div>

                {/* Stepper control */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="order-qty-input" className="text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={orderQuantity <= 1 || submittingOrder}
                      onClick={() => setOrderQuantity((q) => Math.max(1, q - 1))}
                      className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      id="order-qty-input"
                      type="number"
                      min="1"
                      max={orderingProduct.stock}
                      value={orderQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setOrderQuantity(Math.min(orderingProduct.stock, Math.max(1, val)));
                        }
                      }}
                      className="w-20 text-center font-bold font-serif text-lg py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-700"
                    />
                    <button
                      type="button"
                      disabled={orderQuantity >= orderingProduct.stock || submittingOrder}
                      onClick={() => setOrderQuantity((q) => Math.min(orderingProduct.stock, q + 1))}
                      className="w-10 h-10 border border-gray-300 rounded flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                    <span className="text-xs text-gray-400">
                      (Max: {orderingProduct.stock})
                    </span>
                  </div>
                </div>

                <FormField
                  label="Delivery notes (optional)"
                  htmlFor="order-delivery-notes"
                  helperText="e.g. Farm gate pickup, preferred delivery hour"
                >
                  <Textarea
                    id="order-delivery-notes"
                    rows={2}
                    placeholder="Deliver to farm road entrance..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    disabled={submittingOrder}
                  />
                </FormField>

                {/* Order Summary & Server Disclaimer */}
                <div className="border-t border-gray-100 pt-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {formatCurrency(orderingProduct.price)} × {orderQuantity}
                    </span>
                    <span className="font-serif font-bold text-green-900 text-lg">
                      {formatCurrency(orderingProduct.price * orderQuantity)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-normal">
                    Estimated total; the final amount is confirmed by the server.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => setOrderingProduct(null)}
                    disabled={submittingOrder}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    loading={submittingOrder}
                    disabled={submittingOrder}
                  >
                    Confirm order
                  </Button>
                </div>
              </form>
            )}
          </Modal>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: EXPERT CONSULTATION */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentTab === 'consultation' && (
        <section aria-label="Book expert agronomy consultation" className="max-w-2xl bg-white border border-gray-200 rounded p-6">
          <div className="mb-6">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Agronomic Support</span>
            <h2 className="font-serif text-2xl font-semibold text-green-900 mt-1">
              Schedule Expert Advisory Session
            </h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Book a 1-on-1 session with our regional agronomy experts to review soil pH conditioning, diagnose tuber and legume pest symptoms, or prepare organic fertilization plans.
            </p>
          </div>

          <form onSubmit={handleConsultSubmit} className="flex flex-col gap-4">
            <ErrorBlock error={consultError} />

            <FormField
              label="Session date & time"
              htmlFor="consult-datetime"
              required
              error={consultError}
              helperText="Consultation must be scheduled for a future date and time."
            >
              <Input
                ref={consultDateInputRef}
                id="consult-datetime"
                type="datetime-local"
                min={getMinConsultDatetime()}
                value={consultDate}
                onChange={(e) => handleConsultDateChange(e.target.value)}
                error={Boolean(consultError)}
                aria-invalid={Boolean(consultError)}
                aria-describedby={consultError ? 'consult-datetime-error' : undefined}
                disabled={submittingConsult}
              />
            </FormField>

            <FormField
              label="Discussion topics or crop concerns"
              htmlFor="consult-notes"
              helperText="Describe current plot observations, soil questions, or recent pest sightings."
            >
              <Textarea
                id="consult-notes"
                rows={4}
                placeholder="e.g. My cassava plot shows lower pH around 5.1. Looking for guidance on lime application rates..."
                value={consultNotes}
                onChange={(e) => setConsultNotes(e.target.value)}
                disabled={submittingConsult}
              />
            </FormField>

            <div className="p-3 bg-green-50 rounded border border-green-200 text-xs text-green-950 flex items-start gap-2">
              <Info size={15} className="text-green-800 shrink-0 mt-0.5" />
              <span>
                Standard advisory sessions are provided free of charge for registered smallholders under the icagria technical assistance program.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                type="submit"
                loading={submittingConsult}
                disabled={submittingConsult}
              >
                Schedule consultation
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: MY ORDERS (BOOKINGS LIST) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {currentTab === 'orders' && (
        <section aria-label="My orders and consultation sessions">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="w-44 py-1 text-xs"
                aria-label="Filter by order type"
              >
                <option value="">All Types</option>
                <option value="product">Input Orders</option>
                <option value="consultation">Consultations</option>
              </Select>

              <Select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="w-44 py-1 text-xs"
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>

            <p className="text-xs text-gray-400">
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} logged
            </p>
          </div>

          {loadingBookings ? (
            <div className="py-24 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="border border-gray-200 rounded bg-white">
              <EmptyState
                icon={<ShoppingBag size={40} className="text-gray-400" />}
                title="No orders found"
                description="You haven't placed any input orders or scheduled consultations yet."
                actionLabel="Explore Inputs Catalog"
                onAction={() => handleTabChange('inputs')}
              />
            </div>
          ) : (
            <TableContainer>
              <thead>
                <tr>
                  <Th>Type</Th>
                  <Th>Item / Purpose</Th>
                  <Th>Quantity</Th>
                  <Th>Total Amount</Th>
                  <Th>Scheduled Time</Th>
                  <Th>Status</Th>
                  <Th>Booked Date</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const isPending = b.status === 'pending';
                  const isProduct = b.type === 'product';
                  const itemName = isProduct ? b.productName || 'Supply Product' : 'Agronomy Consultation';

                  return (
                    <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                      <Td>
                        <span className="text-xs uppercase font-semibold text-gray-500">
                          {isProduct ? 'Input order' : 'Consultation'}
                        </span>
                      </Td>
                      <Td className="font-medium text-gray-900">
                        <div>
                          <span>{itemName}</span>
                          {b.notes && <p className="text-xs text-gray-400 italic mt-0.5 truncate max-w-xs">{b.notes}</p>}
                        </div>
                      </Td>
                      <Td>{isProduct ? b.quantity : '—'}</Td>
                      <Td className="font-semibold text-green-900">
                        {isProduct ? formatCurrency(b.totalAmount) : 'Free'}
                      </Td>
                      <Td>{b.scheduledAt ? formatDateTime(b.scheduledAt) : '—'}</Td>
                      <Td>
                        <StatusBadge status={b.status} />
                      </Td>
                      <Td>{formatDate(b.createdAt)}</Td>
                      <Td>
                        {isPending && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setCancelTarget(b)}
                            className="text-xs text-red-700 hover:bg-red-50 border-gray-200"
                          >
                            Cancel
                          </Button>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableContainer>
          )}

          {/* Cancel Confirmation Dialog */}
          <ConfirmDialog
            open={Boolean(cancelTarget)}
            onClose={() => !cancellingBooking && setCancelTarget(null)}
            onConfirm={handleCancelBookingConfirm}
            title="Cancel booking?"
            message={
              cancelTarget?.type === 'product'
                ? `Cancel your order for ${cancelTarget.productName}? The stock will be returned to inventory.`
                : 'Cancel your scheduled agronomic consultation session?'
            }
            confirmLabel="Cancel booking"
            confirmVariant="primary"
            loading={cancellingBooking}
          />
        </section>
      )}
    </AppShell>
  );
}
