import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLenis } from 'lenis/react';

// Specialized Section Components
import {
  ListingHeroGallery,
  LeadCaptureSection,
  ArchitecturalGallerySection,
  InstitutionalAuthoritySection,
  NeighborhoodSpotlightsSection,
  PartnersSection,
  ClientStoriesSection,
  BuyerProtectionPromiseSection,
} from '../../components/ui';

export default function Home() {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const galleryRef = useRef(null);
  const leadCaptureRef = useRef(null);

  const navigate = useNavigate();
  const lenis = useLenis();

  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          if (lenis) {
            lenis.scrollTo(element, { offset: -80, duration: 1.2 });
          } else {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 400);
      }
    }
  }, [lenis]);

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
    navigate('/properties');
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

  const sectionRevealProps = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.1 },
    transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] }
  };

  return (
    <div ref={containerRef} className="w-full bg-[#FBFBF9] text-[#141717] font-sans relative selection:bg-[#E76F51] selection:text-white transition-colors duration-500">

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



      {/* 3. ARCHITECTURAL GALLERY EXHIBITION (FEATURED PROPERTIES WITH AMORTIZATION) */}
      <div id="architectural-gallery" ref={galleryRef} className="w-full">
        <motion.div {...sectionRevealProps}>
          <ArchitecturalGallerySection />
        </motion.div>
      </div>



      {/* 5. BALANCED FAMILY GROWTH CORRIDORS: NEIGHBORHOOD SPOTLIGHTS */}
      <div id="where-we-operate" className="w-full">
        <motion.div {...sectionRevealProps}>
          <NeighborhoodSpotlightsSection />
        </motion.div>
      </div>

      {/* 6. 4-POINT BUYER PROTECTION PROMISE (THE PEACE OF MIND ENGINE) */}
      <div id="buyer-protection" className="w-full">
        <motion.div {...sectionRevealProps}>
          <BuyerProtectionPromiseSection />
        </motion.div>
      </div>

      {/* 7. PERFORMANCE LEDGER: INSTITUTIONAL AUTHORITY */}
      <div id="performance-ledger" className="w-full">
        <motion.div {...sectionRevealProps}>
          <InstitutionalAuthoritySection />
        </motion.div>
      </div>

      {/* 8. TRUSTED PARTNERS: PRIME DEVELOPERS & INSTITUTIONAL ALLIANCES */}
      <div id="partners" className="w-full">
        <motion.div {...sectionRevealProps}>
          <PartnersSection />
        </motion.div>
      </div>

      {/* 9. CLIENT STORIES (REAL RELATIONSHIPS) */}
      <div id="client-stories" className="w-full">
        <ClientStoriesSection />
      </div>

      {/* 10. PRIVATE AUDIT: LEAD CAPTURE & CONVERSION */}
      <div id="private-audit" ref={leadCaptureRef} className="w-full">
        <motion.div {...sectionRevealProps}>
          <LeadCaptureSection />
        </motion.div>
      </div>

    </div>
  );
}
