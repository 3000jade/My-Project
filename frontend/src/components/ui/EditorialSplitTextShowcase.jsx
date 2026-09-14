import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconSparkles, 
  IconRefresh, 
  IconBox, 
  IconScissors, 
  IconEye, 
  IconLayersLinked, 
  IconCheck, 
  IconAdjustmentsHorizontal 
} from '@tabler/icons-react';

export default function EditorialSplitTextShowcase() {
  const [triggerKey, setTriggerKey] = useState(0);
  const [showMaskOutlines, setShowMaskOutlines] = useState(false);
  const [staggerSpeed, setStaggerSpeed] = useState(0.12);

  const headlineLines = [
    "WE CONSTRUCT SPACES",
    "WHERE ARCHITECTURAL SILENCE",
    "MEETS RAW COASTAL DRAMA",
    "AND TIMELESS TRANQUILITY"
  ];

  const monographLines = [
    "Every volume is calibrated to capture ambient sunset rays,",
    "transforming heavy monolithic Italian Travertine and honed basalt",
    "into fluid, weightless sanctuaries hovering over the horizon."
  ];

  return (
    <div className="w-full space-y-10">
      <div className="bg-white text-stone-900 p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold mb-2 border border-emerald-200">
              <IconScissors className="w-3.5 h-3.5 text-[#266F71]" />
              The "Editorial Split" • Masked Line-by-Line
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-[#174849]">
              The "Editorial Split" (Masked Line-by-Line)
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xl leading-relaxed">
              Sentences and headlines are split into individual lines, each sequestered inside an invisible structural "box" (<code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-[#174849]">overflow-hidden</code>). On scroll, each line smoothly glides up from nothing, appearing out of thin air.
            </p>
          </div>

          {/* Interactive Controls */}
          <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
            {/* Outline Toggle */}
            <button
              onClick={() => setShowMaskOutlines(!showMaskOutlines)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer border ${
                showMaskOutlines 
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-300'
              }`}
            >
              {showMaskOutlines ? 'Mask Boxes: Visible ⬚' : 'Show Mask Boxes ⬚'}
            </button>

            {/* Speed Selector */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-mono">
              {[
                { label: '80ms', val: 0.08 },
                { label: '120ms', val: 0.12 },
                { label: '200ms', val: 0.20 }
              ].map((speed) => (
                <button
                  key={speed.val}
                  onClick={() => {
                    setStaggerSpeed(speed.val);
                    setTriggerKey(prev => prev + 1);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    staggerSpeed === speed.val 
                      ? 'bg-[#174849] text-white font-bold' 
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {speed.label}
                </button>
              ))}
            </div>

            {/* Replay */}
            <button
              onClick={() => setTriggerKey(prev => prev + 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#266F71] hover:bg-[#174849] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <IconRefresh className="w-3.5 h-3.5" />
              <span>Replay Split</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DEMO A: Large Monograph Display Headline                 */}
        {/* ======================================================== */}
        <div 
          key={`headline-${triggerKey}`} 
          className="bg-stone-950 text-white p-8 sm:p-14 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#266F71]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2 max-w-4xl">
            <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#14B8A6] font-bold block mb-4">
              Editorial Monograph • Line-by-Line Entrance
            </span>

            {headlineLines.map((line, idx) => (
              <div 
                key={idx}
                className={`overflow-hidden transition-all duration-300 ${
                  showMaskOutlines 
                    ? 'border-2 border-dashed border-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded my-1' 
                    : ''
                }`}
              >
                <motion.h2
                  initial={{ y: "115%", opacity: 0, rotate: 1.5 }}
                  animate={{ y: "0%", opacity: 1, rotate: 0 }}
                  transition={{ 
                    duration: 0.85, 
                    delay: idx * staggerSpeed, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-none py-1"
                >
                  {line}
                </motion.h2>
              </div>
            ))}
          </div>

          <div className="relative z-10 pt-8 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
            <span>Overflow Mask Envelope: <code className="text-[#14B8A6]">y: 115% → 0%</code></span>
            <span>Easing: <code className="text-zinc-200">cubic-bezier(0.16, 1, 0.3, 1)</code></span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DEMO B: Multi-Line Body Copy Split Reveal               */}
        {/* ======================================================== */}
        <div key={`body-${triggerKey}`} className="p-8 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-bold tracking-widest text-[#266F71]">
              Editorial Body Copy Split
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              Each line clipped by an individual structural box
            </span>
          </div>

          <div className="space-y-1.5 pt-2 max-w-3xl">
            {monographLines.map((line, idx) => (
              <div 
                key={idx}
                className={`overflow-hidden transition-all duration-300 ${
                  showMaskOutlines 
                    ? 'border border-dashed border-amber-500/80 bg-amber-50 px-2 py-0.5 rounded' 
                    : ''
                }`}
              >
                <motion.p
                  initial={{ y: "120%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  transition={{ 
                    duration: 0.75, 
                    delay: idx * staggerSpeed + 0.1, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  className="text-base sm:text-lg text-stone-700 font-serif leading-relaxed"
                >
                  {line}
                </motion.p>
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center gap-2 text-xs font-semibold text-[#266F71]">
            <IconCheck className="w-4 h-4 text-emerald-600" />
            <span>Zero reflow or text jitter: container heights remain mathematically static.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
