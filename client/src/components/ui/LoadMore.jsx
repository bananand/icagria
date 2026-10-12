// src/components/ui/LoadMore.jsx
// "Load more" text link to trigger pagination.
// Props: onClick, loading, hasMore, className

import React from 'react';
import Spinner from './Spinner';

/**
 * @param {{
 *   onClick: function,
 *   loading?: boolean,
 *   hasMore?: boolean,
 *   className?: string,
 * }} props
 */
export default function LoadMore({ onClick, loading = false, hasMore = true, className = '' }) {
  if (!hasMore) return null;
  return (
    <div className={['flex justify-center mt-6', className].join(' ')}>
      <button
        onClick={onClick}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-900 hover:underline focus-ring rounded disabled:opacity-50"
      >
        {loading && <Spinner size="sm" />}
        {loading ? 'Loading…' : 'Load more →'}
      </button>
    </div>
  );
}
