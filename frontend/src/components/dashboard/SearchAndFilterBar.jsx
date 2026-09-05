import React from 'react';

export default function SearchAndFilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  extraActions,
  className = ""
}) {
  return (
    <div className={`flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6 ${className}`}>
      {/* Search Input - Strictly h-[54px] */}
      <div className="relative flex-1">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
          search
        </span>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-[54px] pl-11 pr-4 bg-white border border-gray-200/80 rounded-xl text-sm font-sans text-gray-800 placeholder-gray-400 focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] transition-all outline-none"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange && onSearchChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Filter Dropdowns - Strictly h-[54px] */}
      {filters.map((filter, idx) => (
        <div key={idx} className="relative min-w-[160px]">
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="w-full h-[54px] px-4 pr-10 bg-white border border-gray-200/80 rounded-xl text-sm font-sans text-gray-700 focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] transition-all outline-none appearance-none cursor-pointer"
          >
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[20px]">
            expand_more
          </span>
        </div>
      ))}

      {/* Extra Action Buttons - Matching h-[54px] */}
      {extraActions && (
        <div className="flex items-center gap-2">
          {extraActions}
        </div>
      )}
    </div>
  );
}
