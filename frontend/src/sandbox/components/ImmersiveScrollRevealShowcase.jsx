import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconEye,
  IconSparkles,
  IconCompass,
  IconLayersSubtract,
  IconAdjustmentsHorizontal,
  IconPlayerPlay,
  IconPlayerPause,
  IconReload,
  IconCode,
  IconCopy,
  IconCheck,
  IconScan,
  IconArrowsSplit,
  IconLayoutCards,
  IconColumns,
  IconFlame,
  IconArrowUpRight,
  IconBuildingSkyscraper
} from '@tabler/icons-react';

// Visual Assets from Sandbox
import modernVillaImg from '../assets/luxury_modern_villa.jpg';
import twilightVillaImg from '../assets/cinematic_duplex_twilight.jpg';
import interiorPenthouseImg from '../assets/cinematic_interior_penthouse.jpg';
import zenCourtyardImg from '../assets/luxury_zen_courtyard.jpg';
import macroFacadeImg from '../assets/macro_craftsmanship_facade.jpg';

const REVEAL_MODES = [
  {
    id: 'iris',
    title: 'Iris Aperture Portal',
    subtitle: 'Concentric Circular Expansion',
    tag: 'Pattern 01 • Optical Aperture',
    icon: IconScan,
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    summary: 'A circular focal badge expands from a compact reticle into a full-bleed panoramic architectural viewport as the user scrolls, simulating an expanding optical camera iris.'
  },
  {
    id: 'split',
    title: 'Asymmetric Split Shearing',
    subtitle: 'Counter-Directional Dual Trajectory',
    tag: 'Pattern 02 • Structural Alignment',
    icon: IconArrowsSplit,
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    summary: 'Opposing vertical panels (wireframe structural elevation on left, photorealistic twilight render on right) shear from opposite directions and snap seamlessly together on scroll.'
  },
  {
    id: 'stack',
    title: '3D Keynote Deck Stacking',
    subtitle: 'Sequential Layer Peeling & Depth Decay',
    tag: 'Pattern 03 • Layer Stacking',
    icon: IconLayoutCards,
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    summary: 'Consecutive luxury property reserve cards slide up, pin stickily, and dynamically scale down (1.0 -> 0.94 -> 0.88) with depth dimming as the next card stacks over top.'
  },
  {
    id: 'louvers',
    title: 'Multi-Blade Louver Curtain',
    subtitle: 'Motorized Architectural Shutter Reveal',
    tag: 'Pattern 04 • Staggered Shutter',
    icon: IconColumns,
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    summary: '8 vertical geometric slats rotate on the Y-axis with 40ms micro-staggers, parting like motorized architectural sun louvers to unveil a panoramic penthouse horizon.'
  },
  {
    id: 'laser',
    title: 'Laser Telemetry Scanner',
    subtitle: 'Velocity-Driven CAD Hotspot Inspection',
    tag: 'Pattern 05 • Telemetry Sweep',
    icon: IconEye,
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    summary: 'A luminous cyan laser scan beam tracks scroll velocity across an architectural elevation, illuminating hidden structural tolerances and CAD material spec callouts.'
  }
];

