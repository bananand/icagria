// src/components/ui/Input.jsx
// A styled text input. Use inside <FormField> for label + error handling.
// Props: id, type, value, onChange, onBlur, placeholder, disabled, className, ...rest

import React from 'react';

/**
 * @param {{
 *   id?: string,
 *   type?: string,
 *   value?: string,
 *   onChange?: function,
 *   onBlur?: function,
 *   placeholder?: string,
 *   disabled?: boolean,
 *   className?: string,
 *   error?: boolean,
 * }} props
 */
export default function Input({ error = false, className = '', disabled = false, ...rest }) {
  return (
    <input
      {...rest}
      disabled={disabled}
      className={[
        'block w-full rounded border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
        'focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent',
        error
          ? 'border-red-700 bg-red-50'
          : 'border-gray-300 bg-white',
        disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : '',
        className,
      ].join(' ')}
    />
  );
}
