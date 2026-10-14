import React from 'react';
import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function SearchAndFilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search by title, address, agent, or property type...",
  filters = [],
  onFilterClick,
  extraActions,
  className = ""
}) {
  return (
    <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center gap-3", className)}>
      {/* Search Input - Clean 40px height */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-10 pl-10 pr-9 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all shadow-2xs"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange && onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right Controls Container */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Filter Dropdowns */}
        {filters.map((filter, idx) => (
          <div key={idx} className="relative min-w-[140px]">
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full h-10 pl-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition-all appearance-none cursor-pointer shadow-2xs"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        ))}

        {/* Square Filter Button matching mockup */}
        <button
          type="button"
          onClick={onFilterClick}
          className="h-10 w-10 flex items-center justify-center rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs shrink-0"
          title="Filter preferences"
          aria-label="Filter preferences"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Extra Action Buttons */}
        {extraActions}
      </div>
    </div>
  );
}
