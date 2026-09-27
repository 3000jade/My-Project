import { useState, useMemo, useEffect, useCallback } from 'react';
import { getPropertyCoordinates } from '../utils/propertyCoordinates';

export function usePropertyFilterEngine(initialProperties = []) {
  const [filters, setFilters] = useState({
    transactionType: 'For Sale',
    keyword: '',
    district: '',
    propertyType: '',
    minPrice: null,
    maxPrice: null,
    beds: '',
    baths: '',
    furnishing: '',
    floorLevel: '',
    financingTerms: [],
    communityRules: [],
    mapBounds: null, // { north, south, east, west }
  });

  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // Debounce keyword, price, and map bounds (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);
    return () => clearTimeout(handler);
  }, [filters]);

  // Main Filtering Logic
  const checkPropertyMatch = useCallback((property, activeFilters) => {
    // 1. Transaction Type
    if (activeFilters.transactionType && activeFilters.transactionType !== 'All') {
      const pTrans = (property.transactionType || property.listing_status || property.status || '').toLowerCase();
      const fTrans = activeFilters.transactionType.toLowerCase();
      if (!pTrans.includes(fTrans) && !(fTrans === 'for sale' && pTrans === 'buy') && !(fTrans === 'for rent' && pTrans === 'rent')) {
        return false;
      }
    }

    // 2. Keyword Search (Location, Name, Address)
    if (activeFilters.keyword && activeFilters.keyword.trim() !== '') {
      const q = activeFilters.keyword.toLowerCase().trim();
      const searchable = `${property.name || ''} ${property.location || ''} ${property.address || ''} ${property.city || ''} ${property.district || ''} ${property.title || ''}`.toLowerCase();
      if (!searchable.includes(q)) {
        return false;
      }
    }

    // 3. District / Quick Chip
    if (activeFilters.district && activeFilters.district !== 'All' && activeFilters.district !== 'All Metro Manila') {
      const d = activeFilters.district.toLowerCase();
      const loc = `${property.location || ''} ${property.city || ''} ${property.district || ''} ${property.address || ''}`.toLowerCase();
      if (!loc.includes(d)) {
        return false;
      }
    }

    // 4. Property Type
    if (activeFilters.propertyType && activeFilters.propertyType !== 'All' && activeFilters.propertyType !== 'All Types') {
      const pType = (property.propertyType || property.property_type || property.propertySubClass || '').toLowerCase();
      const fType = activeFilters.propertyType.toLowerCase();
      if (!pType.includes(fType)) {
        return false;
      }
    }

    // 5. Price Range
    const rawPrice = property.price_raw || Number(String(property.price || '').replace(/[^0-9.-]+/g, '')) || 0;
    if (activeFilters.minPrice !== null && activeFilters.minPrice !== undefined && activeFilters.minPrice !== '') {
      if (rawPrice < Number(activeFilters.minPrice)) return false;
    }
    if (activeFilters.maxPrice !== null && activeFilters.maxPrice !== undefined && activeFilters.maxPrice !== '') {
      if (rawPrice > Number(activeFilters.maxPrice)) return false;
    }

    // 6. Beds
    if (activeFilters.beds && activeFilters.beds !== 'Any') {
      const pBeds = property.beds !== undefined ? Number(property.beds) : (property.bedrooms ? Number(property.bedrooms) : 0);
      if (activeFilters.beds === 'Studio') {
        if (pBeds > 1) return false;
      } else if (activeFilters.beds === '4+' || activeFilters.beds === '5+') {
        if (pBeds < 4) return false;
      } else {
        const requiredBeds = Number(activeFilters.beds);
        if (pBeds !== requiredBeds) return false;
      }
    }

    // 7. Baths
    if (activeFilters.baths && activeFilters.baths !== 'Any') {
      const pBaths = property.baths !== undefined ? Number(property.baths) : (property.bathrooms ? Number(property.bathrooms) : 0);
      const reqBaths = Number(String(activeFilters.baths).replace(/[^0-9]/g, ''));
      if (pBaths < reqBaths) return false;
    }

    // 8. Furnishing
    if (activeFilters.furnishing && activeFilters.furnishing !== 'Any') {
      const pFurn = (property.furnishing || '').toLowerCase();
      if (!pFurn.includes(activeFilters.furnishing.toLowerCase())) return false;
    }

    // 9. Floor Level
    if (activeFilters.floorLevel && activeFilters.floorLevel !== 'Any') {
      const pFloor = (property.floorLevel || property.floor_level || '').toLowerCase();
      if (!pFloor.includes(activeFilters.floorLevel.toLowerCase())) return false;
    }

    // 10. Financing Terms (Array check)
    if (activeFilters.financingTerms && activeFilters.financingTerms.length > 0) {
      const pTerms = Array.isArray(property.financingTerms) 
        ? property.financingTerms.map(t => t.toLowerCase())
        : (property.payment_methods ? property.payment_methods.map(t => t.toLowerCase()) : []);
      const matchesAny = activeFilters.financingTerms.some(term => 
        pTerms.some(pt => pt.includes(term.toLowerCase()))
      );
      if (!matchesAny) return false;
    }

    // 11. Community Rules & Lifestyle (Array check)
    if (activeFilters.communityRules && activeFilters.communityRules.length > 0) {
      const pRules = Array.isArray(property.communityRules) 
        ? property.communityRules.map(r => r.toLowerCase())
        : [];
      const pAmenities = Array.isArray(property.amenities)
        ? property.amenities.map(a => a.toLowerCase())
        : [];
      const combined = [...pRules, ...pAmenities, (property.pet_policy || '').toLowerCase(), (property.terrain || '').toLowerCase()];

      const matchesAll = activeFilters.communityRules.every(rule => 
        combined.some(c => c.includes(rule.toLowerCase()))
      );
      if (!matchesAll) return false;
    }

    // 12. Geographic Bounding Box (Map Viewport Sync)
    if (activeFilters.mapBounds) {
      const coords = getPropertyCoordinates(property);
      const { north, south, east, west } = activeFilters.mapBounds;
      if (coords.lat < south || coords.lat > north || coords.lng < west || coords.lng > east) {
        return false;
      }
    }

    return true;
  }, []);

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return initialProperties.filter(property => checkPropertyMatch(property, debouncedFilters));
  }, [initialProperties, debouncedFilters, checkPropertyMatch]);

  // Facet Counts for All Filter Criteria
  const facets = useMemo(() => {
    const counts = {
      transactionType: {},
      propertyType: {},
      beds: {},
      bedrooms: {},
      status: {},
      furnishing: {},
      floorLevel: {},
      financingTerms: {},
      communityRules: {}
    };

    initialProperties.forEach(p => {
      // Transaction
      const t = p.transactionType || 'For Sale';
      counts.transactionType[t] = (counts.transactionType[t] || 0) + 1;

      // Status
      if (p.status) {
        counts.status[p.status] = (counts.status[p.status] || 0) + 1;
      }

      // Property Type
      const pt = p.propertyType || p.propertySubClass || 'Condominium';
      counts.propertyType[pt] = (counts.propertyType[pt] || 0) + 1;

      // Beds / Bedrooms
      const b = p.beds !== undefined ? String(p.beds) : (p.bedrooms !== undefined ? String(p.bedrooms) : '1');
      counts.beds[b] = (counts.beds[b] || 0) + 1;
      counts.bedrooms[b] = (counts.bedrooms[b] || 0) + 1;

      // Furnishing
      if (p.furnishing) counts.furnishing[p.furnishing] = (counts.furnishing[p.furnishing] || 0) + 1;

      // Floor Level
      if (p.floorLevel) counts.floorLevel[p.floorLevel] = (counts.floorLevel[p.floorLevel] || 0) + 1;

      // Financing
      const fTerms = p.financingTerms || p.payment_methods || [];
      fTerms.forEach(term => {
        counts.financingTerms[term] = (counts.financingTerms[term] || 0) + 1;
      });

      // Community Rules
      const cRules = p.communityRules || [];
      cRules.forEach(rule => {
        counts.communityRules[rule] = (counts.communityRules[rule] || 0) + 1;
      });
    });

    return counts;
  }, [initialProperties]);

  // Marginal Gain Analysis for Empty State
  const tightestFilter = useMemo(() => {
    if (filteredProperties.length > 0) return null;

    let bestKey = null;
    let bestCount = 0;
    let filterLabel = '';

    const testableKeys = [
      { key: 'maxPrice', label: 'Clear price ceiling' },
      { key: 'minPrice', label: 'Clear minimum price' },
      { key: 'beds', label: 'Clear bedroom count' },
      { key: 'district', label: 'Clear district location' },
      { key: 'keyword', label: 'Clear search keyword' },
      { key: 'communityRules', label: 'Relax community rules' },
      { key: 'financingTerms', label: 'Relax financing requirements' },
      { key: 'mapBounds', label: 'Expand map boundary' },
      { key: 'furnishing', label: 'Clear turnover condition' }
    ];

    testableKeys.forEach(({ key, label }) => {
      if (debouncedFilters[key] && (!Array.isArray(debouncedFilters[key]) || debouncedFilters[key].length > 0)) {
        const relaxed = { ...debouncedFilters, [key]: Array.isArray(debouncedFilters[key]) ? [] : null };
        const recoveredCount = initialProperties.filter(p => checkPropertyMatch(p, relaxed)).length;
        if (recoveredCount > bestCount) {
          bestCount = recoveredCount;
          bestKey = key;
          filterLabel = label;
        }
      }
    });

    if (bestKey && bestCount > 0) {
      return {
        key: bestKey,
        label: filterLabel,
        recoveredCount: bestCount
      };
    }

    return null;
  }, [filteredProperties, debouncedFilters, initialProperties, checkPropertyMatch]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.district) count++;
    if (filters.propertyType) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.beds && filters.beds !== 'Any') count++;
    if (filters.baths && filters.baths !== 'Any') count++;
    if (filters.furnishing && filters.furnishing !== 'Any') count++;
    if (filters.floorLevel && filters.floorLevel !== 'Any') count++;
    if (filters.financingTerms && filters.financingTerms.length > 0) count += filters.financingTerms.length;
    if (filters.communityRules && filters.communityRules.length > 0) count += filters.communityRules.length;
    return count;
  }, [filters]);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      transactionType: 'For Sale',
      keyword: '',
      district: '',
      propertyType: '',
      minPrice: null,
      maxPrice: null,
      beds: '',
      baths: '',
      furnishing: '',
      floorLevel: '',
      financingTerms: [],
      communityRules: [],
      mapBounds: null,
    });
  }, []);

  const clearSpecificFilter = useCallback((key) => {
    setFilters(prev => {
      if (Array.isArray(prev[key])) {
        return { ...prev, [key]: [] };
      }
      return { ...prev, [key]: key === 'transactionType' ? 'For Sale' : null };
    });
  }, []);

  return {
    filteredProperties,
    facets,
    filters,
    debouncedFilters,
    activeFilterCount,
    tightestFilter,
    setFilter,
    clearFilters,
    clearSpecificFilter
  };
}
