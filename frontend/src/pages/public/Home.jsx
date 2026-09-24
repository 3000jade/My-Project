import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLenis } from 'lenis/react';

// Specialized Section Components
import {
  ListingHeroGallery,
  AdvancedSearchBox,
  LeadCaptureSection,
  RelatedListingsSection,
  ArchitecturalGallerySection,
  InstitutionalAuthoritySection,
  NeighborhoodSpotlightsSection,
  ClientStoriesSection,
} from '../../components/ui';

export default function Home({ setIsDarkTheme }) {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const galleryRef = useRef(null);
  const searchRef = useRef(null);
  const leadCaptureRef = useRef(null);
  
  const navigate = useNavigate();
  const lenis = useLenis();



  const handleBookTour = () => {
    if (leadCaptureRef.current) {
      if (lenis) {
        lenis.scrollTo(leadCaptureRef.current, { offset: -60, duration: 1.2 });
      } else {
        leadCaptureRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleViewGallery = () => {
    if (galleryRef.current) {
      if (lenis) {
        lenis.scrollTo(galleryRef.current, { offset: -60, duration: 1.2 });
      } else {
        galleryRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleViewProperties = () => {
    if (searchRef.current) {
      if (lenis) {
        lenis.scrollTo(searchRef.current, { offset: -60, duration: 1.2 });
      } else {
        searchRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/properties');
    }
  };

  const handleConsultAgent = () => {
    navigate('/contact');
  };

  const handleInquireNow = () => {
    if (leadCaptureRef.current) {
      if (lenis) {
        lenis.scrollTo(leadCaptureRef.current, { offset: -60, duration: 1.2 });
      } else {
        leadCaptureRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSearch = (filters) => {
    navigate('/properties', { state: { filters } });
  };

  const sectionRevealProps = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.1 },
    transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] }
  };

  return (
    <div ref={containerRef} className="w-full bg-[#FBFBFA] dark:bg-[#070D0E] text-[#141717] dark:text-[#F4F7F7] font-sans relative selection:bg-[#E76F51] selection:text-white transition-colors duration-500">
      
      {/* 1. HERO SECTION: BRAND SHOWCASE WITH FULL-WIDTH HOUSE & HYPER-DEPTH 2.5x PARALLAX */}
      <ListingHeroGallery 
        onBookTour={handleBookTour}
        onViewGallery={handleViewGallery}
        onViewProperties={handleViewProperties}
        onConsultAgent={handleConsultAgent}
        onInquireNow={handleInquireNow}
      />

      {/* Sentinel anchor for sticky header calculation */}
      <div id="hero-sentinel" ref={sentinelRef} className="h-0 w-full pointer-events-none" />

      {/* 2. ARCHITECTURAL GALLERY EXHIBITION (FEATURED PROPERTIES) */}
      <div id="architectural-gallery" ref={galleryRef}>
        <motion.div {...sectionRevealProps}>
          <ArchitecturalGallerySection />
        </motion.div>
      </div>

      {/* 3. PERFORMANCE LEDGER: INSTITUTIONAL AUTHORITY & BENCHMARK METRICS */}
      <div id="performance-ledger">
        <motion.div {...sectionRevealProps}>
          <InstitutionalAuthoritySection />
        </motion.div>
      </div>

      {/* 4. VELOCITY ENGINE: NEIGHBORHOOD SPOTLIGHTS (WHERE WE OPERATE) */}
      <div id="velocity-engine">
        <NeighborhoodSpotlightsSection />
      </div>

      {/* 5. ACTIVE RESERVES: PROPERTY SEARCH & FEATURED RESIDENCES SECTION */}
      <section id="active-reserves" ref={searchRef} className="w-full bg-white dark:bg-[#0C1618] py-16 md:py-24 border-b border-[#D8DFDF] dark:border-white/10 relative z-20 transition-colors duration-500">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-12">
          
          {/* Section Header (Bauhaus H2 36px & JetBrains Mono Micro-Telemetry) */}
          <motion.div {...sectionRevealProps} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-block px-3.5 py-1 bg-[#0D4446]/10 dark:bg-[#14B8A6]/10 text-[#0D4446] dark:text-[#14B8A6] rounded-full text-[12px] font-semibold font-mono uppercase tracking-[0.12em] mb-3 border border-[#0D4446]/20 dark:border-[#14B8A6]/20">
                Curated Collection · Active Reserves
              </span>
              <h2 className="text-3xl md:text-[36px] font-bold text-[#141717] dark:text-[#F4F7F7] tracking-[-0.02em] leading-[1.2] font-display">
                Featured Residences
              </h2>
              <p className="mt-2 text-[#5C6768] dark:text-[#95A6A6] font-sans text-base leading-[1.6] max-w-2xl">
                Filter through our exclusive collection of luxury estates, modern condominiums, and high-yield investments.
              </p>
            </div>
            
            <button
              onClick={() => navigate('/properties')}
              className="self-start md:self-auto h-[54px] px-6 text-[13px] font-bold uppercase tracking-wider text-[#0D4446] dark:text-[#14B8A6] hover:bg-[#0D4446]/5 dark:hover:bg-[#14B8A6]/10 font-sans flex items-center gap-2 rounded-xl border border-[#0D4446]/30 dark:border-[#14B8A6]/30 transition-all shadow-sm group cursor-pointer"
            >
              <span>Explore All Listings</span>
              <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:translate-x-1 group-hover:-rotate-45">
                arrow_forward
              </span>
            </button>
          </motion.div>

          {/* Search Component (Strictly Uniform h-[54px]) */}
          <motion.div {...sectionRevealProps}>
            <AdvancedSearchBox onSearch={handleSearch} isSticky={false} />
          </motion.div>

        </div>
      </section>

      {/* 6. CLIENT STORIES (REAL RELATIONSHIPS) */}
      <ClientStoriesSection />

      {/* 7. PRIVATE AUDIT: LEAD CAPTURE & CONVERSION */}
      <div id="private-audit" ref={leadCaptureRef}>
        <motion.div {...sectionRevealProps}>
          <LeadCaptureSection />
        </motion.div>
      </div>

      {/* 8. RELATED LISTINGS */}
      <motion.div {...sectionRevealProps}>
        <RelatedListingsSection onViewProperty={() => navigate('/properties')} />
      </motion.div>

    </div>
  );
}
