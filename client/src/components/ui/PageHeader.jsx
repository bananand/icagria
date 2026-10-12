// src/components/ui/PageHeader.jsx
// Page header: eyebrow label, large serif h1, optional description, thin rule.
// Props: eyebrow, title, description, className

import React from 'react';

/**
 * @param {{
 *   eyebrow?: string,
 *   title: string,
 *   description?: string,
 *   className?: string,
 * }} props
 */
export default function PageHeader({ eyebrow, title, description, className = '' }) {
  return (
    <header className={['mb-8', className].join(' ')}>
      {eyebrow && (
        <p className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-2">
          {eyebrow}
        </p>
      )}
      <h1 className="font-serif text-3xl font-semibold text-green-900 leading-tight">{title}</h1>
      {description && (
        <p className="mt-2 text-base text-gray-600 leading-relaxed">{description}</p>
      )}
      <hr className="mt-4" />
    </header>
  );
}
