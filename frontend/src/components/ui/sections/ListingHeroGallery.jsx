import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  IconMessages,
  IconArrowRight,
  IconSearch,
  IconMapPin,
  IconHome,
  IconCoin,
  IconShieldCheck
} from '@tabler/icons-react';
import houseHeroSvg from '../../../sandbox/assets/House_Herosection.svg';

export default function ListingHeroGallery({
  onBookTour,
  onViewGallery,
  onViewProperties,
  onConsultAgent,
  onInquireNow
}) {
  const heroRef = useRef(null);
  const navigate = useNavigate();

  // Search Bar Local State
  const [searchLocation, setSearchLocation] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchBudget, setSearchBudget] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.set('location', searchLocation);
    if (searchType) params.set('type', searchType);
    if (searchBudget) params.set('budget', searchBudget);
    navigate(`/properties?${params.toString()}`);
  };

  // Parallax motion tracking with Hyper-Depth 2.5x intensity
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  // Spring physics for smooth momentum scrolling with Lenis
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 24,
    mass: 0.2
  });

  // Hyper-Depth 2.5x layer transformations
  const yHeroHouse = useTransform(smoothProgress, [0, 1], ['0px', '220px']);
  const scaleHeroHouse = useTransform(smoothProgress, [0, 1], [1, 1.12]);
  const yHeadlineText = useTransform(smoothProgress, [0, 1], ['0px', '-35px']);
  const ySkyClouds = useTransform(smoothProgress, [0, 1], ['0px', '55px']);
  const opacitySkyGlow = useTransform(smoothProgress, [0, 0.85], [1, 0.45]);

  return (
    <section ref={heroRef} className="relative w-full bg-white flex flex-col justify-start items-center overflow-hidden pt-[82px] sm:pt-[86px] md:pt-[90px] pb-0 min-h-[90vh] sm:min-h-screen transition-colors duration-500">

      {/* ─── PURE MORNING SKY WITH TEXTURED NATURAL CLOUDS IN THE MIDDLE ─── */}
      <motion.div
        style={{ y: ySkyClouds, opacity: opacitySkyGlow }}
        className="absolute inset-0 pointer-events-none overflow-hidden z-0 transition-opacity duration-500"
      >
        {/* SVG Definition for Organic Realistic Cloud Turbulence & Displacement */}
        <svg className="absolute w-0 h-0 pointer-events-none">
          <filter id="cloud-filter-main" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="5" result="noise" seed="42" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="35" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="cloud-filter-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="4" result="noise" seed="18" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="25" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="smoke-filter" x="-25%" y="-25%" width="150%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="5" result="smoke" seed="88" />
            <feDisplacementMap in="SourceGraphic" in2="smoke" scale="40" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        {/* Crisp Gradient Sky: Clear Cerulean down to White / Deep Night Sky in Dark Mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#b3dbff] via-[#d6ecff]/70 to-white transition-colors duration-500" />

        {/* ─── CONTINUOUS STREAM OF CLOUDS (True Endless Flow Across Sky) ─── */}
        {/* Lane 1: Upper Sky Stream (High Altitude Cumulus) */}
        <div
          className="cloud-flow absolute top-[100px] sm:top-[110px] md:top-[120px] left-0 w-[420px] sm:w-[480px] h-[125px] pointer-events-none z-[1]"
          style={{ animationDuration: '65s', animationDelay: '-32s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_12px_24px_rgba(100,160,220,0.35)]">
            <div className="absolute bottom-2 left-6 w-[86%] h-[65px] bg-white/95 rounded-full" />
            <div className="absolute top-2 left-[18%] w-[160px] h-[92px] bg-white rounded-full" />
            <div className="absolute top-0 left-[44%] w-[180px] h-[105px] bg-white rounded-full" />
            <div className="absolute top-5 left-[66%] w-[140px] h-[80px] bg-white/95 rounded-full" />
            <div className="absolute -top-1 left-[36%] w-[90px] h-[48px] bg-white/90 rounded-full blur-[2px]" />
            <div className="absolute top-7 -left-[2%] w-[95px] h-[50px] bg-white/80 rounded-full blur-[3px]" />
          </div>
        </div>
        <div
          className="cloud-flow absolute top-[95px] sm:top-[105px] md:top-[115px] left-0 w-[400px] sm:w-[460px] h-[120px] pointer-events-none z-[1]"
          style={{ animationDuration: '65s', animationDelay: '0s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_12px_24px_rgba(100,160,220,0.35)]">
            <div className="absolute bottom-2 left-6 w-[86%] h-[62px] bg-white/95 rounded-full" />
            <div className="absolute top-2 left-[20%] w-[150px] h-[88px] bg-white rounded-full" />
            <div className="absolute top-0 left-[46%] w-[170px] h-[100px] bg-white rounded-full" />
            <div className="absolute top-5 left-[68%] w-[130px] h-[75px] bg-white/95 rounded-full" />
            <div className="absolute -top-1 left-[38%] w-[85px] h-[45px] bg-white/90 rounded-full blur-[2px]" />
          </div>
        </div>

        {/* Lane 2: Mid Sky Stream (Parallel to Headline/Subheadline) */}
        <div
          className="cloud-flow absolute top-[180px] sm:top-[195px] md:top-[210px] left-0 w-[360px] sm:w-[420px] h-[110px] pointer-events-none z-[1]"
          style={{ animationDuration: '55s', animationDelay: '-18s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_10px_20px_rgba(100,160,220,0.3)]">
            <div className="absolute bottom-2 left-5 w-[85%] h-[58px] bg-white/90 rounded-full" />
            <div className="absolute top-2 left-[20%] w-[140px] h-[82px] bg-white rounded-full" />
            <div className="absolute top-0 left-[45%] w-[155px] h-[95px] bg-white rounded-full" />
            <div className="absolute top-4 left-[64%] w-[120px] h-[72px] bg-white/95 rounded-full" />
            <div className="absolute -top-1 left-[32%] w-[80px] h-[44px] bg-white/85 rounded-full blur-[2px]" />
          </div>
        </div>
        <div
          className="cloud-flow absolute top-[190px] sm:top-[205px] md:top-[220px] left-0 w-[340px] sm:w-[390px] h-[105px] pointer-events-none z-[1]"
          style={{ animationDuration: '55s', animationDelay: '-45s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_10px_20px_rgba(100,160,220,0.3)]">
            <div className="absolute bottom-2 left-5 w-[85%] h-[55px] bg-white/90 rounded-full" />
            <div className="absolute top-2 left-[18%] w-[130px] h-[78px] bg-white rounded-full" />
            <div className="absolute top-0 left-[42%] w-[145px] h-[90px] bg-white rounded-full" />
            <div className="absolute top-4 left-[62%] w-[115px] h-[68px] bg-white/95 rounded-full" />
            <div className="absolute -top-1 left-[30%] w-[75px] h-[40px] bg-white/85 rounded-full blur-[2px]" />
          </div>
        </div>

        {/* Lane 3: Lower Sky Stream (Directly Above Townhouse Rooflines) */}
        <div
          className="cloud-flow absolute top-[280px] sm:top-[300px] md:top-[315px] left-0 w-[280px] sm:w-[330px] h-[85px] pointer-events-none z-[1]"
          style={{ animationDuration: '70s', animationDelay: '-24s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_8px_16px_rgba(100,160,220,0.25)]">
            <div className="absolute bottom-1 left-4 w-[84%] h-[45px] bg-white/90 rounded-full" />
            <div className="absolute top-1 left-[16%] w-[105px] h-[60px] bg-white rounded-full" />
            <div className="absolute top-0 left-[42%] w-[120px] h-[70px] bg-white rounded-full" />
            <div className="absolute top-3 left-[65%] w-[90px] h-[50px] bg-white/90 rounded-full" />
            <div className="absolute -top-1 left-[35%] w-[65px] h-[34px] bg-white/80 rounded-full blur-[2px]" />
          </div>
        </div>
        <div
          className="cloud-flow absolute top-[290px] sm:top-[310px] md:top-[325px] left-0 w-[260px] sm:w-[300px] h-[80px] pointer-events-none z-[1]"
          style={{ animationDuration: '70s', animationDelay: '-58s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_8px_16px_rgba(100,160,220,0.25)]">
            <div className="absolute bottom-1 left-4 w-[84%] h-[42px] bg-white/90 rounded-full" />
            <div className="absolute top-1 left-[18%] w-[95px] h-[55px] bg-white rounded-full" />
            <div className="absolute top-0 left-[44%] w-[110px] h-[65px] bg-white rounded-full" />
            <div className="absolute top-3 left-[68%] w-[80px] h-[45px] bg-white/90 rounded-full" />
            <div className="absolute -top-1 left-[38%] w-[55px] h-[30px] bg-white/80 rounded-full blur-[2px]" />
          </div>
        </div>

        {/* Lane 4: Distant Roof Apex Horizon Stream */}
        <div
          className="cloud-flow absolute top-[345px] sm:top-[360px] md:top-[375px] left-0 w-[200px] sm:w-[240px] h-[65px] pointer-events-none z-[1]"
          style={{ animationDuration: '80s', animationDelay: '-12s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_6px_14px_rgba(100,160,220,0.2)]">
            <div className="absolute bottom-1 left-3 w-[84%] h-[35px] bg-white/85 rounded-full" />
            <div className="absolute top-0 left-[20%] w-[80px] h-[48px] bg-white/95 rounded-full" />
            <div className="absolute top-1 left-[48%] w-[88px] h-[52px] bg-white/90 rounded-full" />
            <div className="absolute -top-1 left-[32%] w-[50px] h-[26px] bg-white/75 rounded-full blur-[2px]" />
          </div>
        </div>
        <div
          className="cloud-flow absolute top-[350px] sm:top-[365px] md:top-[380px] left-0 w-[180px] sm:w-[220px] h-[60px] pointer-events-none z-[1]"
          style={{ animationDuration: '80s', animationDelay: '-52s' }}
        >
          <div className="relative w-full h-full drop-shadow-[0_6px_14px_rgba(100,160,220,0.2)]">
            <div className="absolute bottom-1 left-3 w-[84%] h-[32px] bg-white/85 rounded-full" />
            <div className="absolute top-0 left-[22%] w-[70px] h-[42px] bg-white/95 rounded-full" />
            <div className="absolute top-1 left-[50%] w-[78px] h-[46px] bg-white/90 rounded-full" />
            <div className="absolute -top-1 left-[34%] w-[45px] h-[24px] bg-white/75 rounded-full blur-[2px]" />
          </div>
        </div>

        {/* Subtle Morning Sun Lighting (Soft Top-Left Glow) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 10% 15%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.1) 35%, transparent 65%)'
          }}
        />
      </motion.div>

      {/* ─── ARCHITECTURAL FROSTED GLASS MONOLITH (Authentic & Immersive Exhibition Plate) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ y: yHeadlineText }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-20 w-full max-w-[1560px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 flex flex-col items-start justify-start pt-1 md:pt-2 will-change-transform"
      >
        <div className="relative w-full max-w-xl lg:max-w-2xl rounded-[22px] p-6 sm:p-7 md:p-8 bg-white/20 backdrop-blur-md border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),0_12px_36px_rgba(13,68,70,0.06)] transition-all">

          {/* Architectural Drafting Corner Crosshairs */}
          <div className="absolute top-3 left-3 text-[13px] font-mono leading-none text-[#0D4446]/40 select-none pointer-events-none">⌜</div>
          <div className="absolute top-3 right-3 text-[13px] font-mono leading-none text-[#0D4446]/40 select-none pointer-events-none">⌝</div>
          <div className="absolute bottom-3 left-3 text-[13px] font-mono leading-none text-[#0D4446]/40 select-none pointer-events-none">⌞</div>
          <div className="absolute bottom-3 right-3 text-[13px] font-mono leading-none text-[#0D4446]/40 select-none pointer-events-none">⌟</div>

          {/* Trust Badge Top Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/45 text-[#0D4446] border border-white/60 shadow-xs text-xs font-semibold tracking-wide mb-3 backdrop-blur-sm">
            <IconShieldCheck size={16} stroke={2.5} className="text-[#0D4446]" />
            <span>37 Years of Trusted Homeownership in the Philippines</span>
          </div>

          {/* Editorial Modernist H1 Display */}
          <h1 className="text-3xl sm:text-4xl md:text-[44px] lg:text-[48px] font-extrabold leading-[1.08] tracking-[-0.03em] mb-3.5 font-display">
            <span className="text-[#0D4446] block drop-shadow-xs">
              Selling Homes,
            </span>
            <span className="text-[#E76F51] block italic font-serif drop-shadow-xs">
              Building Dreams.
            </span>
          </h1>

          {/* Architectural Subtle Hairline Accent */}
          <div className="w-full h-px bg-gradient-to-r from-[#0D4446]/20 via-[#0D4446]/10 to-transparent my-3 sm:my-3.5" />

          {/* Narrative Sub-headline paragraph */}
          <div className="max-w-[560px]">
            <p className="text-[14px] sm:text-[15px] md:text-[16px] text-[#141717] font-sans font-medium leading-[1.6] tracking-[-0.01em]">
              For over 37 years, Human Shelter has helped thousands of Filipino families turn their dream of homeownership into reality. From affordable starter homes to mid-cost master-planned communities, we make your journey secure, transparent, and joyful.
            </p>
          </div>

          {/* ─── SECONDARY CONVERSATION & EXPLORATION ACTIONS ─── */}
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-between gap-3.5 z-30 pt-3.5 border-t border-[#0D4446]/10">
            <button
              type="button"
              aria-label="Consult with an agent"
              onClick={onConsultAgent}
              className="btn-shine premium-btn shine-md h-[46px] px-5 sm:px-6 rounded-full bg-[#187A7E] hover:bg-[#136669] text-white font-sans text-[12px] sm:text-[13px] font-bold tracking-wider uppercase inline-flex items-center gap-2.5 shadow-[0_4px_16px_rgba(24,122,126,0.28)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 ease-out cursor-pointer group shrink-0"
            >
              {/* Live Advisor Beacon */}
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>

              <IconMessages
                size={18}
                stroke={2}
                className="shrink-0 group-hover:scale-110 transition-transform duration-300"
              />

              <span>Consult with an agent</span>
            </button>

            <button
              type="button"
              aria-label="View properties"
              onClick={onViewProperties}
              className="inline-flex items-center gap-2 font-sans text-[13px] sm:text-[14px] font-bold text-[#145E61] hover:text-[#E76F51] transition-all duration-300 cursor-pointer group"
            >
              <span className="border-b border-[#145E61]/40 group-hover:border-[#E76F51] pb-0.5 transition-colors duration-300">
                View properties
              </span>
              <IconArrowRight
                size={16}
                stroke={2.5}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>
          </div>
        </div>

        {/* ─── INTEGRATED QUICK SEARCH BAR (Sheer Transparent Glass Chassis) ─── */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-3 sm:mt-3.5 w-full max-w-xl lg:max-w-2xl p-2.5 sm:p-3 rounded-[18px] bg-white/25 backdrop-blur-md border border-white/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.7),0_10px_28px_rgba(13,68,70,0.05)] grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center z-30"
        >
          {/* Location Select */}
          <div className="sm:col-span-6 relative flex items-center">
            <IconMapPin size={18} className="absolute left-3.5 text-[#187A7E] pointer-events-none" />
            <select
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full h-[50px] pl-10 pr-8 rounded-[10px] bg-white/40 hover:bg-white/55 focus:bg-white/80 border border-white/50 text-xs sm:text-sm font-medium text-[#141717] focus:outline-none focus:border-[#187A7E] transition-colors cursor-pointer appearance-none shadow-2xs"
            >
              <option value="">All Locations (PH)</option>
              <option value="Cavite">Cavite (Bacoor, Imus, Dasma)</option>
              <option value="Laguna">Laguna (Santa Rosa, Biñan)</option>
              <option value="Metro Manila">Metro Manila (Taguig, QC, Makati)</option>
              <option value="Rizal">Rizal (Antipolo, Taytay)</option>
              <option value="Batangas">Batangas & South Corridors</option>
            </select>
          </div>

          {/* Property Type Select */}
          <div className="sm:col-span-6 relative flex items-center">
            <IconHome size={18} className="absolute left-3.5 text-[#187A7E] pointer-events-none" />
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full h-[50px] pl-10 pr-8 rounded-[10px] bg-white/40 hover:bg-white/55 focus:bg-white/80 border border-white/50 text-xs sm:text-sm font-medium text-[#141717] focus:outline-none focus:border-[#187A7E] transition-colors cursor-pointer appearance-none shadow-2xs"
            >
              <option value="">All Property Types</option>
              <option value="House and Lot">House & Lot</option>
              <option value="Condominium">Condominium</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Duplex">Duplex / Commercial</option>
            </select>
          </div>

          {/* Budget Select */}
          <div className="sm:col-span-7 relative flex items-center">
            <IconCoin size={18} className="absolute left-3.5 text-[#187A7E] pointer-events-none" />
            <select
              value={searchBudget}
              onChange={(e) => setSearchBudget(e.target.value)}
              className="w-full h-[50px] pl-10 pr-8 rounded-[10px] bg-white/40 hover:bg-white/55 focus:bg-white/80 border border-white/50 text-xs sm:text-sm font-medium text-[#141717] focus:outline-none focus:border-[#187A7E] transition-colors cursor-pointer appearance-none shadow-2xs"
            >
              <option value="">Any Budget</option>
              <option value="under-3m">Under ₱3M (Pag-IBIG / Starter)</option>
              <option value="3m-8m">₱3M - ₱8M (Mid-Cost Family)</option>
              <option value="above-8m">₱8M+ (Executive / Premium)</option>
            </select>
          </div>

          {/* Submit Lighter Coral CTA Button */}
          <div className="sm:col-span-5">
            <button
              type="submit"
              className="w-full h-[50px] px-4 rounded-[10px] bg-[#F07A5F] hover:bg-[#e76f51] active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(240,122,95,0.32)] transition-all cursor-pointer"
            >
              <IconSearch size={16} stroke={2.5} />
              <span>Find Homes</span>
            </button>
          </div>
        </form>
      </motion.div>

      {/* ─── FULL-WIDTH HOUSE ILLUSTRATION (Hyper-Depth 2.5x Parallax Plane) ─── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ y: yHeroHouse, scale: scaleHeroHouse }}
        transition={{ duration: 1, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full flex justify-center items-center mx-auto leading-none -mt-32 sm:-mt-44 md:-mt-56 lg:-mt-72 pointer-events-none origin-center will-change-transform"
      >
        <div className="relative w-full flex justify-center items-center">
          <img
            src={houseHeroSvg}
            alt="Human Shelter - Selling Homes, Building Dreams"
            className="w-full min-w-full max-w-none h-auto object-cover object-center block drop-shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
            loading="eager"
          />

          {/* Dynamic Pure White Morning Light Wash */}
          <motion.div
            animate={{ opacity: [0.15, 0.28, 0.15] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-transparent pointer-events-none mix-blend-soft-light"
          />
        </div>
      </motion.div>
    </section>
  );
}
