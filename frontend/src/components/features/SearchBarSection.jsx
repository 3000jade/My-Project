import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function SearchBarSection({ onSearch }) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ keyword, type: propertyType, priceRange });
    } else {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (propertyType) params.append('type', propertyType);
      if (priceRange) params.append('price', priceRange);
      
      navigate(`/properties?${params.toString()}`);
    }
  };

  const handleQuickSearch = (location) => {
    setKeyword(location);
    if (onSearch) {
      onSearch({ keyword: location, type: propertyType, priceRange });
    } else {
      const params = new URLSearchParams();
      params.append('keyword', location);
      navigate(`/properties?${params.toString()}`);
    }
  };

  return (
    <div className="sticky top-20 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 shadow-md py-4">
      <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop">
        <form
          onSubmit={handleSearch}
          className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/50 p-2 flex flex-col lg:flex-row gap-2 lg:items-center"
        >
          {/* Keyword Search */}
          <motion.div
            animate={{ scale: isFocused ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex-1 flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-lg border border-transparent focus-within:border-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-primary-container">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-body-md w-full placeholder-on-surface-variant/60"
              placeholder="Location, Project, or Developer"
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </motion.div>
          <div className="flex flex-wrap lg:flex-nowrap gap-2 items-center">
            {/* Property Type */}
            <div className="relative group min-w-[140px] flex-1 lg:flex-none">
              <select
                className="appearance-none bg-surface-container-low border border-transparent hover:border-outline-variant rounded-lg px-4 py-2 text-label-md font-label-md text-on-surface-variant w-full focus:ring-1 focus:ring-primary-container cursor-pointer pr-10"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="">Property Type</option>
                <option value="House">House</option>
                <option value="Condo">Condo</option>
                <option value="Lot">Lot</option>
                <option value="Townhouse">Townhouse</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">keyboard_arrow_down</span>
            </div>
            {/* Price Range */}
            <div className="relative group min-w-[160px] flex-1 lg:flex-none">
              <select
                className="appearance-none bg-surface-container-low border border-transparent hover:border-outline-variant rounded-lg px-4 py-2 text-label-md font-label-md text-on-surface-variant w-full focus:ring-1 focus:ring-primary-container cursor-pointer pr-10"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option value="">Price Range</option>
                <option value="5-20">₱5M - ₱20M</option>
                <option value="20-50">₱20M - ₱50M</option>
                <option value="50-100">₱50M - ₱100M</option>
                <option value="100+">₱100M+</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">payments</span>
            </div>
            <div className="h-8 w-[1px] bg-outline-variant hidden lg:block mx-1"></div>
            {/* More Filters */}
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-primary-container hover:bg-primary-container/10 rounded-lg text-label-md font-label-md transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[20px]">tune</span>
              <span className="hidden sm:inline">More Filters</span>
            </button>
            {/* Search Button */}
            <button
              type="submit"
              className="bg-primary text-on-primary px-8 py-3 rounded-lg text-label-lg premium-btn flex items-center justify-center gap-2 min-w-[100px]"
            >
              Search
            </button>
          </div>
        </form>
        {/* Filter Quick Tags */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          <span className="text-label-sm text-on-surface-variant font-semibold mr-2 uppercase tracking-wider">Quick:</span>
          <button onClick={() => handleQuickSearch('')} type="button" className="px-3 py-1 bg-primary text-on-primary rounded-full text-label-sm whitespace-nowrap">All</button>
          {['Metro Manila', 'Laguna', 'Cebu', 'Pampanga', 'Batangas'].map(location => (
            <button
              key={location}
              onClick={() => handleQuickSearch(location)}
              type="button"
              className="px-3 py-1 bg-surface-container-high text-on-surface-variant hover:bg-secondary-container rounded-full text-label-sm transition-colors border border-outline-variant/30 whitespace-nowrap"
            >
              {location}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
