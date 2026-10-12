// src/components/ui/ErrorBlock.jsx
// Inline error block showing the API error message.
// Props: message, className

import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * @param {{
 *   message: string,
 *   className?: string,
 * }} props
 */
export default function ErrorBlock({ message, className = '' }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={['flex items-start gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700', className].join(' ')}
    >
      <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
