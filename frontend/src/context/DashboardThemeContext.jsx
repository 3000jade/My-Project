import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { profileService } from '../services/profileService';

export const DENSITY_OPTIONS = [
  {
    id: 'compact',
    label: 'Compact',
    badge: '14px Base',
    description: 'Higher information density suited for complex tables and multi-column feeds.',
  },
  {
    id: 'standard',
    label: 'Standard',
    badge: '16px Base',
    description: 'Balanced default scale for day-to-day broker workflow and oversight.',
  },
  {
    id: 'comfortable',
    label: 'Comfortable',
    badge: '18px Base',
    description: 'Larger text and relaxed spacing for enhanced readability and presentations.',
  },
];

const DashboardThemeContext = createContext({
  density: 'standard',
  setDensity: () => {},
  isSyncing: false,
  options: DENSITY_OPTIONS,
});

const STORAGE_KEY = 'broker_dashboard_font_size';

export function DashboardThemeProvider({ children, role = 'broker' }) {
  // 1. Initial State: Read immediately from localStorage to avoid layout shift
  const [density, setDensityState] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (['compact', 'standard', 'comfortable'].includes(cached)) {
        return cached;
      }
    } catch {
      // Ignore localStorage exceptions in restricted contexts
    }
    return 'standard';
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // 2. Sync from backend on initial mount
  useEffect(() => {
    let isMounted = true;
    async function fetchUserPreference() {
      try {
        const profile = await profileService.getProfile({ role });
        const remoteDensity = profile?.ui_preferences?.font_size;
        if (remoteDensity && ['compact', 'standard', 'comfortable'].includes(remoteDensity)) {
          if (isMounted) {
            setDensityState(remoteDensity);
            try {
              localStorage.setItem(STORAGE_KEY, remoteDensity);
            } catch {}
          }
        }
      } catch (err) {
        console.warn('[DashboardThemeProvider] Failed to fetch remote UI preferences:', err);
      }
    }

    fetchUserPreference();
    return () => {
      isMounted = false;
    };
  }, [role]);

  // 3. Setter function: Updates local storage and persists to backend
  const setDensity = useCallback(async (newDensity) => {
    if (!['compact', 'standard', 'comfortable'].includes(newDensity)) return;

    // Instant local state + localStorage update
    setDensityState(newDensity);
    try {
      localStorage.setItem(STORAGE_KEY, newDensity);
    } catch {}

    // Async backend synchronization
    setIsSyncing(true);
    try {
      await profileService.updateProfile(
        { ui_preferences: { font_size: newDensity } },
        { role }
      );
    } catch (err) {
      console.warn('[DashboardThemeProvider] Backend density sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [role]);

  return (
    <DashboardThemeContext.Provider value={{ density, setDensity, isSyncing, options: DENSITY_OPTIONS }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardDensity() {
  const context = useContext(DashboardThemeContext);
  if (!context || !context.options) {
    return {
      density: 'standard',
      setDensity: () => {},
      isSyncing: false,
      options: DENSITY_OPTIONS,
    };
  }
  return context;
}

export default DashboardThemeContext;
