import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import GalleryCard from '../components/ui/GalleryCard';
import AgentCard from '../components/ui/AgentCard';
import { mockProperties } from '../utils/mockProperties';

const HERO_DATA = {
  titlePart1: "Where Heritage Meets",
  titleHighlight: "Strategic Advisory.",
  subtitle: "Experience the next evolution of luxury property acquisition. Our exclusive market insights analyze global markets to secure your legacy.",
  buttons: [
    { text: "Explore Portfolio", primary: true },
    { text: "The Private Office", primary: false }
  ],
  images: [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2000&auto=format&fit=crop"
  ]
};

const TEAM_MEMBERS = [
  { id: 1, name: "Alexander Sterling", role: "Founding Partner", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80" },
  { id: 2, name: "Helena Vance", role: "Head of EMEA", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" },
  { id: 3, name: "Marcus Thorne", role: "Market Analytics Specialist", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80" },
  { id: 4, name: "Elena Rossi", role: "Private Client Advisor", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80" }
];

const TESTIMONIALS = [
  { id: 1, quote: "\"The market intelligence provided by EstateElite allowed us to identify an emerging pocket in Mayfair six months before the market spiked. Truly transformative service.\"", name: "Sir Jonathan H.", role: "Venture Capitalist" },
  { id: 2, quote: "\"Discretion is my highest priority. The Private Office handled our acquisition with absolute secrecy and surgical precision. Exceptional execution.\"", name: "Anonymous Client", role: "Technology Founder" }
];



const VIDEO_TOURS_DATA = {
  title: "Immersive Property Tours",
  description: "Experience our most exclusive estates through cinematic virtual walkthroughs.",
  videos: [
    {
      id: 1,
      title: "The Grand Horizon Villa - Cinematic Tour",
      duration: "4:25",
      quality: "4K Ultra HD",
      thumbnail: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop",
      previewVideo: "https://cdn.coverr.co/videos/coverr-a-beautiful-mansion-in-the-mountains-4999/1080p.mp4"
    }
  ]
};

const MISSION_DATA = {
  title: "Redefining Real Estate through Strategic Intelligence",
  description: "\"Our mission is to bridge the gap between timeless property value and modern computational power. We don't just find houses; we secure generational wealth using predictive analytics that see market trends before they happen.\"",
  subtitle: "The Executive Manifesto"
};

const CONSULTATION_FORM_DATA = {
  interests: [
    "Residential Acquisition",
    "Commercial Portfolio",
    "Portfolio Analytics",
    "Development Advisory"
  ]
};

const CATEGORY_CARDS = [
  { id: 1, label: 'Print', path: '/portfolio/print', dev: 'Jane D.', design: 'Orange Bkg', text: 'text-orange-400', image: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?q=80&w=600&auto=format&fit=crop' },
  { id: 2, label: 'Typography', path: '/portfolio/typography', dev: 'Alex M.', design: 'Purple Text', text: 'text-purple-400', image: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?q=80&w=600&auto=format&fit=crop' },
  { id: 3, label: 'Web Design', path: '/portfolio/web-design', dev: 'Sam K.', design: 'Coupe Rndr', text: 'text-blue-400', image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?q=80&w=600&auto=format&fit=crop' },
  { id: 4, label: 'Product D.', path: '/portfolio/product-design', dev: 'Chris T.', design: 'SaaS Dash', text: 'text-green-400', image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=600&auto=format&fit=crop' },
  { id: 5, label: 'Mobile', path: '/portfolio/mobile', dev: 'Pat R.', design: 'Analytics', text: 'text-red-400', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600&auto=format&fit=crop' },
  { id: 6, label: 'Branding', path: '/portfolio/branding', dev: 'Jamie L.', design: 'Hex Node', text: 'text-yellow-400', image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=600&auto=format&fit=crop' },
  { id: 7, label: 'Animation', path: '/portfolio/animation', dev: 'Taylor W.', design: 'Teal Stack', text: 'text-teal-400', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop' },
  { id: 8, label: 'Illustration', path: '/portfolio/illustration', dev: 'Morgan P.', design: 'Sketch View', text: 'text-pink-400', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600&auto=format&fit=crop' },
];

export default function Home({ setIsDarkTheme }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [activeFormInput, setActiveFormInput] = useState(null);

  useEffect(() => {
    const heroInterval = setInterval(() => {
      setHeroImageIndex(prev => (prev + 1) % HERO_DATA.images.length);
    }, 5000);
    return () => clearInterval(heroInterval);
  }, []);

  // Single-Image Slideshow Carousel Logic (Framer Motion)
  const listings = mockProperties;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prevIndex) => (prevIndex === listings.length - 1 ? 0 : prevIndex + 1));
    }, 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [listings.length]);

  const scrollCarousel = (dir) => {
    if (dir === 'next') {
      setDirection(1);
      setCurrentIndex((prevIndex) => (prevIndex === listings.length - 1 ? 0 : prevIndex + 1));
    } else {
      setDirection(-1);
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? listings.length - 1 : prevIndex - 1));
    }
    resetTimer(); // Strict State/Timer reset on manual click
  };

  const listingsCardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  const consultationRevealProps = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] }
  };
  const consultationContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };
  const consultationItemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  const videoSectionRef = useRef(null);
  const isVideoInView = useInView(videoSectionRef, { margin: "-50% 0px -50% 0px" });

  useEffect(() => {
    if (setIsDarkTheme) {
      setIsDarkTheme(isVideoInView);
    }
  }, [isVideoInView, setIsDarkTheme]);

  return (
    <div ref={containerRef} className="w-full bg-white">
      {/* 1. HERO SECTION (Ultra-Premium Glow & Typography) */}
      <section className="snap-panel relative min-h-screen pt-[15vh] flex flex-col items-center justify-start overflow-hidden w-full bg-[#0B0C0A]">
        <div className="absolute inset-0 w-full z-0 pointer-events-none">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={heroImageIndex}
              src={HERO_DATA.images[heroImageIndex]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              alt="Premium Property"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          </AnimatePresence>
          {/* Ambient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0C0A]/60 via-[#0B0C0A]/40 to-[#0B0C0A] w-full"></div>
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-[#266F71]/30 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-[#F4A261]/20 blur-[120px] rounded-full mix-blend-screen" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} 
          className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 text-center flex flex-col items-center justify-center mt-12"
        >
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-bold font-sans bg-white/10 text-white backdrop-blur-md uppercase tracking-[0.2em] mb-8 border border-white/20 shadow-lg">
            Elite Real Estate Intelligence
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-extrabold font-display tracking-tight text-white mb-8 leading-[1.05] max-w-5xl mx-auto drop-shadow-2xl">
            {HERO_DATA.titlePart1} <span className="text-[#F4A261]">{HERO_DATA.titleHighlight}</span>
          </h1>
          <p className="text-base md:text-lg lg:text-xl text-white/80 leading-[1.8] font-light font-sans mb-12 max-w-3xl mx-auto">
            {HERO_DATA.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full sm:w-auto">
             <Button variant="primary" size="lg" className="bg-[#266F71] hover:bg-[#174849] text-white shadow-[0_10px_30px_rgba(38,111,113,0.3)] hover:-translate-y-1 transition-all border-none font-bold tracking-widest text-[12px]">
                Explore Portfolio
             </Button>
             <Button variant="outline" size="lg" className="bg-transparent hover:bg-white/10 text-white shadow-none hover:-translate-y-1 transition-all border-2 border-white/50 font-bold tracking-widest text-[12px] backdrop-blur-sm">
                The Private Office
             </Button>
          </div>
        </motion.div>
      </section>

      {/* 2. LISTINGS CAROUSEL (Glassmorphic Updates) */}
      <section className="snap-panel w-full min-h-screen pt-[120px] bg-white flex flex-col justify-center">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display text-[#174849] tracking-tight">Featured Listings</h2>
              <p className="text-base md:text-lg lg:text-xl text-gray-500 leading-relaxed font-sans mt-3">Exclusive properties curated for the world's elite.</p>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col justify-center items-center relative group/carousel overflow-hidden aspect-[16/9] md:aspect-[21/9] my-8">
          <AnimatePresence initial={false} custom={direction}>
            {[
              { item: listings[currentIndex === 0 ? listings.length - 1 : currentIndex - 1], pos: 'prev', id: listings[currentIndex === 0 ? listings.length - 1 : currentIndex - 1].id },
              { item: listings[currentIndex], pos: 'center', id: listings[currentIndex].id },
              { item: listings[currentIndex === listings.length - 1 ? 0 : currentIndex + 1], pos: 'next', id: listings[currentIndex === listings.length - 1 ? 0 : currentIndex + 1].id }
            ].map(({ item, pos, id }) => (
              <motion.div
                key={id}
                custom={direction}
                initial={{ opacity: 0, scale: 0.8, x: direction > 0 ? '100%' : '-100%' }}
                animate={{
                  opacity: 1,
                  scale: pos === 'center' ? 1 : 0.85,
                  x: pos === 'center' ? 0 : pos === 'next' ? '85%' : '-85%',
                  zIndex: pos === 'center' ? 10 : 0
                }}
                exit={{ opacity: 0, scale: 0.8, x: direction > 0 ? '-100%' : '100%' }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute w-[85vw] md:w-[70vw] h-full shrink-0"
              >
                <GalleryCard property={item} variants={listingsCardVariants} />
                
                {/* Hardware-accelerated black overlay for side images */}
                <motion.div 
                  initial={false}
                  animate={{ opacity: pos === 'center' ? 0 : 0.7 }}
                  transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 bg-[#0B0C0A] pointer-events-none rounded-[32px]"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Carousel Navigation Buttons */}
          <div className="absolute inset-y-0 left-0 right-0 pointer-events-none flex items-center justify-between px-4 md:px-12 z-30">
            <button
              onClick={() => scrollCarousel('prev')}
              className="pointer-events-auto w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/30 hover:bg-white/90 backdrop-blur-xl border border-white/50 text-[#174849] transition-all flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.2)] opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
            >
              <span className="material-symbols-outlined text-[24px] pr-1">arrow_back_ios_new</span>
            </button>
            <button
              onClick={() => scrollCarousel('next')}
              className="pointer-events-auto w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/30 hover:bg-white/90 backdrop-blur-xl border border-white/50 text-[#174849] transition-all flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.2)] opacity-0 group-hover/carousel:opacity-100 hover:scale-110"
            >
              <span className="material-symbols-outlined text-[24px] pl-1">arrow_forward_ios</span>
            </button>
          </div>
        </div>

        {/* Dynamic Developer Info (Animated Fly-Through) - Premium Glassmorphic */}
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 h-32 mb-16 relative flex items-center justify-center pointer-events-none">
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ x: direction > 0 ? 200 : -200, scale: 0.9, opacity: 0 }}
              animate={{ x: 0, scale: 1, opacity: 1 }}
              exit={{ x: direction > 0 ? -200 : 200, scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="absolute w-[90%] md:w-full max-w-4xl flex items-center justify-between p-5 md:p-6 bg-white/80 backdrop-blur-2xl rounded-[32px] border-2 border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] pointer-events-auto"
            >
              <div className="flex items-center gap-5 md:gap-8">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-[#266F71] to-[#174849] overflow-hidden shadow-lg border border-[#266F71]/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-3xl md:text-4xl drop-shadow-md">real_estate_agent</span>
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#F4A261] font-sans mb-1.5">
                    Exclusive Partner
                  </span>
                  <span className="text-xl md:text-3xl font-extrabold text-[#174849] font-display tracking-tight leading-none">
                    {listings[currentIndex].location || "PT Premium Estates"}
                  </span>
                </div>
              </div>

              <div className="pl-6 md:pl-10 border-l border-gray-200 flex flex-col items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#174849] text-3xl md:text-4xl drop-shadow-sm" title="Verified Partner">verified</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">Verified</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 3. VIDEO TOURS SECTION (Rounded Dark Elegance) */}
      <section
        ref={videoSectionRef}
        className="snap-panel w-full pt-[80px] pb-32 flex flex-col justify-center bg-white transition-colors duration-1000"
        style={{ backgroundColor: isVideoInView ? '#0B0C0A' : '#FFFFFF' }}
      >
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex flex-col mb-12 mt-8">
              <motion.h2
                animate={{ color: isVideoInView ? '#ffffff' : '#1B1C1A' }}
                transition={{ duration: 0.7 }}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display tracking-tight"
              >
                {VIDEO_TOURS_DATA.title}
              </motion.h2>
              <motion.p
                animate={{ color: isVideoInView ? '#9ca3af' : '#6b7280' }}
                transition={{ duration: 0.7 }}
                className="text-lg lg:text-xl leading-relaxed font-sans mt-4 max-w-2xl"
              >
                {VIDEO_TOURS_DATA.description}
              </motion.p>
          </div>
        </div>

        <div className="w-full mt-12">
          {VIDEO_TOURS_DATA.videos.map(video => (
            <div key={video.id} className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden group cursor-pointer border-y border-white/10 shadow-2xl" onClick={() => setIsVideoOpen(true)}>
              <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none bg-black">
                <iframe
                  className="absolute top-1/2 left-1/2 w-[300%] h-[300%] md:w-[150%] md:h-[150%] -translate-x-1/2 -translate-y-1/2 opacity-80 transition-transform duration-[2s] group-hover:scale-105 group-hover:opacity-100 ease-out"
                  src="https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=ScMzIvxBSi4&playsinline=1"
                  allow="autoplay; encrypted-media"
                  frameBorder="0"
                ></iframe>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0C0A]/95 backdrop-blur-xl"
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-none aspect-video bg-black overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] border-y border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsVideoOpen(false)}
                className="absolute top-8 right-8 z-10 w-12 h-12 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all hover:scale-110"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              <div className="w-full h-full flex items-center justify-center bg-black">
                <iframe
                  className="w-full h-full border-none"
                  src="https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1&rel=0"
                  title="Cinematic Property Tour"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MISSION STATEMENT (Paper Texture) */}
      <motion.section {...consultationRevealProps} className="snap-panel reveal bg-[#F4F4F4] py-32 flex flex-col justify-center overflow-hidden relative w-full">
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.04] mix-blend-multiply"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] bg-[#266F71]/5 blur-[120px] rounded-full mix-blend-multiply" />
        </div>
        <div className="max-w-[1000px] mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold font-display text-[#174849] mb-10 tracking-tight leading-[1.1] drop-shadow-sm">
            {MISSION_DATA.title}
          </h2>
          <p className="text-xl md:text-2xl text-black leading-relaxed font-normal font-sans mb-16 px-4 italic max-w-4xl mx-auto">
            {MISSION_DATA.description}
          </p>
          <div className="w-24 h-1 bg-[#174849] mx-auto rounded-full mb-10 shadow-sm"></div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#174849] font-sans">{MISSION_DATA.subtitle}</p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-[0.03] pointer-events-none flex items-center justify-end overflow-hidden">
           <span className="text-[600px] font-black text-black select-none leading-none -mr-32">AI</span>
        </div>
      </motion.section>

      {/* 5. ELITE PARTNERS (Agents) */}
      <motion.section {...consultationRevealProps} className="snap-panel reveal py-32 flex flex-col justify-center w-full bg-white">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 bg-[#266F71]/10 text-[#174849] rounded-full text-[10px] font-bold font-sans uppercase tracking-[0.2em] mb-6 border border-[#266F71]/20">World Class Advisory</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display text-[#174849] tracking-tight">Meet Our Elite Partners</h2>
          </div>
          <motion.div variants={consultationContainerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {TEAM_MEMBERS.map(member => (
              <AgentCard key={member.id} member={member} variants={consultationItemVariants} />
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* 6. TESTIMONIALS (Paper Texture) */}
      <motion.section id="testimonials" {...consultationRevealProps} className="snap-panel reveal bg-[#F4F4F4] py-32 flex flex-col justify-center w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.04] mix-blend-multiply pointer-events-none"></div>
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/3 flex flex-col justify-center">
              <span className="inline-block px-4 py-1.5 bg-[#F4A261]/10 text-[#D97706] rounded-full text-[10px] font-bold font-sans uppercase tracking-[0.2em] mb-6 border border-[#F4A261]/20 w-max">Proven Excellence</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display text-[#174849] mb-8 tracking-tight">Client Experiences</h2>
              <div className="flex gap-2 text-[#F4A261] mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <p className="text-lg text-gray-500 leading-relaxed font-sans font-light">Verified Satisfaction from institutional leaders and global visionaries.</p>
            </div>
            <motion.div variants={consultationContainerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
              {TESTIMONIALS.map(t => (
                <motion.div key={t.id} variants={consultationItemVariants} className="bg-white p-10 shadow-[0_10px_30px_rgba(0,0,0,0.05)] rounded-[32px] border-l-4 border-[#174849] relative overflow-hidden group hover:-translate-y-1 transition-transform">
                  <span className="absolute -top-6 -left-4 text-[120px] font-display text-gray-100 group-hover:text-gray-200 transition-colors pointer-events-none leading-none">"</span>
                  <p className="text-lg text-gray-600 leading-relaxed font-sans mb-8 relative z-10 font-light italic">{t.quote}</p>
                  <div className="relative z-10">
                     <p className="text-sm font-bold uppercase tracking-widest text-[#174849] font-sans">{t.name}</p>
                     <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#174849] font-sans mt-1">{t.role}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 7. PRIVATE CONSULTATION FORM (Luxury Form) */}
      <motion.section {...consultationRevealProps} className="snap-panel reveal py-32 flex flex-col justify-center w-full bg-white">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24">
          <div className="bg-white p-12 lg:p-20 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.08)] rounded-[40px] relative overflow-hidden border border-[#E5E7EB]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
              <div className="flex flex-col justify-center">
                <span className="inline-block px-4 py-1.5 bg-[#266F71]/10 text-[#174849] rounded-full text-[10px] font-bold font-sans uppercase tracking-[0.2em] mb-6 border border-[#266F71]/20 w-max">Private Office</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display text-[#174849] mb-8 tracking-tight">Begin Your Legacy</h2>
                <p className="text-lg lg:text-xl text-gray-500 leading-relaxed font-sans mb-12">Secure your invitation to our exclusive marketplace. One of our senior advisors will contact you within 24 hours for a confidential discovery call.</p>
                <ul className="space-y-8">
                  <li className="flex items-center gap-5 text-[#174849] group">
                     <div className="w-10 h-10 rounded-full bg-[#266F71]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[#174849] text-[20px]">vpn_key</span>
                     </div>
                     <span className="text-sm font-bold uppercase tracking-widest text-gray-700 font-sans">Access to Private Portfolio</span>
                  </li>
                  <li className="flex items-center gap-5 text-[#174849] group">
                     <div className="w-10 h-10 rounded-full bg-[#266F71]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[#174849] text-[20px]">trending_up</span>
                     </div>
                     <span className="text-sm font-bold uppercase tracking-widest text-gray-700 font-sans">Strategic Growth Analysis</span>
                  </li>
                  <li className="flex items-center gap-5 text-[#174849] group">
                     <div className="w-10 h-10 rounded-full bg-[#266F71]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[#174849] text-[20px]">support_agent</span>
                     </div>
                     <span className="text-sm font-bold uppercase tracking-widest text-gray-700 font-sans">Dedicated 24/7 Elite Advisory</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-[#F9F9F8] p-8 lg:p-12 rounded-[32px] border border-[#E5E7EB]">
                <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-3">
                      <label className={`font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${activeFormInput === 'name' ? 'text-[#174849]' : 'text-gray-500'}`}>Full Name</label>
                      <input 
                        onFocus={() => setActiveFormInput('name')}
                        onBlur={() => setActiveFormInput(null)}
                        className="w-full bg-white rounded-xl border border-transparent focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] py-4 px-5 transition-all text-sm font-sans outline-none shadow-sm" type="text" placeholder="John Doe" />
                    </div>
                    <div className="space-y-3">
                      <label className={`font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${activeFormInput === 'email' ? 'text-[#174849]' : 'text-gray-500'}`}>Email Address</label>
                      <input 
                        onFocus={() => setActiveFormInput('email')}
                        onBlur={() => setActiveFormInput(null)}
                        className="w-full bg-white rounded-xl border border-transparent focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] py-4 px-5 transition-all text-sm font-sans outline-none shadow-sm" type="email" placeholder="john@company.com" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className={`font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${activeFormInput === 'interest' ? 'text-[#174849]' : 'text-gray-500'}`}>Interest Area</label>
                    <div className="relative">
                       <select 
                         onFocus={() => setActiveFormInput('interest')}
                         onBlur={() => setActiveFormInput(null)}
                         className="w-full bg-white rounded-xl border border-transparent focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] py-4 px-5 transition-all appearance-none text-sm font-sans outline-none shadow-sm text-gray-700">
                         <option value="" disabled selected>Select an option</option>
                         {CONSULTATION_FORM_DATA.interests.map((interest, idx) => (
                           <option key={idx} value={interest}>{interest}</option>
                         ))}
                       </select>
                       <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">expand_more</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className={`font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${activeFormInput === 'msg' ? 'text-[#174849]' : 'text-gray-500'}`}>Message (Optional)</label>
                    <textarea 
                      onFocus={() => setActiveFormInput('msg')}
                      onBlur={() => setActiveFormInput(null)}
                      className="w-full bg-white rounded-xl border border-transparent focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] py-4 px-5 transition-all text-sm font-sans outline-none shadow-sm resize-none" rows="4" placeholder="How can we assist you?"></textarea>
                  </div>
                  <button className="w-full bg-[#266F71] hover:bg-[#174849] text-white py-5 rounded-xl font-sans font-bold text-[12px] tracking-[0.2em] uppercase transition-all shadow-[0_10px_30px_rgba(38,111,113,0.3)] hover:-translate-y-1 flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    Send Inquiry
                  </button>
                </form>
              </div>
            </div>
            
            {/* Decorative background flare */}
            <div className="absolute -right-32 -bottom-32 w-[500px] h-[500px] bg-gradient-to-tl from-[#266F71]/10 to-transparent rounded-full blur-[80px] pointer-events-none z-0"></div>
          </div>
        </div>
      </motion.section>

      {/* 8. CATEGORY CAROUSEL FOOTER */}
      <motion.section
        className="w-full pt-16 pb-32 bg-[#0B0C0A] overflow-x-auto relative border-t border-white/5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-24 mb-10">
          <span className="inline-block px-3 py-1 bg-white/5 text-[#F4A261] rounded-full text-[10px] font-bold font-sans uppercase tracking-[0.2em] mb-4 border border-white/10">Architecture</span>
          <h3 className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight">Explore Portfolios</h3>
        </div>

        {/* Horizontal Infinite Scroll Container */}
        <div className="relative w-full overflow-hidden pb-8" style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
          <motion.div
            className="flex space-x-6 w-max pl-12"
            animate={{ x: ["0%", "calc(-50% - 12px)"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
          >
            {[...CATEGORY_CARDS, ...CATEGORY_CARDS].map((card, index) => (
              <motion.div
                key={`${card.id}-${index}`}
                className="flex-shrink-0 w-[300px] cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(card.path)}
              >
                {/* Image Container */}
                <div className="w-full h-[200px] rounded-3xl overflow-hidden relative shadow-2xl transition-all border border-white/10 mb-5 bg-gray-900">
                  <img src={card.image} alt={card.label} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-between p-6">
                    <div className="w-10 h-10 bg-[#F4A261] rounded-full flex items-center justify-center shadow-lg transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                       <span className="material-symbols-outlined text-white text-[20px]">arrow_outward</span>
                    </div>
                  </div>
                </div>

                {/* Text Outside Container */}
                <div className="flex flex-col items-start px-2">
                  <span className="text-xl font-display font-bold text-white group-hover:text-[#F4A261] transition-colors">{card.label}</span>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${card.text} font-sans bg-white/5 px-3 py-1 rounded-full border border-white/10`}>
                      {card.design}
                    </span>
                    <span className="text-[11px] text-gray-500 font-sans font-medium uppercase tracking-wider">
                      Dev: {card.dev}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>


    </div>
  );
}
