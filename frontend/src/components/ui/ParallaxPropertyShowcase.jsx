import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  IconCompass, 
  IconBuildingSkyscraper, 
  IconArrowUpRight, 
  IconSparkles, 
  IconEye, 
  IconAdjustmentsHorizontal,
  IconCheck
} from '@tabler/icons-react';

import villaTwilight from '../../sandbox/assets/cinematic_duplex_twilight.jpg';
import penthouseInterior from '../../sandbox/assets/cinematic_interior_penthouse.jpg';
import coastalVilla from '../../sandbox/assets/luxury_modern_villa.jpg';

const properties = [
  {
    id: 'cliffside-villa',
    title: 'The Cliffside Vanguard Estate',
    subtitle: 'Malibu Coastline • Level 3 Elevation',
    price: '$18,500,000',
    specs: { area: '850 m²', beds: 5, baths: 6, view: 'Pacific Sunset' },
    image: coastalVilla,
    badge: 'Architectural Masterpiece',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'horizon-duplex',
    title: 'Horizon Duplex Penthouse',
    subtitle: 'Highland Ridge • Floors 42-43',
    price: '$12,800,000',
    specs: { area: '620 m²', beds: 4, baths: 5, view: 'Skyline Panorama' },
    image: villaTwilight,
    badge: 'Private Sky Pavilion',
    tagColor: 'bg-[#14B8A6]/20 text-[#14B8A6] border-[#14B8A6]/30'
  },
  {
    id: 'solarium-suite',
    title: 'The Solarium Master Residence',
    subtitle: 'Central Park North • Level 28',
    price: '$9,400,000',
    specs: { area: '450 m²', beds: 3, baths: 4, view: 'Park Sanctuary' },
    image: penthouseInterior,
    badge: 'Ultra-Luxury Interior',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  }
];

function SingleParallaxCard({ property, index, speedMultiplier }) {
  const cardRef = useRef(null);

  // Precision scroll tracking relative to this card element
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ['start end', 'end start']
  });

  // Dynamic parallax layers
  const yImage = useTransform(
    scrollYProgress, 
    [0, 1], 
    [`-${12 * speedMultiplier}%`, `${12 * speedMultiplier}%`]
  );

  const scaleImage = useTransform(
    scrollYProgress, 
    [0, 0.5, 1], 
    [1.18, 1.05, 1.18]
  );

  const yText = useTransform(
    scrollYProgress, 
    [0, 1], 
    [`${30 * speedMultiplier}px`, `-${30 * speedMultiplier}px`]
  );

  const opacityBadge = useTransform(
    scrollYProgress, 
    [0, 0.2, 0.8, 1], 
    [0.4, 1, 1, 0.4]
  );

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl group min-h-[460px] sm:min-h-[520px] flex flex-col justify-end p-6 sm:p-10"
    >
      {/* Layer 1: Parallax Background Image Container (Translates vertically & scales) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          style={{ y: yImage, scale: scaleImage }}
          className="absolute -top-[15%] -bottom-[15%] left-0 right-0 w-full h-[130%]"
        >
          <img 
            src={property.image} 
            alt={property.title}
            className="w-full h-full object-cover brightness-[0.78] contrast-[1.08] transition-all duration-700 group-hover:brightness-90 group-hover:scale-105"
          />
        </motion.div>

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-zinc-950/40" />
      </div>

      {/* Layer 2: Top Floating Badge Layer (Opposite Parallax Velocity) */}
      <motion.div 
        style={{ opacity: opacityBadge }}
        className="absolute top-6 left-6 right-6 flex items-center justify-between z-10 pointer-events-none"
      >
        <span className={`px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md border ${property.tagColor}`}>
          {property.badge}
        </span>
        <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white/80 text-[11px] font-mono">
          Layer Parallax: {speedMultiplier.toFixed(1)}x
        </div>
      </motion.div>

      {/* Layer 3: Foreground Content Layer (Opposite Parallax Shift text) */}
      <motion.div 
        style={{ y: yText }}
        className="relative z-10 space-y-4 max-w-2xl"
      >
        <div>
          <span className="text-xs font-semibold text-[#14B8A6] uppercase tracking-widest block mb-1">
            {property.subtitle}
          </span>
          <h3 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight leading-tight group-hover:text-emerald-300 transition-colors">
            {property.title}
          </h3>
        </div>

        {/* Property Specs Pills */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl text-xs text-stone-200 flex items-center gap-1.5">
            <span className="text-stone-400 font-mono">Area:</span>
            <span className="font-bold text-white">{property.specs.area}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl text-xs text-stone-200 flex items-center gap-1.5">
            <span className="text-stone-400 font-mono">Beds:</span>
            <span className="font-bold text-white">{property.specs.beds}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl text-xs text-stone-200 flex items-center gap-1.5">
            <span className="text-stone-400 font-mono">View:</span>
            <span className="font-bold text-white">{property.specs.view}</span>
          </div>
        </div>

        {/* Footer Price & CTA */}
        <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block">Listing Value</span>
            <span className="text-2xl font-extrabold font-mono text-white">{property.price}</span>
          </div>

          <button
            onClick={() => alert(`Inspecting ${property.title} - Spatial Parallax Active`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#266F71] hover:bg-[#14B8A6] text-white text-xs font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Explore Property</span>
            <IconArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ParallaxPropertyShowcase() {
  const [speedMultiplier, setSpeedMultiplier] = useState(1.5);

  return (
    <div className="w-full space-y-8">
      {/* Controls Bar */}
      <div className="bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold">
          <IconAdjustmentsHorizontal className="w-4 h-4 text-[#14B8A6]" />
          <span>Parallax Motion Intensity:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Subtle (0.8x)', value: 0.8 },
            { label: 'Cinematic (1.5x)', value: 1.5 },
            { label: 'Hyper-Depth (2.5x)', value: 2.5 }
          ].map((mode) => (
            <button
              key={mode.value}
              onClick={() => setSpeedMultiplier(mode.value)}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                speedMultiplier === mode.value
                  ? 'bg-[#266F71] text-white font-bold shadow-md'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property List with Parallax Scrolling Cards */}
      <div className="space-y-8">
        {properties.map((prop, idx) => (
          <SingleParallaxCard 
            key={prop.id} 
            property={prop} 
            index={idx} 
            speedMultiplier={speedMultiplier} 
          />
        ))}
      </div>
    </div>
  );
}
