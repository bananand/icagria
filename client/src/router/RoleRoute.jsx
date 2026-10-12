// src/router/RoleRoute.jsx
// Requires one of the allowed roles. Wrong role → redirect to role home + toast.

import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/ui/Spinner';

/** Returns the home path for a given role. */
export function roleHome(role) {
  if (role === 'admin') return '/admin';
  if (role === 'buyer') return '/app/marketplace';
  return '/app/dashboard';
}

/**
 * @param {{
 *   roles: string[],
 *   children: React.ReactNode,
 * }} props
 */
export default function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const { push } = useToast();
  const toastShown = useRef(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!roles.includes(user.role)) {
    if (!toastShown.current) {
      toastShown.current = true;
      // Push toast in a microtask so it runs after render
      setTimeout(() => {
        push({ message: 'You do not have access to that page.', type: 'error' });
      }, 0);
    }
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
}
