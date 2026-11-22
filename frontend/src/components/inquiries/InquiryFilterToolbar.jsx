import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Kbd } from '../ui/kbd';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '../ui/input-group';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '../ui/popover';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '../ui/select';

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
];

export function sortInquiriesByDate(list = [], sortBy = 'newest') {
  return [...list].sort((a, b) => {
    const tA = new Date(a.created_at || a.createdAt || 0).getTime() || 0;
    const tB = new Date(b.created_at || b.createdAt || 0).getTime() || 0;
    return sortBy === 'oldest' ? tA - tB : tB - tA;
  });
}

export default function InquiryFilterToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search inquiries...',
  filters = [],
  sortBy = 'newest',
  onSortChange,
  onResetFilters,
  layout = 'stacked',
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== '/') return;
      const tag = document.activeElement?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        document.activeElement?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeFilters = filters.filter((f) => f.value && f.value !== 'ALL');
  const activeCount = activeFilters.length;
  const hasAnyFilter = activeCount > 0 || Boolean(searchValue?.trim());

  return (
    <div className="flex flex-col gap-2.5">
      <div
        className={
          layout === 'inline'
            ? 'flex flex-col md:flex-row md:items-center gap-2.5'
            : 'flex flex-col gap-2.5'
        }
      >
        {/* Search Input with "/" Shortcut */}
        <InputGroup
          className={`h-10 rounded-lg border border-outline bg-surface ${
            layout === 'inline' ? 'flex-1 min-w-0' : ''
          }`}
        >
        <InputGroupAddon align="inline-start">
          <Search className="size-4 text-on-surface-variant" />
        </InputGroupAddon>
        <InputGroupInput
          ref={searchInputRef}
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search inquiries"
          className="text-sm text-on-surface"
        />
        <InputGroupAddon align="inline-end">
          {searchValue ? (
            <InputGroupButton
              type="button"
              size="icon-xs"
              onClick={() => onSearchChange && onSearchChange('')}
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </InputGroupButton>
          ) : (
            <Kbd>/</Kbd>
          )}
        </InputGroupAddon>
      </InputGroup>

      {/* Filters Popover + Sort Controls */}
      {(filters.length > 0 || onSortChange) && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 ${
            layout === 'inline' ? 'shrink-0' : ''
          }`}
        >
          {filters.length > 0 && (
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10 gap-1.5 normal-case tracking-normal font-medium"
                  />
                }
              >
                <SlidersHorizontal className="size-3.5" />
                <span>Filters</span>
                {activeCount > 0 && (
                  <Badge variant="primary" className="px-1.5 py-0 text-[10px] tabular-nums">
                    {activeCount}
                  </Badge>
                )}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 rounded-xl border border-outline bg-surface p-4 shadow-lg">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">
                      Filter Inquiries
                    </span>
                    {activeCount > 0 && onResetFilters && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onResetFilters();
                          setFiltersOpen(false);
                        }}
                        className="h-7 px-2 text-xs normal-case tracking-normal"
                      >
                        Reset
                      </Button>
                    )}
                  </div>

                  {filters.map((filter, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <Label className="text-[11px] font-semibold text-on-surface-variant">
                        {filter.label || filter.placeholder || `Filter ${idx + 1}`}
                      </Label>
                      <Select value={filter.value} onValueChange={filter.onChange}>
                        <SelectTrigger className="w-full h-10 rounded-lg border border-outline bg-surface px-3 text-xs">
                          <SelectValue placeholder={filter.placeholder || 'All'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {filter.options.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {onSortChange && (
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger
                aria-label="Sort inquiries"
                className="h-10 min-w-[140px] rounded-lg border border-outline bg-surface px-3 text-xs font-medium"
              >
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      )}
      </div>

      {/* Active Filter Chips + Reset */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map((filter, idx) => {
            const matched = filter.options.find((o) => o.value === filter.value);
            return (
              <Badge key={idx} variant="outline" className="gap-1 pr-1 normal-case tracking-normal">
                <span>
                  {filter.label ? `${filter.label}: ` : ''}
                  {matched?.label || filter.value}
                </span>
                <button
                  type="button"
                  onClick={() => filter.onChange('ALL')}
                  aria-label={`Remove ${filter.label || 'filter'}`}
                  className="rounded-full p-0.5 hover:bg-surface-variant cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
          {onResetFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-7 px-2 text-xs gap-1 normal-case tracking-normal text-on-surface-variant"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
