import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconSearch, 
  IconMapPin, 
  IconHome, 
  IconCurrencyPeso, 
  IconBed, 
  IconAdjustmentsHorizontal, 
  IconLayoutGrid, 
  IconLayoutSidebar, 
  IconX, 
  IconChevronDown 
} from '@tabler/icons-react';
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
  const [showBedPopover, setShowBedPopover] = useState(false);
  const pricePopoverRef = useRef(null);
  const bedPopoverRef = useRef(null);

  // Nominatim Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef(null);

  // Close popovers and suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (pricePopoverRef.current && !pricePopoverRef.current.contains(e.target)) {
        setShowPricePopover(false);
      }
      if (bedPopoverRef.current && !bedPopoverRef.current.contains(e.target)) {
        setShowBedPopover(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    if (showPricePopover || showBedPopover || showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPricePopover, showBedPopover, showSuggestions]);

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
      className={`w-full transition-all duration-300 font-sans ${isSticky
        ? 'bg-white/95 backdrop-blur-2xl shadow-sm border-b border-[#E2E8F0] py-3 px-4 md:px-6'
        : 'bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-3 md:p-4'
      }`}
    >
      {/* Upper Row: Transaction Mode + Location Search + Core Dropdowns + View Switcher */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Transaction Mode Segmented Pill */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start lg:self-auto shrink-0 h-11">
          {['All', 'For Sale', 'For Rent', 'Pre-Selling'].map((type) => {
            const isSelected = (filters.transactionType || 'All') === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilter('transactionType', type)}
                className={`px-3.5 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${isSelected
                    ? 'bg-[#0F766E] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#0F766E]'
                  }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        {/* Location Search Input with Nominatim OSM Autocomplete */}
        <div className="relative flex-1 min-w-[200px]" ref={searchContainerRef}>
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center justify-center">
            {isLoadingSuggestions ? (
              <div className="w-4 h-4 border-2 border-slate-200 border-t-[#0F766E] rounded-full animate-spin" />
            ) : (
              <IconSearch size={16} stroke={2} className="text-slate-400" />
            )}
          </div>
          <input
            type="text"
            data-testid="unified-search-input"
            placeholder="Search location, district, or building (Nominatim OSM)..."
            value={filters.keyword || ''}
            onChange={(e) => setFilter('keyword', e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleSearchKeyDown}
            className="w-full h-11 pl-9 pr-8 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all"
          />
          {filters.keyword && (
            <button
              type="button"
              onClick={() => {
                setFilter('keyword', '');
                setShowSuggestions(false);
                setSuggestions([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              title="Clear search"
            >
              <IconX size={14} stroke={2} />
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
                className="absolute top-[48px] left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-[90] overflow-hidden"
              >
                {/* Header with OpenStreetMap telemetry */}
                <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-slate-100 bg-slate-50/80 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1 font-bold text-[#0F766E]">
                    <IconMapPin size={13} stroke={2} className="text-[#FF6B6B]" />
                    Locations
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold">{suggestions.length} Found</span>
                </div>

                {/* Suggestions List */}
                <div className="max-h-[260px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
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
                          isSelected ? 'bg-teal-50/70 text-[#0F766E]' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-lg ${isSelected ? 'bg-[#0F766E] text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <IconMapPin size={14} stroke={2} className="block" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold truncate text-slate-900">
                              {item.mainText || item.description}
                            </span>
                            {item.latitude && item.longitude && (
                              <span className="font-mono text-[9px] text-[#0F766E]/70 shrink-0 font-medium">
                                {Number(item.latitude).toFixed(2)}°, {Number(item.longitude).toFixed(2)}°
                              </span>
                            )}
                          </div>
                          {item.secondaryText && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                              {item.secondaryText}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer Attribution */}
                <div className="px-3.5 py-1.5 border-t border-slate-100 bg-slate-50/60 text-[9px] text-slate-400 flex items-center justify-between">
                  <span>© OpenStreetMap</span>
                  <span className="font-mono text-[#0F766E] font-semibold">Nominatim Geocoder</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Property Type Dropdown */}
        <div className="relative shrink-0">
          <div className="relative">
            <select
              value={filters.propertyType || 'All'}
              onChange={(e) => setFilter('propertyType', e.target.value)}
              className={`h-11 pl-9 pr-8 rounded-xl text-xs font-semibold border transition-all cursor-pointer appearance-none outline-none ${
                filters.propertyType && filters.propertyType !== 'All'
                  ? 'bg-teal-50/70 border-[#0F766E] text-[#0F766E]'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="All">All Property Types</option>
              <option value="House">House</option>
              <option value="Condominium">Condominium</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Lot">Lot</option>
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <IconHome size={15} stroke={2} className={filters.propertyType && filters.propertyType !== 'All' ? 'text-[#0F766E]' : 'text-slate-400'} />
            </div>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <IconChevronDown size={14} stroke={2} />
            </div>
          </div>
        </div>

        {/* Price Range Popover Button */}
        <div className="relative shrink-0" ref={pricePopoverRef}>
          <button
            type="button"
            onClick={() => setShowPricePopover(!showPricePopover)}
            className={`h-11 px-3.5 rounded-xl text-xs font-semibold border flex items-center justify-between gap-2 transition-all cursor-pointer ${
              filters.minPrice || filters.maxPrice
                ? 'bg-teal-50/70 border-[#0F766E] text-[#0F766E]'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <IconCurrencyPeso size={15} stroke={2} className={filters.minPrice || filters.maxPrice ? 'text-[#0F766E]' : 'text-slate-400'} />
              <span>{getPriceLabel()}</span>
            </div>
            <IconChevronDown size={14} stroke={2} className="text-slate-400" />
          </button>

          {/* Interactive Price Popover Card */}
          <AnimatePresence>
            {showPricePopover && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.16 }}
                className="absolute top-[48px] left-0 md:right-0 md:left-auto w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-[80]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">Price Budget (PHP)</h4>
                  {(filters.minPrice || filters.maxPrice) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilter('minPrice', null);
                        setFilter('maxPrice', null);
                      }}
                      className="text-[11px] font-semibold text-slate-400 hover:text-[#FF6B6B] cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Min Price</label>
                    <input
                      type="number"
                      placeholder="₱ 0"
                      value={filters.minPrice || ''}
                      onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#0F766E]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Max Price</label>
                    <input
                      type="number"
                      placeholder="Any"
                      value={filters.maxPrice || ''}
                      onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-[#0F766E]"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Quick Select</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRICE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setFilter('minPrice', p.min);
                          setFilter('maxPrice', p.max);
                        }}
                        className="py-1.5 px-2 bg-slate-50 hover:bg-teal-50 hover:text-[#0F766E] rounded-lg text-[11px] font-semibold text-slate-600 transition-colors text-center border border-slate-200/60 cursor-pointer"
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

        {/* Bedroom Popover (Clean compact popover replacing sprawling 6 buttons) */}
        <div className="relative shrink-0" ref={bedPopoverRef}>
          <button
            type="button"
            onClick={() => setShowBedPopover(!showBedPopover)}
            className={`h-11 px-3.5 rounded-xl text-xs font-semibold border flex items-center justify-between gap-2 transition-all cursor-pointer ${
              filters.beds && filters.beds !== 'Any'
                ? 'bg-teal-50/70 border-[#0F766E] text-[#0F766E]'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <IconBed size={15} stroke={2} className={filters.beds && filters.beds !== 'Any' ? 'text-[#0F766E]' : 'text-slate-400'} />
              <span>{filters.beds && filters.beds !== 'Any' ? `${filters.beds} Beds` : 'Bedrooms'}</span>
            </div>
            <IconChevronDown size={14} stroke={2} className="text-slate-400" />
          </button>

          <AnimatePresence>
            {showBedPopover && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[48px] left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-[80]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">Bedrooms</h4>
                  {filters.beds && filters.beds !== 'Any' && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilter('beds', '');
                        setShowBedPopover(false);
                      }}
                      className="text-[11px] font-semibold text-slate-400 hover:text-[#FF6B6B] cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {BED_OPTIONS.map((opt) => {
                    const isSelected = (filters.beds || 'Any') === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setFilter('beds', opt === 'Any' ? '' : opt);
                          setShowBedPopover(false);
                        }}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-[#0F766E] text-white shadow-2xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                        }`}
                      >
                        {opt === 'Any' ? 'Any' : opt === 'Studio' ? 'Studio' : `${opt} Bed${opt === '1' ? '' : 's'}`}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 'All Filters' Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenFiltersDrawer}
          className={`h-11 px-3.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            activeFilterCount > 0
              ? 'bg-teal-50 border-[#0F766E] text-[#0F766E] shadow-2xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <IconAdjustmentsHorizontal size={15} stroke={2} className={activeFilterCount > 0 ? 'text-[#0F766E]' : 'text-slate-500'} />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#FF6B6B] text-white text-[10px] font-extrabold flex items-center justify-center ml-0.5">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* View Mode Toggle: Split Map vs Grid View */}
        {setViewMode && (
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0 h-11">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white text-[#0F766E] shadow-2xs'
                  : 'text-slate-500 hover:text-[#0F766E]'
              }`}
              title="Split Map View"
            >
              <IconLayoutSidebar size={15} stroke={2} />
              <span>Split Map</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                setFilter('mapBounds', null);
              }}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#0F766E] shadow-2xs'
                  : 'text-slate-500 hover:text-[#0F766E]'
              }`}
              title="Grid Only View"
            >
              <IconLayoutGrid size={15} stroke={2} />
              <span>Grid View</span>
            </button>
          </div>
        )}
      </div>

      {/* Lower Row: Clean Horizontal District Scroller */}
      <div className="flex items-center gap-2 pt-2.5 mt-2.5 border-t border-slate-100 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 pl-0.5">
          <IconMapPin size={13} stroke={2} className="text-[#0F766E]" />
          <span>Districts:</span>
        </div>
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
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F766E] text-white border-[#0F766E] shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
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
