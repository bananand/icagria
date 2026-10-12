// src/components/marketplace/ListingDetailModal.jsx
// Detailed listing view and Buyer "Send inquiry" form.
// Displays all listing fields, seller name (never seller email/phone for public/pending view),
// quantity validation (optional <= listing quantity), and inline API error messages.

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import ErrorBlock from '../ui/ErrorBlock';
import { formatCurrency, formatDate } from '../../utils/format';
import { getErrorMessage } from '../../api/client';
import * as inquiryApi from '../../api/inquiries';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { MapPin, User, Calendar, Sprout, Tag, Send } from 'lucide-react';

export default function ListingDetailModal({
  listing,
  open,
  onClose,
  onInquirySent,
}) {
  const { user } = useAuth();
  const { push } = useToast();

  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formErrors, setFormErrors] = useState({});

  if (!listing) return null;

  const isBuyer = user?.role === 'buyer';
  const isAvailable = listing.status === 'available';

  const validate = () => {
    const errs = {};
    if (quantity !== '') {
      const q = Number(quantity);
      if (isNaN(q) || q <= 0) {
        errs.quantity = 'Quantity must be greater than 0';
      } else if (q > listing.quantity) {
        errs.quantity = `Quantity cannot exceed available stock (${listing.quantity} ${listing.unit || 'kg'})`;
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await inquiryApi.createInquiry({
        listing: listing._id,
        quantity: quantity !== '' ? Number(quantity) : undefined,
        message: message.trim() || undefined,
      });

      push({ message: 'Inquiry sent successfully to the seller.', type: 'success' });
      setQuantity('');
      setMessage('');
      if (onInquirySent) onInquirySent();
      onClose();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose()}
      title={listing.cropName}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-5 text-sm text-gray-700">
        {/* Header & Status */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              Harvest Listing
            </span>
            <p className="text-base font-serif font-bold text-green-900 mt-0.5">
              {formatCurrency(listing.pricePerUnit)} / {listing.unit || 'kg'}
            </p>
          </div>
          <StatusBadge status={listing.status} />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded border border-gray-200">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Available Stock</p>
            <p className="font-serif font-bold text-gray-900 text-base mt-0.5">
              {listing.quantity} {listing.unit || 'kg'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Location</p>
            <p className="text-gray-900 font-medium truncate mt-0.5">
              {listing.location || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Seller</p>
            <p className="text-gray-900 font-medium truncate mt-0.5">
              {listing.seller?.name || 'Verified Farmer'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total Batch Value</p>
            <p className="text-green-900 font-semibold text-xs mt-0.5">
              {formatCurrency(listing.quantity * listing.pricePerUnit)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Listed On</p>
            <p className="text-gray-700 text-xs mt-0.5">
              {formatDate(listing.createdAt)}
            </p>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">
              Harvest Details & Quality
            </h4>
            <p className="text-gray-800 leading-relaxed bg-white border border-gray-100 p-3 rounded">
              {listing.description}
            </p>
          </div>
        )}

        {/* Buyer Send Inquiry Section */}
        {isBuyer && (
          <div className="mt-2 pt-4 border-t border-gray-200 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-green-800" />
              <h4 className="font-serif font-semibold text-gray-900 text-base">
                Send Purchase Inquiry
              </h4>
            </div>

            {!isAvailable ? (
              <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded border border-amber-200">
                This listing is currently {listing.status}. Inquiries can only be submitted for available harvests.
              </p>
            ) : (
              <form onSubmit={handleInquirySubmit} className="flex flex-col gap-3">
                <ErrorBlock error={errorMsg} />

                <FormField
                  label={`Requested quantity (${listing.unit || 'kg'})`}
                  htmlFor="inquiry-quantity"
                  helperText={`Leave empty to request full available batch (${listing.quantity} ${listing.unit || 'kg'})`}
                  error={formErrors.quantity}
                >
                  <Input
                    id="inquiry-quantity"
                    type="number"
                    min="1"
                    max={listing.quantity}
                    step="any"
                    placeholder={`e.g. ${Math.min(50, listing.quantity)}`}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={submitting}
                    error={Boolean(formErrors.quantity)}
                  />
                </FormField>

                <FormField
                  label="Message to seller (optional)"
                  htmlFor="inquiry-message"
                  helperText="e.g. Preferred pickup date, packaging preferences, or questions."
                >
                  <Textarea
                    id="inquiry-message"
                    rows={2}
                    placeholder="We are interested in sourcing this batch for our restaurant..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={submitting}
                  />
                </FormField>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    loading={submitting}
                    disabled={submitting}
                  >
                    Send inquiry
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {!isBuyer && (
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
