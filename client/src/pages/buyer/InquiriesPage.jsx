// src/pages/buyer/InquiriesPage.jsx
// Buyer inquiries management: table of submitted inquiries, status filter,
// cancel pending inquiry via ConfirmDialog, and highlighted seller contact block for accepted inquiries.

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '../../components/layout/AppShell';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TableContainer, Th, Td } from '../../components/ui/Table';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { getErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import * as inquiryApi from '../../api/inquiries';
import {
  Inbox,
  XCircle,
  Phone,
  User,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function InquiriesPage() {
  const { push } = useToast();

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Cancel dialog
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const data = await inquiryApi.getInquiries(params);
      setInquiries(Array.isArray(data) ? data : []);
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await inquiryApi.deleteInquiry(cancelTarget._id);
      push({ message: 'Inquiry cancelled successfully.', type: 'success' });
      setCancelTarget(null);
      await loadInquiries();
    } catch (err) {
      push({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Direct Trade"
        title="My Inquiries"
        description="Track your purchase requests submitted to farmers, view response status, and connect with sellers."
      />

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Status:</span>
          <div className="inline-flex rounded border border-gray-200 bg-white p-0.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'accepted', label: 'Accepted' },
              { key: 'rejected', label: 'Rejected' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={[
                  'px-3 py-1 text-xs rounded transition-colors font-medium',
                  statusFilter === key
                    ? 'bg-green-900 text-white'
                    : 'text-gray-600 hover:text-green-900 hover:bg-green-50',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          {inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'} found
        </p>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="border border-gray-200 rounded bg-white">
          <EmptyState
            icon={<Inbox size={40} className="text-gray-400" />}
            title="No inquiries found"
            description={
              statusFilter !== 'all'
                ? `You have no ${statusFilter} inquiries at the moment.`
                : 'Browse available harvests in the Marketplace to submit purchase inquiries.'
            }
            actionLabel="Browse Marketplace"
            actionHref="/app/marketplace"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {inquiries.map((inq) => {
            const isAccepted = inq.status === 'accepted';
            const isPending = inq.status === 'pending';
            const listing = inq.listing;

            return (
              <article
                key={inq._id}
                className={[
                  'border rounded p-5 bg-white flex flex-col gap-3 transition-colors',
                  isAccepted ? 'border-green-300 bg-green-50/20' : 'border-gray-200',
                ].join(' ')}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-gray-900">
                      {listing?.cropName || 'Harvest Batch'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Batch: {listing?.quantity} {listing?.unit || 'kg'} • {formatCurrency(listing?.pricePerUnit)} / {listing?.unit || 'kg'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={inq.status} />
                    <span className="text-xs text-gray-400">
                      Submitted {formatDate(inq.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Inquiry details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400 uppercase tracking-wider block font-medium">Requested Quantity</span>
                    <span className="font-semibold text-gray-900 text-sm mt-0.5 block">
                      {inq.quantity != null ? `${inq.quantity} ${listing?.unit || 'kg'}` : `Full batch (${listing?.quantity} ${listing?.unit || 'kg'})`}
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <span className="text-gray-400 uppercase tracking-wider block font-medium">Your Message</span>
                    <p className="text-gray-800 italic mt-0.5">
                      {inq.message ? `"${inq.message}"` : 'No custom message provided.'}
                    </p>
                  </div>
                </div>

                {/* Highlighted Seller Contact Block for Accepted Inquiries */}
                {isAccepted && inq.seller && (
                  <div className="mt-2 border border-green-300 bg-green-50/80 rounded p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-900 font-semibold text-sm">
                        <User size={16} />
                        <span>Seller: {inq.seller.name}</span>
                      </div>
                      {inq.seller.phone ? (
                        <a
                          href={`tel:${inq.seller.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-900 text-white rounded text-xs font-medium hover:bg-green-800 transition-colors"
                        >
                          <Phone size={13} />
                          <span>{inq.seller.phone}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">Phone not provided</span>
                      )}
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-green-800 pt-1 border-t border-green-200/60">
                      <Info size={14} className="shrink-0 mt-0.5" />
                      <p>
                        Arrange payment and pickup directly with the seller. icagria does not process payments.
                      </p>
                    </div>
                  </div>
                )}

                {/* Pending Cancel Action */}
                {isPending && (
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCancelTarget(inq)}
                      className="text-xs text-red-700 border-gray-200 hover:border-red-300 hover:bg-red-50"
                    >
                      <XCircle size={14} className="mr-1" />
                      Cancel inquiry
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => !cancelling && setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel inquiry?"
        message={`Are you sure you want to cancel your inquiry for ${cancelTarget?.listing?.cropName || 'this harvest'}?`}
        confirmLabel="Cancel inquiry"
        confirmVariant="primary"
        loading={cancelling}
      />
    </AppShell>
  );
}
