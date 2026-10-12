// src/components/ui/Spinner.jsx
// Animated loading spinner. size: 'sm' | 'md' | 'lg'

import React from 'react';

/**
 * @param {{ size?: 'sm'|'md'|'lg', className?: string }} props
 */
export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <span
      role="status"
      aria-label="Loading"
      className={['animate-spin rounded-full border-2 border-gray-200 border-t-green-700 inline-block', sizes[size] || sizes.md, className].join(' ')}
    />
  );
}
