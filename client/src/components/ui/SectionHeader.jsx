// src/components/ui/SectionHeader.jsx
// Section header: serif h2 + thin rule + optional "View all →" link.
// Props: title, viewAllHref, onViewAll, className

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * @param {{
 *   title: string,
 *   viewAllHref?: string,
 *   onViewAll?: function,
 *   className?: string,
 * }} props
 */
export default function SectionHeader({ title, viewAllHref, onViewAll, className = '' }) {
  return (
    <div className={['flex items-center gap-4 mb-4', className].join(' ')}>
      <h2 className="font-serif text-xl font-semibold text-green-900 shrink-0">{title}</h2>
      <hr className="flex-1" />
      {viewAllHref && (
        <Link
          to={viewAllHref}
          className="text-sm text-green-700 hover:text-green-900 hover:underline whitespace-nowrap shrink-0"
        >
          View all →
        </Link>
      )}
      {!viewAllHref && onViewAll && (
        <button
          onClick={onViewAll}
          className="text-sm text-green-700 hover:text-green-900 hover:underline whitespace-nowrap shrink-0 focus-ring rounded"
        >
          View all →
        </button>
      )}
    </div>
  );
}
