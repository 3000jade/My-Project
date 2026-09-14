import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLenis } from 'lenis/react';

import AgentCard from '../components/ui/AgentCard';
import ParallaxMultiVectorHero from '../components/ui/ParallaxMultiVectorHero';

const TEAM_MEMBERS = [
  { id: 1, name: "Alexander Sterling", role: "Founding Partner", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80" },
  { id: 2, name: "Helena Vance", role: "Head of EMEA", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80" },
  { id: 3, name: "Marcus Thorne", role: "Market Analytics Specialist", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80" },
  { id: 4, name: "Elena Rossi", role: "Private Client Advisor", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80" }
];

import TestimonialCarousel from '../components/ui/TestimonialCarousel';

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

export default function Home({ setIsDarkTheme }) {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const navigate = useNavigate();
  const lenis = useLenis();

  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [activeFormInput, setActiveFormInput] = useState(null);

  const handleExplore = () => {
    if (lenis && videoSectionRef.current) {
      lenis.scrollTo(videoSectionRef.current, { offset: -40, duration: 1.2 });
    } else if (videoSectionRef.current) {
      videoSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRequestValuation = () => {
    navigate('/properties');
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
    <div ref={containerRef} className="w-full bg-white relative">
      {/* 2.5D PARALLAX MULTI-VECTOR INTRO HERO */}
      <ParallaxMultiVectorHero
        onExplore={handleExplore}
        onRequestValuation={handleRequestValuation}
      />
      {/* Precision Scroll Tracking Sentinel per AGENTS.md */}
      <div id="hero-sentinel" ref={sentinelRef} className="h-0 w-full pointer-events-none" />

      {/* VIDEO TOURS SECTION (Rounded Dark Elegance) */}
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
                  title="Cinematic Tour Ambient Preview"
                  loading="lazy"
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

      {/* 6. TESTIMONIALS (Carousel) */}
      <TestimonialCarousel />

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
                         defaultValue=""
                         onFocus={() => setActiveFormInput('interest')}
                         onBlur={() => setActiveFormInput(null)}
                         className="w-full bg-white rounded-xl border border-transparent focus:border-[#266F71] focus:ring-1 focus:ring-[#266F71] py-4 px-5 transition-all appearance-none text-sm font-sans outline-none shadow-sm text-gray-700">
                         <option value="" disabled>Select an option</option>
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
    </div>
  );
}
