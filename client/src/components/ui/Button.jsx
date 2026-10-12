// src/components/ui/Button.jsx
// Three variants: "primary" (solid green-900), "secondary" (outline), "text" (link-style with arrow).
// Props: variant, size, disabled, loading, onClick, type, children, className, arrow

import React from 'react';
import Spinner from './Spinner';

/**
 * @param {{
 *   variant?: 'primary'|'secondary'|'text',
 *   size?: 'sm'|'md'|'lg',
 *   disabled?: boolean,
 *   loading?: boolean,
 *   onClick?: function,
 *   type?: string,
 *   children: React.ReactNode,
 *   className?: string,
 *   arrow?: boolean,
 * }} props
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  children,
  className = '',
  arrow = false,
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-ring rounded';

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants = {
    primary:
      'bg-green-900 text-white hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed',
    secondary:
      'border border-green-900 text-green-900 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed',
    text: 'text-green-700 hover:text-green-900 underline-offset-2 hover:underline disabled:opacity-50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[base, sizes[size] || sizes.md, variants[variant] || variants.primary, className].join(' ')}
    >
      {loading && <Spinner size="sm" />}
      {children}
      {arrow && <span aria-hidden="true">→</span>}
    </button>
  );
}
