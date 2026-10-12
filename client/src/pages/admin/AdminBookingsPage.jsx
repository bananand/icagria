// src/pages/admin/AdminBookingsPage.jsx
// Admin Bookings Management: filter by type & status, table with customer info, strict state transitions, stock restoration cancel modal.
import React, { useEffect, useState, useId } from 'react';
import {
  CalendarCheck,
  Package,
  UserCheck,
  CheckCircle,
  Truck,
  XCircle,
  Filter,
  User,
  Clock,
  AlertTriangle,
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

import { getBookings, updateBookingStatus } from '../../api/bookings';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateTime } from '../../utils/format';

export default function AdminBookingsPage() {
  const { showToast } = useToast();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Status Action Modal
  const [actionTarget, setActionTarget] = useState(null); // { booking, newStatus }
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const typeSelectId = useId();
  const statusSelectId = useId();

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await getBookings(params);
      setBookings(data || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [typeFilter, statusFilter]);

  // Execute Status Transition
  const handleConfirmStatusChange = async () => {
    if (!actionTarget) return;
    const { booking, newStatus } = actionTarget;
    setUpdatingStatus(true);
    try {
      const updated = await updateBookingStatus(booking._id, { status: newStatus });
      showToast(`Order marked as ${newStatus}`, 'success');
      setBookings((prev) => prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b)));
      setActionTarget(null);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || `Failed to update status to ${newStatus}`;
      showToast(msg, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Orders & Services"
        title="Bookings & Orders Management"
        description="Monitor farmer agricultural input orders and expert consultation bookings, fulfilling deliveries or scheduling sessions."
      />

      {/* Filter Bar */}
      <section aria-label="Bookings filters" className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <label htmlFor={typeSelectId} className="text-sm font-medium text-gray-700 whitespace-nowrap flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" aria-hidden="true" />
              Booking Type:
            </label>
            <select
              id={typeSelectId}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1.5 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 bg-white"
            >
              <option value="">All Types</option>
              <option value="product">Input Product Order</option>
              <option value="consultation">Agronomist Consultation</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor={statusSelectId} className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Status:
            </label>
            <select
              id={statusSelectId}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Spinner size="lg" className="text-green-700" />
          <p className="mt-4 text-sm font-medium">Loading bookings...</p>
        </div>
      ) : error ? (
        <ErrorBlock message={error} onRetry={loadBookings} />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarCheck size={40} />}
          title="No bookings found"
          description={
            typeFilter || statusFilter
              ? 'No bookings or orders match the selected filters.'
              : 'There are currently no product orders or consultations recorded.'
          }
        />
      ) : (
        <TableContainer>
          <thead className="bg-gray-50">
            <tr>
              <Th>Farmer / User</Th>
              <Th>Type & Item</Th>
              <Th>Quantity / Time</Th>
              <Th>Total Amount</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((b) => {
                const isProduct = b.type === 'product';
                const status = b.status || 'pending';

                return (
                  <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                    {/* User */}
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {b.user?.name || 'Farmer'}
                        </span>
                        <span className="text-xs text-gray-500">{b.user?.email || '—'}</span>
                      </div>
                    </Td>

                    {/* Type & Item */}
                    <Td>
                      <div className="flex items-center gap-2">
                        {isProduct ? (
                          <Package className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {isProduct ? b.productName || b.product?.name || 'Product Order' : 'Field Agronomist'}
                          </p>
                          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                            {b.type}
                          </span>
                        </div>
                      </div>
                    </Td>

                    {/* Quantity or Scheduled Time */}
                    <Td className="text-sm text-gray-700">
                      {isProduct ? (
                        <span>Qty: <strong>{b.quantity}</strong></span>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-blue-900 bg-blue-50 px-2 py-1 rounded inline-flex">
                          <Clock className="w-3.5 h-3.5 text-blue-700" />
                          <span>{b.scheduledAt ? formatDateTime(b.scheduledAt) : 'Unscheduled'}</span>
                        </div>
                      )}
                    </Td>

                    {/* Total Amount */}
                    <Td className="text-sm font-semibold text-gray-900">
                      {isProduct ? formatCurrency(b.totalAmount) : <span className="text-gray-500 font-normal italic">Free Advisory</span>}
                    </Td>

                    {/* Status */}
                    <Td>
                      <StatusBadge status={status} />
                    </Td>

                    {/* Created Date */}
                    <Td className="text-xs text-gray-500">
                      {formatDateTime(b.createdAt)}
                    </Td>

                    {/* Actions based on valid state machine transitions */}
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* pending -> confirmed */}
                        {status === 'pending' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActionTarget({ booking: b, newStatus: 'confirmed' })}
                            className="text-green-700 hover:text-green-800 hover:bg-green-50 text-xs py-1 px-2.5 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Confirm
                          </Button>
                        )}

                        {/* confirmed -> delivered */}
                        {status === 'confirmed' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActionTarget({ booking: b, newStatus: 'delivered' })}
                            className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 text-xs py-1 px-2.5 flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Deliver
                          </Button>
                        )}

                        {/* pending or confirmed -> cancelled */}
                        {(status === 'pending' || status === 'confirmed') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActionTarget({ booking: b, newStatus: 'cancelled' })}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs py-1 px-2.5 flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </Button>
                        )}

                        {/* delivered or cancelled -> terminal state */}
                        {(status === 'delivered' || status === 'cancelled') && (
                          <span className="text-xs text-gray-400 italic pr-2">Completed</span>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
        </TableContainer>
      )}

      {/* Confirmation Modal for Status Updates */}
      {actionTarget && (
        <ConfirmDialog
          isOpen={Boolean(actionTarget)}
          onClose={() => setActionTarget(null)}
          onConfirm={handleConfirmStatusChange}
          title={
            actionTarget.newStatus === 'cancelled'
              ? 'Cancel Booking Order'
              : `Mark Booking as ${actionTarget.newStatus.charAt(0).toUpperCase() + actionTarget.newStatus.slice(1)}`
          }
          message={
            actionTarget.newStatus === 'cancelled'
              ? actionTarget.booking.type === 'product'
                ? `Are you sure you want to cancel this order? Cancelling will automatically restore ${actionTarget.booking.quantity} unit(s) back to catalog inventory.`
                : 'Are you sure you want to cancel this scheduled agronomist consultation?'
              : `Confirm transitioning order status from "${actionTarget.booking.status}" to "${actionTarget.newStatus}"?`
          }
          confirmText={
            actionTarget.newStatus === 'cancelled'
              ? 'Cancel Order'
              : `Mark as ${actionTarget.newStatus.charAt(0).toUpperCase() + actionTarget.newStatus.slice(1)}`
          }
          cancelText="Back"
          variant={actionTarget.newStatus === 'cancelled' ? 'danger' : 'primary'}
          loading={updatingStatus}
        />
      )}
    </AppShell>
  );
}
