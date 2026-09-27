import React from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export default function SearchAndFilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search by title, location, or ID...",
  filters = [],
  extraActions,
  className = ""
}) {
  return (
    <div className={cn("flex flex-col md:flex-row items-stretch md:items-center gap-3", className)}>
      {/* Search Input - Clean 40px height */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-10 pl-10 pr-9 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0D4446] focus:border-[#0D4446] transition-all"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange && onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {filters.map((filter, idx) => (
        <div key={idx} className="relative min-w-[150px]">
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="w-full h-10 px-3 pr-8 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0D4446] focus:border-[#0D4446] transition-all appearance-none cursor-pointer"
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

      {/* Extra Action Buttons */}
      {extraActions && (
        <div className="flex items-center gap-2 shrink-0">
          {extraActions}
        </div>
      )}
    </div>
  );
}
