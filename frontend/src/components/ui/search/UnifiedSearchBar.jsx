import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mapsService } from '../../../services/mapsService';

const DISTRICT_PRESETS = [
  { name: 'All Metro Manila', lat: 14.5547, lng: 121.0350, zoom: 12 },
  { name: 'BGC / Taguig', lat: 14.5505, lng: 121.0478, zoom: 14 },
  { name: 'Makati', lat: 14.5547, lng: 121.0244, zoom: 14 },
  { name: 'Ortigas / Pasig', lat: 14.5866, lng: 121.0827, zoom: 14 },
  { name: 'Ayala Alabang', lat: 14.4239, lng: 121.0264, zoom: 13 },
  { name: 'Greenhills', lat: 14.6015, lng: 121.0420, zoom: 14 },
  { name: 'Quezon City', lat: 14.6500, lng: 121.0500, zoom: 13 },
];

const PRICE_PRESETS = [
  { label: '< ₱5M', min: null, max: 5000000 },
  { label: '₱5M - ₱15M', min: 5000000, max: 15000000 },
  { label: '₱15M - ₱50M', min: 15000000, max: 50000000 },
  { label: '> ₱50M', min: 50000000, max: null }
];

const BED_OPTIONS = ['Any', 'Studio', '1', '2', '3', '4+'];

