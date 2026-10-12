// src/context/ToastContext.jsx
// Custom toast notification system — no external library.
// Uses aria-live for screen-reader announcements.

import React, {
  createContext,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
} from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { setToastPusher } from '../api/client';

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={16} className="text-green-700 shrink-0" aria-hidden="true" />,
  error: <AlertCircle size={16} className="text-red-700 shrink-0" aria-hidden="true" />,
  info: <Info size={16} className="text-gray-500 shrink-0" aria-hidden="true" />,
};

const BORDER = {
  success: 'border-green-200',
  error: 'border-red-200',
  info: 'border-gray-200',
};

let _nextId = 0;

/**
 * ToastProvider — wrap the app with this to enable toasts.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Expose push to the Axios interceptor (runs outside React tree)
  React.useEffect(() => {
    setToastPusher(push);
    return () => setToastPusher(null);
  }, [push]);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 w-80 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={[
              'flex items-start gap-3 bg-white border rounded-md shadow-md px-4 py-3 pointer-events-auto',
              BORDER[t.type] || 'border-gray-200',
            ].join(' ')}
          >
            {ICONS[t.type] || ICONS.info}
            <p className="text-sm text-gray-800 flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600 focus-ring rounded"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * useToast — returns { push, dismiss }.
 * push({ message, type?: 'success'|'error'|'info', duration?: number })
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
