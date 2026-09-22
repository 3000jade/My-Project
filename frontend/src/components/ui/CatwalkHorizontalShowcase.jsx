import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  IconSparkles, 
  IconArrowRight, 
  IconArrowsSplit, 
  IconPlayerPlay, 
  IconFlame, 
  IconEye, 
  IconBuildingSkyscraper 
} from '@tabler/icons-react';

import coastalVilla from '../../sandbox/assets/luxury_modern_villa.jpg';
import zenCourtyard from '../../sandbox/assets/luxury_zen_courtyard.jpg';
import twilightVilla from '../../sandbox/assets/cinematic_duplex_twilight.jpg';
import interiorPenthouse from '../../sandbox/assets/cinematic_interior_penthouse.jpg';

export default function CatwalkHorizontalShowcase() {
  const runwayRef = useRef(null);

  // Track vertical scroll across the 350vh runway scrub distance
  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ['start start', 'end end']
  });

  // Calculate full-bleed horizontal translation (0% to -75% across 4 runway panels)
  const xTranslation = useTransform(scrollYProgress, [0, 1], ['0%', '-76%']);

  const runwayLooks = [
    {
      id: 'LOOK 01',
      silhouette: 'The Cliffside Monolith',
      location: 'Malibu Coastline • Level 3 Ridge',
      palette: 'Champagne Titanium • Calacatta Marble',
      specs: '850 m² • 5 Suites • Glass Infinity Pool',
      price: '$18,500,000',
      tag: 'Opening Look • Volumetric Drama',
      img: coastalVilla
    },
    {
      id: 'LOOK 02',
      silhouette: 'The Zen Reflection Basin',
      location: 'Kyoto Sanctuary • Forest Glade',
      palette: 'Shou Sugi Ban Cedar • Basalt Granite',
      specs: '720 m² • 4 Suites • Water Court',
      price: '$14,200,000',
      tag: 'Minimalist Silhouette • Zero Boundary',
      img: zenCourtyard
    },
    {
      id: 'LOOK 03',
      silhouette: 'The Twilight Sky Pavilion',
      location: 'Highland Ridge • Levels 42 & 43',
      palette: 'Anodized Bronze • Double-Glazed Schuco',
      specs: '620 m² • 4 Suites • Private Sky Deck',
      price: '$12,800,000',
      tag: 'High-Altitude Tailoring • Sunset Vector',
      img: twilightVilla
    },
    {
      id: 'LOOK 04',
      silhouette: 'The Solarium Masterpiece',
      location: 'Central Park North • Floor 28',
      palette: 'Italian Travertine • Smoked Fluted Glass',
      specs: '450 m² • 3 Suites • Volcanic Soaking Tub',
      price: '$9,400,000',
      tag: 'Finale Look • Bespoke Interior Hauteur',
      img: interiorPenthouse
    }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Outer Runway Track: 340vh creates silky, unhurried runway velocity */}
      <div 
        ref={runwayRef} 
        className="relative h-[340vh]"
      >
        {/* Sticky Full-Bleed Runway Stage: Pins to viewport while gliding horizontally */}
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-black text-white flex flex-col justify-between py-8 px-6 sm:px-12 z-30 shadow-2xl">
          
          {/* Ambient Runway Lighting Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(38,111,113,0.18),transparent_60%)] pointer-events-none" />

          {/* Top Runway Header & Telemetry */}
          <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-mono font-semibold mb-2 border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                The "Catwalk" Horizontal Showcase • Haute Architecture Catalog
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white">
                The Architectural Runway <span className="text-[#14B8A6]">—</span> Lookbook 2025
              </h3>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="bg-zinc-900/90 border border-white/15 px-4 py-2 rounded-xl text-xs font-mono text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>PAGE VERTICALLY LOCKED • HORIZONTAL RUNWAY ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Full-Bleed Catwalk Track (Glides right to left) */}
          <div className="my-auto overflow-visible py-4 relative z-10">
            <motion.div 
              style={{ x: xTranslation }}
              className="flex gap-10 sm:gap-14 w-max pl-4 pr-24 will-change-transform"
            >
              {runwayLooks.map((look, index) => (
                <div
                  key={look.id}
                  className="w-[84vw] max-w-[1240px] h-[64vh] min-h-[440px] rounded-3xl overflow-hidden relative shadow-2xl border border-white/15 flex-shrink-0 group flex flex-col justify-between p-8 sm:p-12"
                >
                  {/* Full-Bleed Runway Image */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img 
                      src={look.img} 
                      alt={look.silhouette}
                      className="w-full h-full object-cover brightness-[0.8] contrast-[1.08] group-hover:scale-105 group-hover:brightness-90 transition-all duration-1000 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/40" />
                  </div>

                  {/* Top Runway Badges */}
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-5xl font-extrabold font-display text-white/90 tracking-tighter">
                        {look.id}
                      </span>
                      <span className="px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-mono text-emerald-300 border border-white/20">
                        {look.tag}
                      </span>
                    </div>

                    <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs font-mono text-white/80">
                      Runway Segment 0{index + 1} / 04
                    </div>
                  </div>

                  {/* Bottom Runway Content: Large Haute Typography */}
                  <div className="relative z-10 space-y-4 max-w-3xl">
                    <div>
                      <span className="text-xs sm:text-sm font-mono uppercase tracking-[0.2em] text-[#14B8A6] font-semibold block mb-1">
                        {look.location}
                      </span>
                      <h4 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight leading-tight group-hover:text-emerald-200 transition-colors">
                        {look.silhouette}
                      </h4>
                    </div>

                    {/* Material Taxonomy & Specs */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 font-mono text-stone-200">
                        <span className="text-stone-400">Palette:</span> {look.palette}
                      </div>
                      <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15 font-mono text-stone-200">
                        <span className="text-stone-400">Footprint:</span> {look.specs}
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block">Acquisition Value</span>
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">{look.price}</span>
                      </div>

                      <button
                        onClick={() => alert(`Reviewing Runway Dossier: ${look.silhouette}`)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#266F71] hover:bg-[#14B8A6] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
                      >
                        <span>View Lookbook Dossier</span>
                        <IconArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom Runway HUD: Progress Rail & Navigation */}
          <div className="relative z-20 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-3">
              <IconSparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Catwalk Progress: Slide Right → Left</span>
            </div>

            {/* Visual Runway Progress Bar */}
            <div className="flex-1 max-w-md h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                style={{ scaleX: scrollYProgress }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#FB8E5D] origin-left"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">Scroll down to advance runway</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