export default function UnifiedSearchBar({
  filters,
  setFilter,
  onOpenFiltersDrawer,
  activeFilterCount = 0,
  viewMode = 'split',
  setViewMode,
  onFlyToDistrict,
  isSticky = false
}) {
  const [showPricePopover, setShowPricePopover] = useState(false);
  const pricePopoverRef = useRef(null);

  // Nominatim Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef(null);

  // Close price popover and suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (pricePopoverRef.current && !pricePopoverRef.current.contains(e.target)) {
        setShowPricePopover(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    if (showPricePopover || showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPricePopover, showSuggestions]);

  // Debounced fetch for Nominatim OSM predictive autocomplete
  useEffect(() => {
    const query = (filters.keyword || '').trim();
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const results = await mapsService.autocomplete(query, 'ph');
        setSuggestions(results || []);
        if (results && results.length > 0) {
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('[UnifiedSearchBar] Autocomplete error:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.keyword]);

  const handleSelectSuggestion = (item) => {
    const text = item.mainText || item.description;
    setFilter('keyword', text);
    setShowSuggestions(false);
    setHighlightedIndex(-1);

    if (onFlyToDistrict && item.latitude && item.longitude) {
      onFlyToDistrict({
        name: text,
        lat: item.latitude,
        lng: item.longitude,
        zoom: 15,
      });
    }
  };

  const handleSearchKeyDown = async (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setShowSuggestions(true);
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setShowSuggestions(true);
        setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      }
    } else if (e.key === 'Enter') {
      if (showSuggestions && highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else if (showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[0]);
      } else if (filters.keyword && filters.keyword.trim().length > 1) {
        // Fallback: Geocode on explicit Enter key submission if no item picked
        setShowSuggestions(false);
        try {
          const geocodeRes = await mapsService.geocode(filters.keyword.trim(), 'ph');
          if (geocodeRes && geocodeRes.latitude && geocodeRes.longitude && onFlyToDistrict) {
            onFlyToDistrict({
              name: filters.keyword.trim(),
              lat: geocodeRes.latitude,
              lng: geocodeRes.longitude,
              zoom: 15,
            });
          }
        } catch {
          // ignore
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleDistrictClick = (preset) => {
    if (preset.name === 'All Metro Manila') {
      setFilter('district', '');
      setFilter('mapBounds', null);
    } else {
      setFilter('district', preset.name);
    }
    if (onFlyToDistrict) {
      onFlyToDistrict(preset);
    }
  };

  const getPriceLabel = () => {
    if (!filters.minPrice && !filters.maxPrice) return 'Price Range';
    if (filters.minPrice && !filters.maxPrice) return `> ₱${(filters.minPrice / 1000000).toFixed(0)}M`;
    if (!filters.minPrice && filters.maxPrice) return `< ₱${(filters.maxPrice / 1000000).toFixed(0)}M`;
    return `₱${(filters.minPrice / 1000000).toFixed(0)}M - ₱${(filters.maxPrice / 1000000).toFixed(0)}M`;
  };

  return (
    <div
      className={`w-full transition-all duration-300 ${isSticky
          ? 'bg-white/95 backdrop-blur-2xl shadow-sm border-b border-gray-200/80 py-3 px-4 md:px-8 lg:px-12'
          : 'bg-white rounded-3xl shadow-sm border border-gray-200/80 p-4 md:p-6'
        }`}
    >
      {/* Upper Row: Transaction Mode + Search Input + Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Transaction Mode Segmented Pill */}
        <div className="flex items-center bg-gray-100/90 p-1 rounded-2xl border border-gray-200/60 self-start lg:self-auto flex-shrink-0">
          {['All', 'For Sale', 'For Rent', 'Pre-Selling'].map((type) => {
            const isSelected = (filters.transactionType || 'All') === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilter('transactionType', type)}
                className={`px-4 h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${isSelected
                    ? 'bg-[#174849] text-white shadow-sm'
                    : 'text-gray-600 hover:text-[#174849]'
                  }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        {/* Location Search Input with Nominatim OSM Autocomplete */}
        <div className="relative flex-1 min-w-[220px]" ref={searchContainerRef}>
          <span className={`material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] pointer-events-none transition-colors ${
            isLoadingSuggestions ? 'text-[#E76F51] animate-spin' : 'text-gray-400'
          }`}>
            {isLoadingSuggestions ? 'progress_activity' : 'search'}
          </span>
          <input
            type="text"
            data-testid="unified-search-input"
            placeholder="Search City, District, or Residence (Nominatim OSM)..."
            value={filters.keyword || ''}
            onChange={(e) => setFilter('keyword', e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleSearchKeyDown}
            className="w-full h-[50px] pl-10 pr-9 bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-gray-200/80 focus:border-[#174849] focus:ring-1 focus:ring-[#174849] rounded-2xl text-xs font-semibold text-gray-800 placeholder-gray-400 outline-none transition-all"
          />
          {filters.keyword && (
            <button
              type="button"
              onClick={() => {
                setFilter('keyword', '');
                setShowSuggestions(false);
                setSuggestions([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Clear search"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}

          {/* Autocomplete Suggestions Dropdown Plinth */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                data-lenis-prevent="true"
                data-testid="nominatim-autocomplete-dropdown"
                className="absolute top-[56px] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200/90 py-2 z-[90] overflow-hidden"
              >
                {/* Header with OpenStreetMap telemetry */}
                <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-gray-100 bg-gray-50/60 text-[10px] font-mono uppercase tracking-wider text-gray-500">
                  <span className="flex items-center gap-1 font-bold text-[#174849]">
                    <span className="material-symbols-outlined text-[14px] text-[#E76F51]">explore</span>
                    OpenStreetMap Locations
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold">{suggestions.length} Found</span>
                </div>

                {/* Suggestions List */}
                <div className="max-h-[260px] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                  {suggestions.map((item, idx) => {
                    const isSelected = highlightedIndex === idx;
                    return (
                      <button
                        key={item.placeId || `${item.latitude}-${item.longitude}-${idx}`}
                        type="button"
                        data-testid={`autocomplete-item-${idx}`}
                        onClick={() => handleSelectSuggestion(item)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors cursor-pointer ${
                          isSelected ? 'bg-teal-50/70 text-[#174849]' : 'hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-lg ${isSelected ? 'bg-[#174849] text-white' : 'bg-gray-100 text-gray-500'}`}>
                          <span className="material-symbols-outlined text-[16px] block">location_on</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold truncate text-[#141717]">
                              {item.mainText || item.description}
                            </span>
                            {item.latitude && item.longitude && (
                              <span className="font-mono text-[9px] text-[#174849]/70 shrink-0 font-medium">
                                {Number(item.latitude).toFixed(2)}°, {Number(item.longitude).toFixed(2)}°
                              </span>
                            )}
                          </div>
                          {item.secondaryText && (
                            <p className="text-[11px] text-gray-500 truncate mt-0.5 font-normal">
                              {item.secondaryText}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer Attribution */}
                <div className="px-3.5 py-1.5 border-t border-gray-100 bg-gray-50/60 text-[9px] text-gray-400 flex items-center justify-between">
                  <span>© OpenStreetMap Contributors</span>
                  <span className="font-mono text-[#174849] font-bold">Nominatim Geocoder</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Property Type Dropdown */}
        <div className="relative flex-shrink-0 hidden md:block">
          <select
            value={filters.propertyType || 'All'}
            onChange={(e) => setFilter('propertyType', e.target.value)}
            className={`h-[50px] px-4 pr-10 rounded-2xl text-xs font-bold border flex items-center justify-between gap-2 transition-all cursor-pointer appearance-none ${
              filters.propertyType && filters.propertyType !== 'All'
                ? 'bg-[#174849]/5 border-[#174849] text-[#174849]'
                : 'bg-white hover:bg-gray-50 border-gray-200/80 text-gray-700'
            }`}
          >
            <option value="All">All Property Types</option>
            <option value="House">House</option>
            <option value="Condominium">Condominium</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Lot">Lot</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-gray-400 pointer-events-none">expand_more</span>
        </div>

        {/* Price Range Popover Button */}
        <div className="relative flex-shrink-0" ref={pricePopoverRef}>
          <button
            type="button"
            onClick={() => setShowPricePopover(!showPricePopover)}
            className={`h-[50px] px-4 rounded-2xl text-xs font-bold border flex items-center justify-between gap-2 transition-all cursor-pointer ${filters.minPrice || filters.maxPrice
                ? 'bg-[#174849]/5 border-[#174849] text-[#174849]'
                : 'bg-white hover:bg-gray-50 border-gray-200/80 text-gray-700'
              }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#174849]">payments</span>
              <span>{getPriceLabel()}</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-gray-400">expand_more</span>
          </button>

          {/* Interactive Price Popover Card */}
          <AnimatePresence>
            {showPricePopover && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="absolute top-[60px] left-0 md:right-0 md:left-auto w-80 bg-white rounded-2xl shadow-xl border border-gray-200/90 p-5 z-[80]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#174849]">Price Budget (PHP)</h4>
                  {(filters.minPrice || filters.maxPrice) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilter('minPrice', null);
                        setFilter('maxPrice', null);
                      }}
                      className="text-[11px] font-bold text-gray-400 hover:text-[#E76F51] cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Min Price</label>
                    <input
                      type="number"
                      placeholder="₱ 0"
                      value={filters.minPrice || ''}
                      onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-10 px-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#174849]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Max Price</label>
                    <input
                      type="number"
                      placeholder="Any"
                      value={filters.maxPrice || ''}
                      onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-10 px-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#174849]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Quick Select</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRICE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setFilter('minPrice', p.min);
                          setFilter('maxPrice', p.max);
                        }}
                        className="py-1.5 px-2 bg-gray-50 hover:bg-[#174849]/5 hover:text-[#174849] rounded-lg text-[11px] font-bold text-gray-600 transition-colors text-center border border-gray-100 cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bedroom Count Segment */}
        <div className="hidden xl:flex items-center bg-gray-100/90 p-1 rounded-2xl border border-gray-200/60 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 font-sans">Beds</span>
          {BED_OPTIONS.map((opt) => {
            const isSelected = (filters.beds || 'Any') === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setFilter('beds', opt === 'Any' ? '' : opt)}
                className={`px-3 h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer ${isSelected
                    ? 'bg-[#174849] text-white shadow-sm'
                    : 'text-gray-600 hover:text-[#174849]'
                  }`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* 'All Filters' Drawer Button */}
        <button
          type="button"
          onClick={onOpenFiltersDrawer}
          className={`h-[50px] px-4 rounded-2xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${activeFilterCount > 0
              ? 'bg-[#174849] text-white border-[#174849] shadow-md'
              : 'bg-white hover:bg-gray-50 border-gray-200/80 text-gray-700'
            }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#E76F51] text-white text-[10px] font-extrabold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View Mode Toggle: Split Map vs Grid */}
        {setViewMode && (
          <div className="hidden md:flex items-center bg-gray-100/90 p-1 rounded-2xl border border-gray-200/60 flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3.5 h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'split'
                  ? 'bg-white text-[#174849] shadow-sm'
                  : 'text-gray-500 hover:text-[#174849]'
                }`}
              title="Split Map View"
            >
              <span className="material-symbols-outlined text-[17px]">vertical_split</span>
              <span>Split Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3.5 h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer ${viewMode === 'grid'
                  ? 'bg-white text-[#174849] shadow-sm'
                  : 'text-gray-500 hover:text-[#174849]'
                }`}
              title="Grid Only View"
            >
              <span className="material-symbols-outlined text-[17px]">grid_view</span>
              <span>Grid View</span>
            </button>
          </div>
        )}
      </div>

      {/* Lower Row: Metro Manila Quick District Chips Bar */}
      <div className="mt-3 pt-3 border-t border-gray-100/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 whitespace-nowrap pl-1">
          Districts:
        </span>
        <div className="flex items-center gap-1.5">
          {DISTRICT_PRESETS.map((preset) => {
            const isSelected =
              preset.name === 'All Metro Manila'
                ? !filters.district
                : filters.district === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleDistrictClick(preset)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer ${isSelected
                    ? 'bg-[#174849] text-white border-[#174849] shadow-sm'
                    : 'bg-gray-50/80 text-gray-600 border-gray-200/80 hover:border-gray-300 hover:bg-gray-100'
                  }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
