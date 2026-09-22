import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLenis } from 'lenis/react';

// Specialized Section Components
import ListingHeroGallery from '../components/ui/ListingHeroGallery';
import AdvancedSearchBox from '../components/ui/AdvancedSearchBox';
import LeadCaptureSection from '../components/ui/LeadCaptureSection';
import RelatedListingsSection from '../components/ui/RelatedListingsSection';
import ArchitecturalGallerySection from '../components/ui/ArchitecturalGallerySection';
import InstitutionalAuthoritySection from '../components/ui/InstitutionalAuthoritySection';
import NeighborhoodSpotlightsSection from '../components/ui/NeighborhoodSpotlightsSection';
import ClientStoriesSection from '../components/ui/ClientStoriesSection';

export default function Home({ setIsDarkTheme }) {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const galleryRef = useRef(null);
  const searchRef = useRef(null);
  const leadCaptureRef = useRef(null);
  
  const navigate = useNavigate();
  const lenis = useLenis();

  // Scroll tracking sentinel for theme/header state
  const isHeroInView = useInView(containerRef, { amount: 0.1 });

  useEffect(() => {
    if (setIsDarkTheme) {
      setIsDarkTheme(!isHeroInView);
    }
  }, [isHeroInView, setIsDarkTheme]);

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
    <div ref={containerRef} className="w-full bg-[#f9f9f7] text-[#0f1722] font-sans relative">
      
      {/* 1. HERO SECTION: BRAND SHOWCASE WITH FULL-WIDTH HOUSE */}
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
      <div ref={galleryRef}>
        <motion.div {...sectionRevealProps}>
          <ArchitecturalGallerySection />
        </motion.div>
      </div>

      {/* INSTITUTIONAL AUTHORITY & BENCHMARK METRICS (CREDIBILITY GRID) */}
      <motion.div {...sectionRevealProps}>
        <InstitutionalAuthoritySection />
      </motion.div>

      {/* NEIGHBORHOOD SPOTLIGHTS (WHERE WE OPERATE) */}
      <NeighborhoodSpotlightsSection />

      {/* 3. PROPERTY SEARCH & FEATURED RESIDENCES SECTION */}
      <section id="property-page" ref={searchRef} className="w-full bg-white py-16 md:py-24 border-b border-[#e5e5df] relative z-20">
        <div className="w-full max-w-[1560px] mx-auto px-5 md:px-10 lg:px-16">
          
          {/* Section Header */}
          <motion.div {...sectionRevealProps} className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-block px-3.5 py-1 bg-[#174849]/10 text-[#174849] rounded-full text-[10px] font-bold font-sans uppercase tracking-[0.25em] mb-3 border border-[#174849]/20">
                Curated Collection
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-[#0f1722] tracking-tight font-sans">
                Featured Residences
              </h2>
              <p className="mt-2 text-gray-500 font-sans text-sm md:text-base max-w-2xl">
                Filter through our exclusive collection of luxury estates, modern condominiums, and high-yield investments.
              </p>
            </div>
            
            <button
              onClick={() => navigate('/properties')}
              className="self-start md:self-auto text-xs font-bold uppercase tracking-wider text-[#174849] hover:text-[#0e2c2c] font-sans flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[#174849]/20 hover:border-[#174849] hover:bg-[#174849]/5 transition-all shadow-sm"
            >
              <span>Explore All Listings</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </motion.div>

          {/* Search Component */}
          <motion.div {...sectionRevealProps}>
            <AdvancedSearchBox onSearch={handleSearch} isSticky={false} />
          </motion.div>

        </div>
      </section>

      {/* 4. CLIENT STORIES (REAL RELATIONSHIPS) */}
      <ClientStoriesSection />

      {/* 5. LEAD CAPTURE & CONVERSION (RESERVATION) */}
      <div ref={leadCaptureRef}>
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
