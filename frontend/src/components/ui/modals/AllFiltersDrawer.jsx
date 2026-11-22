import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../sheet';
import { Button } from '../button';
import { Badge } from '../badge';

const FINANCING_OPTIONS = [
  'Pag-IBIG Housing Loan',
  'Bank Financing',
  'Assume Balance / Pasalo',
  'In-House Financing',
  'Cash',
];

const TURNOVER_OPTIONS = [
  'Fully Furnished',
  'Semi-Furnished',
  'Bare / Unfurnished',
];

const LIFESTYLE_OPTIONS = [
  'Pet-Friendly Community',
  'Flood-Free Area',
  'Private Balcony',
  'Maid Room',
  '24/7 Gated Security',
];

const BATH_OPTIONS = ['Any', '1', '2', '3', '4+'];
const FLOOR_OPTIONS = ['Any', 'Low', 'Mid', 'High', 'Penthouse'];

const SORT_OPTIONS = [
  { value: 'Newest', label: 'Newest Additions' },
  { value: 'Price: High to Low', label: 'Price: High to Low' },
  { value: 'Price: Low to High', label: 'Price: Low to High' },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 motion-reduce:transition-none';

export default function AllFiltersDrawer({
  isOpen,
  onClose,
  filters,
  setFilter,
  facets = {},
  totalCount = 0,
  onClearAll,
  sortBy = 'Newest',
  setSortBy,
}) {
  const toggleArrayFilter = (key, value) => {
    const current = filters[key] || [];
    if (current.includes(value)) {
      setFilter(key, current.filter((item) => item !== value));
    } else {
      setFilter(key, [...current, value]);
    }
  };

  return (
    <Sheet
      open={Boolean(isOpen)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col gap-0 bg-surface border-l border-outline shadow-xl"
      >
        <SheetHeader className="px-6 py-4 border-b border-outline bg-surface shrink-0 pr-12">
          <SheetTitle className="text-xl font-semibold tracking-tight text-on-surface">
            All Filters & Specifications
          </SheetTitle>
          <SheetDescription className="text-sm text-on-surface-variant">
            Refine residences by financing, specifications, and lifestyle features
          </SheetDescription>
        </SheetHeader>

        <div
          data-lenis-prevent="true"
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-on-surface"
        >
          {/* Sort Order */}
          {setSortBy && (
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-wider text-on-surface">
                  Sort Order
                </h3>
                <span className="text-xs font-medium text-on-surface-variant">
                  Default: Newest
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSortBy(opt.value)}
                      className={`min-h-11 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border flex items-center justify-center text-center cursor-pointer ${FOCUS_RING} ${isSelected
                        ? 'bg-primary text-white border-primary hover:bg-primary-hover'
                        : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
                        }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 1. Financing & Payment Terms */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-on-surface">
                Financing & Payment Terms
              </h3>
              <span className="text-xs font-medium text-on-surface-variant">
                Multi-select
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FINANCING_OPTIONS.map((term) => {
                const isSelected = (filters.financingTerms || []).includes(term);
                const count = facets.financingTerms?.[term] || 0;
                return (
                  <button
                    key={term}
                    type="button"
                    onClick={() => toggleArrayFilter('financingTerms', term)}
                    className={`min-h-11 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border flex items-center gap-2 cursor-pointer ${FOCUS_RING} ${isSelected
                      ? 'bg-primary text-white border-primary hover:bg-primary-hover'
                      : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
                      }`}
                  >
                    <span>{term}</span>
                    {count > 0 && (
                      <Badge
                        variant="secondary"
                        className={`text-xs px-2 py-0.5 rounded-full ${isSelected
                          ? 'bg-white/20 text-white border-transparent'
                          : 'bg-surface text-on-surface-variant border-outline'
                          }`}
                      >
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Bathrooms */}
          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-on-surface">
              Bathrooms
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {BATH_OPTIONS.map((opt) => {
                const isSelected = (filters.baths || 'Any') === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFilter('baths', opt === 'Any' ? '' : opt)}
                    className={`min-h-11 rounded-lg text-xs font-semibold transition-colors border flex items-center justify-center cursor-pointer ${FOCUS_RING} ${isSelected
                      ? 'bg-primary text-white border-primary hover:bg-primary-hover'
                      : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
                      }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 3. Turnover / Furnishing Status */}
          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-on-surface">
              Turnover Condition
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TURNOVER_OPTIONS.map((opt) => {
                const isSelected = filters.furnishing === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFilter('furnishing', isSelected ? '' : opt)}
                    className={`min-h-12 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border flex items-center justify-center text-center cursor-pointer ${FOCUS_RING} ${isSelected
                      ? 'bg-primary text-white border-primary hover:bg-primary-hover'
                      : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
                      }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 4. Lifestyle & Community Rules */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wider text-on-surface">
                Lifestyle & Community Rules
              </h3>
              <span className="text-xs font-medium text-on-surface-variant">
                Philippine Essentials
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LIFESTYLE_OPTIONS.map((rule) => {
                const isSelected = (filters.communityRules || []).includes(rule);
                return (
                  <button
                    key={rule}
                    type="button"
                    onClick={() => toggleArrayFilter('communityRules', rule)}
                    className={`min-h-11 p-3 rounded-lg text-xs font-semibold transition-colors border flex items-center justify-between text-left cursor-pointer ${FOCUS_RING} ${isSelected
                      ? 'bg-tertiary-container border-primary text-primary'
                      : 'bg-surface-variant border-outline text-on-surface hover:border-outline-variant'
                      }`}
                  >
                    <span>{rule}</span>
                    <span
                      className={`w-4 h-4 rounded-sm flex items-center justify-center border ${isSelected
                        ? 'bg-primary text-white border-primary'
                        : 'border-outline-variant bg-surface'
                        }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 5. Floor Level */}
          <section className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-on-surface">
              Floor Level
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FLOOR_OPTIONS.filter((o) => o !== 'Any').map((level) => {
                const isSelected = filters.floorLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFilter('floorLevel', isSelected ? '' : level)}
                    className={`min-h-11 rounded-lg text-xs font-semibold transition-colors border flex items-center justify-center cursor-pointer ${FOCUS_RING} ${isSelected
                      ? 'bg-primary text-white border-primary hover:bg-primary-hover'
                      : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
                      }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-outline bg-surface flex flex-row items-center justify-between gap-4 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClearAll}
            className="h-11 px-4 text-xs font-semibold text-on-surface-variant hover:text-red-600 cursor-pointer"
          >
            Clear All
          </Button>

          <Button
            type="button"
            onClick={onClose}
            className="h-12 px-6 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm gap-2 cursor-pointer"
          >
            <span>
              Show {totalCount} {totalCount === 1 ? 'Residence' : 'Residences'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
