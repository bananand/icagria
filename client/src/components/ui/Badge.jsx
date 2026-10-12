// src/components/ui/Badge.jsx
// Small pill label.
// Props: children, variant ('default'|'green'|'red'|'gray'), className

import React from 'react';

const VARIANTS = {
  default: 'bg-gray-100 text-gray-700',
  green: 'bg-green-100 text-green-900',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-500',
};

/**
 * @param {{
 *   children: React.ReactNode,
 *   variant?: 'default'|'green'|'red'|'gray',
 *   className?: string,
 * }} props
 */
export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide uppercase',
        VARIANTS[variant] || VARIANTS.default,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
