import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import houseHeroSvg from '../../../sandbox/assets/House_Herosection.svg';

export default function ListingHeroGallery({ 
  onBookTour, 
  onViewGallery,
  onViewProperties,
  onConsultAgent,
  onInquireNow
}) {
  const heroRef = useRef(null);

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
  const yHeadlineText = useTransform(smoothProgress, [0, 1], ['0px', '-90px']);
  const ySkyClouds = useTransform(smoothProgress, [0, 1], ['0px', '55px']);
  const opacitySkyGlow = useTransform(smoothProgress, [0, 0.85], [1, 0.45]);

  return (
    <section ref={heroRef} className="relative w-full bg-white flex flex-col justify-end items-center overflow-hidden pt-[95px] md:pt-[105px] lg:pt-[115px] pb-0">
      
      {/* ─── PURE MORNING SKY WITH TEXTURED NATURAL CLOUDS IN THE MIDDLE ─── */}
      <motion.div 
        style={{ y: ySkyClouds, opacity: opacitySkyGlow }}
        className="absolute inset-0 pointer-events-none overflow-hidden z-0"
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

        {/* Crisp Gradient Sky: Clear Cerulean / Soft Morning Azure down to White */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#b3dbff] via-[#d6ecff]/70 to-white" />

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
        className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-12 text-left flex flex-col items-start pt-2 sm:pt-4 will-change-transform"
      >
        <div className="relative w-full max-w-3xl rounded-3xl p-6 sm:p-8 md:p-10 bg-gradient-to-br from-white/70 via-white/50 to-[#d6ecff]/45 backdrop-blur-2xl border border-white/85 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_20px_50px_rgba(100,160,220,0.18)] transition-all">
          
          {/* Top Cadastral Telemetry Stamp Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-5">
            <span className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.14em] text-[#0D4446] font-mono bg-white/85 px-3 py-1 rounded-full border border-[#0D4446]/20 shadow-xs">
              SINCE 1989 · HUMAN SHELTER ARCHITECTURAL HOLDINGS
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono font-medium tracking-[0.12em] text-[#0D4446]/70 uppercase">
              14.5995° N, 120.9842° E // HS-PH
            </span>
          </div>

          {/* Editorial Modernist H1 Display (56px, -0.03em, weight 800) */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold leading-[1.08] tracking-[-0.03em] mb-4 font-display">
            <span className="text-[#0D4446] block drop-shadow-xs">
              Selling Homes,
            </span>
            <span className="text-[#E76F51] block italic font-serif drop-shadow-xs">
              Building Dreams.
            </span>
          </h1>

          {/* Architectural Subtle Hairline Accent */}
          <div className="w-full h-px bg-gradient-to-r from-[#0D4446]/20 via-[#0D4446]/10 to-transparent my-4 sm:my-5" />

          {/* Narrative Sub-headline paragraph */}
          <div className="max-w-[640px]">
            <p className="text-[15px] sm:text-[16px] md:text-[17px] text-[#141717] font-sans font-medium leading-[1.65] tracking-[-0.01em]">
              For over 37 years, Human Shelter has helped thousands of Filipino families turn their dream of homeownership into reality. From affordable housing to mid-cost homes, we make the journey easy and trustworthy, because we know that owning a home is one of life’s biggest decisions.
            </p>
          </div>

          {/* Action Buttons Beneath Body Text with Login Button 45° Glass Light-Beam Shine Effect */}
          <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-3 sm:gap-4 z-30">
            <button
              type="button"
              onClick={onConsultAgent}
              className="premium-btn h-[54px] px-7 rounded-full bg-white/90 hover:bg-white text-[#0D4446] border border-[#0D4446]/25 backdrop-blur-md font-sans text-[15px] font-semibold transition-all duration-300 shadow-[0_4px_16px_rgba(13,68,70,0.08)] hover:shadow-[0_8px_24px_rgba(13,68,70,0.15)] flex items-center gap-3 cursor-pointer"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Consult with an agent</span>
            </button>

            <button
              type="button"
              onClick={onInquireNow}
              className="premium-btn h-[54px] px-8 rounded-full bg-[#E76F51] hover:bg-[#D65C3E] text-white font-sans text-[15px] font-bold tracking-wide transition-all duration-300 shadow-[0_8px_20px_rgba(231,111,81,0.35)] hover:shadow-[0_12px_28px_rgba(231,111,81,0.45)] flex items-center gap-2.5 justify-center cursor-pointer group"
            >
              <span>Inquire now</span>
              <span className="text-[18px] leading-none transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5">↗</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── FULL-WIDTH HOUSE ILLUSTRATION (Hyper-Depth 2.5x Parallax Plane) ─── */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ y: yHeroHouse, scale: scaleHeroHouse }}
        transition={{ duration: 1, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full flex justify-center items-end leading-none -mt-24 sm:-mt-32 md:-mt-44 lg:-mt-52 pointer-events-none origin-bottom will-change-transform"
      >
        <div className="relative w-full flex justify-center items-end">
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
