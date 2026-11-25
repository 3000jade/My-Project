import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  SlidersHorizontal,
  X,
  Search,
  MapPin,
  Home,
  Banknote,
  BedDouble,
  Bath,
  Car,
  Sofa,
  Landmark,
  Tag,
} from 'lucide-react';

import UnifiedSearchBar from '../../components/ui/search/UnifiedSearchBar';
import PropertyCard from '../../components/ui/cards/PropertyCard';
import GooglePropertyMap from '../../components/ui/map/GooglePropertyMap';
import FilterEmptyState from '../../components/ui/core/FilterEmptyState';
import Button from '../../components/ui/core/Button';
import { usePropertyFilterEngine, formatCompactPhp } from '../../hooks/usePropertyFilterEngine';
import { propertyService } from '../../services/propertyService';
import { getPropertyCoordinates } from '../../utils/propertyCoordinates';

const AllFiltersDrawer = lazy(() => import('../../components/ui/modals/AllFiltersDrawer'));

function extractAvailableLocations(list = []) {
  const byKey = new Map();

  list.forEach((property) => {
    const city = (property?.city || property?.location_raw?.city || property?.location?.city || '').trim();
    const province = (
      property?.state_or_province ||
      property?.province ||
      property?.location_raw?.stateOrProvince ||
      property?.location?.state ||
      property?.location?.stateOrProvince ||
      ''
    ).trim();
    const fallbackLoc = typeof property?.location === 'string' ? property.location.trim() : '';
    const label = city || province || fallbackLoc;
    if (!label) return;

    const key = label.toLowerCase();
    const coords = getPropertyCoordinates(property);
    const hasCoords = Boolean(coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng));

    if (!byKey.has(key)) {
      byKey.set(key, {
        name: label,
        count: 0,
        sumLat: 0,
        sumLng: 0,
        coordCount: 0,
      });
    }
    const entry = byKey.get(key);
    entry.count += 1;
    if (hasCoords) {
      entry.sumLat += coords.lat;
      entry.sumLng += coords.lng;
      entry.coordCount += 1;
    }
  });

  return Array.from(byKey.values())
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map((entry) => ({
      name: entry.name,
      count: entry.count,
      lat: entry.coordCount > 0 ? entry.sumLat / entry.coordCount : null,
      lng: entry.coordCount > 0 ? entry.sumLng / entry.coordCount : null,
      zoom: 13,
    }));
}

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

  const [properties, setProperties] = useState([]);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [serverPage, setServerPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);
  const lastParamsRef = useRef(null);

  // Dynamic header visibility listener
  useEffect(() => {
    const handleHeaderVisibility = (e) => {
      setIsHeaderVisible(e.detail?.isVisible ?? true);
    };
    window.addEventListener('header-visibility', handleHeaderVisibility);
    return () => window.removeEventListener('header-visibility', handleHeaderVisibility);
  }, []);

  // Hook-driven unified filter engine (skip strict client keyword re-filtering since Postgres runs fuzzy/FTS search)
  const {
    filteredProperties,
    facets,
    filters,
    debouncedFilters,
    activeFilterCount,
    tightestFilter,
    setFilter,
    clearFilters,
    clearSpecificFilter
  } = usePropertyFilterEngine(properties, { skipClientKeywordFilter: true });

  useEffect(() => {
    let cancelled = false;
    async function fetchProperties() {
      try {
        if (!hasLoadedOnceRef.current) {
          setIsLoading(true);
        }
        const sortParam =
          sortBy === 'Price: High to Low'
            ? 'price_desc'
            : sortBy === 'Price: Low to High'
              ? 'price_asc'
              : debouncedFilters.keyword?.trim()
                ? 'relevance'
                : 'newest';

        const params = {
          limit: 100,
          publicView: 'true',
          standardStatus: 'Active',
          sortBy: sortParam,
        };
        if (debouncedFilters.keyword?.trim()) params.search = debouncedFilters.keyword.trim();
        if (debouncedFilters.transactionType && debouncedFilters.transactionType !== 'All') {
          params.transactionType = debouncedFilters.transactionType;
        }
        if (debouncedFilters.propertyType && debouncedFilters.propertyType !== 'All') {
          params.propertyType = debouncedFilters.propertyType;
        }
        if (
          debouncedFilters.location &&
          debouncedFilters.location !== 'All' &&
          debouncedFilters.location !== 'All Locations' &&
          debouncedFilters.location !== 'All Metro Manila'
        ) {
          params.district = debouncedFilters.location;
        }
        if (debouncedFilters.minPrice) params.minPrice = debouncedFilters.minPrice;
        if (debouncedFilters.maxPrice) params.maxPrice = debouncedFilters.maxPrice;
        if (debouncedFilters.beds && debouncedFilters.beds !== 'Any') params.beds = debouncedFilters.beds;
        if (debouncedFilters.baths && debouncedFilters.baths !== 'Any') {
          const parsedBaths = Number(String(debouncedFilters.baths).replace(/[^0-9]/g, ''));
          if (parsedBaths > 0) params.baths = parsedBaths;
        }
        if (debouncedFilters.parking && debouncedFilters.parking !== 'Any') {
          const parsedParking = Number(String(debouncedFilters.parking).replace(/[^0-9]/g, ''));
          if (parsedParking > 0) params.parking = parsedParking;
        }
        if (debouncedFilters.furnishing && debouncedFilters.furnishing !== 'Any') {
          params.furnishing = debouncedFilters.furnishing;
        }
        if (Array.isArray(debouncedFilters.banks) && debouncedFilters.banks.length > 0) {
          params.banks = debouncedFilters.banks.join(',');
        }

        lastParamsRef.current = params;
        setDisplayLimit(8);
        const res = await propertyService.getProperties({ ...params, page: 1 });
        if (!cancelled && res && res.data) {
          setProperties(res.data);
          setServerPage(1);
          setTotalAvailable(Number(res.total ?? res.data.length));
          const extracted = extractAvailableLocations(res.data);
          if (!params.district) {
            setAvailableLocations(extracted);
          } else {
            setAvailableLocations((prev) => (prev.length > 0 ? prev : extracted));
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to fetch properties:', error);
        }
      } finally {
        if (!cancelled) {
          hasLoadedOnceRef.current = true;
          setIsLoading(false);
        }
      }
    }
    fetchProperties();
    return () => {
      cancelled = true;
    };
  }, [debouncedFilters, sortBy]);

  // Sync URL search params into the filter engine
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status') || searchParams.get('transactionType');
    const locationParam = searchParams.get('location');
    const budgetParam = searchParams.get('budget');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const searchParam = searchParams.get('search');

    if (statusParam) {
      setFilter('transactionType', statusParam);
    }
    if (typeParam) {
      setFilter('propertyType', typeParam);
    }
    if (locationParam) {
      setFilter('location', locationParam);
    }
    if (searchParam) {
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

  // Preserve server sort order (already sorted by price_asc / price_desc / relevance / newest)
  const sortedProperties = filteredProperties;

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

  const hasMoreServerPages = totalAvailable > properties.length;

  const handleLoadMore = async () => {
    if (displayLimit < filteredProperties.length) {
      setDisplayLimit((prev) => Math.min(prev + 6, filteredProperties.length));
      return;
    }
    if (hasMoreServerPages && !isLoadingMore && lastParamsRef.current) {
      setIsLoadingMore(true);
      try {
        const nextPage = serverPage + 1;
        const res = await propertyService.getProperties({ ...lastParamsRef.current, page: nextPage });
        if (res && Array.isArray(res.data) && res.data.length > 0) {
          setProperties((prev) => {
            const seen = new Set(prev.map((p) => String(p.id)));
            const fresh = res.data.filter((p) => !seen.has(String(p.id)));
            return [...prev, ...fresh];
          });
          setServerPage(nextPage);
          setTotalAvailable(Number(res.total ?? totalAvailable));
          setDisplayLimit((prev) => prev + 6);
        }
      } catch (err) {
        console.error('Failed to load next page of properties:', err);
      } finally {
        setIsLoadingMore(false);
      }
    }
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
    scrollToPropertyCard(propId);
  }, [scrollToPropertyCard]);

  const handleCardSelectProperty = useCallback((property) => {
    const propId =
      property?.id ||
      property?.ListingKey ||
      property?.listingKey ||
      property?.ListingId ||
      property?.listingId;
    if (!propId) return;
    setSelectedPropertyId(propId);
  }, []);

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
    <div
      className="h-screen overflow-hidden w-full flex flex-col"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: "url('/images/topographic-bg.svg')",
        backgroundRepeat: 'repeat',
        backgroundSize: '600px 600px',
      }}
    >
      {/* Top spacing below fixed navigation header */}
      <div
        className={`shrink-0 transition-all duration-300 ease-in-out ${isHeaderVisible ? 'h-16 md:h-20' : 'h-0'
          }`}
      />

      {/* Main Container */}
      <div className="flex-1 w-full px-3 sm:px-4 md:px-5 lg:px-6 flex flex-col overflow-hidden pb-3 min-h-0">
        {/* Unified Search Bar & Database Location Chips (z-30 so dropdowns never layer behind the z-0 map) */}
        <div
          data-testid="search-bar-container"
          className="relative z-30 shrink-0 pt-2 pb-2 transition-all"
        >
          <UnifiedSearchBar
            filters={filters}
            setFilter={setFilter}
            onOpenFiltersDrawer={() => setIsDrawerOpen(true)}
            activeFilterCount={activeFilterCount}
            viewMode={viewMode}
            setViewMode={setViewMode}
            availableLocations={availableLocations}
            onFlyToLocation={(loc) => setTargetDistrict(loc)}
          />
        </div>

        {/* Active Filter Chips Ribbon (animated enter/exit, icons, everyday labels) */}
        <AnimatePresence initial={false}>
          {activeFilterCount > 0 && (
            <motion.div
              key="active-filter-ribbon"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="shrink-0 overflow-hidden"
            >
              <div className="flex items-center gap-2 py-1 mb-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 text-xs font-semibold font-sans uppercase tracking-wider text-primary shrink-0 mr-1">
                  <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                  <span>Active ({activeFilterCount})</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <AnimatePresence initial={false}>
                    {Object.entries(filters).flatMap(([key, value]) => {
                      if (!value || value === '' || value === 'Any') return [];
                      if (key === 'transactionType' && value === 'All') return [];
                      if (Array.isArray(value)) {
                        return value.map((item) => ({
                          chipKey: `${key}-${item}`,
                          filterKey: key,
                          itemValue: item,
                          label: item,
                          icon: Landmark,
                        }));
                      }

                      let label = String(value);
                      let ChipIcon = Tag;
                      if (key === 'minPrice') {
                        label = `From ${formatCompactPhp(value)}`;
                        ChipIcon = Banknote;
                      } else if (key === 'maxPrice') {
                        label = `Up to ${formatCompactPhp(value)}`;
                        ChipIcon = Banknote;
                      } else if (key === 'keyword') {
                        label = `"${value}"`;
                        ChipIcon = Search;
                      } else if (key === 'propertyType') {
                        label = value;
                        ChipIcon = Home;
                      } else if (key === 'location' || key === 'district') {
                        label = value;
                        ChipIcon = MapPin;
                      } else if (key === 'beds') {
                        label = value === 'Studio' ? 'Studio' : `${value} Beds`;
                        ChipIcon = BedDouble;
                      } else if (key === 'baths') {
                        label = `${value} Baths`;
                        ChipIcon = Bath;
                      } else if (key === 'parking') {
                        label = `${value} Parking`;
                        ChipIcon = Car;
                      } else if (key === 'furnishing') {
                        label = value === 'None' ? 'Unfurnished' : value;
                        ChipIcon = Sofa;
                      } else if (key === 'transactionType') {
                        label = value;
                        ChipIcon = Tag;
                      }

                      return [{ chipKey: key, filterKey: key, itemValue: null, label, icon: ChipIcon }];
                    }).map(({ chipKey, filterKey, itemValue, label, icon: ChipIcon }) => (
                      <motion.div
                        key={chipKey}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-tertiary-container text-primary rounded-full text-xs font-semibold font-sans border border-primary/20 transition-colors shrink-0"
                      >
                        <ChipIcon className="size-3 shrink-0" aria-hidden="true" />
                        <span>{label}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${label}`}
                          onClick={() => clearSpecificFilter(filterKey, itemValue)}
                          className="hover:text-red-600 cursor-pointer flex items-center justify-center transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        >
                          <X className="size-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-on-surface-variant hover:text-on-surface uppercase tracking-wider cursor-pointer ml-1 transition-colors shrink-0 rounded-sm px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 min-h-[360px] w-full" role="status" aria-label="Loading properties">
            <div className="w-10 h-10 border-3 border-[#0F766E]/20 border-t-[#0F766E] rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-500">Loading firm property listings...</p>
          </div>
        ) : viewMode === 'split' ? (
          <div className="flex-1 overflow-hidden w-full min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 xl:gap-6 items-start h-full">
            {/* Left Pane: Property Cards Grid or Empty State */}
            <div
              ref={parentRef}
              data-lenis-prevent="true"
              data-testid="properties-scroll-container"
              className={`h-full min-h-0 overflow-y-auto overscroll-contain pr-1 sm:pr-2 pb-24 lg:pb-6 custom-scrollbar w-full lg:col-span-7 xl:col-span-7 2xl:col-span-7 ${mobileTab === 'map' ? 'hidden lg:block' : 'block'
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
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 xl:gap-5 pt-1 pb-5 px-0.5"
                        >
                          {rowItems.map((property, idx) => (
                            <motion.div
                              key={property.id}
                              id={`property-card-${property.id}`}
                              className="h-full"
                              onMouseEnter={() => setHoveredPropertyId(property.id)}
                              onMouseLeave={() => setHoveredPropertyId(null)}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: idx * 0.05 }}
                            >
                              <PropertyCard
                                property={property}
                                variant="vertical"
                                isSelected={String(selectedPropertyId) === String(property.id)}
                                isHovered={String(hoveredPropertyId) === String(property.id)}
                                onSelect={handleCardSelectProperty}
                              />
                            </motion.div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination / Load More Footer */}
                  {filteredProperties && (displayedProperties.length < filteredProperties.length || hasMoreServerPages) && (
                    <div className="flex flex-col items-center justify-center mt-12 mb-16 gap-4">
                      <Button
                        variant="primary"
                        size="lg"
                        icon="expand_more"
                        disabled={isLoadingMore}
                        onClick={handleLoadMore}
                        className="bg-[#0F766E] hover:bg-[#115E59] text-white shadow-[0_10px_30px_rgba(15,118,110,0.2)] hover:-translate-y-1 transition-all border-none font-bold tracking-widest text-[12px] px-8 cursor-pointer"
                      >
                        {isLoadingMore ? 'Loading More...' : 'Load More Residences'}
                      </Button>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans">
                        Showing {displayedProperties.length} of {Math.max(filteredProperties.length, totalAvailable)}
                      </span>
                    </div>
                  )}

                  {displayedProperties.length === filteredProperties.length && filteredProperties.length > 0 && !hasMoreServerPages && (
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

            {/* Right Pane: Interactive Geographical Map Split Plane (isolated at z-0 per DESIGN.md 5.5) */}
            <div
              data-testid="properties-map-container"
              className={`relative isolate z-0 w-full h-full lg:col-span-5 xl:col-span-5 2xl:col-span-5 rounded-xl overflow-hidden shadow-xs border border-outline bg-background ${mobileTab === 'list' ? 'hidden lg:block' : 'block'
                }`}
            >
              <GooglePropertyMap
                properties={filteredProperties}
                selectedPropertyId={selectedPropertyId}
                hoveredPropertyId={hoveredPropertyId}
                onSelectProperty={handleSelectProperty}
                onHoverProperty={handleHoverProperty}
                targetDistrict={targetDistrict}
                recenterTrigger={mobileTab}
              />
            </div>
          </div>
        ) : displayedProperties && displayedProperties.length > 0 ? (
          <div className="flex-1 overflow-hidden w-full min-h-0 h-full">
            <div
              ref={parentRef}
              data-lenis-prevent="true"
              data-testid="properties-scroll-container"
              className="h-full min-h-0 overflow-y-auto overscroll-contain pr-2 pb-24 lg:pb-8 custom-scrollbar w-full"
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
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 pt-1.5 pb-10 px-0.5"
                    >
                      {rowItems.map((property, idx) => (
                        <motion.div
                          key={property.id}
                          id={`property-card-${property.id}`}
                          className="h-full"
                          onMouseEnter={() => setHoveredPropertyId(property.id)}
                          onMouseLeave={() => setHoveredPropertyId(null)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: idx * 0.05 }}
                        >
                          <PropertyCard
                            property={property}
                            variant="vertical"
                            isSelected={selectedPropertyId === property.id}
                            isHovered={hoveredPropertyId === property.id}
                          />
                        </motion.div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Pagination / Load More Footer */}
              {filteredProperties && (displayedProperties.length < filteredProperties.length || hasMoreServerPages) && (
                <div className="flex flex-col items-center justify-center mt-12 mb-16 gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    icon="expand_more"
                    disabled={isLoadingMore}
                    onClick={handleLoadMore}
                    className="bg-[#0F766E] hover:bg-[#115E59] text-white shadow-[0_10px_30px_rgba(15,118,110,0.2)] hover:-translate-y-1 transition-all border-none font-bold tracking-widest text-[12px] px-8 cursor-pointer"
                  >
                    {isLoadingMore ? 'Loading More...' : 'Load More Residences'}
                  </Button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans">
                    Showing {displayedProperties.length} of {Math.max(filteredProperties.length, totalAvailable)}
                  </span>
                </div>
              )}

              {displayedProperties.length === filteredProperties.length && filteredProperties.length > 0 && !hasMoreServerPages && (
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
              className="flex items-center gap-2 px-5 py-3 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-xl active:scale-95 transition-all border border-[#FF8559]/40 backdrop-blur-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                {mobileTab === 'list' ? 'map' : 'format_list_bulleted'}
              </span>
              <span>{mobileTab === 'list' ? 'View Map' : 'View List'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Deep Specification Drawer (lazy-loaded on open) */}
      {isDrawerOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </div>
  );
}
