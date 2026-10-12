// src/components/ui/Table.jsx
// Minimal table helpers: TableContainer, Th, Td.
// Use: <TableContainer><thead><tr><Th>...</Th></tr></thead><tbody><tr><Td>...</Td></tr></tbody></TableContainer>

import React from 'react';

/**
 * Scroll wrapper + <table> element.
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export function TableContainer({ children, className = '' }) {
  return (
    <div className={['overflow-x-auto rounded border border-gray-200', className].join(' ')}>
      <table>{children}</table>
    </div>
  );
}

/**
 * Table header cell — small uppercase.
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export function Th({ children, className = '' }) {
  return (
    <th className={className}>
      {children}
    </th>
  );
}

/**
 * Table data cell.
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export function Td({ children, className = '' }) {
  return (
    <td className={className}>
      {children}
    </td>
  );
}
