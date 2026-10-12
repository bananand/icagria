// src/components/ui/StatusBadge.jsx
// Icon + text status badge. Never relies on color alone.
// Props: status (string key), map (optional custom map)

import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, Truck, Package, Leaf } from 'lucide-react';

// Default status map — extendable per page via the `map` prop
const DEFAULT_MAP = {
  active:    { label: 'Active',     icon: CheckCircle, color: 'text-green-700 bg-green-50' },
  inactive:  { label: 'Inactive',   icon: XCircle,     color: 'text-gray-500 bg-gray-100' },
  available: { label: 'Available',  icon: Leaf,        color: 'text-green-700 bg-green-50' },
  reserved:  { label: 'Reserved',   icon: Clock,       color: 'text-amber-700 bg-amber-50' },
  sold:      { label: 'Sold',       icon: CheckCircle, color: 'text-gray-500 bg-gray-100' },
  pending:   { label: 'Pending',    icon: Clock,       color: 'text-amber-700 bg-amber-50' },
  accepted:  { label: 'Accepted',   icon: CheckCircle, color: 'text-green-700 bg-green-50' },
  rejected:  { label: 'Rejected',   icon: XCircle,     color: 'text-red-700 bg-red-50' },
  confirmed: { label: 'Confirmed',  icon: CheckCircle, color: 'text-green-700 bg-green-50' },
  delivered: { label: 'Delivered',  icon: Truck,       color: 'text-blue-700 bg-blue-50' },
  cancelled: { label: 'Cancelled',  icon: XCircle,     color: 'text-red-700 bg-red-50' },
  growing:      { label: 'Growing',      icon: Leaf,        color: 'text-green-700 bg-green-50' },
  harvested:    { label: 'Harvested',    icon: Package,     color: 'text-gray-700 bg-gray-100' },
  farmer:       { label: 'Farmer',       icon: Leaf,        color: 'text-green-700 bg-green-50' },
  buyer:        { label: 'Buyer',        icon: Package,     color: 'text-blue-700 bg-blue-50' },
  admin:        { label: 'Admin',        icon: AlertCircle, color: 'text-gray-700 bg-gray-100' },
  suitable:     { label: 'Suitable',     icon: CheckCircle, color: 'text-green-700 bg-green-50' },
  too_acidic:   { label: 'Too Acidic',   icon: AlertCircle, color: 'text-amber-800 bg-amber-50' },
  too_alkaline: { label: 'Too Alkaline', icon: AlertCircle, color: 'text-blue-800 bg-blue-50' },
  no_data:      { label: 'No Data',      icon: Clock,       color: 'text-gray-500 bg-gray-100' },
  unknown:      { label: 'Not Set',      icon: AlertCircle, color: 'text-gray-500 bg-gray-100' },
};

/**
 * @param {{
 *   status: string,
 *   map?: object,
 *   className?: string,
 * }} props
 */
export default function StatusBadge({ status, map = {}, className = '' }) {
  const merged = { ...DEFAULT_MAP, ...map };
  const config = merged[status] || {
    label: status,
    icon: AlertCircle,
    color: 'text-gray-500 bg-gray-100',
  };
  const Icon = config.icon;

  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
        config.color,
        className,
      ].join(' ')}
    >
      <Icon size={12} aria-hidden="true" />
      {config.label}
    </span>
  );
}
