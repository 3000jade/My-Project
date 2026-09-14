import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconSparkles, 
  IconArrowUpRight, 
  IconCheck, 
  IconEye, 
  IconX, 
  IconLayersSubtract,
  IconAdjustmentsHorizontal
} from '@tabler/icons-react';

import coastalVilla from '../../assets/luxury_modern_villa.jpg';
import zenCourtyard from '../../assets/luxury_zen_courtyard.jpg';
import twilightVilla from '../../assets/cinematic_duplex_twilight.jpg';

export default function BorderlessLuxuryCardShowcase() {
  const [showComparison, setShowComparison] = useState(false);

  const estates = [
    {
      id: "01",
      title: "The Cliffside Vanguard",
      location: "Malibu Coastline",
      category: "Coastal Monolith",
      area: "850 m²",
      valuation: "$18,500,000",
      image: coastalVilla,
      aspect: "aspect-[4/5]"
    },
    {
      id: "02",
      title: "The Zen Water Basin",
      location: "Kyoto Sanctuary",
      category: "Minimalist Pavilion",
      area: "720 m²",
      valuation: "$14,200,000",
      image: zenCourtyard,
      aspect: "aspect-[4/5]"
    },
    {
      id: "03",
      title: "The Horizon Duplex",
      location: "Highland Ridge",
      category: "Sky Residence",
      area: "620 m²",
      valuation: "$12,800,000",
      image: twilightVilla,
      aspect: "aspect-[4/5]"
    }
  ];

  return (
    <div className="w-full space-y-12">
      {/* Header & Philosophy */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 text-white text-xs font-mono font-semibold mb-2">
            <IconLayersSubtract className="w-3.5 h-3.5 text-[#14B8A6]" />
            Luxury Layout Standard • Zero Borders &amp; Zero Box Wrappers
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-[#174849] tracking-tight">
            Pristine Borderless Full-Bleed Layout
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 mt-2 max-w-2xl leading-relaxed">
            Eliminating generic software card tropes. The component possesses <strong>absolutely no visible borders</strong> and <strong>no solid card background containers</strong>. It is simply a pristine, full-bleed architectural photograph resting directly on the website's natural canvas.
          </p>
        </div>

        {/* Comparison Toggle */}
        <button
          onClick={() => setShowComparison(!showComparison)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer border ${
            showComparison 
              ? 'bg-[#174849] text-white border-[#174849] shadow-md' 
              : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-300'
          }`}
        >
          <span>{showComparison ? 'Active: Generic Box Comparison' : 'Compare: Boxed Card vs Borderless'}</span>
        </button>
      </div>

      {/* Comparison Drawer Notice */}
      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-2xl bg-stone-100 border border-stone-300 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl bg-white border border-stone-300 shadow-sm space-y-2 opacity-70">
                <span className="font-mono font-bold text-rose-600 flex items-center gap-1.5">
                  <IconX className="w-4 h-4" />
                  Generic Clunky Box Layout (Avoid)
                </span>
                <p className="text-stone-500 leading-relaxed">
                  Visible grey border lines, solid background card rectangle, small inset padding that traps the image inside an artificial cardboard box.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#174849] text-white border border-[#266F71] shadow-md space-y-2">
                <span className="font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                  <IconCheck className="w-4 h-4" />
                  Pristine Borderless Luxury Layout (Applied Below)
                </span>
                <p className="text-stone-200 leading-relaxed">
                  Zero borders, zero background wrappers. The photograph rests flush on the page canvas, letting natural whitespace frame the composition.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* THE PRISTINE BORDERLESS CARD GRID                        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
        {estates.map((estate, idx) => (
          <motion.article
            key={estate.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="group cursor-pointer bg-transparent border-0 shadow-none p-0 flex flex-col justify-between"
          >
            {/* Pristine Full-Bleed Photograph (No border, No background card) */}
            <div className={`w-full ${estate.aspect} rounded-2xl overflow-hidden relative bg-stone-200`}>
              <motion.img
                src={estate.image}
                alt={estate.title}
                className="w-full h-full object-cover brightness-[0.92] contrast-[1.05] transition-all duration-700 ease-out group-hover:scale-105 group-hover:brightness-100"
              />

              {/* Minimalist Floating Index Badge (Top Left) */}
              <div className="absolute top-4 left-4 z-10">
                <span className="font-mono text-[11px] font-bold text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                  {estate.id}
                </span>
              </div>

              {/* Ambient Bottom Gradient for Hover Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Hover Floating Arrow */}
              <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <div className="w-9 h-9 rounded-full bg-white text-[#174849] flex items-center justify-center shadow-lg">
                  <IconArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Pristine Minimalist Metadata (Rests directly on page background) */}
            <div className="pt-5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono uppercase text-[#266F71] font-bold tracking-wider text-[11px]">
                  {estate.category}
                </span>
                <span className="font-mono text-stone-400 text-[11px]">
                  {estate.location}
                </span>
              </div>

              <h4 className="text-xl font-bold font-display text-[#174849] group-hover:text-[#266F71] transition-colors leading-snug">
                {estate.title}
              </h4>

              <div className="pt-2 flex items-baseline justify-between border-t border-stone-200/80 text-xs font-mono">
                <span className="text-sm font-extrabold text-[#174849]">
                  {estate.valuation}
                </span>
                <span className="text-stone-400">
                  {estate.area}
                </span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Architectural Design Rationale */}
      <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-stone-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>No Borders (<code className="text-[#174849]">border: none</code>)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>No Solid Background Box (<code className="text-[#174849]">bg-transparent</code>)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Full-Bleed Media Ratio (<code className="text-[#174849]">aspect-[4/5]</code>)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Natural Canvas Breathing Room</span>
        </div>
      </div>
    </div>
  );
}
