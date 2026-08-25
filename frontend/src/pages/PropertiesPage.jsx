import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

import AdvancedSearchBox from '../components/ui/AdvancedSearchBox';
import PropertyCard from '../components/ui/PropertyCard';
import Button from '../components/ui/Button';
import Hero3DCarousel from '../components/ui/Hero3DCarousel';

import { mockProperties } from '../utils/mockProperties';

export default function PropertiesPage() {
  const [sortBy, setSortBy] = useState('Newest');

  const allProperties = mockProperties;
  const [properties, setProperties] = useState(allProperties);

  const [displayLimit, setDisplayLimit] = useState(6);
  const displayedProperties = properties.slice(0, displayLimit);

  // Responsive columns logic
  const [columns, setColumns] = useState(3);
  const [isStickySearch, setIsStickySearch] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    const handleHeaderVis = (e) => setHeaderVisible(e.detail.isVisible);
    window.addEventListener('header-visibility', handleHeaderVis);
    return () => window.removeEventListener('header-visibility', handleHeaderVis);
  }, []);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setColumns(1);
      else if (window.innerWidth < 1024) setColumns(2);
      else setColumns(3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sentinelRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sentinelRef.current) {
        const rect = sentinelRef.current.getBoundingClientRect();
        // The header is exactly 80px tall when scrolled.
        // We trigger sticky when the search bar touches the bottom of the header.
        const isTouching = rect.top <= 80;
        
        setIsStickySearch(prev => {
          if (prev !== isTouching) {
            window.dispatchEvent(new CustomEvent('search-sticky-toggle', { detail: { isTouching } }));
            return isTouching;
          }
          return prev;
        });
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const rowVirtualizer = useWindowVirtualizer({
    count: Math.ceil(displayedProperties.length / columns),
    estimateSize: () => 550,
    overscan: 2,
  });

  const handleSearch = (filters) => {
    const { location, propertyType, minPrice, maxPrice, beds, baths, parking, amenities, region, province, city } = filters;
    const filtered = allProperties.filter(p => {
      let match = true;
      
      // Generic keyword search
      if (location && location.trim() !== '') {
        const query = location.toLowerCase();
        if (!p.location.toLowerCase().includes(query) && !p.name.toLowerCase().includes(query)) {
          match = false;
        }
      }

      // Property Type Filter
      if (propertyType && propertyType !== 'All Types') {
        if (p.propertyType !== propertyType) {
          match = false;
        }
      }
      
      // Philippine Geographic Filters
      if (city && city.trim() !== '') {
        if (!p.location.toLowerCase().includes(city.toLowerCase())) match = false;
      } else if (province && province.trim() !== '') {
        // Fallback to province if city is not selected
        if (!p.location.toLowerCase().includes(province.toLowerCase())) match = false;
      }
      
      if (minPrice || maxPrice) {
        const priceNum = Number(p.price.replace(/[^0-9.-]+/g,""));
        if (minPrice && priceNum < Number(minPrice)) match = false;
        if (maxPrice && priceNum > Number(maxPrice)) match = false;
      }

      if (beds && p.beds < Number(beds)) match = false;
      if (baths && p.baths < Number(baths)) match = false;
      if (parking && p.parking < Number(parking)) match = false;

      if (amenities && amenities.length > 0) {
        const hasAll = amenities.every(am => p.amenities.includes(am));
        if (!hasAll) match = false;
      }
      
      return match;
    });
    setProperties(filtered);
    setDisplayLimit(6); // Reset limit on search
  };

  const handleLoadMore = () => {
    setDisplayLimit(prev => Math.min(prev + 6, properties.length));
  };

  return (
    <div className="bg-white min-h-screen w-full relative overflow-x-clip">
      {/* 1. 3D Carousel Hero */}
      <Hero3DCarousel properties={mockProperties.slice(0, 5)} />

      {/* 2. Advanced Search Component */}
      <div className={`transition-all duration-500 z-[45] sticky ${headerVisible && isStickySearch ? 'top-[80px]' : 'top-0'} ${isStickySearch ? 'px-0 pt-0 bg-white/80 backdrop-blur-2xl shadow-sm border-b border-gray-100' : 'mt-10 px-5 md:px-10 lg:px-24 relative'}`}>
        <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-0 pointer-events-none" />
        <AdvancedSearchBox onSearch={handleSearch} isSticky={isStickySearch} />
      </div>

      {/* 3. Latest Properties Grid */}
      <div className="py-12 relative w-full">
        {/* Ambient Glows */}
        <div className="absolute top-40 left-0 w-[500px] h-[500px] bg-[#174849]/5 blur-[120px] rounded-full pointer-events-none mix-blend-multiply" />
        <div className="absolute bottom-40 right-0 w-[500px] h-[500px] bg-[#F4A261]/5 blur-[120px] rounded-full pointer-events-none mix-blend-multiply" />

        <section className="w-full px-5 md:px-10 lg:px-24 py-10 relative z-10 max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-gray-200/60 pb-6">
            <div>
              <span className="inline-block px-3 py-1 bg-[#174849]/10 text-[#174849] rounded-full text-[10px] font-bold font-sans uppercase tracking-[0.2em] mb-4 border border-[#174849]/20">Exclusive Portfolio</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display text-[#174849] tracking-tight">Available Properties</h2>
            </div>
            <div className="flex items-center gap-3 mt-6 md:mt-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 font-sans">Sort by</span>
              <div className="relative">
                <select
                  className="appearance-none bg-white border border-gray-200 rounded-xl text-[12px] font-bold uppercase tracking-wider text-[#174849] font-sans py-2.5 pr-10 pl-4 focus:border-[#174849] focus:ring-1 focus:ring-[#174849] outline-none shadow-sm cursor-pointer transition-all hover:border-[#174849]/50"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Newest">Newest Additions</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#174849]/50 text-[20px]">expand_more</span>
              </div>
            </div>
          </div>

          {displayedProperties && displayedProperties.length > 0 ? (
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
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 pb-12"
                  >
                    {rowItems.map((property, idx) => (
                      <motion.div 
                        key={property.id} 
                        className="h-full"
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: idx * 0.1 }}
                      >
                        <PropertyCard property={property} variant="vertical" />
                      </motion.div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-32 flex flex-col items-center justify-center bg-white/50 backdrop-blur-xl border border-gray-100 rounded-[40px] shadow-sm max-w-3xl mx-auto mt-12"
            >
              <div className="w-20 h-20 bg-[#174849]/5 rounded-full flex items-center justify-center mb-6">
                 <span className="material-symbols-outlined text-4xl text-[#174849]/40">search_off</span>
              </div>
              <p className="text-2xl font-bold font-display text-[#174849] mb-3 tracking-tight">No properties found</p>
              <p className="text-base text-gray-500 leading-relaxed font-sans text-center max-w-md px-6">
                We couldn't find any listings matching your exact criteria. Try adjusting your filters or expanding your search area.
              </p>
              <Button variant="outline" size="md" className="mt-8 border-[#174849]/20 text-[#174849] hover:bg-[#174849]/5" onClick={() => setProperties(allProperties)}>
                Clear All Filters
              </Button>
            </motion.div>
          )}

          {properties && displayedProperties.length < properties.length && (
            <div className="flex flex-col items-center justify-center mt-20 gap-6">
              <Button 
                variant="primary" 
                size="lg" 
                icon="expand_more" 
                onClick={handleLoadMore}
                className="bg-[#174849] hover:bg-[#113536] text-white shadow-[0_10px_30px_rgba(23,72,73,0.2)] hover:-translate-y-1 transition-all border-none font-bold tracking-widest text-[12px] px-8"
              >
                Load More Properties
              </Button>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 font-sans">
                Showing {displayedProperties.length} of {properties.length}
              </span>
            </div>
          )}
          
          {displayedProperties.length === properties.length && properties.length > 0 && (
            <div className="flex justify-center mt-24">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-gray-50 rounded-full border border-gray-100">
                <span className="material-symbols-outlined text-[#174849] text-sm">check_circle</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 font-sans">
                  All {properties.length} Properties Loaded
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
