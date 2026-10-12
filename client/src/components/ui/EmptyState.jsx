// src/components/ui/EmptyState.jsx
// Empty state with an icon, helpful sentence, and optional call-to-action.
// Props: icon, title, description, actionLabel, onAction, actionHref

import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';
import { Link } from 'react-router-dom';

/**
 * @param {{
 *   icon?: React.ReactNode,
 *   title: string,
 *   description?: string,
 *   actionLabel?: string,
 *   onAction?: function,
 *   actionHref?: string,
 *   className?: string,
 * }} props
 */
export default function EmptyState({ icon, title, description, actionLabel, onAction, actionHref, className = '' }) {
  const renderIcon = () => {
    if (!icon) return <Inbox size={40} aria-hidden="true" />;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      const IconComp = icon;
      return <IconComp size={40} aria-hidden="true" />;
    }
    return icon;
  };

  return (
    <div className={['flex flex-col items-center justify-center text-center py-16 gap-3', className].join(' ')}>
      <span className="text-gray-300">
        {renderIcon()}
      </span>
      <p className="font-serif text-lg font-semibold text-gray-700">{title}</p>
      {description && <p className="text-sm text-gray-500 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="mt-2">{actionLabel}</Button>
      )}
      {actionLabel && actionHref && (
        <Link to={actionHref}>
          <Button variant="primary" className="mt-2">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
