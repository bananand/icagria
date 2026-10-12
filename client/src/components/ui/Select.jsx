// src/components/ui/Select.jsx
// A styled <select> dropdown. Use inside <FormField>.
// Props: id, value, onChange, disabled, error, children, className

import React from 'react';

/**
 * @param {{
 *   id?: string,
 *   value?: string,
 *   onChange?: function,
 *   disabled?: boolean,
 *   error?: boolean,
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function Select({ error = false, disabled = false, className = '', children, ...rest }) {
  return (
    <select
      {...rest}
      disabled={disabled}
      className={[
        'block w-full rounded border px-3 py-2 text-sm text-gray-900 bg-white',
        'focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent',
        error ? 'border-red-700 bg-red-50' : 'border-gray-300',
        disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : '',
        className,
      ].join(' ')}
    >
      {children}
    </select>
  );
}
