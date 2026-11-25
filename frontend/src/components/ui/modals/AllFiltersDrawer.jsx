import React from 'react';
import { motion, MotionConfig } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  Banknote,
  Bath,
  Car,
  Landmark,
  RotateCcw,
  Sofa,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../sheet';
import { Button } from '../button';
import PartneredBankMultiSelect from '../../../pages/portals/broker/components/property-form/PartneredBankMultiSelect';

const BATH_OPTIONS = ['Any', '1', '2', '3', '4+'];
const PARKING_OPTIONS = ['Any', '1+', '2+', '3+'];
const FURNISHING_OPTIONS = [
  { value: 'Fully Furnished', label: 'Fully Furnished' },
  { value: 'Semi-Furnished', label: 'Semi-Furnished' },
  { value: 'None', label: 'Unfurnished' },
];

const SALE_PRICE_PRESETS = [
  { label: 'Under ₱5M', min: null, max: 5000000 },
  { label: '₱5M – ₱15M', min: 5000000, max: 15000000 },
  { label: '₱15M – ₱50M', min: 15000000, max: 50000000 },
  { label: 'Over ₱50M', min: 50000000, max: null },
];

const RENT_PRICE_PRESETS = [
  { label: 'Under ₱25K/mo', min: null, max: 25000 },
  { label: '₱25K – ₱60K/mo', min: 25000, max: 60000 },
  { label: '₱60K – ₱150K/mo', min: 60000, max: 150000 },
  { label: 'Over ₱150K/mo', min: 150000, max: null },
];

const SORT_OPTIONS = [
  { value: 'Newest', label: 'Newest First' },
  { value: 'Price: Low to High', label: 'Lowest Price' },
  { value: 'Price: High to Low', label: 'Highest Price' },
];

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 motion-reduce:transition-none';

function FilterSectionHeader({ icon: Icon, title, context }) {
  return (
    <div className="flex items-start gap-2">
      <div className="size-7 rounded-lg bg-surface-variant border border-outline flex items-center justify-center text-primary shrink-0 mt-0.5">
        <Icon className="size-3.5" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-on-surface leading-tight">{title}</h3>
        {context && <p className="text-xs text-on-surface-variant mt-0.5">{context}</p>}
      </div>
    </div>
  );
}

