import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';

import {
  UnifiedSearchBar,
  AllFiltersDrawer,
  PropertyCard,
  PropertyMap,
  GooglePropertyMap,
  StreetViewModal,
  FilterEmptyState,
  Button
} from '../../components/ui';
import { usePropertyFilterEngine } from '../../hooks/usePropertyFilterEngine';
import { propertyService } from '../../services/propertyService';

export default function PropertiesPage() {
  const [searchParams] = useSearchParams();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [sortBy, setSortBy] = useState('Newest');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'grid'
  const [mobileTab, setMobileTab] = useState('list'); // 'list' | 'map'
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);
  const [targetDistrict, setTargetDistrict] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showActiveFilters, setShowActiveFilters] = useState(false);
  const [streetViewData, setStreetViewData] = useState(null);

  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic header visibility listener
  useEffect(() => {
    const handleHeaderVisibility = (e) => {
      setIsHeaderVisible(e.detail?.isVisible ?? true);
    };
    window.addEventListener('header-visibility', handleHeaderVisibility);
    return () => window.removeEventListener('header-visibility', handleHeaderVisibility);
  }, []);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setIsLoading(true);
        const res = await propertyService.getProperties({ limit: 100 });
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

  // When switching to Grid View, clear geographic map bounding box restriction
  useEffect(() => {
    if (viewMode === 'grid') {
      setFilter('mapBounds', null);
    }
  }, [viewMode, setFilter]);

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
      const width = window.innerWidth;
      if (viewMode === 'split') {
        if (width < 640) setColumns(1);
        else if (width < 1024) setColumns(2); // full width on mobileTab === 'list'
        else if (width < 1280) setColumns(1); // 50% split on 1024px laptop
        else setColumns(2);                   // 50% split on 1280px+ desktop
      } else {
        if (width < 640) setColumns(1);
        else if (width < 1024) setColumns(2);
        else if (width < 1536) setColumns(3);
        else setColumns(4);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(displayedProperties.length / columns),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 520,
    overscan: 4,
  });

  const handleLoadMore = () => {
    setDisplayLimit((prev) => Math.min(prev + 6, filteredProperties.length));
  };

  const hoverScrollTimeoutRef = useRef(null);

  const scrollToPropertyCard = useCallback((propId) => {
    if (!propId) return;

    // Check if property is within current displayLimit; if beyond, expand displayLimit to render it
    const fullIndex = sortedProperties.findIndex((p) => String(p.id) === String(propId));
    if (fullIndex !== -1 && fullIndex >= displayLimit) {
      setDisplayLimit((prev) => Math.max(prev, fullIndex + 4));
    }

    // Scroll using rowVirtualizer if index is known
    if (fullIndex !== -1) {
      const rowIndex = Math.floor(fullIndex / columns);
      if (rowVirtualizer && typeof rowVirtualizer.scrollToIndex === 'function') {
        rowVirtualizer.scrollToIndex(rowIndex, { align: 'center', behavior: 'smooth' });
      }
    }

    // Also attempt DOM element scroll for smooth centering
    setTimeout(() => {
      const cardEl =
        document.getElementById(`property-card-${propId}`) ||
        document.getElementById(`property-card-${String(propId)}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  }, [sortedProperties, displayLimit, columns, rowVirtualizer]);

  const handleSelectProperty = useCallback((property) => {
    const propId =
      property?.id ||
      property?.ListingKey ||
      property?.listingKey ||
      property?.ListingId ||
      property?.listingId;
    if (!propId) return;
    setSelectedPropertyId(propId);
    if (window.innerWidth < 1024) {
      setMobileTab('list');
    }
    scrollToPropertyCard(propId);
  }, [scrollToPropertyCard]);

  const handleHoverProperty = useCallback((property) => {
    if (!property) {
      setHoveredPropertyId(null);
      return;
    }
    const propId = property.id || property;
    setHoveredPropertyId(propId);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverScrollTimeoutRef.current) clearTimeout(hoverScrollTimeoutRef.current);
    };
  }, []);

  return (
    <div className="bg-[#F8FAFC] h-screen overflow-hidden w-full flex flex-col">
      {/* Top spacing below fixed navigation header */}
      <div 
        className={`shrink-0 transition-all duration-300 ease-in-out ${
          isHeaderVisible ? 'h-16 md:h-20' : 'h-0'
        }`} 
      />

      {/* Main Container */}
      <div className="flex-1 w-full px-3 sm:px-4 md:px-6 lg:px-8 flex flex-col overflow-hidden pb-4 min-h-0">
        {/* Unified Search Bar & Quick District Chips (Non-sticky) */}
        <div className="shrink-0 pt-2 pb-2 transition-all z-20">
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

        {/* Active Filter Chips Ribbon (only rendered when filters are active) */}
        {activeFilterCount > 0 && (
          <div className="shrink-0 flex items-center gap-2 py-1 mb-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 text-[10px] font-bold font-sans uppercase tracking-wider text-[#0F766E] shrink-0 mr-1">
              <span className="material-symbols-outlined text-[14px]">tune</span>
              <span>Filtered ({activeFilterCount})</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {Object.entries(filters).map(([key, value]) => {
                if (!value || value === '' || value === 'Any' || key === 'mapBounds') return null;
                if (Array.isArray(value) && value.length === 0) return null;
                
                let displayValue = String(value);
                if (key === 'minPrice') displayValue = `> ₱${(value / 1000000).toFixed(0)}M`;
                else if (key === 'maxPrice') displayValue = `< ₱${(value / 1000000).toFixed(0)}M`;
                else if (key === 'keyword') displayValue = `"${value}"`;
                else if (key === 'propertyType') displayValue = `Type: ${value}`;
                else if (key === 'district') displayValue = `District: ${value}`;
                else if (key === 'beds') displayValue = `${value} Beds`;
                else if (key === 'baths') displayValue = `${value} Baths`;

                if (!displayValue || displayValue.trim() === '') return null;

                return (
                  <div key={key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0F766E]/10 text-[#0F766E] rounded-full text-[10px] font-bold font-sans uppercase tracking-wider border border-[#0F766E]/20 transition-all hover:bg-[#0F766E]/15 shrink-0">
                    <span>{displayValue}</span>
                    <button type="button" onClick={() => clearSpecificFilter(key)} className="hover:text-red-500 cursor-pointer flex items-center justify-center transition-colors">
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>
                );
              })}
              <button type="button" onClick={clearFilters} className="text-[10px] font-bold text-gray-500 hover:text-gray-800 uppercase tracking-widest cursor-pointer ml-1 transition-colors shrink-0">
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Results Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 min-h-[360px] w-full" role="status" aria-label="Loading properties">
            <div className="w-10 h-10 border-3 border-[#0F766E]/20 border-t-[#0F766E] rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-500">Loading firm property listings...</p>
          </div>
        ) : viewMode === 'split' ? (
          <div className="flex-1 overflow-hidden w-full min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start h-full">
            {/* Left Pane: Property Cards Grid or Empty State */}
            <div
              ref={parentRef}
              data-lenis-prevent="true"
              data-testid="properties-scroll-container"
              className={`h-full min-h-0 overflow-y-auto overscroll-contain pr-2 custom-scrollbar w-full lg:col-span-6 xl:col-span-6 ${
                mobileTab === 'map' ? 'hidden lg:block' : 'block'
              }`}
            >
              {displayedProperties && displayedProperties.length > 0 ? (
                <>
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
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 pb-8"
                        >
                          {rowItems.map((property, idx) => (
                            <motion.div
                              key={property.id}
                              id={`property-card-${property.id}`}
                              className={`h-full transition-all duration-300 rounded-2xl ${
                                selectedPropertyId === property.id
                                  ? 'ring-3 ring-[#0F766E] shadow-2xl scale-[1.02] bg-teal-50/20'
                                  : hoveredPropertyId === property.id
                                    ? 'ring-2 ring-[#0F766E] shadow-lg scale-[1.01] bg-teal-50/10'
                                    : ''
                              }`}
                              onMouseEnter={() => setHoveredPropertyId(property.id)}
                              onMouseLeave={() => setHoveredPropertyId(null)}
                              initial={{ opacity: 0, scale: 0.95, y: 30 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: idx * 0.08 }}
                            >
                              <PropertyCard
                                property={property}
                                variant="vertical"
                                isSelected={selectedPropertyId === property.id}
                                isHovered={hoveredPropertyId === property.id}
                                onMouseEnter={() => setHoveredPropertyId(property.id)}
                                onMouseLeave={() => setHoveredPropertyId(null)}
                              />
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
                        className="bg-[#0F766E] hover:bg-[#115E59] text-white shadow-[0_10px_30px_rgba(15,118,110,0.2)] hover:-translate-y-1 transition-all border-none font-bold tracking-widest text-[12px] px-8 cursor-pointer"
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
                        <span className="material-symbols-outlined text-[#0F766E] text-sm">check_circle</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-sans">
                          All {filteredProperties.length} Residences Displayed
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8">
                  <FilterEmptyState
                    tightestFilter={tightestFilter}
                    onClearFilter={() => tightestFilter && clearSpecificFilter(tightestFilter.key)}
                    onResetAll={clearFilters}
                  />
                </div>
              )}
            </div>

            {/* Right Pane: Interactive Geographical Map Split Plane (RIGHT SIDE) */}
            <div
              className={`w-full h-full lg:col-span-6 xl:col-span-6 rounded-3xl overflow-hidden shadow-lg border border-gray-200/90 z-20 bg-gray-50 ${
                mobileTab === 'list' ? 'hidden lg:block' : 'block'
              }`}
            >
              <GooglePropertyMap
                properties={filteredProperties}
                selectedPropertyId={selectedPropertyId}
                hoveredPropertyId={hoveredPropertyId}
                onSelectProperty={handleSelectProperty}
                onHoverProperty={handleHoverProperty}
                onBoundsChange={(bounds) => setFilter('mapBounds', bounds)}
                targetDistrict={targetDistrict}
                onOpenStreetView={(coords) => setStreetViewData({ coordinates: coords, title: 'Luxury Residence' })}
              />
            </div>
          </div>
        ) : displayedProperties && displayedProperties.length > 0 ? (
          <div className="flex-1 overflow-hidden w-full min-h-0 h-full">
            <div
              ref={parentRef}
              data-lenis-prevent="true"
              data-testid="properties-scroll-container"
              className="h-full min-h-0 overflow-y-auto overscroll-contain pr-2 custom-scrollbar w-full"
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
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 pb-12"
                    >
                      {rowItems.map((property, idx) => (
                        <motion.div
                          key={property.id}
                          id={`property-card-${property.id}`}
                          className={`h-full transition-all duration-300 rounded-2xl ${
                            selectedPropertyId === property.id
                              ? 'ring-3 ring-[#0F766E] shadow-2xl scale-[1.02] bg-teal-50/20'
                              : hoveredPropertyId === property.id
                                ? 'ring-2 ring-[#0F766E] shadow-lg scale-[1.01] bg-teal-50/10'
                                : ''
                          }`}
                          onMouseEnter={() => setHoveredPropertyId(property.id)}
                          onMouseLeave={() => setHoveredPropertyId(null)}
                          initial={{ opacity: 0, scale: 0.95, y: 30 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: idx * 0.08 }}
                        >
                          <PropertyCard
                            property={property}
                            variant="vertical"
                            isSelected={selectedPropertyId === property.id}
                            isHovered={hoveredPropertyId === property.id}
                            onMouseEnter={() => setHoveredPropertyId(property.id)}
                            onMouseLeave={() => setHoveredPropertyId(null)}
                          />
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
                    className="bg-[#0F766E] hover:bg-[#115E59] text-white shadow-[0_10px_30px_rgba(15,118,110,0.2)] hover:-translate-y-1 transition-all border-none font-bold tracking-widest text-[12px] px-8 cursor-pointer"
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
                    <span className="material-symbols-outlined text-[#0F766E] text-sm">check_circle</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-sans">
                      All {filteredProperties.length} Residences Displayed
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Algorithmic Empty State Recovery in Grid Mode */
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
              className="flex items-center gap-2 px-5 py-3 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-xl active:scale-95 transition-all border border-[#FF6B6B]/40 backdrop-blur-md cursor-pointer"
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
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      {/* 360° Street View Modal */}
      {streetViewData && (
        <StreetViewModal
          isOpen={Boolean(streetViewData)}
          coordinates={streetViewData.coordinates}
          propertyTitle={streetViewData.title}
          onClose={() => setStreetViewData(null)}
        />
      )}
    </div>
  );
}
