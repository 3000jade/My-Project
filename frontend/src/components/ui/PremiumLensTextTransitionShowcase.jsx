import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconEye, 
  IconSparkles, 
  IconRefresh, 
  IconCamera, 
  IconFocus2, 
  IconAdjustmentsHorizontal,
  IconCheck
} from '@tabler/icons-react';

export default function PremiumLensTextTransitionShowcase() {
  const [triggerKey, setTriggerKey] = useState(0);
  const [blurAmount, setBlurAmount] = useState(14);
  const [oversizeScale, setOversizeScale] = useState(1.1);

  const words = [
    "Volumetric", 
    "Travertine", 
    "Monolith", 
    "Framed", 
    "Against", 
    "Twilight"
  ];

  const editorialQuotes = [
    {
      kicker: "ANAMORPHIC RACK FOCUS",
      headline: "The Architecture of Pure Silence",
      body: "Monolithic slabs of honed Italian stone are joined with diamond-milled negative reveals, creating spaces where acoustic reverberation dissolves into tranquil clarity."
    },
    {
      kicker: "CUBIC RESOLUTION",
      headline: "Light as a Primary Building Material",
      body: "Motorized double-glazed thermal panels eliminate physical thresholds between living quarters and the coastal horizon."
    }
  ];

  return (
    <div className="w-full space-y-10">
      <div className="bg-white text-stone-900 p-6 sm:p-10 rounded-3xl border border-stone-200 shadow-sm space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-mono font-semibold mb-2 border border-stone-200">
              <IconFocus2 className="w-3.5 h-3.5 text-[#266F71]" />
              Optical Rack Focus • Anamorphic Blur-To-Charcoal
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-[#174849]">
              Premium Optical Lens Text Transitions
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-xl leading-relaxed">
              Text doesn't merely fade in from zero opacity. It begins <strong>slightly oversized</strong>, <strong>deeply blurred</strong> like a camera lens out of focus, and in a <strong>muted silver tone</strong>, then smoothly scales down, sharpens, and settles into crisp, deep charcoal.
            </p>
          </div>

          {/* Interactive Replay & Parameter Controls */}
          <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-mono">
              {[
                { label: 'Subtle (8px)', blur: 8, scale: 1.06 },
                { label: 'Cinematic (14px)', blur: 14, scale: 1.10 },
                { label: 'Deep Rack (22px)', blur: 22, scale: 1.18 }
              ].map((preset) => (
                <button
                  key={preset.blur}
                  onClick={() => {
                    setBlurAmount(preset.blur);
                    setOversizeScale(preset.scale);
                    setTriggerKey(prev => prev + 1);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    blurAmount === preset.blur 
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
              <span>Rack Focus</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DEMO A: Word-By-Word Staggered Anamorphic Focus Rack     */}
        {/* ======================================================== */}
        <div className="bg-stone-50/80 p-8 sm:p-12 rounded-2xl border border-stone-200/80 text-center space-y-4">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#266F71] font-bold block">
            Staggered Anamorphic Focus Wave
          </span>

          <div key={`words-${triggerKey}`} className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-2 py-4">
            {words.map((word, idx) => (
              <motion.span
                key={idx}
                initial={{ 
                  scale: oversizeScale, 
                  filter: `blur(${blurAmount}px)`, 
                  color: "#CBD5E1", // Muted silver
                  opacity: 0.2
                }}
                animate={{ 
                  scale: 1.0, 
                  filter: "blur(0px)", 
                  color: "#18181B", // Crisp deep charcoal
                  opacity: 1.0
                }}
                transition={{ 
                  duration: 0.85, 
                  delay: idx * 0.12, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight inline-block"
              >
                {word}
              </motion.span>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs font-mono text-stone-500">
            <span>State: Oversized ({oversizeScale}x) + {blurAmount}px Blur → 1.0x Crisp Charcoal (#18181B)</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* DEMO B: Editorial Paragraph & Header Viewport Rack Focus */}
        {/* ======================================================== */}
        <div key={`editorial-${triggerKey}`} className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {editorialQuotes.map((quote, qIdx) => (
            <div 
              key={qIdx}
              className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4 group hover:border-[#266F71]/40 transition-colors"
            >
              {/* Kicker */}
              <motion.span
                initial={{ 
                  scale: 1.08, 
                  filter: `blur(${blurAmount * 0.7}px)`, 
                  color: "#94A3B8", 
                  opacity: 0.3 
                }}
                animate={{ 
                  scale: 1.0, 
                  filter: "blur(0px)", 
                  color: "#266F71", 
                  opacity: 1.0 
                }}
                transition={{ duration: 0.7, delay: qIdx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="text-[10px] font-mono uppercase font-bold tracking-[0.2em] block"
              >
                {quote.kicker}
              </motion.span>

              {/* Headline */}
              <motion.h4
                initial={{ 
                  scale: oversizeScale, 
                  filter: `blur(${blurAmount}px)`, 
                  color: "#CBD5E1", 
                  opacity: 0.25 
                }}
                animate={{ 
                  scale: 1.0, 
                  filter: "blur(0px)", 
                  color: "#18181B", 
                  opacity: 1.0 
                }}
                transition={{ duration: 0.85, delay: qIdx * 0.15 + 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-xl sm:text-2xl font-bold font-display tracking-tight leading-snug"
              >
                {quote.headline}
              </motion.h4>

              {/* Body */}
              <motion.p
                initial={{ 
                  scale: 1.04, 
                  filter: `blur(${blurAmount * 0.6}px)`, 
                  color: "#94A3B8", 
                  opacity: 0.3 
                }}
                animate={{ 
                  scale: 1.0, 
                  filter: "blur(0px)", 
                  color: "#475569", 
                  opacity: 1.0 
                }}
                transition={{ duration: 0.85, delay: qIdx * 0.15 + 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs sm:text-sm text-stone-600 leading-relaxed pt-1"
              >
                {quote.body}
              </motion.p>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-mono text-stone-400">
                <span>Transition Physics:</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">ease: [0.16, 1, 0.3, 1]</span>
              </div>
            </div>
          ))}
        </div>

        {/* ======================================================== */}
        {/* DEMO C: Interactive Hover Rack Focus Card                */}
        {/* ======================================================== */}
        <div className="bg-zinc-950 text-white p-6 sm:p-8 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-[#14B8A6] font-bold">
              Interactive Hover Lens Trigger
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              Hover over cards below to test interactive rack focus
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              { label: "Material Specification", desc: "0.5mm diamond cut shadow line with thermal expansion relief" },
              { label: "Titanium Cladding", desc: "120-grit directional brushed PVD champagne coating" },
              { label: "Acoustic Attenuation", desc: "Dual acoustic interlayers rated STC 55 soundproof isolation" }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                initial="unfocused"
                whileHover="focused"
                className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#14B8A6]/50 transition-all cursor-pointer space-y-2"
              >
                <motion.h5
                  variants={{
                    unfocused: { scale: 1.06, filter: "blur(6px)", color: "#71717A" },
                    focused: { scale: 1.0, filter: "blur(0px)", color: "#FFFFFF" }
                  }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-sm font-bold font-display"
                >
                  {card.label}
                </motion.h5>
                <motion.p
                  variants={{
                    unfocused: { filter: "blur(4px)", color: "#52525B", opacity: 0.5 },
                    focused: { filter: "blur(0px)", color: "#D4D4D8", opacity: 1.0 }
                  }}
                  transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs leading-relaxed"
                >
                  {card.desc}
                </motion.p>
                <div className="pt-2 flex items-center gap-1.5 text-[10px] font-mono text-[#14B8A6]">
                  <IconCheck className="w-3.5 h-3.5" />
                  <span>Hover to Rack Sharp Focus</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
