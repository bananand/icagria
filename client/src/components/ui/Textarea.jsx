// src/components/ui/Textarea.jsx
// A styled <textarea>. Use inside <FormField>.
// Props: id, value, onChange, disabled, error, rows, placeholder, className

import React from 'react';

/**
 * @param {{
 *   id?: string,
 *   value?: string,
 *   onChange?: function,
 *   disabled?: boolean,
 *   error?: boolean,
 *   rows?: number,
 *   placeholder?: string,
 *   className?: string,
 * }} props
 */
export default function Textarea({ error = false, disabled = false, rows = 4, className = '', ...rest }) {
  return (
    <textarea
      {...rest}
      rows={rows}
      disabled={disabled}
      className={[
        'block w-full rounded border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 resize-y',
        'focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent',
        error ? 'border-red-700 bg-red-50' : 'border-gray-300 bg-white',
        disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : '',
        className,
      ].join(' ')}
    />
  );
}
