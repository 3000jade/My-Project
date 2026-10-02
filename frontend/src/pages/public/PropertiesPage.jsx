import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';

import {
  UnifiedSearchBar,
  AllFiltersDrawer,
  PropertyCard,
  PropertyMap,
  FilterEmptyState,
  Button
} from '../../components/ui';
import { usePropertyFilterEngine } from '../../hooks/usePropertyFilterEngine';
import { propertyService } from '../../services/propertyService';

export default function PropertiesPage() {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('Newest');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'grid'
  const [mobileTab, setMobileTab] = useState('list'); // 'list' | 'map'
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);
  const [targetDistrict, setTargetDistrict] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showActiveFilters, setShowActiveFilters] = useState(false);

  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setIsLoading(true);
        const res = await propertyService.getProperties();
        if (res && res.data) {
          setProperties(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProperties();
  }, []);

  // Hook-driven unified filter engine
  const {
    filteredProperties,
    facets,
    filters,
    activeFilterCount,
    tightestFilter,
    setFilter,
    clearFilters,
    clearSpecificFilter
  } = usePropertyFilterEngine(properties);

  // Sync URL search params into the filter engine
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const locationParam = searchParams.get('location');
    const budgetParam = searchParams.get('budget');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const searchParam = searchParams.get('search');

    if (typeParam) {
      setFilter('propertyType', typeParam);
    }
    if (locationParam) {
      setFilter('keyword', locationParam);
    } else if (searchParam) {
      setFilter('keyword', searchParam);
    }

    if (minPriceParam) {
      setFilter('minPrice', Number(minPriceParam));
    }
    if (maxPriceParam) {
      setFilter('maxPrice', Number(maxPriceParam));
    }

    if (budgetParam) {
      if (budgetParam === 'under-3m') {
        setFilter('maxPrice', 3000000);
      } else if (budgetParam === '3m-8m') {
        setFilter('minPrice', 3000000);
        setFilter('maxPrice', 8000000);
      } else if (budgetParam === 'above-8m') {
        setFilter('minPrice', 8000000);
      }
    }
  }, [searchParams, setFilter]);

  const [displayLimit, setDisplayLimit] = useState(8);

  // Sorting
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    if (sortBy === 'Price: High to Low') {
      const priceA = a.price_raw || Number(String(a.price || '').replace(/[^0-9.-]+/g, '')) || 0;
      const priceB = b.price_raw || Number(String(b.price || '').replace(/[^0-9.-]+/g, '')) || 0;
      return priceB - priceA;
    }
    if (sortBy === 'Price: Low to High') {
      const priceA = a.price_raw || Number(String(a.price || '').replace(/[^0-9.-]+/g, '')) || 0;
      const priceB = b.price_raw || Number(String(b.price || '').replace(/[^0-9.-]+/g, '')) || 0;
      return priceA - priceB;
    }
    return 0;
  });

  const displayedProperties = sortedProperties.slice(0, displayLimit);

  // Responsive columns logic for virtualizer
  const [columns, setColumns] = useState(2);
  const parentRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth < 1024;
      if (viewMode === 'split') {
        setColumns(isMobile ? 1 : 2);
      } else {
        if (isMobile) setColumns(1);
        else if (isTablet) setColumns(2);
        else setColumns(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(displayedProperties.length / columns),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 540,
    overscan: 2,
  });

  const handleLoadMore = () => {
    setDisplayLimit((prev) => Math.min(prev + 6, filteredProperties.length));
  };

  const handleSelectProperty = (property) => {
    setSelectedPropertyId(property.id);
    if (window.innerWidth < 1024) {
      setMobileTab('list');
    }
    setTimeout(() => {
      const cardEl = document.getElementById(`property-card-${property.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="bg-[#FBFBF9] h-screen overflow-hidden w-full flex flex-col">
      {/* Top spacing below fixed navigation header */}
      <div className="h-[80px] shrink-0" />

      {/* Main Container */}
      <div className="flex-1 w-full px-4 md:px-6 lg:px-8 flex flex-col overflow-hidden pb-4">
        {/* Unified Search Bar & Quick District Chips (Non-sticky) */}
        <div className="shrink-0 pt-2 pb-4">
          <UnifiedSearchBar
            filters={filters}
            setFilter={setFilter}
            onOpenFiltersDrawer={() => setIsDrawerOpen(true)}
            activeFilterCount={activeFilterCount}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onFlyToDistrict={(preset) => setTargetDistrict(preset)}
          />
        </div>

        {/* Portfolio Section Header */}
        <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-end my-4 border-b border-gray-200/60 pb-4 gap-4">
          <div>
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3 min-h-[32px]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold font-sans uppercase tracking-[0.15em] text-[#174849] shrink-0 mr-1">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Active Filtering ({activeFilterCount})
                </div>

                <div className="flex flex-wrap items-center gap-2">
                      {Object.entries(filters).map(([key, value]) => {
                        if (!value || value === '' || value === 'Any' || key === 'mapBounds') return null;
                        if (Array.isArray(value) && value.length === 0) return null;
                        
                        let displayValue = String(value);
                        if (key === 'minPrice') displayValue = `> ₱${(value / 1000000).toFixed(0)}M`;
                        else if (key === 'maxPrice') displayValue = `< ₱${(value / 1000000).toFixed(0)}M`;
                        else if (key === 'keyword') displayValue = `Search: "${value}"`;
                        else if (key === 'propertyType') displayValue = `Type: ${value}`;
                        else if (key === 'district') displayValue = `District: ${value}`;
                        else if (key === 'beds') displayValue = `Beds: ${value}`;
                        else if (key === 'baths') displayValue = `Baths: ${value}`;

                        if (!displayValue || displayValue.trim() === '') return null;

                        return (
                          <div key={key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#174849]/10 text-[#174849] rounded-full text-[10px] font-bold font-sans uppercase tracking-wider border border-[#174849]/20 transition-all hover:bg-[#174849]/15 shrink-0">
                            <span>{displayValue}</span>
                            <button type="button" onClick={() => clearSpecificFilter(key)} className="hover:text-red-500 cursor-pointer flex items-center justify-center transition-colors">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </div>
                        );
                      })}
                      {activeFilterCount > 0 && (
                        <button type="button" onClick={clearFilters} className="text-[10px] font-bold text-gray-500 hover:text-gray-800 uppercase tracking-widest cursor-pointer ml-1 transition-colors shrink-0">
                          Clear All
                        </button>
                      )}
                </div>
              </div>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-display text-[#174849] tracking-tight">
              Available Properties
            </h1>
          </div>

          {/* Controls: Sort Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">
                Sort
              </span>
              <div className="relative">
                <select
                  className="appearance-none bg-white border border-gray-200 rounded-xl text-[12px] font-bold uppercase tracking-wider text-[#174849] font-sans py-2 pr-9 pl-3.5 focus:border-[#174849] focus:ring-1 focus:ring-[#174849] outline-none shadow-sm cursor-pointer transition-all hover:border-[#174849]/50"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Newest">Newest Additions</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#174849]/50 text-[18px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {displayedProperties && displayedProperties.length > 0 ? (
          <div className={`flex-1 overflow-hidden w-full ${viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start' : ''}`}>
            {/* Left Pane: Property Cards Grid (Visible on mobile when mobileTab === 'list' or in grid mode) */}
            <div
              ref={parentRef}
              className={`h-full overflow-y-auto pr-2 custom-scrollbar w-full ${viewMode === 'split'
                  ? `lg:col-span-6 xl:col-span-6 ${mobileTab === 'map' ? 'hidden lg:block' : 'block'}`
                  : 'w-full'
                }`}
            >
              <div
                className="w-full relative"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const startIndex = virtualRow.index * columns;
                  const rowItems = displayedProperties.slice(startIndex, startIndex + columns);

                  return (
                    <div
                      key={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className={`grid ${viewMode === 'split'
                          ? 'grid-cols-1 sm:grid-cols-2 gap-6 pb-8'
                          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 pb-12'
                        }`}
                    >
                      {rowItems.map((property, idx) => (
                        <motion.div
                          key={property.id}
                          id={`property-card-${property.id}`}
                          className={`h-full transition-all duration-300 rounded-2xl ${selectedPropertyId === property.id
                              ? 'ring-2 ring-[#E76F51] shadow-2xl scale-[1.01]'
                              : hoveredPropertyId === property.id
                                ? 'ring-2 ring-[#174849]/70 shadow-lg'
                                : ''
                            }`}
                          onMouseEnter={() => setHoveredPropertyId(property.id)}
                          onMouseLeave={() => setHoveredPropertyId(null)}
                          initial={{ opacity: 0, scale: 0.95, y: 30 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: idx * 0.08 }}
                        >
                          <PropertyCard property={property} variant="vertical" />
                        </motion.div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Pagination / Load More Footer */}
              {filteredProperties && displayedProperties.length < filteredProperties.length && (
                <div className="flex flex-col items-center justify-center mt-12 mb-16 gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    icon="expand_more"
                    onClick={handleLoadMore}
                    className="bg-[#174849] hover:bg-[#113536] text-white shadow-[0_10px_30px_rgba(23,72,73,0.2)] hover:-translate-y-1 transition-all border-none font-bold tracking-widest text-[12px] px-8 cursor-pointer"
                  >
                    Load More Residences
                  </Button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans">
                    Showing {displayedProperties.length} of {filteredProperties.length}
                  </span>
                </div>
              )}

              {displayedProperties.length === filteredProperties.length && filteredProperties.length > 0 && (
                <div className="flex justify-center mt-16 mb-16">
                  <div className="inline-flex items-center gap-3 px-6 py-2 bg-gray-50 rounded-full border border-gray-100">
                    <span className="material-symbols-outlined text-[#174849] text-sm">check_circle</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-sans">
                      All {filteredProperties.length} Residences Displayed
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Pane: Interactive Geographical Map Split Plane (RIGHT SIDE) */}
            {viewMode === 'split' && (
              <div
                className={`w-full h-full lg:col-span-6 xl:col-span-6 rounded-3xl overflow-hidden shadow-lg border border-gray-200/90 z-20 bg-gray-50 ${mobileTab === 'list' ? 'hidden lg:block' : 'block'
                  }`}
              >
                <PropertyMap
                  properties={filteredProperties}
                  selectedPropertyId={selectedPropertyId}
                  hoveredPropertyId={hoveredPropertyId}
                  onSelectProperty={handleSelectProperty}
                  onBoundsChange={(bounds) => setFilter('mapBounds', bounds)}
                  targetDistrict={targetDistrict}
                />
              </div>
            )}
          </div>
        ) : (
          /* Algorithmic Empty State Recovery */
          <div className="mt-8 mb-16">
            <FilterEmptyState
              tightestFilter={tightestFilter}
              onClearFilter={() => tightestFilter && clearSpecificFilter(tightestFilter.key)}
              onResetAll={clearFilters}
            />
          </div>
        )}

        {/* Mobile Floating View Switcher Pill */}
        {viewMode === 'split' && (
          <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileTab((prev) => (prev === 'list' ? 'map' : 'list'))}
              className="flex items-center gap-2 px-5 py-3 bg-[#174849] hover:bg-[#113536] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-xl active:scale-95 transition-all border border-[#E76F51]/40 backdrop-blur-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {mobileTab === 'list' ? 'map' : 'format_list_bulleted'}
              </span>
              <span>{mobileTab === 'list' ? 'View Map' : 'View List'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Deep Specification Drawer */}
      <AllFiltersDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        filters={filters}
        setFilter={setFilter}
        facets={facets}
        totalCount={filteredProperties.length}
        onClearAll={clearFilters}
      />
    </div>
  );
}
