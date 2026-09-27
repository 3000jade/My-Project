import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconBox,
  IconPhoto,
  IconPointer,
  IconTypography,
  IconLayoutGrid,
  IconPlayerPlay,
  IconPlayerPause,
  IconReload,
  IconCode,
  IconCopy,
  IconCheck,
  IconArrowUpRight,
  IconSparkles,
  IconAdjustmentsHorizontal,
  IconShieldCheck,
  IconFlame,
  IconScan,
  IconBuildingSkyscraper
} from '@tabler/icons-react';

// Visual Assets from Sandbox
import modernVillaImg from '../assets/luxury_modern_villa.jpg';
import twilightVillaImg from '../assets/cinematic_duplex_twilight.jpg';
import interiorPenthouseImg from '../assets/cinematic_interior_penthouse.jpg';
import zenCourtyardImg from '../assets/luxury_zen_courtyard.jpg';
import macroFacadeImg from '../assets/macro_craftsmanship_facade.jpg';

const CATEGORIES = [
  { id: 'all', name: 'All Reveal Types', icon: IconLayoutGrid, count: 5 },
  { id: 'containers', name: 'Containers', icon: IconBox, count: 2 },
  { id: 'images', name: 'Images & Masks', icon: IconPhoto, count: 2 },
  { id: 'buttons', name: 'Buttons & CTAs', icon: IconPointer, count: 2 },
  { id: 'elements', name: 'Typography & Stats', icon: IconTypography, count: 2 },
  { id: 'bento', name: 'Full Landing Bento', icon: IconSparkles, count: 1 }
];

