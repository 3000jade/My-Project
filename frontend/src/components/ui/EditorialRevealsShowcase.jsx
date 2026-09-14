import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconEye, 
  IconSparkles, 
  IconLayersLinked, 
  IconRefresh, 
  IconFlame, 
  IconBox,
  IconCheck,
  IconCompass
} from '@tabler/icons-react';

import coastalVilla from '../../assets/luxury_modern_villa.jpg';
import twilightVilla from '../../assets/cinematic_duplex_twilight.jpg';
import interiorPenthouse from '../../assets/cinematic_interior_penthouse.jpg';

export default function EditorialRevealsShowcase() {
  const [maskKey, setMaskKey] = useState(0);
  const [staggerKey, setStaggerKey] = useState(0);
  const [staggerDelay, setStaggerDelay] = useState(0.12);

  const luxuryProducts = [
    { title: "Horizon Villa 01", location: "Malibu Cliffside", area: "850 m²", price: "$18.5M", img: coastalVilla, badge: "Vanguard Architecture" },
    { title: "Penthouse Suite 42", location: "Highland Ridge", area: "620 m²", price: "$12.8M", img: twilightVilla, badge: "Private Sky Deck" },
    { title: "Solarium Residence", location: "Central Park North", area: "450 m²", price: "$9.4M", img: interiorPenthouse, badge: "Calacatta Sanctuary" },
    { title: "Oceanfront Glasshouse", location: "Monterey Bay", area: "710 m²", price: "$15.2M", img: coastalVilla, badge: "Infinity Edge" }
  ];

  return (
    <div className="w-full space-y-12">
      {/* 1. SCROLL-TRIGGERED REVEAL (MINIMALIST VIEWPORT) */}
      <div className="bg-zinc-950 text-white p-6 sm:p-10 rounded-3xl border border-zinc-800 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold mb-2 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Pattern 1 • Viewport Triggered Reveal
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
              Clean Minimalist Scroll-Triggered Reveal
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
              Keeps initial screens minimalist and uncluttered. Cards dynamically fade in, slide up, and expand into position <strong className="text-emerald-400 font-normal">only when they enter the active viewport</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { tag: "01 • Structural Integrity", title: "Reinforced Monolithic Shell", desc: "Seismic grade 8.5 foundation with integrated acoustic damping insulation." },
            { tag: "02 • Spatial Flow", title: "Double-Height Glass Pavilion", desc: "10-meter floor-to-ceiling motorized Schuco glass panels." },
            { tag: "03 • Solar Architecture", title: "Passive Kinetic Louvers", desc: "Automated bronze louvers tracking solar position for climate control." }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: false, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="bg-zinc-900/90 p-6 rounded-2xl border border-zinc-800 hover:border-emerald-500/40 transition-colors space-y-3 relative group"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold block">
                {item.tag}
              </span>
              <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                {item.title}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {item.desc}
              </p>
              <div className="pt-3 flex items-center justify-between text-[11px] text-zinc-500 font-mono border-t border-zinc-800">
                <span>Viewport Status:</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">In View ✓</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 2. MASKED REVEAL (HIGH-END EDITORIAL CURTAIN EFFECT) */}
      <div className="bg-white text-stone-900 p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-mono font-semibold mb-2 border border-indigo-200">
              <IconSparkles className="w-3.5 h-3.5 text-indigo-600" />
              Pattern 2 • Invisible Mask &amp; Curtain Slide
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold font-display text-[#174849]">
              High-End Editorial Masked Curtain Reveal
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xl leading-relaxed">
              Text and images slide out from behind an invisible container boundary (<code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-[#174849]">overflow-hidden</code>), producing a luxury fashion/architectural magazine reveal.
            </p>
          </div>

          <button
            onClick={() => setMaskKey(prev => prev + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#174849] hover:bg-[#266F71] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer self-start sm:self-auto"
          >
            <IconRefresh className="w-3.5 h-3.5" />
            <span>Replay Masked Reveal</span>
          </button>
        </div>

        <div key={maskKey} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Masked Editorial Text Column */}
          <div className="space-y-4">
            {/* Masked Subtitle */}
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs font-mono uppercase font-bold tracking-widest text-[#266F71] block"
              >
                Volumetric Architectural Mastery
              </motion.span>
            </div>

            {/* Masked Title Line 1 */}
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-3xl sm:text-4xl font-extrabold font-display text-[#174849] tracking-tight"
              >
                Sculpted from Light &amp; Stone
              </motion.h2>
            </div>

            {/* Masked Paragraph */}
            <div className="overflow-hidden">
              <motion.p
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm text-stone-600 leading-relaxed pt-2"
              >
                Every aperture is positioned to frame the sunset. Crafted using bookmatched Italian Travertine, monolithic cast-in-place concrete, and floor-to-ceiling double-glazed thermal glass.
              </motion.p>
            </div>

            {/* Masked Button CTA */}
            <div className="overflow-hidden pt-2">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="inline-flex items-center gap-2 text-xs font-bold text-[#174849] border-b-2 border-[#266F71] pb-1 cursor-pointer hover:text-[#266F71] transition-colors">
                  Read Architectural Design Monograph →
                </span>
              </motion.div>
            </div>
          </div>

          {/* Masked Image Curtain Column */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[16/10] border border-stone-200 group">
            {/* Sliding Curtain Curtain Mask */}
            <motion.div
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 bg-[#174849] z-20 origin-top"
            />
            
            <motion.img
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              src={coastalVilla}
              alt="Coastal Villa Masked Reveal"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-white text-xs font-mono flex items-center justify-between">
              <span>Masked Curtain Slide</span>
              <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px]">overflow-hidden</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STAGGERED ENTRANCE WAVE (RHYTHMIC PRODUCT GRID) */}
      <div className="bg-stone-900 text-white p-6 sm:p-10 rounded-3xl border border-stone-800 shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-semibold mb-2 border border-amber-500/20">
              <IconFlame className="w-3.5 h-3.5 text-amber-400" />
              Pattern 3 • Rhythmic Millisecond Wave
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
              Staggered Entrance Wave (Luxury Grid)
            </h3>
            <p className="text-xs text-stone-400 mt-1 max-w-xl leading-relaxed">
              Grid elements fade in sequentially one after another with controlled millisecond delays, creating an intentional rhythm across property listings.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-stone-800 p-1 rounded-xl border border-stone-700">
              {[
                { label: 'Fast (50ms)', val: 0.05 },
                { label: 'Standard (120ms)', val: 0.12 },
                { label: 'Dramatic (250ms)', val: 0.25 }
              ].map((speed) => (
                <button
                  key={speed.val}
                  onClick={() => {
                    setStaggerDelay(speed.val);
                    setStaggerKey(prev => prev + 1);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors cursor-pointer ${
                    staggerDelay === speed.val ? 'bg-[#266F71] text-white font-bold' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {speed.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStaggerKey(prev => prev + 1)}
              className="p-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl border border-stone-700 transition-colors cursor-pointer"
              title="Re-trigger Wave"
            >
              <IconRefresh className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Staggered Wave Grid Container */}
        <motion.div
          key={staggerKey}
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: staggerDelay,
                delayChildren: 0.05
              }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {luxuryProducts.map((prod, idx) => (
            <motion.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 35, scale: 0.92 },
                show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
              }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="bg-stone-800/80 rounded-2xl overflow-hidden border border-stone-700/60 shadow-lg group flex flex-col justify-between"
            >
              <div className="relative h-44 overflow-hidden">
                <img 
                  src={prod.img} 
                  alt={prod.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-amber-300 border border-amber-500/20">
                  {prod.badge}
                </span>
                <span className="absolute bottom-2 right-3 font-mono text-[10px] text-stone-400 bg-stone-900/80 px-2 py-0.5 rounded">
                  Wave #{(idx + 1).toString().padStart(2, '0')}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="text-sm font-bold text-white group-hover:text-[#14B8A6] transition-colors">
                  {prod.title}
                </h4>
                <p className="text-xs text-stone-400 font-mono">
                  {prod.location}
                </p>

                <div className="pt-3 border-t border-stone-700/60 flex items-center justify-between text-xs">
                  <span className="font-mono text-stone-300 font-bold">{prod.price}</span>
                  <span className="text-[10px] font-mono text-stone-400 bg-stone-700/50 px-2 py-0.5 rounded">{prod.area}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
