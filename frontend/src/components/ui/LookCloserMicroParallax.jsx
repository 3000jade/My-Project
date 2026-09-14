import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  IconFocus2, 
  IconSparkles, 
  IconLayersLinked, 
  IconCompass, 
  IconEye, 
  IconMicroscope, 
  IconCheck, 
  IconAdjustmentsHorizontal 
} from '@tabler/icons-react';

import macroFacadeImg from '../../assets/macro_craftsmanship_facade.jpg';

export default function LookCloserMicroParallax() {
  const containerRef = useRef(null);

  // Track vertical scroll progress across the 280vh scrub distance
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Micro-Parallax Camera Transforms:
  // Phase 1 (0 -> 0.28): 1x overview
  // Phase 2 (0.35 -> 0.65): 2.2x zoom into marble & negative shadow joint
  // Phase 3 (0.72 -> 1.0): 3.2x extreme macro into brushed champagne titanium
  const scale = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [1, 2.1, 3.1, 3.1]);
  const xPan = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], ['0%', '-14%', '24%', '24%']);
  const yPan = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], ['0%', '-8%', '-4%', '-4%']);

  // Callout card opacities based on current scroll milestone
  const opacityPhase1 = useTransform(scrollYProgress, [0, 0.24, 0.32], [1, 1, 0]);
  const opacityPhase2 = useTransform(scrollYProgress, [0.28, 0.38, 0.62, 0.70], [0, 1, 1, 0]);
  const opacityPhase3 = useTransform(scrollYProgress, [0.66, 0.76, 1], [0, 1, 1]);

  // Reticle pulse coordinates
  const reticle1Opacity = useTransform(scrollYProgress, [0.32, 0.40, 0.62, 0.68], [0, 1, 1, 0]);
  const reticle2Opacity = useTransform(scrollYProgress, [0.70, 0.78, 1], [0, 1, 1]);

  return (
    <div className="w-full space-y-6">
      {/* Outer Scroll Track: Provides the physical scrub distance */}
      <div 
        ref={containerRef} 
        className="relative h-[290vh] rounded-3xl"
      >
        {/* Sticky Viewport Stage: Stays locked in viewport while user scrubs */}
        <div className="sticky top-20 h-[85vh] rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col justify-between p-6 sm:p-10 relative">
          
          {/* Top Telemetry Header */}
          <div className="relative z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-mono font-semibold mb-2 border border-amber-500/20">
                <IconMicroscope className="w-3.5 h-3.5 text-amber-400" />
                The "Look Closer" Micro-Parallax • Craftsmanship Scrub
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
                Architectural Joinery &amp; Material Craftsmanship
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
                Scroll to engage micro-parallax: the lens dynamically zooms into microscopic textures, diamond-milled reveals, and brushed titanium grain.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs font-mono text-zinc-300 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>SCRUB ACTIVE • 1x → 3.2x MACRO</span>
            </div>
          </div>

          {/* Core Lens Viewport: Transforms with Micro-Parallax */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <motion.div
              style={{
                scale,
                x: xPan,
                y: yPan,
                transformOrigin: '50% 50%'
              }}
              className="w-full h-full will-change-transform"
            >
              <img 
                src={macroFacadeImg} 
                alt="Architectural Craftsmanship Macro Facade"
                className="w-full h-full object-cover brightness-[0.88] contrast-[1.05]"
              />
            </motion.div>

            {/* Subtle vignette and gradient framing */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-zinc-950/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/70 via-transparent to-zinc-950/70" />
          </div>

          {/* Focal Reticle Overlays */}
          {/* Reticle 1: Shadow Reveal Gap */}
          <motion.div 
            style={{ opacity: reticle1Opacity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-400/80 animate-spin-slow flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <span className="text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">
              TARGET: 0.5mm SHADOW JOINT
            </span>
          </motion.div>

          {/* Reticle 2: Titanium Micro Grain */}
          <motion.div 
            style={{ opacity: reticle2Opacity }}
            className="absolute top-[42%] left-[36%] pointer-events-none z-10 flex flex-col items-center gap-2"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#14B8A6]/80 animate-spin-slow flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-ping" />
            </div>
            <span className="text-[10px] font-mono bg-black/80 px-2 py-0.5 rounded text-[#14B8A6] border border-teal-500/30">
              TARGET: 120-GRIT TITANIUM GRAIN
            </span>
          </motion.div>

          {/* Contextual Narrative Callouts (Positioned dynamically near inspected detail) */}
          <div className="relative z-20 my-auto pointer-events-none">
            {/* Phase 1 Callout: Overview */}
            <motion.div 
              style={{ opacity: opacityPhase1 }}
              className="max-w-md bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-5 rounded-2xl shadow-2xl space-y-2 pointer-events-auto"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-amber-400 font-bold uppercase tracking-wider">Phase 01 • Master Overview</span>
                <span className="font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded text-[10px]">1.0x Scale</span>
              </div>
              <h4 className="text-lg font-bold text-white font-display">
                The Calacatta &amp; Titanium Synthesis
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Seamless monolithic architectural envelope uniting honed Italian Calacatta marble slabs with bespoke aerospace champagne titanium cladding.
              </p>
              <div className="pt-2 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <span className="text-amber-400">↓</span>
                <span>Scroll down to zoom closer into joinery tolerances</span>
              </div>
            </motion.div>

            {/* Phase 2 Callout: Negative Shadow Reveal */}
            <motion.div 
              style={{ opacity: opacityPhase2 }}
              className="max-w-md bg-zinc-900/90 backdrop-blur-md border border-amber-500/30 p-5 rounded-2xl shadow-2xl space-y-2 pointer-events-auto mt-4"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-amber-400 font-bold uppercase tracking-wider">Phase 02 • Micro-Tolerances</span>
                <span className="font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] border border-amber-500/20">2.1x Macro Zoom</span>
              </div>
              <h4 className="text-lg font-bold text-white font-display">
                0.5mm Diamond-Honed Shadow Reveal
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Rather than butt-joining marble slabs directly, a laser-cut 0.5mm negative shadow line provides thermal expansion relief while producing an immaculate razor-thin architectural shadow.
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-amber-300/90">
                <span>Tolerance: ±0.05mm</span>
                <span>•</span>
                <span>Edge Bevel: 45° Micro-Chamfer</span>
              </div>
            </motion.div>

            {/* Phase 3 Callout: Brushed Titanium Surface */}
            <motion.div 
              style={{ opacity: opacityPhase3 }}
              className="max-w-md bg-zinc-900/90 backdrop-blur-md border border-teal-500/30 p-5 rounded-2xl shadow-2xl space-y-2 pointer-events-auto mt-4 ml-auto"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[#14B8A6] font-bold uppercase tracking-wider">Phase 03 • Material Grain</span>
                <span className="font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded text-[10px] border border-teal-500/20">3.1x Extreme Macro</span>
              </div>
              <h4 className="text-lg font-bold text-white font-display">
                Directional Brushed Titanium Inlay
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                120-grit directional satin brushed finish treated with Physical Vapor Deposition (PVD). Yields an ultra-matte, non-reflective finish that repels ambient skin oils and marine corrosion.
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-teal-300/90">
                <span>Grade 5 Titanium</span>
                <span>•</span>
                <span>PVD Gold-Champagne Tint</span>
              </div>
            </motion.div>
          </div>

          {/* Bottom Scrub Progress Rail */}
          <div className="relative z-20 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-3">
              <IconFocus2 className="w-4 h-4 text-amber-400" />
              <span>Optical Zoom Rail: 1.0x → 3.1x Scrub Depth</span>
            </div>

            {/* Visual Scrub Progress Indicator */}
            <div className="flex-1 max-w-sm h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                style={{ scaleX: scrollYProgress }}
                className="h-full bg-gradient-to-r from-amber-500 via-[#14B8A6] to-emerald-400 origin-left"
              />
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-amber-400 font-bold">Scroll to Inspect Details</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
