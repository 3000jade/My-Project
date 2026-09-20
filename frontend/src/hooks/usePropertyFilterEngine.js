import { useState, useMemo, useEffect } from 'react';

export function usePropertyFilterEngine(initialProperties = []) {
  const [filters, setFilters] = useState({});
  const [debouncedFilters, setDebouncedFilters] = useState({});

  // 300ms debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);
    return () => clearTimeout(handler);
  }, [filters]);

  const filteredProperties = useMemo(() => {
    return initialProperties.filter(property => {
      for (const [key, value] of Object.entries(debouncedFilters)) {
        if (value !== undefined && value !== null && property[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }, [initialProperties, debouncedFilters]);

  const facets = useMemo(() => {
    const counts = {};
    
    initialProperties.forEach(property => {
      for (const key in property) {
        if (property[key] !== undefined && property[key] !== null && typeof property[key] !== 'object') {
          if (!counts[key]) {
            counts[key] = {};
          }
          const valStr = String(property[key]);
          counts[key][valStr] = (counts[key][valStr] || 0) + 1;
        }
      }
    });

    return counts;
  }, [initialProperties]);

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters({});

  return {
    filteredProperties,
    facets,
    filters,
    debouncedFilters,
    setFilter,
    clearFilters
  };
}
