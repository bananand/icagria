// src/components/ui/Skeleton.jsx
// Grey placeholder block for loading states.
// Props: className, height, width

import React from 'react';

/**
 * @param {{
 *   className?: string,
 *   height?: string,
 *   width?: string,
 * }} props
 */
export default function Skeleton({ className = '', height = 'h-4', width = 'w-full' }) {
  return (
    <div
      aria-hidden="true"
      className={['animate-pulse rounded bg-gray-200', height, width, className].join(' ')}
    />
  );
}

/**
 * SkeletonCard — a card-shaped skeleton placeholder.
 */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={['border border-gray-200 rounded overflow-hidden', className].join(' ')}>
      <div className="aspect-[3/2] bg-gray-200 animate-pulse" />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton height="h-3" width="w-1/3" />
        <Skeleton height="h-5" width="w-2/3" />
        <Skeleton height="h-3" width="w-full" />
      </div>
    </div>
  );
}
