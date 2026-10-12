// src/components/marketplace/ListingCard.jsx
// Marketplace Listing Card:
// 3:2 placeholder image block, StatusBadge, crop & status eyebrow,
// serif headline with crop name, quantity unit - price per unit, location, seller name, posted date.

import React from 'react';
import StatusBadge from '../ui/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';
import { MapPin, User, Calendar, Tag } from 'lucide-react';

export default function ListingCard({ listing, onClick, className = '' }) {
  if (!listing) return null;

  const isClickable = Boolean(onClick);

  return (
    <article
      onClick={onClick}
      className={[
        'border border-gray-200 rounded overflow-hidden flex flex-col bg-white transition-all',
        isClickable ? 'cursor-pointer hover:border-green-300 hover:shadow-xs' : '',
        className,
      ].join(' ')}
    >
      {/* 3:2 image block */}
      <div className="aspect-[3/2] bg-green-100 flex items-center justify-center relative overflow-hidden shrink-0">
        <span className="font-serif text-5xl text-green-700 select-none" aria-hidden="true">
          {listing.cropName ? listing.cropName[0] : 'H'}
        </span>
        <div className="absolute top-3 right-3">
          <StatusBadge status={listing.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Eyebrow: Crop & Status */}
        <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wider font-medium">
          <span>{listing.crop?.type || 'Harvest'}</span>
          <span>{listing.status}</span>
        </div>

        {/* Headline */}
        <h3 className="font-serif text-lg font-semibold text-gray-900 leading-snug">
          {listing.cropName}
        </h3>

        {/* Pricing & Quantity */}
        <div className="text-sm font-semibold text-green-900">
          <span>
            {listing.quantity} {listing.unit || 'kg'}
          </span>
          <span className="mx-1.5 text-gray-400 font-normal">•</span>
          <span>{formatCurrency(listing.pricePerUnit)} / {listing.unit || 'kg'}</span>
        </div>

        {/* Metadata */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex flex-col gap-1.5 text-xs text-gray-500">
          {listing.location && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin size={13} className="text-green-800 shrink-0" aria-hidden="true" />
              <span className="truncate">{listing.location}</span>
            </div>
          )}
          {listing.seller?.name && (
            <div className="flex items-center gap-1.5 truncate">
              <User size={13} className="text-gray-400 shrink-0" aria-hidden="true" />
              <span className="truncate">{listing.seller.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-gray-400">
            <Calendar size={13} className="shrink-0" aria-hidden="true" />
            <span>Posted {formatDate(listing.createdAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