export default function ScrollTriggerLandingShowcase() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [triggerKey, setTriggerKey] = useState(0); // forces re-trigger of animations
  const [isSimulating, setIsSimulating] = useState(false);
  const [viewportThreshold, setViewportThreshold] = useState(0.85); // 0.0 to 1.0
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeCodeSnippet, setActiveCodeSnippet] = useState('containers');
  const [copied, setCopied] = useState(false);

  // Auto-simulation loop
  useEffect(() => {
    let animId;
    if (isSimulating) {
      let forward = true;
      const speed = 0.006;
      const loop = () => {
        setViewportThreshold((prev) => {
          let next = forward ? prev + speed : prev - speed;
          if (next >= 1) {
            next = 1;
            forward = false;
          } else if (next <= 0) {
            next = 0;
            forward = true;
          }
          return next;
        });
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animId);
  }, [isSimulating]);

  const handleReplay = () => {
    setTriggerKey((k) => k + 1);
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Threshold helper: true if threshold is beyond trigger point
  const isTriggered = (triggerPoint) => viewportThreshold >= triggerPoint;

  return (
    <div className="w-full space-y-10 font-sans text-[#F4F7F7]">
      
      {/* ─── CONSOLE CONTROLLER ─── */}
      <div className="bg-[#0C1618] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] text-xs font-mono font-bold uppercase tracking-widest mb-3 border border-[#14B8A6]/30">
              <IconSparkles className="w-3.5 h-3.5 text-[#14B8A6] animate-pulse" />
              <span>Landing Page Component Motion Anatomy</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
              Immersive Scroll <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] via-teal-300 to-[#FF7D5A]">Trigger Reveals</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#95A6A6] mt-2 max-w-2xl leading-relaxed">
              Explore how individual components of a premier luxury landing page—from expanding container horizons and angled image masks to magnetic spring CTAs and micro-telemetry stats—trigger into view on scroll.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`h-[48px] px-5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isSimulating 
                  ? 'bg-[#E76F51] hover:bg-[#D65C3E] text-white shadow-[#E76F51]/20'
                  : 'bg-[#0D4446] hover:bg-[#14B8A6] text-white hover:text-[#070D0E] shadow-[#0D4446]/20'
              }`}
            >
              {isSimulating ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
              <span>{isSimulating ? 'Pause Sweep' : 'Auto-Scrub Viewport'}</span>
            </button>

            <button
              onClick={handleReplay}
              className="h-[48px] px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-mono text-xs transition-colors flex items-center justify-center cursor-pointer"
              title="Re-trigger Entrance Animations"
            >
              <IconReload size={18} />
            </button>

            <button
              onClick={() => {
                setActiveCodeSnippet(activeCategory === 'all' ? 'containers' : activeCategory);
                setShowCodeModal(true);
              }}
              className="h-[48px] px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[#14B8A6] border border-[#14B8A6]/30 font-mono text-xs transition-colors flex items-center gap-2 cursor-pointer"
              title="View Code Snippets"
            >
              <IconCode size={18} />
              <span className="hidden sm:inline">Snippets</span>
            </button>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#14B8A6] text-[#070D0E] border-[#14B8A6] shadow-[0_0_15px_rgba(20,184,166,0.3)]'
                    : 'bg-white/5 hover:bg-white/10 text-[#95A6A6] hover:text-white border-white/10'
                }`}
              >
                <Icon size={16} />
                <span>{cat.name}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${isSelected ? 'bg-black/20 text-black' : 'bg-white/10 text-[#95A6A6]'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Viewport Trigger Scrubber & Threshold Readout */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-2/3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#14B8A6] shrink-0">
              <IconAdjustmentsHorizontal size={16} />
              <span>Viewport Depth:</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={viewportThreshold}
              onChange={(e) => {
                setIsSimulating(false);
                setViewportThreshold(parseFloat(e.target.value));
              }}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#14B8A6]"
            />
            <span className="font-mono text-xs font-bold text-white w-14 text-right shrink-0">
              {Math.round(viewportThreshold * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-5 text-[11px] font-mono text-[#95A6A6] border-t md:border-t-0 pt-2 md:pt-0 border-white/5">
            <div>
              <span>TRIGGER POINT: </span>
              <span className={`font-bold ${viewportThreshold >= 0.4 ? 'text-[#14B8A6]' : 'text-[#FF7D5A]'}`}>
                {viewportThreshold >= 0.75 ? 'BOTTOM 25% REACHED' : viewportThreshold >= 0.35 ? 'THRESHOLD BREACHED' : 'AWAITING SCROLL'}
              </span>
            </div>
            <div>
              <span>PHYSICS: </span>
              <span className="text-white font-bold">spring(300, 25)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SHOWCASE STAGE: SECTION BY SECTION ─── */}
      <div key={triggerKey} className="space-y-12">

        {/* ═══════════════════════════════════════════════
            1. CONTAINER REVEALS
        ═══════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'containers') && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-[#14B8A6]/10 text-[#14B8A6] flex items-center justify-center font-mono text-xs font-bold border border-[#14B8A6]/20">
                  01
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                    Container Reveals &amp; Structural Plinths
                  </h3>
                  <p className="text-xs text-[#95A6A6] font-mono">
                    Expanding horizon margins &amp; spring-elevated architectural stages
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Pattern: Horizon Inset
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Container Pattern A: Expanding Inset Horizon Container */}
              <div className="bg-[#070D0E] p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#95A6A6]">
                  <span className="uppercase font-bold text-[#14B8A6]">Container Pattern A</span>
                  <span>Trigger: top 70%</span>
                </div>

                {/* Animated Container */}
                <motion.div
                  initial={false}
                  animate={{
                    padding: isTriggered(0.3) ? '24px' : '48px',
                    borderRadius: isTriggered(0.3) ? '16px' : '36px',
                    scale: isTriggered(0.3) ? 1.0 : 0.94,
                    borderColor: isTriggered(0.3) ? 'rgba(20, 184, 166, 0.4)' : 'rgba(255, 255, 255, 0.08)'
                  }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#0C1618] border shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#14B8A6]/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#14B8A6] font-bold">
                      HORIZON CONTAINER REVEAL
                    </span>
                    <h4 className="text-xl font-bold font-display text-white">
                      The Sanctuary Atrium Pavilion
                    </h4>
                    <p className="text-xs text-[#95A6A6] leading-relaxed">
                      As the visitor scrolls into this section, the container relaxes its heavy margin insets and snaps outward flush with the structural grid.
                    </p>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-mono text-[#536465]">
                      Margin: {isTriggered(0.3) ? '0px flush' : '48px inset'}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[#14B8A6]">
                      <IconScan size={14} />
                      <span>{isTriggered(0.3) ? 'STAGE EXPANDED' : 'INSET DOCKED'}</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Container Pattern B: Architectural Plinth Slide-Up */}
              <div className="bg-[#070D0E] p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#95A6A6]">
                  <span className="uppercase font-bold text-[#FF7D5A]">Container Pattern B</span>
                  <span>Trigger: top 60%</span>
                </div>

                <div className="relative rounded-2xl overflow-hidden min-h-[300px] bg-[#0C1618] border border-white/10 p-6 flex flex-col justify-end">
                  {/* The Sliding Architectural Plinth */}
                  <motion.div
                    initial={false}
                    animate={{
                      y: isTriggered(0.4) ? 0 : 90,
                      opacity: isTriggered(0.4) ? 1 : 0.25,
                      boxShadow: isTriggered(0.4) 
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(20, 184, 166, 0.2)' 
                        : 'none'
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-[#132427] to-[#070D0E] border border-[#14B8A6]/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#14B8A6] font-bold">
                        ELEVATED PLINTH STAGE
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">
                        Δy: {isTriggered(0.4) ? '0.0px' : '+90.0px'}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white">
                      Cantilevered Observation Deck
                    </h4>
                    <p className="text-xs text-[#95A6A6] leading-relaxed">
                      Emerges smoothly from beneath the frame baseline using dampened spring physics, establishing tactile z-axis spatial permanence.
                    </p>
                  </motion.div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════
            2. IMAGE & MASK REVEALS
        ═══════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'images') && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-[#FF7D5A]/10 text-[#FF7D5A] flex items-center justify-center font-mono text-xs font-bold border border-[#FF7D5A]/20">
                  02
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                    Image Masks &amp; Visual Transitions
                  </h3>
                  <p className="text-xs text-[#95A6A6] font-mono">
                    Diagonal polygon slit wipes &amp; CAD blueprint to photorealism transitions
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Pattern: Angle Slit &amp; Dissolve
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Image Pattern A: Diagonal Slit Mask with Counter Zoom */}
              <div className="bg-[#070D0E] p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#95A6A6]">
                  <span className="uppercase font-bold text-[#14B8A6]">Image Pattern A</span>
                  <span>Trigger: top 50%</span>
                </div>

                <div className="relative h-72 rounded-2xl overflow-hidden bg-black border border-white/10">
                  {/* The Clipped Image */}
                  <motion.div
                    initial={false}
                    animate={{
                      clipPath: isTriggered(0.35) 
                        ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' 
                        : 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)'
                    }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full relative"
                  >
                    <motion.img
                      initial={false}
                      animate={{
                        scale: isTriggered(0.35) ? 1.0 : 1.25
                      }}
                      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                      src={modernVillaImg}
                      alt="Modern Villa"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                  </motion.div>

                  {/* Caption Chip */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                    <span className="text-xs font-mono text-white font-bold">Malibu Oceanfront Reserve</span>
                    <span className="text-[10px] font-mono text-[#14B8A6]">WIPE COMPLETE: {isTriggered(0.35) ? '100%' : '0%'}</span>
                  </div>
                </div>
              </div>

              {/* Image Pattern B: Blueprint CAD to Twilight Photorealism */}
              <div className="bg-[#070D0E] p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#95A6A6]">
                  <span className="uppercase font-bold text-[#FF7D5A]">Image Pattern B</span>
                  <span>Trigger: top 45%</span>
                </div>

                <div className="relative h-72 rounded-2xl overflow-hidden bg-black border border-white/10">
                  {/* Underneath: Twilight Render */}
                  <img
                    src={twilightVillaImg}
                    alt="Twilight Render"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Overlay: Blueprint CAD Wireframe with Grid */}
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: isTriggered(0.4) ? 0 : 1,
                      scale: isTriggered(0.4) ? 1.05 : 1.0
                    }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 w-full h-full bg-[#08181A] flex flex-col items-center justify-center pointer-events-none"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a620_1px,transparent_1px),linear-gradient(to_bottom,#14b8a620_1px,transparent_1px)] bg-[size:32px_32px]" />
                    <IconBuildingSkyscraper size={48} className="text-[#14B8A6] opacity-60 mb-2 relative z-10" />
                    <span className="text-xs font-mono text-[#14B8A6] uppercase tracking-widest relative z-10 font-bold">
                      CAD STRUCTURAL WIREFRAME
                    </span>
                    <span className="text-[10px] font-mono text-[#95A6A6] relative z-10 mt-1">
                      Scroll past 45% to dissolve into photorealism
                    </span>
                  </motion.div>

                  {/* Top Right Status Badge */}
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/80 border border-white/10 text-[10px] font-mono text-white">
                    {isTriggered(0.4) ? 'LUMINOUS TWILIGHT [RENDER]' : 'STRUCTURAL CAD [BLUEPRINT]'}
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════
            3. BUTTONS & CTAS
        ═══════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'buttons') && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold border border-emerald-500/20">
                  03
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                    Buttons &amp; Call-to-Action (CTA) Entrances
                  </h3>
                  <p className="text-xs text-[#95A6A6] font-mono">
                    Magnetic capsule launches &amp; sticky pulse aurora glow conversion docks
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Pattern: Magnetic Launch
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Button Pattern A: Magnetic Capsule Launch */}
              <div className="bg-[#070D0E] p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#95A6A6]">
                  <span className="uppercase font-bold text-[#14B8A6]">Button Pattern A</span>
                  <span>Trigger: top 65%</span>
                </div>

                <div className="h-64 rounded-2xl bg-[#0C1618] border border-white/10 p-6 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#95A6A6]">
                    PRIMARY PROPERTY INQUIRY
                  </span>
                  <h4 className="text-lg font-bold font-display text-white">
                    Ready to Secure an Exclusive Allocation?
                  </h4>

                  {/* The Magnetic Capsule Button */}
                  <motion.div
                    initial={false}
                    animate={{
                      y: isTriggered(0.35) ? 0 : 40,
                      scale: isTriggered(0.35) ? 1.0 : 0.8,
                      opacity: isTriggered(0.35) ? 1 : 0
                    }}
                    transition={{ type: 'spring', damping: 18, stiffness: 250 }}
                  >
                    <button className="h-[54px] px-8 rounded-full bg-[#14B8A6] hover:bg-[#0D9488] text-[#070D0E] font-mono text-xs font-extrabold uppercase tracking-wider flex items-center gap-3 shadow-[0_10px_30px_rgba(20,184,166,0.35)] transition-all cursor-pointer group">
                      <span>Reserve Private Inspection</span>
                      <span className="w-8 h-8 rounded-full bg-[#070D0E] text-[#14B8A6] flex items-center justify-center transition-transform group-hover:rotate-45">
                        <IconArrowUpRight size={16} />
                      </span>
                    </button>
                  </motion.div>
                </div>
              </div>

              {/* Button Pattern B: Sticky Pulse Aurora Glow Dock */}
              <div className="bg-[#070D0E] p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#95A6A6]">
                  <span className="uppercase font-bold text-[#FF7D5A]">Button Pattern B</span>
                  <span>Trigger: top 50%</span>
                </div>

                <div className="h-64 rounded-2xl bg-[#0C1618] border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-[#FF7D5A] font-bold">
                      CONVERSION STICKY ANCHOR
                    </span>
                    <h4 className="text-base font-bold text-white">
                      Fixed Bottom Conversion Dock
                    </h4>
                    <p className="text-xs text-[#95A6A6]">
                      When reaching the decision threshold, the bottom dock summons an ambient Terracotta Coral aurora pulse.
                    </p>
                  </div>

                  {/* Dock Preview */}
                  <motion.div
                    initial={false}
                    animate={{
                      y: isTriggered(0.45) ? 0 : 25,
                      opacity: isTriggered(0.45) ? 1 : 0.4
                    }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="p-3.5 rounded-2xl bg-black/80 border border-white/15 backdrop-blur-md flex items-center justify-between relative"
                  >
                    {isTriggered(0.45) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.98, 1.02, 0.98] }}
                        transition={{ repeat: Infinity, duration: 2.4 }}
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#FF7D5A]/20 via-[#14B8A6]/20 to-[#FF7D5A]/20 blur-md pointer-events-none"
                      />
                    )}

                    <div className="relative z-10 pl-2">
                      <span className="text-[10px] font-mono text-[#95A6A6] block uppercase">Direct Hotline</span>
                      <span className="text-xs font-mono font-bold text-white">+63 (02) 8876-0000</span>
                    </div>

                    <button className="relative z-10 h-[44px] px-5 rounded-xl bg-[#E76F51] hover:bg-[#D65C3E] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg">
                      <IconFlame size={16} />
                      <span>Instant Consultation</span>
                    </button>
                  </motion.div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════
            4. TYPOGRAPHY & MICRO-ELEMENTS
        ═══════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'elements') && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono text-xs font-bold border border-cyan-500/20">
                  04
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                    Typography &amp; Micro-Telemetry Reveals
                  </h3>
                  <p className="text-xs text-[#95A6A6] font-mono">
                    Masked editorial line staggers &amp; JetBrains Mono metric counters
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Pattern: Masked Line Stagger
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Typography Pattern A: Masked Line Stagger */}
              <div className="bg-[#070D0E] p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#95A6A6]">
                  <span className="uppercase font-bold text-[#14B8A6]">Typography Pattern A</span>
                  <span>Trigger: top 75%</span>
                </div>

                <div className="h-64 rounded-2xl bg-[#0C1618] border border-white/10 p-6 flex flex-col justify-center space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#14B8A6] font-bold block mb-1">
                    EDITORIAL MASKED ENTRANCE
                  </span>

                  {[
                    'The Permanent Architecture',
                    'Of High-Value Capital',
                    'And Curated Reserves.'
                  ].map((line, idx) => (
                    <div key={idx} className="overflow-hidden">
                      <motion.h4
                        initial={false}
                        animate={{
                          y: isTriggered(0.25) ? '0%' : '110%',
                          opacity: isTriggered(0.25) ? 1 : 0
                        }}
                        transition={{
                          duration: 0.8,
                          delay: idx * 0.08,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        className={`text-xl sm:text-2xl font-extrabold font-display ${idx === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-teal-200' : 'text-white'}`}
                      >
                        {line}
                      </motion.h4>
                    </div>
                  ))}

                  <p className="text-xs text-[#95A6A6] pt-3 border-t border-white/10 mt-3 font-mono">
                    Zero layout reflow: elements slide out of invisible overflow masks without shifting page geometry.
                  </p>
                </div>
              </div>

              {/* Micro-Telemetry Pattern B: Cadastral Metric Counters */}
              <div className="bg-[#070D0E] p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-[#95A6A6]">
                  <span className="uppercase font-bold text-[#FF7D5A]">Micro-Telemetry Pattern B</span>
                  <span>Trigger: top 60%</span>
                </div>

                <div className="h-64 rounded-2xl bg-[#0C1618] border border-white/10 p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#FF7D5A] font-bold block mb-1">
                      REAL-TIME PERFORMANCE LEDGER
                    </span>
                    <h4 className="text-base font-bold text-white">
                      Verified Sales Velocity Metrics
                    </h4>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'ESCROW POOL', val: isTriggered(0.4) ? '₱1.42B' : '₱0.00', sub: '+18.4% YoY' },
                      { label: 'AVG VELOCITY', val: isTriggered(0.4) ? '16 Days' : '0 Days', sub: 'Top Tier' },
                      { label: 'CAD AUDIT', val: isTriggered(0.4) ? '99.8%' : '0.0%', sub: 'Zero Fault' }
                    ].map((metric, idx) => (
                      <motion.div
                        key={idx}
                        initial={false}
                        animate={{
                          scale: isTriggered(0.4) ? 1.0 : 0.85,
                          opacity: isTriggered(0.4) ? 1 : 0.3
                        }}
                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                        className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center"
                      >
                        <span className="text-[9px] font-mono text-[#95A6A6] uppercase block">{metric.label}</span>
                        <p className="text-base sm:text-lg font-mono font-extrabold text-[#14B8A6] mt-0.5">{metric.val}</p>
                        <span className="text-[9px] font-mono text-emerald-400 block">{metric.sub}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#536465] pt-2 border-t border-white/5">
                    <span>FONT: JetBrains Mono</span>
                    <span>font-feature-settings: 'tnum' 1</span>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════
            5. FULL LANDING PAGE BENTO SECTION
        ═══════════════════════════════════════════════ */}
        {(activeCategory === 'all' || activeCategory === 'bento') && (
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-mono text-xs font-bold border border-purple-500/20">
                  05
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                    Harmonized Landing Page Bento Section
                  </h3>
                  <p className="text-xs text-[#95A6A6] font-mono">
                    All 4 reveal types working together in a unified production section
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Full Bento Matrix
              </span>
            </div>

            {/* Complete Harmonized Bento */}
            <motion.div
              initial={false}
              animate={{
                opacity: isTriggered(0.2) ? 1 : 0.35,
                y: isTriggered(0.2) ? 0 : 40
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 sm:p-8 rounded-3xl bg-[#0C1618] border border-white/10 shadow-2xl space-y-6"
            >
              {/* Header inside Bento */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10">
                <div className="space-y-2">
                  <div className="overflow-hidden">
                    <motion.div
                      animate={{ y: isTriggered(0.25) ? '0%' : '100%' }}
                      transition={{ duration: 0.6 }}
                      className="inline-flex items-center gap-2 text-xs font-mono text-[#14B8A6] font-bold uppercase tracking-widest"
                    >
                      <IconShieldCheck size={14} />
                      <span>Certified Allocation Ledger</span>
                    </motion.div>
                  </div>
                  <div className="overflow-hidden">
                    <motion.h4
                      animate={{ y: isTriggered(0.3) ? '0%' : '100%' }}
                      transition={{ duration: 0.7 }}
                      className="text-2xl sm:text-3xl font-extrabold font-display text-white"
                    >
                      Prime Capital Residences
                    </motion.h4>
                  </div>
                </div>

                {/* Staggered Magnetic CTA */}
                <motion.div
                  animate={{
                    scale: isTriggered(0.35) ? 1.0 : 0.85,
                    opacity: isTriggered(0.35) ? 1 : 0
                  }}
                  transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                >
                  <button className="h-[48px] px-6 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-[#070D0E] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md">
                    <span>View All 12 Allocations</span>
                    <IconArrowUpRight size={16} />
                  </button>
                </motion.div>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Bento Card 1: Image Curtain */}
                <motion.div
                  animate={{
                    y: isTriggered(0.3) ? 0 : 30,
                    opacity: isTriggered(0.3) ? 1 : 0.2
                  }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="md:col-span-2 relative h-64 rounded-2xl overflow-hidden border border-white/10 group"
                >
                  <img
                    src={zenCourtyardImg}
                    alt="Zenith Courtyard"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#14B8A6] uppercase tracking-wider font-bold">Featured Sanctuary</span>
                      <h5 className="text-base font-bold text-white">The Zenith Japanese Courtyard</h5>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-black/60 border border-white/20 text-xs font-mono text-white font-bold">
                      ₱38,500,000
                    </span>
                  </div>
                </motion.div>

                {/* Bento Card 2: Micro Telemetry */}
                <motion.div
                  animate={{
                    y: isTriggered(0.3) ? 0 : 30,
                    opacity: isTriggered(0.3) ? 1 : 0.2
                  }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#FF7D5A] font-bold block mb-1">
                      CADASTRAL AUDIT
                    </span>
                    <h5 className="text-base font-bold text-white">
                      Clear Title Registry
                    </h5>
                    <p className="text-xs text-[#95A6A6] mt-2">
                      100% verified cadastral boundaries registered under Torrens Title with Land Registration Authority.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">LRA-VERIFIED</span>
                    <IconShieldCheck className="text-emerald-400" size={18} />
                  </div>
                </motion.div>

              </div>
            </motion.div>
          </section>
        )}

      </div>

      {/* ─── CODE RECIPE MODAL ─── */}
      <AnimatePresence>
        {showCodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowCodeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0C1618] border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-[#14B8A6] font-bold uppercase tracking-wider block">
                    RECIPE • {activeCodeSnippet.toUpperCase()}
                  </span>
                  <h3 className="text-xl font-bold font-display text-white mt-1">
                    Scroll Trigger Reveal Code Snippet
                  </h3>
                </div>

                <button
                  onClick={() => setShowCodeModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Code Snippet Box */}
              <div className="relative rounded-2xl bg-black p-4 font-mono text-xs text-emerald-400 overflow-x-auto border border-white/10 max-h-80">
                <pre>{`// Production-ready Framer Motion snippet for ${activeCodeSnippet}
import { motion } from 'framer-motion';

${activeCodeSnippet === 'containers' ? `// Container Inset-to-Flush Reveal
export function HorizonContainer({ children }) {
  return (
    <motion.div
      initial={{ padding: '48px', borderRadius: '36px', scale: 0.94 }}
      whileInView={{ padding: '24px', borderRadius: '16px', scale: 1.0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="bg-[#0C1618] border border-teal-500/30"
    >
      {children}
    </motion.div>
  );` : activeCodeSnippet === 'images' ? `// Angled Polygon Slit Mask Image Reveal
export function AngledSlitImage({ src, alt }) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <motion.div
        initial={{ clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' }}
        whileInView={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.img
          initial={{ scale: 1.25 }}
          whileInView={{ scale: 1.0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </motion.div>
    </div>
  );` : activeCodeSnippet === 'buttons' ? `// Magnetic Spring Capsule Launch Button
export function MagneticCapsuleButton({ label, onClick }) {
  return (
    <motion.button
      initial={{ y: 35, scale: 0.8, opacity: 0 }}
      whileInView={{ y: 0, scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', damping: 18, stiffness: 250 }}
      onClick={onClick}
      className="h-[54px] px-8 rounded-full bg-[#14B8A6] text-[#070D0E] font-mono font-bold uppercase tracking-wider flex items-center gap-3 shadow-lg"
    >
      <span>{label}</span>
      <span className="w-8 h-8 rounded-full bg-[#070D0E] text-[#14B8A6] flex items-center justify-center">
        ↗
      </span>
    </motion.button>
  );` : `// Editorial Masked Line Stagger
export function EditorialHeadline({ lines }) {
  return (
    <div className="space-y-1">
      {lines.map((line, idx) => (
        <div key={idx} className="overflow-hidden">
          <motion.h2
            initial={{ y: '110%', opacity: 0 }}
            whileInView={{ y: '0%', opacity: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-extrabold text-white"
          >
            {line}
          </motion.h2>
        </div>
      ))}
    </div>
  );`}`}</pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#95A6A6] font-mono">
                  WCAG AAA Contrast • Zero Layout Reflow
                </span>
                <button
                  onClick={() => handleCopyCode(`// ${activeCodeSnippet.toUpperCase()} Scroll Trigger Reveal\n// Ready for production implementation`)}
                  className="px-5 py-2.5 rounded-xl bg-[#14B8A6] hover:bg-[#0D9488] text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                >
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  <span>{copied ? 'Copied Recipe!' : 'Copy Code'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
