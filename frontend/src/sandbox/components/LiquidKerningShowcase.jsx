import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconSparkles, 
  IconRefresh, 
  IconLetterCase, 
  IconArrowsHorizontal, 
  IconCheck, 
  IconAdjustmentsHorizontal,
  IconEye
} from '@tabler/icons-react';

export default function LiquidKerningShowcase() {
  const [triggerKey, setTriggerKey] = useState(0);
  const [trackingIntensity, setTrackingIntensity] = useState(0.24); // in em
  const [isHoverTracked, setIsHoverTracked] = useState(false);

  const brandTitles = [
    { title: "HORIZON RESIDENCES", subtitle: "Private Sky Pavilion • Manila Golf Views", tag: "Flagship" },
    { title: "THE MONOLITH ATELIER", subtitle: "Hand-Honed Italian Travertine & Titanium", tag: "Haute" },
    { title: "VANGUARD SANCTUARY", subtitle: "Zero-Boundary Coastal Architecture", tag: "Masterpiece" }
  ];

  return (
    <div className="w-full space-y-10">
      <div className="bg-white text-stone-900 p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-semibold mb-2 border border-stone-200">
              <IconArrowsHorizontal className="w-3.5 h-3.5 text-[#266F71]" />
              The "Liquid Kerning" Expand • Kinetic Typography
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-[#174849]">
              The "Liquid Kerning" Expand
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xl leading-relaxed">
              A minimalist header starts with standard letter-spacing. As the element comes into view or receives a hover, the space between the letters slowly expands (tracking out) like liquid silk while subtly dimming in opacity.
            </p>
          </div>

          {/* Interactive Tracking Intensity Controls */}
          <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-mono">
              {[
                { label: 'Subtle (+0.14em)', val: 0.14 },
                { label: 'Editorial (+0.24em)', val: 0.24 },
                { label: 'Liquid Hauteur (+0.38em)', val: 0.38 }
              ].map((preset) => (
                <button
                  key={preset.val}
                  onClick={() => {
                    setTrackingIntensity(preset.val);
                    setTriggerKey(prev => prev + 1);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    trackingIntensity === preset.val 
                      ? 'bg-[#174849] text-white font-bold' 
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setTriggerKey(prev => prev + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#266F71] hover:bg-[#174849] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <IconRefresh className="w-3.5 h-3.5" />
              <span>Replay Expansion</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DEMO A: Scroll-Triggered Liquid Kerning Monograph Hero   */}
        {/* ======================================================== */}
        <div 
          key={`hero-${triggerKey}`}
          className="bg-stone-950 text-white p-10 sm:p-16 rounded-3xl border border-zinc-800 shadow-2xl text-center space-y-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(38,111,113,0.15),transparent_70%)] pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-4xl mx-auto">
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#14B8A6] font-bold block">
              Scroll Viewport Triggered Expansion
            </span>

            {/* Liquid Kerning Hero Title */}
            <motion.h2
              initial={{ 
                letterSpacing: "0.02em", 
                opacity: 1.0 
              }}
              animate={{ 
                letterSpacing: `${trackingIntensity}em`, 
                opacity: 0.78 
              }}
              transition={{ 
                duration: 1.4, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display uppercase tracking-tight text-white select-none transition-all"
            >
              ARCHITECTURAL SILENCE
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-sm text-stone-300 font-serif italic max-w-xl mx-auto"
            >
              Where mass dissolves into air, and structural stone yields to natural illumination.
            </motion.p>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400 max-w-xl mx-auto">
            <span>Baseline: <code className="text-zinc-300">0.02em</code></span>
            <span>→</span>
            <span>Liquid Expanded: <code className="text-emerald-400">+{trackingIntensity}em (opacity: 78%)</code></span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DEMO B: Interactive Hover Kerning Catalog Cards          */}
        {/* ======================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold tracking-widest text-[#266F71]">
              Interactive Hover Liquid Kerning
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              Hover over cards to watch typography gracefully track out
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {brandTitles.map((card, idx) => (
              <motion.div
                key={idx}
                initial="idle"
                whileHover="hovered"
                className="p-6 sm:p-7 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-xs hover:border-[#266F71]/50 transition-all cursor-pointer flex flex-col justify-between h-56 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                    {card.tag}
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 group-hover:text-[#266F71] transition-colors">
                    0{idx + 1}
                  </span>
                </div>

                <div className="my-auto space-y-2">
                  {/* Liquid Kerning Animated Title */}
                  <motion.h4
                    variants={{
                      idle: { letterSpacing: "0.02em", opacity: 0.95 },
                      hovered: { letterSpacing: "0.18em", opacity: 0.72 }
                    }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="text-base sm:text-lg font-extrabold font-display text-[#174849] uppercase"
                  >
                    {card.title}
                  </motion.h4>
                  <p className="text-xs text-stone-500 font-mono">
                    {card.subtitle}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-[11px] font-mono text-stone-400">
                  <span className="group-hover:text-[#266F71] transition-colors">Hover to expand</span>
                  <span className="text-xs">→</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
