// src/components/ui/StatCard.jsx
// Single metric display block.
// Props: label, value, sub, icon, className

import React from 'react';

/**
 * @param {{
 *   label: string,
 *   value: string|number,
 *   sub?: string,
 *   icon?: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function StatCard({ label, value, sub, icon, className = '' }) {
  return (
    <div className={['border border-gray-200 rounded p-4 flex flex-col gap-1', className].join(' ')}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">{label}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <p className="text-2xl font-serif font-semibold text-green-900">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