export default function AllFiltersDrawer({
  isOpen,
  onClose,
  filters,
  setFilter,
  totalCount = 0,
  onClearAll,
  sortBy = 'Newest',
  setSortBy,
}) {
  const isRentMode = (filters.transactionType || 'All') === 'For Rent';
  const activePricePresets = isRentMode ? RENT_PRICE_PRESETS : SALE_PRICE_PRESETS;
  const isPriceRangeInvalid = Boolean(
    filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice)
  );
  const selectedBanks = Array.isArray(filters.banks) ? filters.banks : [];

  const handleToggleBank = (bankName) => {
    const next = selectedBanks.includes(bankName)
      ? selectedBanks.filter((b) => b !== bankName)
      : [...selectedBanks, bankName];
    setFilter('banks', next);
  };

  return (
    <MotionConfig reducedMotion="user">
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
              More Filters
            </SheetTitle>
            <SheetDescription className="text-sm text-on-surface-variant">
              Refine homes by price, basic details, and partnered banks
            </SheetDescription>
          </SheetHeader>

          <div
            data-lenis-prevent="true"
            className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-on-surface"
          >
            {/* 1. Sort By */}
            {setSortBy && (
              <section className="space-y-3">
                <FilterSectionHeader
                  icon={ArrowUpDown}
                  title="Sort By"
                  context="Choose how homes are ordered"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = sortBy === opt.value;
                    return (
                      <motion.button
                        key={opt.value}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSortBy(opt.value)}
                        className={`min-h-11 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border flex items-center justify-center text-center cursor-pointer ${FOCUS_RING} ${
                          isSelected
                            ? 'bg-primary text-white border-primary hover:bg-primary-hover shadow-xs'
                            : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
                        }`}
                      >
                        {opt.label}
                      </motion.button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 2. Price Range */}
            <section className="space-y-3">
              <FilterSectionHeader
                icon={Banknote}
                title={isRentMode ? 'Monthly Rent (PHP)' : 'Price Range (PHP)'}
                context={isRentMode ? 'Set your monthly rent budget' : 'Enter min/max or pick a quick range'}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="drawer-min-price" className="text-xs font-medium uppercase tracking-wider text-on-surface-variant block mb-1">
                    Min Price
                  </label>
                  <input
                    id="drawer-min-price"
                    type="number"
                    min="0"
                    placeholder="₱ 0"
                    value={filters.minPrice || ''}
                    onChange={(e) => setFilter('minPrice', e.target.value ? Number(e.target.value) : null)}
                    className={`w-full h-11 px-3 bg-surface border rounded-lg text-sm font-medium text-on-surface placeholder:text-on-surface-variant tabular-nums ${FOCUS_RING} ${
                      isPriceRangeInvalid ? 'border-red-600' : 'border-outline'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="drawer-max-price" className="text-xs font-medium uppercase tracking-wider text-on-surface-variant block mb-1">
                    Max Price
                  </label>
                  <input
                    id="drawer-max-price"
                    type="number"
                    min="0"
                    placeholder="Any"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilter('maxPrice', e.target.value ? Number(e.target.value) : null)}
                    className={`w-full h-11 px-3 bg-surface border rounded-lg text-sm font-medium text-on-surface placeholder:text-on-surface-variant tabular-nums ${FOCUS_RING} ${
                      isPriceRangeInvalid ? 'border-red-600' : 'border-outline'
                    }`}
                  />
                </div>
              </div>
              {isPriceRangeInvalid && (
                <div role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>Min price cannot be higher than max price.</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {activePricePresets.map((preset) => {
                  const isActive =
                    (filters.minPrice ?? null) === preset.min && (filters.maxPrice ?? null) === preset.max;
                  return (
                    <motion.button
                      key={preset.label}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setFilter('minPrice', preset.min);
                        setFilter('maxPrice', preset.max);
                      }}
                      className={`min-h-10 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer tabular-nums ${FOCUS_RING} ${
                        isActive
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
                      }`}
                    >
                      {preset.label}
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {/* 3. Basic Details: Bathrooms, Parking, Furnishing */}
            <section className="space-y-3">
              <FilterSectionHeader
                icon={Bath}
                title="Bathrooms"
                context="Minimum number of bathrooms"
              />
              <div className="grid grid-cols-5 gap-2">
                {BATH_OPTIONS.map((opt) => {
                  const isSelected = (filters.baths || 'Any') === opt;
                  return (
                    <motion.button
                      key={opt}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setFilter('baths', opt === 'Any' ? '' : opt)}
                      className={`min-h-11 rounded-lg text-xs font-semibold transition-colors border flex items-center justify-center cursor-pointer ${FOCUS_RING} ${
                        isSelected
                          ? 'bg-primary text-white border-primary hover:bg-primary-hover shadow-xs'
                          : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
                      }`}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <FilterSectionHeader
                icon={Car}
                title="Parking"
                context="Minimum car parking slots"
              />
              <div className="grid grid-cols-4 gap-2">
                {PARKING_OPTIONS.map((opt) => {
                  const isSelected = (filters.parking || 'Any') === opt;
                  return (
                    <motion.button
                      key={opt}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setFilter('parking', opt === 'Any' ? '' : opt)}
                      className={`min-h-11 rounded-lg text-xs font-semibold transition-colors border flex items-center justify-center cursor-pointer ${FOCUS_RING} ${
                        isSelected
                          ? 'bg-primary text-white border-primary hover:bg-primary-hover shadow-xs'
                          : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
                      }`}
                    >
                      {opt === 'Any' ? 'Any' : `${opt} Slot${opt === '1+' ? '' : 's'}`}
                    </motion.button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <FilterSectionHeader
                icon={Sofa}
                title="Furnishing"
                context="Move-in setup of the home"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {FURNISHING_OPTIONS.map(({ value, label }) => {
                  const isSelected = filters.furnishing === value;
                  return (
                    <motion.button
                      key={value}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFilter('furnishing', isSelected ? '' : value)}
                      className={`min-h-11 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border flex items-center justify-center text-center cursor-pointer ${FOCUS_RING} ${
                        isSelected
                          ? 'bg-primary text-white border-primary hover:bg-primary-hover shadow-xs'
                          : 'bg-surface-variant text-on-surface border-outline hover:border-outline-variant'
                      }`}
                    >
                      {label}
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {/* 4. Partnered Banks */}
            <section className="space-y-3">
              <FilterSectionHeader
                icon={Landmark}
                title="Partnered Banks"
                context="Filter homes accredited with your preferred bank or Pag-IBIG Fund"
              />
              <PartneredBankMultiSelect
                id="public-filter-bank-picker"
                selectedBankNames={selectedBanks}
                onToggleBank={handleToggleBank}
                onClearAll={() => setFilter('banks', [])}
              />
              {selectedBanks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedBanks.map((bank) => (
                    <span
                      key={bank}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-container text-primary text-xs font-semibold border border-primary/20"
                    >
                      <Landmark className="size-3 shrink-0" aria-hidden="true" />
                      <span>{bank}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${bank}`}
                        onClick={() => handleToggleBank(bank)}
                        className="hover:text-red-600 cursor-pointer rounded-full"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="px-6 py-4 border-t border-outline bg-surface flex flex-row items-center justify-between gap-4 shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClearAll}
              className="h-11 px-4 text-xs font-semibold text-on-surface-variant hover:text-red-600 cursor-pointer gap-1.5"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              <span>Reset All</span>
            </Button>

            <Button
              type="button"
              onClick={onClose}
              className="h-12 px-6 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm gap-2 cursor-pointer tabular-nums"
            >
              <span>
                Show {totalCount} {totalCount === 1 ? 'Home' : 'Homes'}
              </span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </MotionConfig>
  );
}
