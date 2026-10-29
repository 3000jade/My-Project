import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Breakpoint definitions matching Tailwind CSS
 */
export const VIEWPORT_BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1024,
};

/**
 * Helper to determine current device tier
 * @param {number} width - Viewport width in pixels
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
export function getViewportTier(width) {
  if (width < VIEWPORT_BREAKPOINTS.TABLET) {
    return 'mobile';
  }
  if (width < VIEWPORT_BREAKPOINTS.DESKTOP) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Computes default visible column IDs for a given device tier
 * @param {Array<{id: string, tiers?: string[], isLocked?: boolean}>} availableColumns 
 * @param {'mobile' | 'tablet' | 'desktop'} tier 
 * @returns {string[]}
 */
export function getDefaultColumnsForTier(availableColumns = [], tier = 'desktop') {
  if (!Array.isArray(availableColumns) || availableColumns.length === 0) {
    return [];
  }

  return availableColumns
    .filter((col) => {
      // Locked columns are always visible on all devices
      if (col.isLocked) return true;
      // If no explicit tiers defined, default to visible across all
      if (!Array.isArray(col.tiers) || col.tiers.length === 0) return true;
      return col.tiers.includes(tier);
    })
    .map((col) => col.id);
}

/**
 * Custom hook to manage responsive table columns based on device viewport
 * @param {Object} options
 * @param {Array} options.availableColumns - Full list of available columns with metadata
 * @param {string} [options.storageKey] - Optional localStorage key to persist user customizations
 * @param {Function} [options.onColumnsChange] - Optional callback when visible columns change
 */
export default function useResponsiveColumns({
  availableColumns = [],
  storageKey = null,
  onColumnsChange = null
}) {
  // 1. Viewport detection state
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1280; // Default SSR / test fallback
  });

  const currentTier = useMemo(() => getViewportTier(viewportWidth), [viewportWidth]);

  // Keep track of whether the user explicitly customized columns
  const [hasCustomPreference, setHasCustomPreference] = useState(() => {
    if (!storageKey || typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(storageKey);
      return Boolean(saved);
    } catch {
      return false;
    }
  });

  // 2. Visible columns state
  const [visibleColumns, setVisibleColumnsState] = useState(() => {
    // Check saved preference first
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Ensure locked columns remain included
            const lockedIds = availableColumns.filter((c) => c.isLocked).map((c) => c.id);
            return Array.from(new Set([...parsed, ...lockedIds]));
          }
        }
      } catch {
        // Fall back to viewport tier default
      }
    }
    const tier = typeof window !== 'undefined' ? getViewportTier(window.innerWidth) : 'desktop';
    return getDefaultColumnsForTier(availableColumns, tier);
  });

  // 3. Listen to window resize events with debouncing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        setViewportWidth(width);
        const newTier = getViewportTier(width);

        // If user hasn't explicitly customized, automatically adapt columns to new tier
        if (!hasCustomPreference) {
          const tierDefaults = getDefaultColumnsForTier(availableColumns, newTier);
          setVisibleColumnsState(tierDefaults);
          if (onColumnsChange) onColumnsChange(tierDefaults);
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [availableColumns, hasCustomPreference, onColumnsChange]);

  // 4. Update visible columns explicitly (user action)
  const setVisibleColumns = useCallback((newCols) => {
    const lockedIds = availableColumns.filter((c) => c.isLocked).map((c) => c.id);
    const ensured = Array.from(new Set([...(Array.isArray(newCols) ? newCols : []), ...lockedIds]));

    setVisibleColumnsState(ensured);
    setHasCustomPreference(true);

    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(ensured));
      } catch {
        // ignore storage errors
      }
    }

    if (onColumnsChange) {
      onColumnsChange(ensured);
    }
  }, [availableColumns, storageKey, onColumnsChange]);

  // 5. Reset to current device's default columns
  const resetToDeviceDefault = useCallback(() => {
    const tierDefaults = getDefaultColumnsForTier(availableColumns, currentTier);
    setVisibleColumnsState(tierDefaults);
    setHasCustomPreference(false);

    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore storage errors
      }
    }

    if (onColumnsChange) {
      onColumnsChange(tierDefaults);
    }
  }, [availableColumns, currentTier, storageKey, onColumnsChange]);

  return {
    currentTier,
    viewportWidth,
    visibleColumns,
    setVisibleColumns,
    resetToDeviceDefault,
    hasCustomPreference,
    defaultColumnsForCurrentTier: useMemo(() => getDefaultColumnsForTier(availableColumns, currentTier), [availableColumns, currentTier])
  };
}
