// src/components/ui/Card.jsx
// Magazine-style card: 3:2 image area, eyebrow, serif headline, description.
// Props: eyebrow, headline, description, initial, imageUrl, onClick, href, className

import React from 'react';

/**
 * @param {{
 *   eyebrow?: string,
 *   headline: string,
 *   description?: string,
 *   initial?: string,
 *   imageUrl?: string,
 *   onClick?: function,
 *   className?: string,
 *   children?: React.ReactNode,
 * }} props
 */
export default function Card({ eyebrow, headline, description, initial, imageUrl, onClick, className = '', children }) {
  const isClickable = !!onClick;
  return (
    <article
      onClick={onClick}
      className={[
        'border border-gray-200 rounded overflow-hidden flex flex-col',
        isClickable ? 'cursor-pointer hover:border-green-200 transition-colors' : '',
        className,
      ].join(' ')}
    >
      {/* 3:2 image area */}
      <div className="aspect-[3/2] bg-green-100 flex items-center justify-center overflow-hidden shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={headline} className="w-full h-full object-cover" />
        ) : (
          <span className="font-serif text-5xl text-green-700 select-none" aria-hidden="true">
            {initial || (headline ? headline[0] : '?')}
          </span>
        )}
      </div>
      {/* Content */}
      <div className="p-4 flex flex-col gap-1 flex-1">
        {eyebrow && (
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">{eyebrow}</p>
        )}
        <h3 className={['font-serif font-semibold text-gray-900 leading-snug', isClickable ? 'group-hover:underline' : ''].join(' ')}>
          {headline}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        )}
        {children}
      </div>
    </article>
  );
}
