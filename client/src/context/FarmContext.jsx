// src/context/FarmContext.jsx
// Manages the farmer's farms list and current selected farm.
// Selected farm is persisted in localStorage under "icagria_selected_farm".

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import * as farmApi from '../api/farms';

const SELECTED_FARM_KEY = 'icagria_selected_farm';

const FarmContext = createContext(null);

export function FarmProvider({ children }) {
  const { user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFarmId, setSelectedFarmIdState] = useState(() => {
    return localStorage.getItem(SELECTED_FARM_KEY) || '';
  });

  const reloadFarms = useCallback(async () => {
    if (!user || user.role !== 'farmer') {
      setFarms([]);
      setSelectedFarmIdState('');
      localStorage.removeItem(SELECTED_FARM_KEY);
      return;
    }

    setLoading(true);
    try {
      const data = await farmApi.getFarms();
      const loadedFarms = Array.isArray(data) ? data : [];
      setFarms(loadedFarms);

      setSelectedFarmIdState((prevId) => {
        const stored = localStorage.getItem(SELECTED_FARM_KEY);
        const candidate = prevId || stored || '';
        // Validate candidate against loaded farms
        const valid = loadedFarms.some((f) => f._id === candidate);
        if (valid) {
          localStorage.setItem(SELECTED_FARM_KEY, candidate);
          return candidate;
        }
        // Fallback to first farm if available, else empty string
        const fallback = loadedFarms.length > 0 ? loadedFarms[0]._id : '';
        if (fallback) {
          localStorage.setItem(SELECTED_FARM_KEY, fallback);
        } else {
          localStorage.removeItem(SELECTED_FARM_KEY);
        }
        return fallback;
      });
    } catch {
      setFarms([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load farms whenever user logs in or changes (only farmer role)
  useEffect(() => {
    if (user?.role === 'farmer') {
      reloadFarms();
    } else {
      setFarms([]);
      setSelectedFarmIdState('');
      localStorage.removeItem(SELECTED_FARM_KEY);
    }
  }, [user, reloadFarms]);

  const setSelectedFarmId = useCallback((id) => {
    setSelectedFarmIdState(id);
    if (id) {
      localStorage.setItem(SELECTED_FARM_KEY, id);
    } else {
      localStorage.removeItem(SELECTED_FARM_KEY);
    }
  }, []);

  return (
    <FarmContext.Provider
      value={{
        farms,
        selectedFarmId,
        setSelectedFarmId,
        reloadFarms,
        loading,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used inside FarmProvider');
  return ctx;
}
