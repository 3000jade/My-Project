import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  DollarSign,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { COMMON_PROPERTY_TYPES } from '../../pages/portals/broker/BrokerPropertyTypeSelect';

export default function PropertyFilterToolbar({
  search = '',
  onSearchChange,
  statusTab = 'ALL',
  onStatusTabChange,
  statusCounts = {},
  selectedType = 'ALL',
  onTypeChange,
  propertyTypeOptions,
  selectedLocation = 'ALL',
  onLocationChange,
  locationOptions = [],
  priceRange = { min: '', max: '' },
  onPriceRangeChange,
  sortBy = 'newest',
  onSortByChange,
  onResetFilters,
  totalCount = 0,
  filteredCount = 0,
}) {
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const pricePopoverRef = useRef(null);

  // Close price popover on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (pricePopoverRef.current && !pricePopoverRef.current.contains(e.target)) {
        setIsPriceOpen(false);
      }
    }
    if (isPriceOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPriceOpen]);

  const resolvedTypeOptions =
    propertyTypeOptions && propertyTypeOptions.length > 0
      ? propertyTypeOptions
      : (COMMON_PROPERTY_TYPES?.map((t) => t.name) || [
          'Condominium',
          'House & Lot',
          'Townhouse',
          'Lot / Land',
          'Commercial',
          'Apartment',
          'Villa',
          'Warehouse',
        ]);

  const statusTabs = [
    { id: 'ALL', label: 'All Listings', count: statusCounts?.all ?? 0 },
    {
      id: 'PROPOSALS',
      label: 'Agent Proposals',
      count: statusCounts?.proposals ?? 0,
      badge: (statusCounts?.proposals ?? 0) > 0,
    },
    {
      id: 'PENDING_CONFIRMATION',
      label: 'Pending Confirmation',
      count: statusCounts?.pendingConfirmation ?? 0,
      badge: (statusCounts?.pendingConfirmation ?? 0) > 0,
    },
    {
      id: 'ACTION_REQUIRED',
      label: 'Action Required',
      count: statusCounts?.actionRequired ?? 0,
      badge: (statusCounts?.actionRequired ?? 0) > 0,
      isAlert: true,
    },
    {
      id: 'NEEDS_APPROVAL',
      label: 'Needs Approval',
      count: statusCounts?.needsApproval ?? 0,
      badge: true,
    },
    { id: 'ACTIVE', label: 'Active', count: statusCounts?.active ?? 0 },
    {
      id: 'RESERVED',
      label: 'Reserved',
      count: statusCounts?.reserved ?? 0,
      ariaLabel: 'Reserved / Under Contract',
    },
    {
      id: 'SOLD',
      label: 'Sold',
      count: statusCounts?.sold ?? 0,
      ariaLabel: 'Sold / Closed',
    },
    { id: 'DRAFT', label: 'Draft', count: statusCounts?.draft ?? 0 },
    { id: 'INACTIVE', label: 'Archived', count: statusCounts?.inactive ?? 0 },
  ];

  const formatPrice = (val) => {
    const num = Number(val);
    return isNaN(num) ? val : `₱${num.toLocaleString()}`;
  };

  const hasPriceFilter = Boolean(priceRange?.min || priceRange?.max);
  let priceLabel = '';
  if (priceRange?.min && priceRange?.max) {
    priceLabel = `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`;
  } else if (priceRange?.min) {
    priceLabel = `≥ ${formatPrice(priceRange.min)}`;
  } else if (priceRange?.max) {
    priceLabel = `≤ ${formatPrice(priceRange.max)}`;
  }

  const hasActiveFilters = Boolean(
    (search && search.trim() !== '') ||
      (selectedType && selectedType !== 'ALL') ||
      (selectedLocation && selectedLocation !== 'ALL') ||
      hasPriceFilter
  );

  return (
    <div className="space-y-3 font-sans">
      {/* Status Navigation Tabs (Clean Modern Underline Style) */}
      <div className="border-b border-[#E2E8F0] flex items-center gap-1 sm:gap-2 overflow-x-auto select-none no-scrollbar -mx-1 px-1">
        {statusTabs.map((tab) => {
          const isSelected = statusTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusTabChange?.(tab.id)}
              aria-label={tab.ariaLabel || `${tab.label} (${tab.count})`}
              className={cn(
                'group relative inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-all cursor-pointer shrink-0 border-b-2 -mb-px',
                isSelected
                  ? 'border-[#0F766E] text-[#0F766E] font-semibold'
                  : 'border-transparent text-[#64748B] hover:text-[#1E293B] hover:border-slate-300'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono transition-colors',
                  isSelected
                    ? 'bg-teal-50 text-[#0F766E] font-bold border border-teal-200/60'
                    : tab.isAlert && tab.count > 0
                    ? 'bg-rose-100 text-rose-800 font-bold'
                    : tab.badge && tab.count > 0
                    ? 'bg-amber-100 text-amber-800 font-bold'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Clean Unified Multi-Criteria Toolbar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-2.5 shadow-2xs flex flex-wrap items-center gap-2">
        {/* Omni Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search properties by title, location, or listing code..."
            className="w-full h-9 pl-9 pr-8 bg-[#F8FAFC] hover:bg-slate-50 focus:bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange?.('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Property Type Facet */}
        <div className="relative shrink-0">
          <select
            value={selectedType || 'ALL'}
            onChange={(e) => onTypeChange?.(e.target.value)}
            className={cn(
              "h-9 pl-3 pr-8 rounded-lg text-xs font-medium cursor-pointer transition-colors appearance-none focus:outline-none focus:ring-1 focus:ring-[#0F766E]",
              selectedType && selectedType !== 'ALL'
                ? "bg-teal-50/70 border border-[#0F766E] text-[#0F766E] font-semibold"
                : "bg-[#F8FAFC] hover:bg-slate-100/70 border border-[#E2E8F0] text-[#1E293B]"
            )}
            aria-label="Property type"
          >
            <option value="ALL">Type: All</option>
            {resolvedTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Location Facet */}
        <div className="relative shrink-0">
          <select
            value={selectedLocation || 'ALL'}
            onChange={(e) => onLocationChange?.(e.target.value)}
            className={cn(
              "h-9 pl-3 pr-8 rounded-lg text-xs font-medium cursor-pointer transition-colors appearance-none focus:outline-none focus:ring-1 focus:ring-[#0F766E]",
              selectedLocation && selectedLocation !== 'ALL'
                ? "bg-teal-50/70 border border-[#0F766E] text-[#0F766E] font-semibold"
                : "bg-[#F8FAFC] hover:bg-slate-100/70 border border-[#E2E8F0] text-[#1E293B]"
            )}
            aria-label="Location"
          >
            <option value="ALL">Location: All</option>
            {locationOptions?.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Price Range Filter */}
        <div className="relative shrink-0" ref={pricePopoverRef}>
          <button
            type="button"
            onClick={() => setIsPriceOpen(!isPriceOpen)}
            aria-label="Price range filter"
            className={cn(
              'h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors',
              hasPriceFilter
                ? 'border border-[#0F766E] text-[#0F766E] bg-teal-50/70 font-semibold'
                : 'border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100/70 text-[#1E293B]'
            )}
          >
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>{hasPriceFilter ? priceLabel : 'Price'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {isPriceOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-72 bg-white rounded-xl border border-[#E2E8F0] shadow-xl p-3.5 z-30 space-y-3 font-sans animate-in fade-in-80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1E293B]">
                  Price Range (PHP)
                </span>
                {hasPriceFilter && (
                  <button
                    type="button"
                    onClick={() => onPriceRangeChange?.({ min: '', max: '' })}
                    className="text-[11px] text-[#0F766E] hover:text-[#115E59] font-medium cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Min Price
                  </label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange?.min ?? ''}
                    onChange={(e) =>
                      onPriceRangeChange?.({
                        ...priceRange,
                        min: e.target.value,
                      })
                    }
                    className="w-full h-8 px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Max Price
                  </label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange?.max ?? ''}
                    onChange={(e) =>
                      onPriceRangeChange?.({
                        ...priceRange,
                        max: e.target.value,
                      })
                    }
                    className="w-full h-8 px-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                  />
                </div>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  Quick Presets
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: '< ₱10M', min: '', max: '10000000' },
                    { label: '₱10M - ₱25M', min: '10000000', max: '25000000' },
                    { label: '₱25M - ₱50M', min: '25000000', max: '50000000' },
                    { label: '> ₱50M', min: '50000000', max: '' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        onPriceRangeChange?.({
                          min: preset.min,
                          max: preset.max,
                        })
                      }
                      className="text-[11px] py-1 px-2 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-[#0F766E] border border-slate-200/80 text-slate-600 font-medium transition-colors text-center cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sort By Selector */}
        <div className="relative shrink-0">
          <select
            value={sortBy || 'newest'}
            onChange={(e) => onSortByChange?.(e.target.value)}
            className="h-9 pl-3 pr-8 bg-[#F8FAFC] hover:bg-slate-100/70 border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] appearance-none focus:outline-none focus:ring-1 focus:ring-[#0F766E] cursor-pointer transition-colors"
            aria-label="Sort by"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="price_desc">Price (High to Low)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="title_asc">Title: A to Z</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Dynamic Reset Action: only renders when filters are active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="h-9 px-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 animate-in fade-in-50"
            title="Reset all filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Active Filter Chips Strip */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#64748B]">
          <span className="font-medium text-[#1E293B]">
            Showing {filteredCount} of {totalCount} listings
          </span>
          <div className="h-3 w-px bg-slate-200 mx-1 hidden sm:block" />
          <div className="flex flex-wrap items-center gap-1.5">
            {search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
                <span>Search: "{search}"</span>
                <button
                  type="button"
                  aria-label="Remove search filter"
                  onClick={() => onSearchChange?.('')}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedType && selectedType !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
                <span>Type: {selectedType}</span>
                <button
                  type="button"
                  aria-label="Remove type filter"
                  onClick={() => onTypeChange?.('ALL')}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedLocation && selectedLocation !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
                <span>Location: {selectedLocation}</span>
                <button
                  type="button"
                  aria-label="Remove location filter"
                  onClick={() => onLocationChange?.('ALL')}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {hasPriceFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
                <span>Price: {priceLabel}</span>
                <button
                  type="button"
                  aria-label="Remove price filter"
                  onClick={() => onPriceRangeChange?.({ min: '', max: '' })}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              role="button"
              onClick={onResetFilters}
              className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] ml-1 cursor-pointer transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
