// src/components/ui/FormField.jsx
// Wraps label + input slot + helper text + inline error.
// Props: label, htmlFor, helperText, error, required, children

import React from 'react';

/**
 * @param {{
 *   label: string,
 *   htmlFor?: string,
 *   helperText?: string,
 *   error?: string,
 *   required?: boolean,
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function FormField({ label, htmlFor, helperText, error, required = false, children, className = '' }) {
  return (
    <div className={['flex flex-col gap-1', className].join(' ')}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="ml-0.5 text-red-700" aria-hidden="true">*</span>}
      </label>
      {children}
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      {error && (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} role="alert" className="text-xs text-red-700 flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
