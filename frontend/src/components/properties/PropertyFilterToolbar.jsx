import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Kbd } from '@/components/ui/kbd';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '@/components/ui/select';
import { COMMON_PROPERTY_TYPES } from '../../pages/portals/broker/components/property-form/propertyTypeConfig';

const PRICE_PRESETS = [
  { label: '< ₱10M', min: '', max: '10000000' },
  { label: '₱10M - ₱25M', min: '10000000', max: '25000000' },
  { label: '₱25M - ₱50M', min: '25000000', max: '50000000' },
  { label: '> ₱50M', min: '50000000', max: '' },
];

const SORT_ITEMS = [
  { label: 'Sort: Newest First', value: 'newest' },
  { label: 'Sort: Oldest First', value: 'oldest' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Title: A to Z', value: 'title_asc' },
  { label: 'Title: Z to A', value: 'title_desc' },
];

function formatCompactPeso(val) {
  const num = Number(val);
  if (isNaN(num)) return val;
  if (num >= 1000000) {
    const m = num / 1000000;
    return `₱${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  return `₱${num.toLocaleString()}`;
}

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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Focus search input when pressing "/" outside form controls
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== '/') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || document.activeElement?.isContentEditable) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const typeItems = [
    { label: 'All Types', value: 'ALL' },
    ...resolvedTypeOptions.map((opt) => ({ label: opt, value: opt })),
  ];

  const locationItems = [
    { label: 'All Locations', value: 'ALL' },
    ...(locationOptions || []).map((loc) => ({ label: loc, value: loc })),
  ];

  const statusTabs = [
    { id: 'ALL', label: 'All Listings', count: statusCounts?.all ?? 0 },
    { id: 'DRAFT', label: 'Draft', count: statusCounts?.draft ?? 0 },
    {
      id: 'PENDING_APPROVAL',
      label: 'Pending Approval',
      count: statusCounts?.pendingApproval ?? 0,
      badge: (statusCounts?.pendingApproval ?? 0) > 0,
    },
    { id: 'PUBLISHED', label: 'Published', count: statusCounts?.published ?? 0 },
    { id: 'UNPUBLISHED', label: 'Unpublished', count: statusCounts?.unpublished ?? 0 },
    { id: 'CLOSED', label: 'Closed', count: statusCounts?.closed ?? 0 },
  ];

  const minVal = priceRange?.min !== '' && priceRange?.min != null ? Number(priceRange.min) : null;
  const maxVal = priceRange?.max !== '' && priceRange?.max != null ? Number(priceRange.max) : null;
  const isPriceInvalid = minVal !== null && maxVal !== null && !isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal;

  const hasPriceFilter = Boolean(priceRange?.min || priceRange?.max);
  let priceLabel = '';
  if (priceRange?.min && priceRange?.max) {
    priceLabel = `${formatCompactPeso(priceRange.min)} - ${formatCompactPeso(priceRange.max)}`;
  } else if (priceRange?.min) {
    priceLabel = `≥ ${formatCompactPeso(priceRange.min)}`;
  } else if (priceRange?.max) {
    priceLabel = `≤ ${formatCompactPeso(priceRange.max)}`;
  }

  const currentTab = statusTabs.find((t) => t.id === statusTab) || statusTabs[0];

  const unifiedFilterCount =
    (statusTab && statusTab !== 'ALL' ? 1 : 0) +
    (selectedType && selectedType !== 'ALL' ? 1 : 0) +
    (selectedLocation && selectedLocation !== 'ALL' ? 1 : 0) +
    (hasPriceFilter ? 1 : 0);

  const hasActiveFilters = Boolean((search && search.trim() !== '') || unifiedFilterCount > 0);

  const handleResetPopoverFilters = () => {
    onStatusTabChange?.('ALL');
    onTypeChange?.('ALL');
    onLocationChange?.('ALL');
    onPriceRangeChange?.({ min: '', max: '' });
  };

  return (
    <div className="flex flex-col gap-4 font-sans min-w-0 max-w-full">
      {/* Unified Search + Single Filter Button Toolbar */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-xs flex flex-wrap items-center gap-2 min-w-0 max-w-full">
        {/* Omni Search Input */}
        <InputGroup className="flex-1 min-w-[220px] h-10 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-50 focus-within:bg-white focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/20">
          <InputGroupAddon align="inline-start">
            <Search className="text-[#64748B]" />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchInputRef}
            type="text"
            value={search || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search properties by title, location, agent, or listing code..."
            className="h-10 text-sm text-[#1E293B] placeholder:text-[#64748B]"
          />
          <InputGroupAddon align="inline-end">
            {search ? (
              <InputGroupButton
                size="icon-sm"
                aria-label="Clear search"
                onClick={() => onSearchChange?.('')}
                className="text-[#64748B] hover:text-[#1E293B]"
              >
                <X />
              </InputGroupButton>
            ) : (
              <Kbd className="hidden sm:inline-flex border border-[#E2E8F0] bg-white text-[#64748B]">/</Kbd>
            )}
          </InputGroupAddon>
        </InputGroup>

        {/* Single Unified Filters Popover */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                data-testid="unified-filter-btn"
                aria-label={unifiedFilterCount > 0 ? `Filters (${unifiedFilterCount} active)` : 'Filters'}
                aria-expanded={isFiltersOpen}
                className={cn(
                  "h-10 px-3 rounded-lg normal-case tracking-normal text-sm font-medium gap-2 shrink-0",
                  unifiedFilterCount > 0
                    ? "bg-[#CCFBF1]/60 border-[#0F766E] text-[#0F766E] font-semibold hover:bg-[#CCFBF1]"
                    : "bg-[#F8FAFC] border-[#E2E8F0] text-[#1E293B] hover:bg-slate-100"
                )}
              >
                <SlidersHorizontal data-icon="inline-start" />
                <span>Filters</span>
                {unifiedFilterCount > 0 && (
                  <Badge
                    variant="coral"
                    className="bg-[#FF6B6B] text-[#1E293B] border-none px-1.5 py-0 min-w-5 h-5 justify-center tabular-nums"
                  >
                    {unifiedFilterCount}
                  </Badge>
                )}
                <ChevronDown
                  className={cn(
                    "text-[#64748B] transition-transform duration-150",
                    isFiltersOpen && "rotate-180"
                  )}
                />
              </Button>
            }
          />

          <PopoverContent
            align="start"
            sideOffset={8}
            className="w-[calc(100vw-2rem)] sm:w-[420px] p-0 rounded-xl border border-[#E2E8F0] bg-white shadow-xl gap-0"
          >
            {/* Panel Header */}
            <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] rounded-t-xl flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#1E293B]">Filter Listings</span>
                <span className="text-xs text-[#64748B]">Narrow by status, type, location, or budget</span>
              </div>
              {unifiedFilterCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetPopoverFilters}
                  className="text-xs font-semibold text-[#0F766E] hover:text-[#115E59] normal-case tracking-normal"
                >
                  Reset
                </Button>
              )}
            </div>

            {/* Panel Body */}
            <div className="p-4 flex flex-col gap-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {/* 1. Listing Status */}
              <div className="flex flex-col gap-2" data-testid="status-dropdown-menu">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Listing Status
                  </span>
                  <span className="text-xs text-[#64748B] tabular-nums">
                    {statusTabs.length} options
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {statusTabs.map((tab) => {
                    const isSelected = statusTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        data-testid={`status-option-${tab.id}`}
                        aria-label={tab.ariaLabel || `${tab.label} (${tab.count})`}
                        onClick={() => onStatusTabChange?.(tab.id)}
                        className={cn(
                          "min-h-10 px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 focus-visible:border-[#0F766E]",
                          isSelected
                            ? "bg-[#CCFBF1]/60 border-[#0F766E] text-[#0F766E] font-semibold"
                            : "bg-white border-[#E2E8F0] text-[#1E293B] hover:bg-[#F8FAFC]"
                        )}
                      >
                        <span className="truncate">{tab.label}</span>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded-full text-[11px] tabular-nums shrink-0",
                            isSelected
                              ? "bg-[#0F766E] text-white font-semibold"
                              : tab.isAlert && tab.count > 0
                              ? "bg-red-50 text-red-600 font-semibold"
                              : tab.badge && tab.count > 0
                              ? "bg-amber-50 text-amber-700 font-semibold"
                              : "bg-[#F1F5F9] text-[#64748B]"
                          )}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator className="bg-[#E2E8F0]" />

              {/* 2. Property Type & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Property Type
                  </Label>
                  <Select
                    items={typeItems}
                    value={selectedType || 'ALL'}
                    onValueChange={(val) => onTypeChange?.(val || 'ALL')}
                  >
                    <SelectTrigger
                      aria-label="Property type"
                      className="w-full h-10 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-medium text-[#1E293B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="rounded-xl border border-[#E2E8F0] bg-white shadow-lg">
                      <SelectGroup>
                        {typeItems.map((item) => (
                          <SelectItem key={item.value} value={item.value} className="rounded-lg text-sm">
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                    Location
                  </Label>
                  <Select
                    items={locationItems}
                    value={selectedLocation || 'ALL'}
                    onValueChange={(val) => onLocationChange?.(val || 'ALL')}
                  >
                    <SelectTrigger
                      aria-label="Location"
                      className="w-full h-10 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-medium text-[#1E293B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false} className="rounded-xl border border-[#E2E8F0] bg-white shadow-lg">
                      <SelectGroup>
                        {locationItems.map((item) => (
                          <SelectItem key={item.value} value={item.value} className="rounded-lg text-sm">
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-[#E2E8F0]" />

              {/* 3. Price Range (PHP) */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Price Range (PHP)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="filter-min-price" className="text-xs text-[#64748B]">
                      Min Price
                    </Label>
                    <Input
                      id="filter-min-price"
                      type="number"
                      placeholder="Min"
                      aria-invalid={isPriceInvalid}
                      value={priceRange?.min ?? ''}
                      onChange={(e) =>
                        onPriceRangeChange?.({
                          ...priceRange,
                          min: e.target.value,
                        })
                      }
                      className={cn(
                        "h-10 rounded-lg bg-[#F8FAFC] text-sm tabular-nums",
                        isPriceInvalid && "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/20"
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="filter-max-price" className="text-xs text-[#64748B]">
                      Max Price
                    </Label>
                    <Input
                      id="filter-max-price"
                      type="number"
                      placeholder="Max"
                      aria-invalid={isPriceInvalid}
                      value={priceRange?.max ?? ''}
                      onChange={(e) =>
                        onPriceRangeChange?.({
                          ...priceRange,
                          max: e.target.value,
                        })
                      }
                      className={cn(
                        "h-10 rounded-lg bg-[#F8FAFC] text-sm tabular-nums",
                        isPriceInvalid && "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/20"
                      )}
                    />
                  </div>
                </div>
                {isPriceInvalid && (
                  <p className="text-xs font-medium text-red-600" role="alert">
                    Minimum price cannot be higher than maximum price.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {PRICE_PRESETS.map((preset) => {
                    const isPresetActive =
                      String(priceRange?.min || '') === preset.min &&
                      String(priceRange?.max || '') === preset.max;
                    return (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onPriceRangeChange?.({
                            min: preset.min,
                            max: preset.max,
                          })
                        }
                        className={cn(
                          "h-9 rounded-lg normal-case tracking-normal text-xs font-medium",
                          isPresetActive
                            ? "bg-[#CCFBF1]/60 border-[#0F766E] text-[#0F766E] font-semibold"
                            : "bg-[#F8FAFC] border-[#E2E8F0] text-[#1E293B] hover:bg-[#CCFBF1]/40 hover:text-[#0F766E]"
                        )}
                      >
                        {preset.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Panel Footer (Single Primary CTA) */}
            <div className="px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] rounded-b-xl flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-[#64748B] tabular-nums">
                {filteredCount} matching {filteredCount === 1 ? 'listing' : 'listings'}
              </span>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsFiltersOpen(false)}
                className="h-9 px-4 rounded-lg normal-case tracking-normal text-xs font-semibold"
              >
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort By Selector */}
        <Select
          items={SORT_ITEMS}
          value={sortBy || 'newest'}
          onValueChange={(val) => onSortByChange?.(val || 'newest')}
        >
          <SelectTrigger
            aria-label="Sort by"
            className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 text-sm font-medium text-[#1E293B] focus-visible:border-[#0F766E] focus-visible:ring-2 focus-visible:ring-[#0F766E]/20 shrink-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" alignItemWithTrigger={false} className="rounded-xl border border-[#E2E8F0] bg-white shadow-lg">
            <SelectGroup>
              {SORT_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value} className="rounded-lg text-sm">
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Dynamic Reset Action */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={onResetFilters}
            title="Reset all filters"
            className="h-10 px-3 rounded-lg border-red-200 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 normal-case tracking-normal text-xs font-semibold shrink-0"
          >
            <RotateCcw data-icon="inline-start" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}
      </div>

      {/* Active Filter Chips Strip */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
          <span className="font-medium text-[#1E293B] tabular-nums">
            Showing {filteredCount} of {totalCount} listings
          </span>
          <Separator orientation="vertical" className="h-3.5 hidden sm:block bg-[#E2E8F0]" />
          <div className="flex flex-wrap items-center gap-2">
            {statusTab && statusTab !== 'ALL' && (
              <Badge variant="default" className="gap-1.5 px-3 py-1 normal-case tracking-normal font-medium bg-[#CCFBF1] text-[#115E59] border-[#0F766E]/20">
                <span>Status: {currentTab?.label || statusTab}</span>
                <button
                  type="button"
                  aria-label="Remove status filter"
                  onClick={() => onStatusTabChange?.('ALL')}
                  className="hover:text-red-600 cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {search && (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 normal-case tracking-normal font-medium">
                <span>Search: &quot;{search}&quot;</span>
                <button
                  type="button"
                  aria-label="Remove search filter"
                  onClick={() => onSearchChange?.('')}
                  className="text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {selectedType && selectedType !== 'ALL' && (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 normal-case tracking-normal font-medium">
                <span>Type: {selectedType}</span>
                <button
                  type="button"
                  aria-label="Remove type filter"
                  onClick={() => onTypeChange?.('ALL')}
                  className="text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {selectedLocation && selectedLocation !== 'ALL' && (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 normal-case tracking-normal font-medium">
                <span>Location: {selectedLocation}</span>
                <button
                  type="button"
                  aria-label="Remove location filter"
                  onClick={() => onLocationChange?.('ALL')}
                  className="text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {hasPriceFilter && (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 normal-case tracking-normal font-medium tabular-nums">
                <span>Price: {priceLabel}</span>
                <button
                  type="button"
                  aria-label="Remove price filter"
                  onClick={() => onPriceRangeChange?.({ min: '', max: '' })}
                  className="text-[#64748B] hover:text-[#1E293B] cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-7 px-2 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] normal-case tracking-normal"
            >
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
