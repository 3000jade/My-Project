import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FINANCING_OPTIONS = [
  'Pag-IBIG Housing Loan',
  'Bank Financing',
  'Assume Balance / Pasalo',
  'In-House Financing',
  'Cash'
];

const TURNOVER_OPTIONS = [
  'Fully Furnished',
  'Semi-Furnished',
  'Bare / Unfurnished'
];

const LIFESTYLE_OPTIONS = [
  'Pet-Friendly Community',
  'Flood-Free Area',
  'Private Balcony',
  'Maid Room',
  '24/7 Gated Security'
];

const BATH_OPTIONS = ['Any', '1', '2', '3', '4+'];
const FLOOR_OPTIONS = ['Any', 'Low', 'Mid', 'High', 'Penthouse'];

export default function AllFiltersDrawer({
  isOpen,
  onClose,
  filters,
  setFilter,
  facets = {},
  totalCount = 0,
  onClearAll
}) {
  const toggleArrayFilter = (key, value) => {
    const current = filters[key] || [];
    if (current.includes(value)) {
      setFilter(key, current.filter(item => item !== value));
    } else {
      setFilter(key, [...current, value]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative z-10 w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
              <div>
                <h2 className="text-xl font-extrabold font-display text-[#174849] tracking-tight">
                  All Filters & Specifications
                </h2>
                <p className="text-xs text-gray-500 font-sans mt-0.5">
                  Refine luxury residences by Philippine financing and lifestyle features
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Close filters"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Scrollable Filter Body (Lenis isolated) */}
            <div
              data-lenis-prevent="true"
              className="flex-1 overflow-y-auto px-6 py-6 space-y-8 text-gray-800"
            >
              {/* 1. Financing & Payment Terms */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#174849] font-sans">
                    Financing & Payment Terms
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-400">Multi-select</span>
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
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#174849] text-white border-[#174849] shadow-sm'
                            : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span>{term}</span>
                        {count > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-600'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Bathrooms */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#174849] font-sans mb-3">
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
                        className={`h-[44px] rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#174849] text-white border-[#174849] shadow-sm'
                            : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Turnover / Furnishing Status */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#174849] font-sans mb-3">
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
                        className={`h-[48px] px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center text-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#174849] text-white border-[#174849] shadow-sm'
                            : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Lifestyle & Community Rules */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#174849] font-sans">
                    Lifestyle & Community Rules
                  </h3>
                  <span className="text-[11px] font-semibold text-gray-400">Philippine Essentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {LIFESTYLE_OPTIONS.map((rule) => {
                    const isSelected = (filters.communityRules || []).includes(rule);
                    return (
                      <button
                        key={rule}
                        type="button"
                        onClick={() => toggleArrayFilter('communityRules', rule)}
                        className={`p-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-between text-left cursor-pointer ${
                          isSelected
                            ? 'bg-[#174849]/5 border-[#174849] text-[#174849]'
                            : 'bg-gray-50/80 border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span>{rule}</span>
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[11px] ${
                            isSelected ? 'bg-[#174849] text-white border-[#174849]' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && '✓'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Floor Level (For Condominiums & Penthouses) */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#174849] font-sans mb-3">
                  Floor Level
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FLOOR_OPTIONS.filter(o => o !== 'Any').map((level) => {
                    const isSelected = filters.floorLevel === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setFilter('floorLevel', isSelected ? '' : level)}
                        className={`h-[44px] rounded-xl text-xs font-bold transition-all border flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#174849] text-white border-[#174849] shadow-sm'
                            : 'bg-gray-50/80 text-gray-700 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky Drawer Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between gap-4 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-bold text-gray-500 hover:text-[#E76F51] underline transition-colors cursor-pointer"
              >
                Clear All
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 h-[48px] bg-[#174849] hover:bg-[#113536] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Show {totalCount} {totalCount === 1 ? 'Residence' : 'Residences'}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
