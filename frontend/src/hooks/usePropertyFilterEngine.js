import { useState, useMemo, useEffect, useCallback } from 'react';

export function formatCompactPhp(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return '₱0';
  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    const formatted = Number.isInteger(millions) ? String(millions) : millions.toFixed(1).replace(/\.0$/, '');
    return `₱${formatted}M`;
  }
  if (num >= 1_000) {
    const thousands = num / 1_000;
    const formatted = Number.isInteger(thousands) ? String(thousands) : thousands.toFixed(1).replace(/\.0$/, '');
    return `₱${formatted}K`;
  }
  return `₱${num.toLocaleString('en-PH')}`;
}

const DEFAULT_FILTERS = {
  transactionType: 'All',
  keyword: '',
  location: '',
  propertyType: '',
  minPrice: null,
  maxPrice: null,
  beds: '',
  baths: '',
  parking: '',
  furnishing: '',
  banks: [],
};

export function usePropertyFilterEngine(initialProperties = [], options = {}) {
  const { skipClientKeywordFilter = false } = options;
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState(DEFAULT_FILTERS);

  // Debounce keyword and price typing (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);
    return () => clearTimeout(handler);
  }, [filters]);

  const checkPropertyMatch = useCallback((property, activeFilters) => {
    const custom = property.customResoAttributes || property.custom_reso_attributes || {};

    // 1. Transaction Type (Pre-Selling maps to property_condition / propertyStatus)
    if (activeFilters.transactionType && activeFilters.transactionType !== 'All') {
      const fTrans = activeFilters.transactionType.toLowerCase();
      if (fTrans === 'pre-selling' || fTrans === 'preselling') {
        const cond = String(
          property.property_condition ||
          property.propertyCondition ||
          property.specs?.propertyCondition ||
          custom.propertyStatus ||
          ''
        ).toLowerCase();
        if (!cond.includes('presell') && !cond.includes('pre-sell') && !cond.includes('under construction')) {
          return false;
        }
      } else {
        const pTrans = (
          property.transactionType ||
          property.transaction_type ||
          property.specs?.transactionType ||
          property.listing_status ||
          property.status ||
          ''
        ).toLowerCase();
        if (!pTrans.includes(fTrans) && !(fTrans === 'for sale' && pTrans === 'buy') && !(fTrans === 'for rent' && pTrans === 'rent')) {
          return false;
        }
      }
    }

    // 2. Keyword Search (skipped when Postgres search_public_properties_v2 already ran fuzzy/FTS search)
    if (!skipClientKeywordFilter && activeFilters.keyword && activeFilters.keyword.trim() !== '') {
      const tokens = activeFilters.keyword.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const searchable = `${property.name || ''} ${property.location || ''} ${property.address || ''} ${property.city || ''} ${property.barangay || ''} ${property.district || ''} ${property.subdivisionName || ''} ${property.building_name || ''} ${property.buildingName || ''} ${property.developer_name || ''} ${property.developerName || ''} ${property.title || ''} ${property.publicRemarks || property.public_remarks || ''}`.toLowerCase();
      if (!tokens.every((token) => searchable.includes(token))) {
        return false;
      }
    }

    // 3. Location Quick Chip
    const activeLocation = activeFilters.location || activeFilters.district || '';
    if (
      activeLocation &&
      activeLocation !== 'All' &&
      activeLocation !== 'All Locations' &&
      activeLocation !== 'All Metro Manila'
    ) {
      const target = activeLocation.toLowerCase();
      const subLocations = target.split('/').map((s) => s.trim().toLowerCase());
      const loc = `${property.location || ''} ${property.city || ''} ${property.state_or_province || ''} ${property.province || ''} ${property.district || ''} ${property.address || ''} ${property.subdivisionName || ''}`.toLowerCase();
      if (!subLocations.some((sub) => loc.includes(sub))) {
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

    // 5. Price Range (skip inverted bounds while inline warning is shown)
    const minNum = activeFilters.minPrice !== null && activeFilters.minPrice !== undefined && activeFilters.minPrice !== '' ? Number(activeFilters.minPrice) : null;
    const maxNum = activeFilters.maxPrice !== null && activeFilters.maxPrice !== undefined && activeFilters.maxPrice !== '' ? Number(activeFilters.maxPrice) : null;
    if (!(minNum !== null && maxNum !== null && minNum > maxNum)) {
      const rawPrice = property.price_raw || Number(String(property.price || '').replace(/[^0-9.-]+/g, '')) || 0;
      if (minNum !== null && rawPrice < minNum) return false;
      if (maxNum !== null && rawPrice > maxNum) return false;
    }

    // 6. Beds
    if (activeFilters.beds && activeFilters.beds !== 'Any') {
      const pBeds = property.beds !== undefined ? Number(property.beds) : (property.bedrooms ? Number(property.bedrooms) : 0);
      if (activeFilters.beds === 'Studio') {
        if (pBeds > 1) return false;
      } else if (String(activeFilters.beds).endsWith('+')) {
        const minBeds = parseInt(activeFilters.beds, 10);
        if (Number.isFinite(minBeds) && pBeds < minBeds) return false;
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

    // 8. Parking Slots (properties.parking_total)
    if (activeFilters.parking && activeFilters.parking !== 'Any') {
      const pParking = Number(property.parking_total ?? property.parkingTotal ?? property.specs?.parkingTotal ?? property.parking ?? 0);
      const reqParking = Number(String(activeFilters.parking).replace(/[^0-9]/g, ''));
      if (pParking < reqParking) return false;
    }

    // 9. Furnishing (properties.furnishing: None, Semi-Furnished, Fully Furnished)
    if (activeFilters.furnishing && activeFilters.furnishing !== 'Any') {
      const pFurnish = String(property.furnishing || custom.furnishing || '').toLowerCase();
      const targetFurnish = activeFilters.furnishing.toLowerCase();
      if (pFurnish !== targetFurnish) return false;
    }

    // 10. Partnered Banks (custom_reso_attributes.partneredBanks)
    if (Array.isArray(activeFilters.banks) && activeFilters.banks.length > 0) {
      const propBanks = Array.isArray(custom.partneredBanks)
        ? custom.partneredBanks.map((b) => String(typeof b === 'string' ? b : b?.bankName || '').toLowerCase())
        : [];
      const matchesAnyBank = activeFilters.banks.some((bank) => propBanks.includes(bank.toLowerCase()));
      if (!matchesAnyBank) return false;
    }

    return true;
  }, [skipClientKeywordFilter]);

  const filteredProperties = useMemo(() => {
    return initialProperties.filter((property) => checkPropertyMatch(property, debouncedFilters));
  }, [initialProperties, debouncedFilters, checkPropertyMatch]);

  const facets = useMemo(() => {
    const counts = {
      transactionType: {},
      propertyType: {},
      beds: {},
      bedrooms: {},
      furnishing: {},
      banks: {},
    };

    initialProperties.forEach((p) => {
      const custom = p.customResoAttributes || p.custom_reso_attributes || {};
      const t = p.transactionType || 'For Sale';
      counts.transactionType[t] = (counts.transactionType[t] || 0) + 1;

      const pt = p.propertyType || p.propertySubClass || 'Condominium';
      counts.propertyType[pt] = (counts.propertyType[pt] || 0) + 1;

      const b = p.beds !== undefined ? String(p.beds) : (p.bedrooms !== undefined ? String(p.bedrooms) : '1');
      counts.beds[b] = (counts.beds[b] || 0) + 1;
      counts.bedrooms[b] = (counts.bedrooms[b] || 0) + 1;

      if (p.furnishing) counts.furnishing[p.furnishing] = (counts.furnishing[p.furnishing] || 0) + 1;

      const bankList = Array.isArray(custom.partneredBanks) ? custom.partneredBanks : [];
      bankList.forEach((bank) => {
        const name = typeof bank === 'string' ? bank : bank?.bankName;
        if (name) counts.banks[name] = (counts.banks[name] || 0) + 1;
      });
    });

    return counts;
  }, [initialProperties]);

  const tightestFilter = useMemo(() => {
    if (filteredProperties.length > 0) return null;

    let bestKey = null;
    let bestCount = 0;
    let filterLabel = '';

    const testableKeys = [
      { key: 'maxPrice', label: 'Clear max budget' },
      { key: 'minPrice', label: 'Clear min budget' },
      { key: 'beds', label: 'Clear bedroom filter' },
      { key: 'baths', label: 'Clear bathroom filter' },
      { key: 'parking', label: 'Clear parking filter' },
      { key: 'furnishing', label: 'Clear furnishing filter' },
      { key: 'banks', label: 'Clear bank filter' },
      { key: 'location', label: 'Clear location filter' },
      { key: 'keyword', label: 'Clear search keyword' },
    ];

    testableKeys.forEach(({ key, label }) => {
      if (debouncedFilters[key] && (!Array.isArray(debouncedFilters[key]) || debouncedFilters[key].length > 0)) {
        const relaxed = { ...debouncedFilters, [key]: Array.isArray(debouncedFilters[key]) ? [] : null };
        const recoveredCount = initialProperties.filter((p) => checkPropertyMatch(p, relaxed)).length;
        if (recoveredCount > bestCount) {
          bestCount = recoveredCount;
          bestKey = key;
          filterLabel = label;
        }
      }
    });

    if (bestKey && bestCount > 0) {
      return { key: bestKey, label: filterLabel, recoveredCount: bestCount };
    }

    return null;
  }, [filteredProperties, debouncedFilters, initialProperties, checkPropertyMatch]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.transactionType && filters.transactionType !== 'All') count++;
    if (filters.keyword && filters.keyword.trim()) count++;
    if (filters.location) count++;
    if (filters.propertyType) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.beds && filters.beds !== 'Any') count++;
    if (filters.baths && filters.baths !== 'Any') count++;
    if (filters.parking && filters.parking !== 'Any') count++;
    if (filters.furnishing) count++;
    if (Array.isArray(filters.banks) && filters.banks.length > 0) count += filters.banks.length;
    return count;
  }, [filters]);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const clearSpecificFilter = useCallback((key, itemValue = null) => {
    setFilters((prev) => {
      if (Array.isArray(prev[key])) {
        if (itemValue !== null) {
          return { ...prev, [key]: prev[key].filter((v) => v !== itemValue) };
        }
        return { ...prev, [key]: [] };
      }
      if (key === 'transactionType') return { ...prev, transactionType: 'All' };
      if (key === 'minPrice' || key === 'maxPrice') return { ...prev, [key]: null };
      return { ...prev, [key]: '' };
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
    clearSpecificFilter,
  };
}
