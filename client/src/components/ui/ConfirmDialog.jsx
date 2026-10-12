// src/components/ui/ConfirmDialog.jsx
// Confirmation modal with confirm/cancel buttons.
// Props: open, onClose, onConfirm, title, message, confirmLabel, confirmVariant, loading

import React from 'react';
import Modal from './Modal';
import Button from './Button';

/**
 * @param {{
 *   open: boolean,
 *   onClose: function,
 *   onConfirm: function,
 *   title?: string,
 *   message: string,
 *   confirmLabel?: string,
 *   confirmVariant?: 'primary'|'secondary',
 *   loading?: boolean,
 * }} props
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-gray-700 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
          className={confirmLabel.toLowerCase().includes('delete') || confirmLabel.toLowerCase().includes('remove') ? 'bg-red-700 hover:bg-red-800 border-red-700' : ''}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
