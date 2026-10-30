import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Columns3,
} from 'lucide-react';
import { IconCurrencyPeso } from '@tabler/icons-react';
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
  availableColumns = [],
  visibleColumns = [],
  onVisibleColumnsChange,
  onResetColumns,
  currentTier = null,
}) {
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const pricePopoverRef = useRef(null);

  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const columnsPopoverRef = useRef(null);

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const statusPopoverRef = useRef(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (pricePopoverRef.current && !pricePopoverRef.current.contains(e.target)) {
        setIsPriceOpen(false);
      }
      if (columnsPopoverRef.current && !columnsPopoverRef.current.contains(e.target)) {
        setIsColumnsOpen(false);
      }
      if (statusPopoverRef.current && !statusPopoverRef.current.contains(e.target)) {
        setIsStatusOpen(false);
      }
    }
    if (isPriceOpen || isColumnsOpen || isStatusOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPriceOpen, isColumnsOpen, isStatusOpen]);

  const handleToggleColumn = (colId) => {
    if (!onVisibleColumnsChange) return;
    if (visibleColumns.includes(colId)) {
      onVisibleColumnsChange(visibleColumns.filter((c) => c !== colId));
    } else {
      onVisibleColumnsChange([...visibleColumns, colId]);
    }
  };

  const handleResetColumns = () => {
    if (onResetColumns) {
      onResetColumns();
    } else if (onVisibleColumnsChange && availableColumns.length > 0) {
      onVisibleColumnsChange(availableColumns.map((c) => c.id));
    }
  };

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

  const currentTab = statusTabs.find((t) => t.id === statusTab) || statusTabs[0];

  const hasActiveFilters = Boolean(
    (search && search.trim() !== '') ||
      (statusTab && statusTab !== 'ALL') ||
      (selectedType && selectedType !== 'ALL') ||
      (selectedLocation && selectedLocation !== 'ALL') ||
      hasPriceFilter
  );

  return (
    <div className="space-y-3 font-sans min-w-0 max-w-full">
      {/* Clean Unified Multi-Criteria Toolbar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-2.5 shadow-2xs flex flex-wrap items-center gap-2 min-w-0 max-w-full">
        {/* Omni Search Input */}
        <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
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

        {/* Status Facet Dropdown Popover */}
        <div className="relative shrink-0" ref={statusPopoverRef}>
          <button
            type="button"
            data-testid="status-filter-dropdown-btn"
            onClick={() => setIsStatusOpen((prev) => !prev)}
            aria-label={`Status: ${currentTab.label}`}
            aria-expanded={isStatusOpen}
            className={cn(
              "h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors",
              statusTab && statusTab !== 'ALL'
                ? "bg-teal-50/70 border border-[#0F766E] text-[#0F766E] font-semibold"
                : "bg-[#F8FAFC] hover:bg-slate-100/70 border border-[#E2E8F0] text-[#1E293B]"
            )}
          >
            <span>Status: {currentTab.label}</span>
            <span
              className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-mono transition-colors ml-0.5",
                statusTab && statusTab !== 'ALL'
                  ? "bg-teal-100 text-[#0F766E] font-bold"
                  : currentTab.isAlert && currentTab.count > 0
                  ? "bg-rose-100 text-rose-800 font-bold"
                  : currentTab.badge && currentTab.count > 0
                  ? "bg-amber-100 text-amber-800 font-bold"
                  : "bg-slate-200/70 text-slate-600"
              )}
            >
              {currentTab.count}
            </span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-slate-400 ml-0.5 transition-transform duration-150",
                isStatusOpen && "rotate-180"
              )}
            />
          </button>

          {isStatusOpen && (
            <div
              data-testid="status-dropdown-menu"
              className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-[#E2E8F0] rounded-xl shadow-xl p-2 z-40 space-y-1 animate-in fade-in-50 zoom-in-95"
            >
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>Listing Status</span>
                <span className="font-mono text-[10px] text-slate-400 font-normal">
                  {statusTabs.length} Options
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar py-1 space-y-0.5">
                {statusTabs.map((tab) => {
                  const isSelected = statusTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      data-testid={`status-option-${tab.id}`}
                      aria-label={tab.ariaLabel || `${tab.label} (${tab.count})`}
                      onClick={() => {
                        onStatusTabChange?.(tab.id);
                        setIsStatusOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left",
                        isSelected
                          ? "bg-teal-50/80 text-[#0F766E] font-semibold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        {isSelected ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />
                        )}
                        <span className="truncate">{tab.label}</span>
                      </div>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-mono shrink-0",
                          isSelected
                            ? "bg-teal-100 text-[#0F766E] font-bold"
                            : tab.isAlert && tab.count > 0
                            ? "bg-rose-100 text-rose-800 font-bold"
                            : tab.badge && tab.count > 0
                            ? "bg-amber-100 text-amber-800 font-bold"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
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
            <IconCurrencyPeso size={14} stroke={2} className={hasPriceFilter ? 'text-[#0F766E]' : 'text-slate-400'} />
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

        {/* Column Visibility Selector */}
        {availableColumns && availableColumns.length > 0 && (
          <div className="relative shrink-0" ref={columnsPopoverRef}>
            <button
              type="button"
              onClick={() => setIsColumnsOpen((prev) => !prev)}
              className={cn(
                "h-9 px-3 bg-[#F8FAFC] hover:bg-slate-100/70 border rounded-lg text-xs font-medium text-[#1E293B] flex items-center gap-1.5 transition-colors cursor-pointer",
                isColumnsOpen ? "border-[#0F766E] ring-1 ring-[#0F766E]" : "border-[#E2E8F0]"
              )}
              aria-label="Customize columns"
              title="Customize visible table columns"
              aria-expanded={isColumnsOpen}
            >
              <Columns3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns</span>
              {availableColumns.length > 0 && (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded-full">
                  {visibleColumns.length}/{availableColumns.length}
                </span>
              )}
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-slate-400 transition-transform duration-150",
                  isColumnsOpen && "rotate-180"
                )}
              />
            </button>

            {isColumnsOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-2.5 z-40 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
                  <span className="text-xs font-semibold text-[#1E293B]">Table Columns</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleResetColumns}
                      className="text-[11px] font-medium text-[#0F766E] hover:text-[#115E59] cursor-pointer"
                      title="Reset to device default columns"
                    >
                      Reset Default
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => onVisibleColumnsChange && onVisibleColumnsChange(availableColumns.map((c) => c.id))}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                      title="Show all columns"
                    >
                      Show All
                    </button>
                  </div>
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                  {availableColumns.map((col) => {
                    const isChecked = visibleColumns.includes(col.id);
                    const isLocked = Boolean(col.isLocked);
                    return (
                      <label
                        key={col.id}
                        className={cn(
                          "flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-[#1E293B] transition-colors select-none",
                          isLocked ? "cursor-not-allowed text-slate-400 bg-slate-50/50" : "hover:bg-slate-50 cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            aria-label={col.label}
                            checked={isChecked}
                            disabled={isLocked}
                            onChange={() => !isLocked && handleToggleColumn(col.id)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#0F766E] focus:ring-[#0F766E] accent-[#0F766E] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className={cn(isLocked ? "font-normal" : "font-medium")}>
                            {col.label}
                          </span>
                        </div>
                        {isLocked && (
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            Locked
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

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
            {statusTab && statusTab !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs text-[#0F766E] font-medium">
                <span>Status: {currentTab?.label || statusTab}</span>
                <button
                  type="button"
                  aria-label="Remove status filter"
                  onClick={() => onStatusTabChange?.('ALL')}
                  className="text-teal-400 hover:text-teal-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
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
