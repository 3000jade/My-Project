import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  IconArrowsSplit, 
  IconPin, 
  IconArrowRight, 
  IconCompass, 
  IconSparkles, 
  IconFlame, 
  IconBuildingSkyscraper,
  IconEye,
  IconCheck,
  IconMaximize
} from '@tabler/icons-react';

import coastalVilla from '../../sandbox/assets/luxury_modern_villa.jpg';
import zenCourtyard from '../../sandbox/assets/luxury_zen_courtyard.jpg';
import twilightVilla from '../../sandbox/assets/cinematic_duplex_twilight.jpg';
import interiorPenthouse from '../../sandbox/assets/cinematic_interior_penthouse.jpg';

export default function HorizontalAndPinnedScrollShowcase() {
  // Horizontal scroll container reference
  const horizontalSectionRef = useRef(null);
  const { scrollYProgress: horizontalProgress } = useScroll({
    target: horizontalSectionRef,
    offset: ['start start', 'end end']
  });

  // Transform vertical progress (0 to 1) into horizontal X translation
  // Moves 4 full cards horizontally across the viewport
  const xTranslation = useTransform(horizontalProgress, [0, 1], ['0%', '-68%']);

  // Sticky Pinning container reference
  const pinnedSectionRef = useRef(null);
  const { scrollYProgress: pinnedProgress } = useScroll({
    target: pinnedSectionRef,
    offset: ['start start', 'end end']
  });

  const pinnedScale = useTransform(pinnedProgress, [0, 0.5, 1], [1, 1.05, 1]);
  const pinnedImageIdx = useTransform(pinnedProgress, [0, 0.45, 0.85], [0, 1, 2]);

  const galleryItems = [
    {
      id: '01',
      title: 'The Cliffside Vanguard Estate',
      category: 'Coastal Monolith',
      location: 'Malibu Coastline',
      price: '$18,500,000',
      specs: '850 m² • 5 Beds • Infinity Pool',
      img: coastalVilla,
      badge: 'Level 3 Coastal Cliff'
    },
    {
      id: '02',
      title: 'The Zen Water Courtyard',
      category: 'Minimalist Sanctuary',
      location: 'Kyoto Pine Forest',
      price: '$14,200,000',
      specs: '720 m² • 4 Beds • Reflection Pool',
      img: zenCourtyard,
      badge: 'Japanese Black Pine'
    },
    {
      id: '03',
      title: 'Horizon Duplex Penthouse',
      category: 'High-Altitude Residence',
      location: 'Highland Ridge',
      price: '$12,800,000',
      specs: '620 m² • 4 Beds • Sky Pavilion',
      img: twilightVilla,
      badge: 'Levels 42-43'
    },
    {
      id: '04',
      title: 'The Solarium Master Suite',
      category: 'Urban Sanctuary',
      location: 'Central Park North',
      price: '$9,400,000',
      specs: '450 m² • 3 Beds • Calacatta Marble',
      img: interiorPenthouse,
      badge: 'Level 28 Solarium'
    }
  ];

  return (
    <div className="w-full space-y-16">
      {/* ======================================================== */}
      {/* 1. STICKY CONTENT PINNING DEMO (SPLIT-SCREEN SCRUB)      */}
      {/* ======================================================== */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#174849]/10 text-[#174849] text-xs font-mono font-semibold mb-2 border border-[#174849]/20">
            <IconPin className="w-3.5 h-3.5 text-[#266F71]" />
            Feature A • Sticky Content Pinning
          </div>
          <h3 className="text-2xl font-bold font-display text-[#174849]">
            Split-Screen Content Pinning
          </h3>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Locks a key element (like the architectural specimen or title) on the left side of the screen, while descriptive narrative specifications on the right side continue scrolling past.
          </p>
        </div>

        {/* Pinning Scrub Area */}
        <div ref={pinnedSectionRef} className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          {/* Left Column: Pinned Sticky Anchor */}
          <div className="lg:col-span-6">
            <div className="sticky top-28 space-y-4">
              <motion.div 
                style={{ scale: pinnedScale }}
                className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3] border border-stone-300 group bg-stone-900"
              >
                <img 
                  src={zenCourtyard} 
                  alt="Pinned Architectural Residence"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                
                {/* Pinned Telemetry Pill */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#174849]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-teal-400/30 text-white text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-ping" />
                  <span>PINNED SPECIMEN: LEVEL 0</span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-[#14B8A6] block">
                    Active Architectural Anchor
                  </span>
                  <h4 className="text-lg font-bold font-display">
                    Zenith Water Pavilion Residence
                  </h4>
                  <p className="text-xs text-stone-300 mt-0.5">
                    Locked to viewport while chapters scroll on the right →
                  </p>
                </div>
              </motion.div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                <span className="font-mono text-[11px] text-stone-400">Pinning Behavior:</span>
                <span className="font-mono font-bold text-[#266F71] bg-[#266F71]/10 px-2 py-0.5 rounded">
                  position: sticky; top: 112px;
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Scrolling Narrative Chapters */}
          <div className="lg:col-span-6 space-y-8">
            {[
              {
                step: "Phase 01",
                title: "Monolithic Basalt Foundation",
                body: "Engineered deep into ancient granite bedrock. The foundation structure utilizes high-density carbon-cured concrete designed to dampen sub-surface seismic vibrations up to magnitude 8.8."
              },
              {
                step: "Phase 02",
                title: "Water-Mirror Reflecting Pool",
                body: "A central 18-meter dark granite basin acts as both a passive evaporative cooling system and a Zen spatial contemplation anchor reflecting natural moonlight."
              },
              {
                step: "Phase 03",
                title: "Double-Glazed Thermal Pavilion",
                body: "Motorized triple-track Schuco structural glass panels open seamlessly into the courtyard, removing physical boundaries between interior living rooms and nature."
              },
              {
                step: "Phase 04",
                title: "Acoustic Japanese Cedar Cladding",
                body: "Exterior wood louvers treated with traditional Shou Sugi Ban charring for extreme weather resistance, insect deterrence, and natural fire-retardant properties."
              }
            ].map((chapter, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-xs space-y-3 hover:border-[#266F71]/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md bg-[#266F71]/10 text-[#266F71] text-xs font-mono font-bold uppercase tracking-wider">
                    {chapter.step}
                  </span>
                  <span className="text-xs text-stone-400 font-mono">Scrub Index #{idx + 1}</span>
                </div>
                <h4 className="text-lg font-bold text-[#174849] font-display">
                  {chapter.title}
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {chapter.body}
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#266F71]">
                  <IconCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified Architectural Milestone</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. HORIZONTAL SCROLL SECTION (VERTICAL-TO-HORIZONTAL LOCK) */}
      {/* ======================================================== */}
      <div 
        ref={horizontalSectionRef} 
        className="relative h-[280vh] rounded-3xl overflow-visible"
      >
        {/* Sticky Viewport Window: Locks vertically while translating horizontally */}
        <div className="sticky top-20 h-[85vh] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col justify-between p-6 sm:p-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 text-xs font-mono font-semibold mb-2 border border-teal-500/20">
                <IconArrowsSplit className="w-3.5 h-3.5 text-teal-400" />
                Feature B • Horizontal Scroll Lock
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
                Curated Architectural Portfolio Gallery
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Scroll vertically to translate horizontally across the collection track.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto bg-zinc-900/90 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-mono text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>VERTICAL SCROLL LOCKED</span>
            </div>
          </div>

          {/* Horizontally Sliding Track */}
          <div className="my-auto overflow-hidden py-4">
            <motion.div 
              style={{ x: xTranslation }}
              className="flex gap-8 w-max pl-2 pr-12"
            >
              {galleryItems.map((item) => (
                <div 
                  key={item.id}
                  className="w-[320px] sm:w-[460px] h-[360px] sm:h-[400px] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col justify-between p-6 relative group flex-shrink-0"
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={item.img} 
                      alt={item.title}
                      className="w-full h-full object-cover brightness-[0.75] group-hover:scale-105 group-hover:brightness-90 transition-all duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                  </div>

                  {/* Top Badges */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-mono font-bold text-teal-300 border border-teal-500/20">
                      {item.badge}
                    </span>
                    <span className="font-mono text-xs text-zinc-400 bg-black/40 px-2 py-0.5 rounded">
                      #{item.id}
                    </span>
                  </div>

                  {/* Bottom Content */}
                  <div className="relative z-10 space-y-2">
                    <span className="text-[11px] font-mono uppercase text-teal-400 font-semibold tracking-wider block">
                      {item.category} • {item.location}
                    </span>
                    <h4 className="text-xl font-bold font-display text-white group-hover:text-teal-200 transition-colors">
                      {item.title}
                    </h4>
                    <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs font-mono">
                      <span className="text-white font-bold text-base">{item.price}</span>
                      <span className="text-zinc-300">{item.specs}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Footer Progress Scrub Bar */}
          <div className="z-10 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-4 text-xs font-mono text-zinc-400">
            <span>Scroll Scrub Track: 0% → 100%</span>
            
            {/* Visual Progress Bar */}
            <div className="flex-1 max-w-md h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                style={{ scaleX: horizontalProgress }}
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 origin-left"
              />
            </div>

            <span className="text-teal-400 font-bold">Horizontal Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}
