// src/context/AlertsContext.jsx
// Polling unread alerts count for farmers and providing refresh methods.

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import * as alertApi from '../api/alerts';

const AlertsContext = createContext(null);

export function AlertsProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user || user.role !== 'farmer') {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await alertApi.getUnreadAlertsCount();
      // Handle either { count } or { unreadCount } depending on API response
      const count = typeof data?.count === 'number' ? data.count : (data?.unreadCount || 0);
      setUnreadCount(count);
    } catch {
      // Silently fail polling
    }
  }, [user]);

  // Initial fetch and 60-second polling for farmer
  useEffect(() => {
    if (user?.role === 'farmer') {
      refreshUnreadCount();
      const interval = setInterval(refreshUnreadCount, 60000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user, refreshUnreadCount]);

  return (
    <AlertsContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlerts must be used inside AlertsProvider');
  return ctx;
}
