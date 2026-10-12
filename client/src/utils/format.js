// src/utils/format.js
// Formatting helpers used throughout the icagria frontend.

/**
 * Format a number as Indonesian Rupiah currency.
 * @param {number} amount
 * @returns {string} e.g. "Rp 8.000"
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date string or Date object as "12 Oct 2026".
 * @param {string|Date} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date+time as "12 Oct 2026, 14:30".
 * @param {string|Date} value
 * @returns {string}
 */
export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return (
    d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  );
}

/**
 * Format a plain number with thousand separators.
 * @param {number} value
 * @param {number} [decimals=0]
 * @returns {string}
 */
export function formatNumber(value, decimals = 0) {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Truncate a string to a maximum length, appending "…".
 * @param {string} str
 * @param {number} [max=120]
 * @returns {string}
 */
export function truncate(str, max = 120) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}
