import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Home,
  Banknote,
  BedDouble,
  SlidersHorizontal,
  LayoutGrid,
  PanelRight,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { mapsService } from '../../../services/mapsService';

const PRICE_PRESETS = [
  { label: '< ₱5M', min: null, max: 5000000 },
  { label: '₱5M - ₱15M', min: 5000000, max: 15000000 },
  { label: '₱15M - ₱50M', min: 15000000, max: 50000000 },
  { label: '> ₱50M', min: 50000000, max: null },
];

const PROPERTY_TYPE_OPTIONS = [
  { value: 'All', label: 'All Property Types' },
  { value: 'House', label: 'House' },
  { value: 'Condominium', label: 'Condominium' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Lot', label: 'Lot' },
];

const BED_OPTIONS = ['Any', 'Studio', '1', '2', '3', '4+'];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 motion-reduce:transition-none';

export default function UnifiedSearchBar({
  filters,
  setFilter,
  onOpenFiltersDrawer,
  activeFilterCount = 0,
  viewMode = 'split',
  setViewMode,
  availableLocations = [],
  onFlyToLocation,
  onFlyToDistrict,
  isSticky = false,
  defaultCollapsed = false,
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showPricePopover, setShowPricePopover] = useState(false);
  const [showBedPopover, setShowBedPopover] = useState(false);

  // Nominatim Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef(null);

  const flyToLocation = onFlyToLocation || onFlyToDistrict;
  const activeLocation = filters.location || filters.district || '';

  // Close autocomplete suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

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

    if (flyToLocation && item.latitude && item.longitude) {
      flyToLocation({
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
          if (geocodeRes && geocodeRes.latitude && geocodeRes.longitude && flyToLocation) {
            flyToLocation({
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

  const handleLocationClick = (loc) => {
    if (!loc || loc.name === 'All Locations') {
      setFilter('location', '');
      setFilter('mapBounds', null);
      if (flyToLocation) {
        flyToLocation({ name: 'All Locations', lat: 14.5547, lng: 121.035, zoom: 12 });
      }
      return;
    }

    setFilter('location', loc.name);
    if (flyToLocation && loc.lat && loc.lng) {
      flyToLocation({
        name: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        zoom: loc.zoom || 13,
      });
    }
  };

  const getPriceLabel = () => {
    if (!filters.minPrice && !filters.maxPrice) return 'Price Range';
    if (filters.minPrice && !filters.maxPrice) return `> ₱${(filters.minPrice / 1000000).toFixed(0)}M`;
    if (!filters.minPrice && filters.maxPrice) return `< ₱${(filters.maxPrice / 1000000).toFixed(0)}M`;
    return `₱${(filters.minPrice / 1000000).toFixed(0)}M - ₱${(filters.maxPrice / 1000000).toFixed(0)}M`;
  };

  const selectedPropertyType = filters.propertyType || 'All';
  const selectedPropertyTypeLabel =
    PROPERTY_TYPE_OPTIONS.find((opt) => opt.value === selectedPropertyType)?.label ||
    selectedPropertyType;
  const hasPriceFilter = Boolean(filters.minPrice || filters.maxPrice);
  const hasBedFilter = Boolean(filters.beds && filters.beds !== 'Any');

  return (
    <div
      className={`w-full transition-colors font-sans ${isSticky
        ? 'bg-surface/95 backdrop-blur-md shadow-xs border-b border-outline py-3 px-4 md:px-6'
        : 'bg-surface rounded-xl shadow-xs border border-outline p-3 md:p-4'
      }`}
    >
      {/* Upper Row: Transaction Mode + Location Search + Core Dropdowns + View Switcher */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 flex-wrap xl:flex-nowrap">
        {/* Transaction Mode Segmented Pill */}
        <div className="flex items-center bg-surface-variant p-1 rounded-lg border border-outline self-start lg:self-auto shrink-0 h-11 max-w-full overflow-x-auto no-scrollbar">
          {['All', 'For Sale', 'For Rent', 'Pre-Selling'].map((type) => {
            const isSelected = (filters.transactionType || 'All') === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilter('transactionType', type)}
                className={`px-3 h-9 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${FOCUS_RING} ${isSelected
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        {/* Location Search Input with Nominatim OSM Autocomplete */}
        <div className="relative flex-1 min-w-40 w-full lg:w-auto" ref={searchContainerRef}>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant flex items-center justify-center">
            {isLoadingSuggestions ? (
              <div className="size-4 border-2 border-outline border-t-primary rounded-full animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
          </div>
          <input
            type="text"
            data-testid="unified-search-input"
            placeholder="Search city, barangay, building, or keyword..."
            value={filters.keyword || ''}
            onChange={(e) => setFilter('keyword', e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleSearchKeyDown}
            className={`w-full h-11 pl-9 pr-9 bg-background hover:bg-surface-variant/60 focus:bg-surface border border-outline rounded-lg text-sm font-normal text-on-surface placeholder:text-on-surface-variant transition-colors ${FOCUS_RING}`}
          />
          {filters.keyword && (
            <button
              type="button"
              onClick={() => {
                setFilter('keyword', '');
                setShowSuggestions(false);
                setSuggestions([]);
              }}
              aria-label="Clear search"
              title="Clear search"
              className={`absolute right-2 top-1/2 -translate-y-1/2 size-7 rounded-md flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant cursor-pointer transition-colors ${FOCUS_RING}`}
            >
              <X className="size-4" />
            </button>
          )}

          {/* Autocomplete Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                data-lenis-prevent="true"
                data-testid="nominatim-autocomplete-dropdown"
                className="absolute top-12 left-0 right-0 bg-surface rounded-xl shadow-md border border-outline py-2 z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-outline bg-background text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <MapPin className="size-3.5 text-accent" />
                    Locations
                  </span>
                  <span className="tabular-nums">{suggestions.length} Found</span>
                </div>

                <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-outline">
                  {suggestions.map((item, idx) => {
                    const isSelected = highlightedIndex === idx;
                    return (
                      <button
                        key={item.placeId || `${item.latitude}-${item.longitude}-${idx}`}
                        type="button"
                        data-testid={`autocomplete-item-${idx}`}
                        onClick={() => handleSelectSuggestion(item)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors cursor-pointer ${FOCUS_RING} ${
                          isSelected ? 'bg-tertiary-container/60 text-primary' : 'hover:bg-background text-on-surface'
                        }`}
                      >
                        <div className={`mt-0.5 p-1 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-surface-variant text-on-surface-variant'}`}>
                          <MapPin className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold truncate text-on-surface">
                              {item.mainText || item.description}
                            </span>
                            {item.latitude && item.longitude && (
                              <span className="text-xs tabular-nums text-primary/80 shrink-0">
                                {Number(item.latitude).toFixed(2)}°, {Number(item.longitude).toFixed(2)}°
                              </span>
                            )}
                          </div>
                          {item.secondaryText && (
                            <p className="text-xs text-on-surface-variant truncate mt-0.5">
                              {item.secondaryText}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="px-4 py-2 border-t border-outline bg-background text-xs text-on-surface-variant flex items-center justify-between">
                  <span>© OpenStreetMap</span>
                  <span className="text-primary font-medium">Nominatim Geocoder</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isCollapsed && (
          <>
            {/* Property Type Dropdown (shadcn/ui Select — portaled at z-50) */}
            <div className="shrink-0">
              <Select
                value={selectedPropertyType}
                onValueChange={(val) => setFilter('propertyType', val === 'All' ? '' : val)}
              >
                <SelectTrigger
                  aria-label="Property Type"
                  className={`h-11 data-[size=default]:h-11 px-3.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer gap-2 ${FOCUS_RING} ${
                    selectedPropertyType !== 'All'
                      ? 'bg-tertiary-container/60 border-primary text-primary'
                      : 'bg-surface hover:bg-surface-variant border-outline text-on-surface'
                  }`}
                >
                  <Home
                    className={`size-4 shrink-0 ${
                      selectedPropertyType !== 'All' ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  />
                  <SelectValue>{selectedPropertyTypeLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  align="center"
                  sideOffset={8}
                  alignItemWithTrigger={false}
                  className="rounded-xl border border-outline bg-surface text-on-surface shadow-md"
                >
                  {PROPERTY_TYPE_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="rounded-lg text-sm cursor-pointer"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Popover (shadcn/ui Popover — portaled at z-50) */}
            <div className="shrink-0">
              <Popover open={showPricePopover} onOpenChange={setShowPricePopover}>
                <PopoverTrigger
                  type="button"
                  className={`h-11 px-3.5 rounded-lg text-xs font-semibold border flex items-center justify-between gap-2 transition-colors cursor-pointer ${FOCUS_RING} ${
                    hasPriceFilter
                      ? 'bg-tertiary-container/60 border-primary text-primary'
                      : 'bg-surface hover:bg-surface-variant border-outline text-on-surface'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Banknote
                      className={`size-4 shrink-0 ${
                        hasPriceFilter ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    />
                    <span>{getPriceLabel()}</span>
                  </span>
                  <ChevronDown className="size-4 text-on-surface-variant" />
                </PopoverTrigger>

                <PopoverContent
                  side="bottom"
                  align="center"
                  sideOffset={8}
                  className="w-80 rounded-xl border border-outline bg-surface p-4 text-on-surface shadow-md ring-0 gap-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Price Budget (PHP)
                    </h4>
                    {hasPriceFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter('minPrice', null);
                          setFilter('maxPrice', null);
                        }}
                        className={`text-xs font-medium text-on-surface-variant hover:text-accent cursor-pointer rounded-sm px-1 ${FOCUS_RING}`}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-on-surface-variant block mb-1">
                        Min Price
                      </label>
                      <input
                        type="number"
                        placeholder="₱ 0"
                        value={filters.minPrice || ''}
                        onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
                        className={`w-full h-10 px-3 bg-surface border border-outline rounded-lg text-sm font-medium text-on-surface placeholder:text-on-surface-variant tabular-nums ${FOCUS_RING}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-on-surface-variant block mb-1">
                        Max Price
                      </label>
                      <input
                        type="number"
                        placeholder="Any"
                        value={filters.maxPrice || ''}
                        onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
                        className={`w-full h-10 px-3 bg-surface border border-outline rounded-lg text-sm font-medium text-on-surface placeholder:text-on-surface-variant tabular-nums ${FOCUS_RING}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-outline">
                    <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant block">
                      Quick Select
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {PRICE_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setFilter('minPrice', p.min);
                            setFilter('maxPrice', p.max);
                          }}
                          className={`min-h-10 py-2 px-3 bg-surface-variant hover:bg-tertiary-container hover:text-primary rounded-lg text-xs font-semibold text-on-surface transition-colors text-center border border-outline cursor-pointer tabular-nums ${FOCUS_RING}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Bedrooms Popover (shadcn/ui Popover — portaled at z-50) */}
            <div className="shrink-0">
              <Popover open={showBedPopover} onOpenChange={setShowBedPopover}>
                <PopoverTrigger
                  type="button"
                  className={`h-11 px-3.5 rounded-lg text-xs font-semibold border flex items-center justify-between gap-2 transition-colors cursor-pointer ${FOCUS_RING} ${
                    hasBedFilter
                      ? 'bg-tertiary-container/60 border-primary text-primary'
                      : 'bg-surface hover:bg-surface-variant border-outline text-on-surface'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BedDouble
                      className={`size-4 shrink-0 ${
                        hasBedFilter ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    />
                    <span>{hasBedFilter ? `${filters.beds} Beds` : 'Bedrooms'}</span>
                  </span>
                  <ChevronDown className="size-4 text-on-surface-variant" />
                </PopoverTrigger>

                <PopoverContent
                  side="bottom"
                  align="center"
                  sideOffset={8}
                  className="w-64 rounded-xl border border-outline bg-surface p-4 text-on-surface shadow-md ring-0 gap-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Bedrooms
                    </h4>
                    {hasBedFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilter('beds', '');
                          setShowBedPopover(false);
                        }}
                        className={`text-xs font-medium text-on-surface-variant hover:text-accent cursor-pointer rounded-sm px-1 ${FOCUS_RING}`}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
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
                          className={`min-h-10 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center border ${FOCUS_RING} ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'bg-surface-variant hover:border-outline-variant text-on-surface border-outline'
                          }`}
                        >
                          {opt === 'Any' ? 'Any' : opt === 'Studio' ? 'Studio' : `${opt} Bed${opt === '1' ? '' : 's'}`}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}

        {/* Right Action Cluster: Collapse/Expand + All Filters Drawer */}
        <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end sm:justify-start">
          <button
            type="button"
            data-testid="search-bar-collapse-toggle"
            aria-expanded={!isCollapsed}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Filters & Locations' : 'Collapse to compact bar'}
            className={`flex-1 sm:flex-none h-11 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${FOCUS_RING} ${
              isCollapsed
                ? 'bg-tertiary-container/60 border-primary text-primary'
                : 'bg-surface hover:bg-surface-variant border-outline text-on-surface-variant'
            }`}
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="size-4" />
                <span>Expand</span>
              </>
            ) : (
              <>
                <ChevronUp className="size-4" />
                <span>Compact</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenFiltersDrawer}
            className={`flex-1 sm:flex-none h-11 px-3.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${FOCUS_RING} ${
              activeFilterCount > 0
                ? 'bg-tertiary-container/60 border-primary text-primary shadow-xs'
                : 'bg-surface hover:bg-surface-variant border-outline text-on-surface'
            }`}
          >
            <SlidersHorizontal
              className={`size-4 ${activeFilterCount > 0 ? 'text-primary' : 'text-on-surface-variant'}`}
            />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="size-5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* View Mode Toggle: Split Map vs Grid View */}
        {setViewMode && (
          <div className="hidden lg:flex items-center bg-surface-variant p-1 rounded-lg border border-outline shrink-0 h-11 ml-auto">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-semibold transition-colors cursor-pointer ${FOCUS_RING} ${
                viewMode === 'split'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              title="Split Map View"
            >
              <PanelRight className="size-4" />
              <span className="hidden 2xl:inline">Split Map</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                setFilter('mapBounds', null);
              }}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-semibold transition-colors cursor-pointer ${FOCUS_RING} ${
                viewMode === 'grid'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
              title="Grid Only View"
            >
              <LayoutGrid className="size-4" />
              <span className="hidden 2xl:inline">Grid View</span>
            </button>
          </div>
        )}
      </div>

      {/* Lower Row: Dynamic Database Location Scroller */}
      {!isCollapsed && (
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-outline overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 text-xs font-medium text-on-surface-variant uppercase tracking-wider shrink-0">
            <MapPin className="size-3.5 text-primary" />
            <span>Location:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleLocationClick({ name: 'All Locations' })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer ${FOCUS_RING} ${
                !activeLocation
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
              }`}
            >
              All Locations
            </button>
            {availableLocations.map((loc) => {
              const isSelected = activeLocation.toLowerCase() === loc.name.toLowerCase();
              return (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => handleLocationClick(loc)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer ${FOCUS_RING} ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
                  }`}
                >
                  {loc.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