export default function ImmersiveScrollRevealShowcase() {
  const [activeMode, setActiveMode] = useState('iris');
  const [scrubValue, setScrubValue] = useState(0.35); // 0 to 1
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-play animation loop
  useEffect(() => {
    let animId;
    if (isPlaying) {
      let forward = true;
      const speed = 0.005;
      const tick = () => {
        setScrubValue((prev) => {
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
        animId = requestAnimationFrame(tick);
      };
      animId = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handleCopyCode = (codeText) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mathematical Transforms for Mode 1: Iris Aperture
  // Circular aperture radius: 14% at 0, 100% at 1.0
  const irisRadius = 14 + scrubValue * 86;
  const irisImageScale = 1.3 - scrubValue * 0.3; // 1.3 down to 1.0
  const irisFStop = (1.4 + (1 - scrubValue) * 14.6).toFixed(1); // f/16 down to f/1.4

  // Mathematical Transforms for Mode 2: Split Shearing
  // Left moves down (-100px -> 0px), Right moves up (+100px -> 0px)
  const splitLeftY = (1 - scrubValue) * -90;
  const splitRightY = (1 - scrubValue) * 90;
  const splitOpacity = 0.4 + scrubValue * 0.6;

  // Mathematical Transforms for Mode 3: Deck Stacking
  // 3 cards (index 0, 1, 2)
  const activeDeckIndex = Math.min(2, Math.floor(scrubValue * 3));

  // Mathematical Transforms for Mode 4: Louvers
  // 8 slats
  const louverAngle = (1 - scrubValue) * 90; // 90deg (closed) down to 0deg (open)

  // Mathematical Transforms for Mode 5: Laser Telemetry
  const laserXPercent = scrubValue * 100;

  return (
    <div className="w-full space-y-8 font-sans">
      
      {/* ─── SHOWCASE HEADER & CONTROL CONSOLE ─── */}
      <div className="bg-[#0C1618] text-[#F4F7F7] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] text-xs font-mono font-bold uppercase tracking-widest mb-3 border border-[#14B8A6]/30">
              <IconSparkles className="w-3.5 h-3.5 text-[#14B8A6] animate-pulse" />
              <span>Immersive Scroll Reveal Suite • 5 Master Patterns</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
              The Architecture of the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#FF7D5A]">Scroll Reveal</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#95A6A6] mt-2 max-w-2xl leading-relaxed">
              Award-winning scroll storytelling mechanisms. Moving beyond static fade-ins to aperture expansions, counter-directional shearing, layer deck peeling, and CAD laser sweeps.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`h-[48px] px-5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isPlaying 
                  ? 'bg-[#E76F51] hover:bg-[#D65C3E] text-white shadow-[#E76F51]/20'
                  : 'bg-[#0D4446] hover:bg-[#14B8A6] text-white hover:text-[#070D0E] shadow-[#0D4446]/20'
              }`}
            >
              {isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
              <span>{isPlaying ? 'Pause Auto-Scrub' : 'Simulate Scroll'}</span>
            </button>

            <button
              onClick={() => setScrubValue(0)}
              className="h-[48px] px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-mono text-xs transition-colors flex items-center justify-center cursor-pointer"
              title="Reset Scrub to 0%"
            >
              <IconReload size={18} />
            </button>

            <button
              onClick={() => setShowCodeModal(true)}
              className="h-[48px] px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[#14B8A6] border border-[#14B8A6]/30 font-mono text-xs transition-colors flex items-center gap-2 cursor-pointer"
              title="View Implementation Code"
            >
              <IconCode size={18} />
              <span className="hidden sm:inline">Recipe</span>
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {REVEAL_MODES.map((m) => {
            const Icon = m.icon;
            const isSelected = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#132427] border-[#14B8A6] text-white shadow-[0_0_20px_rgba(20,184,166,0.25)]'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/20 text-[#95A6A6] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon size={20} className={isSelected ? 'text-[#14B8A6]' : 'text-[#536465]'} />
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-ping" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-60">
                    {m.id.toUpperCase()}
                  </div>
                  <div className="text-xs sm:text-sm font-bold font-display line-clamp-1 mt-0.5">
                    {m.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Global Scrub Controller & Metrics Bar */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-2/3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#14B8A6] shrink-0">
              <IconAdjustmentsHorizontal size={16} />
              <span>Scroll Delta:</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={scrubValue}
              onChange={(e) => {
                setIsPlaying(false);
                setScrubValue(parseFloat(e.target.value));
              }}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#14B8A6]"
            />
            <span className="font-mono text-xs font-bold text-white w-14 text-right shrink-0">
              {Math.round(scrubValue * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-4 text-[11px] font-mono text-[#95A6A6] border-t md:border-t-0 pt-2 md:pt-0 border-white/5">
            <div>
              <span>STATE: </span>
              <span className={`font-bold ${scrubValue > 0.8 ? 'text-[#14B8A6]' : scrubValue > 0.2 ? 'text-amber-400' : 'text-[#FF7D5A]'}`}>
                {scrubValue === 0 ? 'PRISTINE [0%]' : scrubValue >= 0.95 ? 'FULL REVEAL [100%]' : 'IN-TRANSITION'}
              </span>
            </div>
            <div>
              <span>CURVE: </span>
              <span className="text-white font-bold">cubic-bezier(0.16, 1, 0.3, 1)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LIVE REVEAL VIEWPORT STAGE ─── */}
      <div className="relative min-h-[580px] sm:min-h-[640px] rounded-3xl overflow-hidden bg-[#070D0E] border border-white/10 shadow-2xl p-4 sm:p-8 flex flex-col justify-between">
        
        {/* Active Pattern Meta Badge */}
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3">
          {(() => {
            const current = REVEAL_MODES.find((m) => m.id === activeMode);
            return (
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border ${current.badgeColor}`}>
                  {current.tag}
                </span>
                <span className="text-xs text-[#95A6A6] font-mono hidden sm:inline">
                  {current.subtitle}
                </span>
              </div>
            );
          })()}

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-[#95A6A6]">
            <span>Active Specimen:</span>
            <span className="text-white font-bold">The Obsidian Vanguard Monolith</span>
          </div>
        </div>

        {/* ─── PATTERN 1: IRIS APERTURE PORTAL REVEAL ─── */}
        {activeMode === 'iris' && (
          <div className="relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden bg-black flex items-center justify-center my-auto">
            {/* Concentric Calibration Reticle Rings */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
              <div 
                className="rounded-full border border-[#14B8A6]/40 transition-all duration-75"
                style={{
                  width: `${irisRadius * 2}%`,
                  height: `${irisRadius * 2}%`,
                  boxShadow: '0 0 35px rgba(20, 184, 166, 0.25)'
                }}
              />
              <div 
                className="absolute rounded-full border border-white/10 border-dashed transition-all duration-75"
                style={{
                  width: `${irisRadius * 2.3}%`,
                  height: `${irisRadius * 2.3}%`
                }}
              />
            </div>

            {/* Aperture Mask Container */}
            <div
              className="absolute inset-0 w-full h-full overflow-hidden transition-all duration-75 ease-out"
              style={{
                clipPath: `circle(${irisRadius}% at 50% 50%)`
              }}
            >
              <img
                src={modernVillaImg}
                alt="Coastal Modern Villa"
                className="w-full h-full object-cover transition-transform duration-100 ease-out"
                style={{
                  transform: `scale(${irisImageScale})`
                }}
              />
              {/* Cinematic Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            </div>

            {/* Teaser Focal Badge (Visible when aperture is small) */}
            <div 
              className="relative z-30 flex flex-col items-center justify-center text-center p-6 pointer-events-none transition-opacity duration-300"
              style={{
                opacity: scrubValue < 0.4 ? 1 - scrubValue * 2 : 0
              }}
            >
              <div className="w-16 h-16 rounded-full bg-black/80 border border-[#14B8A6] flex items-center justify-center text-[#14B8A6] shadow-[0_0_25px_rgba(20,184,166,0.5)] mb-3">
                <IconScan size={28} className="animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#14B8A6] font-bold">
                SCROLL TO EXPAND APERTURE
              </span>
              <h3 className="text-xl font-bold font-display text-white mt-1">
                Horizon Cliffside Vanguard
              </h3>
            </div>

            {/* Full-Bleed Spec Content (Revealed as aperture widens) */}
            <div 
              className="absolute bottom-6 left-6 right-6 z-30 flex flex-col sm:flex-row sm:items-end justify-between gap-4 p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 transition-all duration-300 pointer-events-none"
              style={{
                opacity: scrubValue > 0.4 ? (scrubValue - 0.4) * 1.66 : 0,
                transform: `translateY(${(1 - scrubValue) * 30}px)`
              }}
            >
              <div>
                <span className="text-[11px] font-mono text-[#FF7D5A] uppercase tracking-widest font-bold block mb-1">
                  MALIBU PACIFIC RIDGE • RESERVE SPECIMEN
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                  The Cantilevered Vanguard Villa
                </h3>
                <p className="text-xs text-[#95A6A6] mt-1 max-w-lg">
                  Titanium-reinforced monolithic shell framing uninterrupted coastal sunsets.
                </p>
              </div>

              <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-white/15 pt-3 sm:pt-0 sm:pl-6 text-right">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#95A6A6] block">Aperture</span>
                  <span className="text-lg font-mono font-extrabold text-[#14B8A6]">f/{irisFStop}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#95A6A6] block">Valuation</span>
                  <span className="text-lg font-mono font-extrabold text-white">$18,500,000</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── PATTERN 2: ASYMMETRIC SPLIT SHEARING ─── */}
        {activeMode === 'split' && (
          <div className="relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden bg-black flex items-center justify-center my-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 w-full h-full gap-1">
              
              {/* Left Panel: Moving Down */}
              <div 
                className="relative overflow-hidden rounded-l-2xl border-r border-[#14B8A6]/40 transition-transform duration-75 ease-out bg-zinc-950"
                style={{
                  transform: `translateY(${splitLeftY}px)`
                }}
              >
                <img
                  src={zenCourtyardImg}
                  alt="Zenith Courtyard"
                  className="w-full h-full object-cover filter contrast-125 grayscale"
                />
                {/* Blueprint Grid Overlay */}
                <div 
                  className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a615_1px,transparent_1px),linear-gradient(to_bottom,#14b8a615_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none"
                />
                
                <div className="absolute top-6 left-6 z-20 p-4 rounded-xl bg-black/80 backdrop-blur-md border border-[#14B8A6]/40 text-left max-w-xs">
                  <span className="text-[10px] font-mono uppercase text-[#14B8A6] font-bold block mb-1">
                    SHEAR PLANE A • STRUCTURAL ELEVATION
                  </span>
                  <h4 className="text-sm font-bold text-white">Reinforced Concrete Pylons</h4>
                  <p className="text-[11px] text-[#95A6A6] mt-0.5 font-mono">
                    Δy offset: {splitLeftY.toFixed(1)}px
                  </p>
                </div>
              </div>

              {/* Right Panel: Moving Up */}
              <div 
                className="relative overflow-hidden rounded-r-2xl border-l border-[#14B8A6]/40 transition-transform duration-75 ease-out bg-zinc-950"
                style={{
                  transform: `translateY(${splitRightY}px)`
                }}
              >
                <img
                  src={twilightVillaImg}
                  alt="Twilight Villa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-6 right-6 z-20 p-4 rounded-xl bg-black/80 backdrop-blur-md border border-[#FF7D5A]/40 text-right max-w-xs">
                  <span className="text-[10px] font-mono uppercase text-[#FF7D5A] font-bold block mb-1">
                    SHEAR PLANE B • PHOTOREALISTIC TWILIGHT
                  </span>
                  <h4 className="text-sm font-bold text-white">Atmospheric Evening Lumens</h4>
                  <p className="text-[11px] text-[#95A6A6] mt-0.5 font-mono">
                    Δy offset: {splitRightY.toFixed(1)}px
                  </p>
                </div>
              </div>
            </div>

            {/* Center Shear Indicator Axis */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-transparent via-[#14B8A6] to-transparent z-30 pointer-events-none flex items-center justify-center">
              <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest bg-black border ${Math.abs(splitLeftY) < 10 ? 'border-[#14B8A6] text-[#14B8A6]' : 'border-white/20 text-[#95A6A6]'}`}>
                {Math.abs(splitLeftY) < 10 ? 'LOCKED [0.0mm]' : 'SHEARING'}
              </span>
            </div>
          </div>
        )}

        {/* ─── PATTERN 3: 3D KEYNOTE DECK STACKING ─── */}
        {activeMode === 'stack' && (
          <div className="relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center my-auto p-4 sm:p-8">
            <div className="relative w-full max-w-2xl h-[380px]">
              {[
                {
                  id: 0,
                  title: 'The Obsidian Pavilion',
                  spec: '720 m² • 5 Suites • Infinity Basin',
                  price: '$14,200,000',
                  img: modernVillaImg,
                  badge: 'Deck Tier 01'
                },
                {
                  id: 1,
                  title: 'Zenith Sky Residence',
                  spec: '940 m² • 6 Suites • Helipad Deck',
                  price: '$18,900,000',
                  img: twilightVillaImg,
                  badge: 'Deck Tier 02'
                },
                {
                  id: 2,
                  title: 'The Solarium Atrium',
                  spec: '610 m² • 4 Suites • Courtyard Cloister',
                  price: '$11,500,000',
                  img: interiorPenthouseImg,
                  badge: 'Deck Tier 03'
                }
              ].map((card, idx) => {
                // Card activation math based on scrubValue
                const isStacked = scrubValue > (idx + 1) * 0.33;
                const isCurrent = (scrubValue >= idx * 0.33 && scrubValue <= (idx + 1) * 0.33) || (idx === 2 && scrubValue >= 0.66);
                const isUpcoming = scrubValue < idx * 0.33;

                // Scale down and blur as card gets buried
                const cardScale = isStacked ? 0.94 - (2 - idx) * 0.04 : isCurrent ? 1.0 : 1.05;
                const cardY = isUpcoming ? (idx * 0.33 - scrubValue) * 450 : isStacked ? (idx - 2) * 16 : 0;
                const cardBrightness = isStacked ? 0.55 : 1.0;

                return (
                  <div
                    key={card.id}
                    className="absolute inset-0 rounded-3xl overflow-hidden border border-white/20 shadow-2xl transition-all duration-150 ease-out flex flex-col justify-end p-6 sm:p-8 bg-zinc-950"
                    style={{
                      transform: `translateY(${cardY}px) scale(${cardScale})`,
                      filter: `brightness(${cardBrightness})`,
                      zIndex: idx * 10
                    }}
                  >
                    <img
                      src={card.img}
                      alt={card.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                    <div className="relative z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono text-[#14B8A6] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-black/60 border border-[#14B8A6]/40 inline-block mb-2">
                          {card.badge}
                        </span>
                        <h4 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
                          {card.title}
                        </h4>
                        <p className="text-xs text-[#95A6A6] mt-1 font-mono">
                          {card.spec}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase text-[#95A6A6] block">Offering</span>
                        <span className="text-xl sm:text-2xl font-mono font-extrabold text-white">
                          {card.price}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── PATTERN 4: MULTI-BLADE LOUVER SHUTTER ─── */}
        {activeMode === 'louvers' && (
          <div className="relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden bg-black flex items-center justify-center my-auto">
            {/* The Background Panoramas to be revealed */}
            <img
              src={interiorPenthouseImg}
              alt="Penthouse Interior"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* 8 Motorized Architectural Louvers */}
            <div className="absolute inset-0 grid grid-cols-8 w-full h-full pointer-events-none">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((blade) => {
                // Staggered calculation based on blade index
                const bladeProgress = Math.max(0, Math.min(1, (scrubValue - blade * 0.08) / 0.5));
                const rotateY = (1 - bladeProgress) * 88; // 88deg (shut) down to 0deg (open)
                const opacity = 1 - bladeProgress * 0.95;

                return (
                  <div
                    key={blade}
                    className="relative h-full border-r border-black/40 bg-gradient-to-r from-[#0C1618] via-[#132427] to-[#070D0E] shadow-2xl transition-all duration-75 origin-left"
                    style={{
                      transform: `perspective(800px) rotateY(${rotateY}deg)`,
                      opacity: opacity
                    }}
                  >
                    <div className="absolute inset-y-0 right-0 w-1 bg-[#14B8A6]/30" />
                    <span className="absolute bottom-4 left-2 text-[9px] font-mono text-[#536465] rotate-90 origin-left">
                      SLAT-{blade + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Foreground Telemetry Text */}
            <div 
              className="relative z-20 text-center p-6 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 max-w-lg transition-all duration-200"
              style={{
                opacity: scrubValue > 0.5 ? (scrubValue - 0.5) * 2 : 0,
                transform: `scale(${0.9 + scrubValue * 0.1})`
              }}
            >
              <span className="text-[10px] font-mono text-[#14B8A6] font-bold uppercase tracking-widest">
                MOTORIZED APERTURE 90° OPEN
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white mt-1">
                Calacatta Atrium Sanctuary
              </h3>
              <p className="text-xs text-[#95A6A6] mt-2">
                Automated acoustic glass louvers retracted. Unobstructed 270-degree horizon exposure.
              </p>
            </div>
          </div>
        )}

        {/* ─── PATTERN 5: LASER TELEMETRY SCANNER ─── */}
        {activeMode === 'laser' && (
          <div className="relative w-full h-[460px] sm:h-[520px] rounded-2xl overflow-hidden bg-black flex items-center justify-center my-auto">
            <img
              src={macroFacadeImg}
              alt="Macro Architectural Facade"
              className="absolute inset-0 w-full h-full object-cover filter brightness-75 contrast-125"
            />
            {/* Grid Mask */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* The Sweeping Laser Line */}
            <div
              className="absolute inset-y-0 w-1 bg-[#14B8A6] shadow-[0_0_20px_#14B8A6,0_0_40px_#14B8A6] z-20 pointer-events-none transition-all duration-75"
              style={{
                left: `${laserXPercent}%`
              }}
            >
              <div className="absolute top-4 -left-12 px-2 py-0.5 rounded bg-black/90 border border-[#14B8A6] text-[10px] font-mono text-[#14B8A6] whitespace-nowrap">
                SCAN BEAM: {Math.round(laserXPercent)}%
              </div>
            </div>

            {/* Hotspot Spec 1: Seismic Dampener (at 25% X) */}
            <div
              className="absolute top-[35%] left-[25%] z-20 transition-all duration-200"
              style={{
                opacity: scrubValue >= 0.25 ? 1 : 0.2,
                transform: `scale(${scrubValue >= 0.25 ? 1 : 0.8})`
              }}
            >
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-[#14B8A6] text-black font-mono text-[10px] font-bold flex items-center justify-center animate-ping absolute inset-0 opacity-75" />
                <div className="w-5 h-5 rounded-full bg-[#14B8A6] text-black font-mono text-[10px] font-bold flex items-center justify-center relative">
                  01
                </div>
              </div>
              {scrubValue >= 0.25 && (
                <div className="absolute -top-16 left-6 p-3 rounded-xl bg-black/90 border border-[#14B8A6]/50 shadow-xl whitespace-nowrap text-left">
                  <span className="text-[9px] font-mono uppercase text-[#14B8A6] block font-bold">SPEC 01 • JOINT</span>
                  <span className="text-xs font-bold text-white">0.5mm Titanium Expansion Gap</span>
                </div>
              )}
            </div>

            {/* Hotspot Spec 2: Acoustic Glaze (at 60% X) */}
            <div
              className="absolute top-[55%] left-[60%] z-20 transition-all duration-200"
              style={{
                opacity: scrubValue >= 0.60 ? 1 : 0.2,
                transform: `scale(${scrubValue >= 0.60 ? 1 : 0.8})`
              }}
            >
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-[#FF7D5A] text-black font-mono text-[10px] font-bold flex items-center justify-center animate-ping absolute inset-0 opacity-75" />
                <div className="w-5 h-5 rounded-full bg-[#FF7D5A] text-black font-mono text-[10px] font-bold flex items-center justify-center relative">
                  02
                </div>
              </div>
              {scrubValue >= 0.60 && (
                <div className="absolute -top-16 left-6 p-3 rounded-xl bg-black/90 border border-[#FF7D5A]/50 shadow-xl whitespace-nowrap text-left">
                  <span className="text-[9px] font-mono uppercase text-[#FF7D5A] block font-bold">SPEC 02 • GLAZING</span>
                  <span className="text-xs font-bold text-white">Schuco Triple-Layer 48dB Acoustic</span>
                </div>
              )}
            </div>

            {/* Hotspot Spec 3: Cantilever Anchor (at 85% X) */}
            <div
              className="absolute top-[30%] left-[85%] z-20 transition-all duration-200"
              style={{
                opacity: scrubValue >= 0.85 ? 1 : 0.2,
                transform: `scale(${scrubValue >= 0.85 ? 1 : 0.8})`
              }}
            >
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-emerald-400 text-black font-mono text-[10px] font-bold flex items-center justify-center animate-ping absolute inset-0 opacity-75" />
                <div className="w-5 h-5 rounded-full bg-emerald-400 text-black font-mono text-[10px] font-bold flex items-center justify-center relative">
                  03
                </div>
              </div>
              {scrubValue >= 0.85 && (
                <div className="absolute -top-16 -left-36 p-3 rounded-xl bg-black/90 border border-emerald-400/50 shadow-xl whitespace-nowrap text-right">
                  <span className="text-[9px] font-mono uppercase text-emerald-400 block font-bold">SPEC 03 • ANCHOR</span>
                  <span className="text-xs font-bold text-white">Post-Tensioned Carbon Soffit</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Pattern Explanation Card */}
        <div className="relative z-30 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-[#95A6A6]">
          <p className="max-w-2xl text-[12px] font-sans">
            {REVEAL_MODES.find((m) => m.id === activeMode)?.summary}
          </p>

          <button
            onClick={() => setShowCodeModal(true)}
            className="inline-flex items-center gap-1.5 text-[#14B8A6] hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Inspect React/Tailwind Code</span>
            <IconArrowUpRight size={14} />
          </button>
        </div>
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
                    CODE RECIPE • {activeMode.toUpperCase()}
                  </span>
                  <h3 className="text-xl font-bold font-display text-white mt-1">
                    {REVEAL_MODES.find((m) => m.id === activeMode)?.title}
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
                <pre>{`// Pattern: ${REVEAL_MODES.find((m) => m.id === activeMode)?.title}
import { motion, useScroll, useTransform } from 'framer-motion';

export function ${activeMode === 'iris' ? 'IrisPortalReveal' : activeMode === 'split' ? 'AsymmetricSplitReveal' : activeMode === 'stack' ? 'DeckStackingReveal' : activeMode === 'louvers' ? 'MultiBladeLouverReveal' : 'LaserScannerReveal'}() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

${activeMode === 'iris' ? `  // Circular clip-path expansion
  const radius = useTransform(scrollYProgress, [0, 1], ['14%', '100%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.3, 1.0]);

  return (
    <motion.div style={{ clipPath: \`circle(\${radius} at 50% 50%)\` }}>
      <motion.img style={{ scale: imageScale }} src="/villa.jpg" />
    </motion.div>
  );` : activeMode === 'split' ? `  // Counter-directional shearing
  const leftY = useTransform(scrollYProgress, [0, 1], ['-90px', '0px']);
  const rightY = useTransform(scrollYProgress, [0, 1], ['90px', '0px']);

  return (
    <div className="grid grid-cols-2">
      <motion.div style={{ y: leftY }} className="border-r border-teal-500/40" />
      <motion.div style={{ y: rightY }} className="border-l border-teal-500/40" />
    </div>
  );` : activeMode === 'stack' ? `  // Keynote deck stacking
  return (
    <div className="relative h-[300vh]">
      {cards.map((card, idx) => (
        <div key={idx} className="sticky top-28 transition-transform" />
      ))}
    </div>
  );` : activeMode === 'louvers' ? `  // 8-blade architectural louvers
  return (
    <div className="grid grid-cols-8">
      {slats.map((slat, idx) => (
        <motion.div
          key={idx}
          style={{ transform: \`rotateY(\${angle}deg)\` }}
          transition={{ delay: idx * 0.04 }}
        />
      ))}
    </div>
  );` : `  // Laser telemetry sweep
  const laserX = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  return (
    <motion.div style={{ left: laserX }} className="w-1 bg-teal-400 shadow-teal" />
  );`}
}`}</pre>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#95A6A6] font-mono">
                  Engineered with Framer Motion &amp; Tailwind CSS
                </span>
                <button
                  onClick={() => handleCopyCode(`// Pattern: ${REVEAL_MODES.find((m) => m.id === activeMode)?.title}\n// Ready for production implementation`)}
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
