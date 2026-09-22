import { motion } from 'framer-motion';
import houseHeroSvg from '../../sandbox/assets/House_Herosection.svg';

export default function ListingHeroGallery({ 
  onBookTour, 
  onViewGallery,
  onViewProperties,
  onConsultAgent,
  onInquireNow
}) {
  return (
    <section className="relative w-full bg-white flex flex-col justify-end items-center overflow-hidden pt-[95px] md:pt-[105px] lg:pt-[115px] pb-0">
      
      {/* ─── PURE MORNING SKY WITH TEXTURED NATURAL CLOUDS IN THE MIDDLE ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
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
      </div>

      {/* ─── EYE-CATCHING EDITORIAL TYPOGRAPHY (Replicated from Design) ─── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-20 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 text-left flex flex-col items-start pt-1 md:pt-2"
      >
        {/* Eyebrow Label (Flush aligned with heading, Since 1989 only) */}
        <div className="mb-3 sm:mb-4">
          <span className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.14em] text-[#4a525d] font-sans">
            SINCE 1989
          </span>
        </div>

        {/* Editorial Serif Dual-Tone Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-normal leading-[1.04] tracking-[-0.015em] mb-4 sm:mb-5 max-w-4xl" style={{ fontFamily: 'var(--font-serif)' }}>
          <span className="text-[#266F71] block font-normal">
            Selling Homes,
          </span>
          <span className="text-[#c9684b] block italic font-normal">
            Building Dreams.
          </span>
        </h1>

        {/* Narrative Sub-headline paragraph */}
        <div className="max-w-[720px]">
          <p className="text-[16px] sm:text-[17px] md:text-[18px] text-[#3f4949] font-sans font-normal leading-[1.6] tracking-[-0.01em]">
            For over 37 years, Human Shelter has helped thousands of Filipino families turn their dream of homeownership into reality. From affordable housing to mid-cost homes, we make the journey easy and trustworthy, because we know that owning a home is one of life’s biggest decisions.
          </p>
        </div>
      </motion.div>

      {/* ─── FULL-WIDTH HOUSE ILLUSTRATION (Fitted to Screen Width - Forefront Layer) ─── */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full flex justify-center items-end leading-none -mt-10 sm:-mt-14 md:-mt-20 lg:-mt-24 -translate-y-[32px] -mb-[32px] pointer-events-none"
      >
        <div className="relative w-full flex justify-center items-end">
          <img
            src={houseHeroSvg}
            alt="Human Shelter - Selling Homes, Building Dreams"
            className="w-full w-screen max-w-none h-auto object-contain object-bottom block drop-shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
            loading="eager"
          />

          {/* Dynamic Pure White Morning Light Wash */}
          <motion.div 
            animate={{ opacity: [0.15, 0.28, 0.15] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-transparent pointer-events-none mix-blend-soft-light"
          />
        </div>

        {/* Action Buttons Centered Over Lower Section of the House (Driveway / Street base) */}
        <div className="absolute inset-x-0 bottom-8 sm:bottom-12 md:bottom-16 flex justify-center items-center z-40 pointer-events-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 p-2 sm:p-2.5 rounded-2xl bg-white/85 backdrop-blur-md border border-white shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
            <button
              type="button"
              onClick={onViewProperties}
              className="h-[54px] px-7 rounded-xl bg-[#266F71] hover:bg-[#1f595b] active:scale-[0.98] text-white font-sans text-[15px] sm:text-[16px] font-semibold transition-all duration-200 shadow-[0_4px_16px_rgba(38,111,113,0.35)] flex items-center justify-center cursor-pointer"
            >
              View properties
            </button>

            <button
              type="button"
              onClick={onConsultAgent}
              className="h-[54px] px-6 rounded-xl bg-white hover:bg-[#f5f4ef] active:scale-[0.98] text-[#174849] border border-[#266F71]/40 hover:border-[#266F71] font-sans text-[15px] sm:text-[16px] font-semibold transition-all duration-200 shadow-sm flex items-center justify-center cursor-pointer"
            >
              Consult with an agent
            </button>

            <button
              type="button"
              onClick={onInquireNow}
              className="h-[54px] px-6 rounded-xl bg-[#c9684b] hover:bg-[#b5583c] active:scale-[0.98] text-white font-sans text-[15px] sm:text-[16px] font-semibold transition-all duration-200 shadow-[0_4px_16px_rgba(201,104,75,0.35)] flex items-center justify-center cursor-pointer"
            >
              Inquire now
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
