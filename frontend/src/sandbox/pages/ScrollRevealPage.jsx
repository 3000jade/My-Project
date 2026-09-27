import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  IconSparkles, 
  IconArrowLeft,
  IconEye,
  IconScan,
  IconLayersSubtract,
  IconCompass,
  IconCheck,
  IconLayoutGrid,
  IconClick,
  IconBox
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import ImmersiveScrollRevealShowcase from '../components/ImmersiveScrollRevealShowcase';
import ScrollTriggerLandingShowcase from '../components/ScrollTriggerLandingShowcase';

export default function ScrollRevealPage() {
  const [activeSuite, setActiveSuite] = useState('landing'); // 'landing' | 'cinematic'

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#070b0b] text-[#F4F7F7] selection:bg-[#14B8A6] selection:text-black px-4 sm:px-8 lg:px-16 py-12">
      <div className="max-w-[1440px] mx-auto space-y-12">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/sandbox"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#95A6A6] hover:text-[#14B8A6] transition-colors"
          >
            <IconArrowLeft size={16} />
            <span>Back to Sandbox Hub</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-bold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>PropTech Motion Lab 07</span>
          </div>
        </div>

        {/* Hero Introduction */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] text-xs font-mono font-bold uppercase tracking-wider border border-[#14B8A6]/30">
            <IconSparkles size={14} className="animate-spin" style={{ animationDuration: '6s' }} />
            <span>Awwwards-Caliber Scrollytelling &amp; Landing Page Motion</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
            Immersive <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] via-teal-300 to-[#FF7D5A]">Scroll Reveals</span>
          </h1>

          <p className="text-base sm:text-lg text-[#95A6A6] leading-relaxed font-sans">
            Engineered scroll reveal mechanisms for modern landing pages. Explore two suites: <strong>Landing Page Component Triggers</strong> (expanding containers, magnetic spring CTAs, angled image masks, masked typography, bento matrix) and <strong>Cinematic Viewport Portals</strong> (iris aperture expansions, split shears, 3D deck stacking, louvers, CAD laser scans).
          </p>

          {/* Quick Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            {[
              { label: 'Viewport Discipline', detail: 'Negative threshold margins' },
              { label: 'Sub-Pixel Math', detail: 'Zero layout reflow' },
              { label: 'Geometric Masks', detail: 'Clip-path & overflow-hidden' },
              { label: 'Micro-Telemetry', detail: 'JetBrains live counters' }
            ].map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] font-mono text-[#14B8A6] font-bold uppercase block">{p.label}</span>
                <span className="text-xs text-white font-medium">{p.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── SUITE SWITCHER TABS ─── */}
        <div className="p-2 rounded-2xl bg-white/[0.03] border border-white/10 inline-flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSuite('landing')}
            className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
              activeSuite === 'landing'
                ? 'bg-[#14B8A6] text-[#070D0E] shadow-[0_0_20px_rgba(20,184,166,0.35)]'
                : 'text-[#95A6A6] hover:text-white hover:bg-white/5'
            }`}
          >
            <IconLayoutGrid size={18} />
            <span>Landing Page Elements Suite (5 Categories)</span>
          </button>

          <button
            onClick={() => setActiveSuite('cinematic')}
            className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer ${
              activeSuite === 'cinematic'
                ? 'bg-[#14B8A6] text-[#070D0E] shadow-[0_0_20px_rgba(20,184,166,0.35)]'
                : 'text-[#95A6A6] hover:text-white hover:bg-white/5'
            }`}
          >
            <IconScan size={18} />
            <span>Cinematic Viewport Portals (5 Master Patterns)</span>
          </button>
        </div>

        {/* ─── ACTIVE SHOWCASE COMPONENT ─── */}
        {activeSuite === 'landing' ? (
          <ScrollTriggerLandingShowcase />
        ) : (
          <ImmersiveScrollRevealShowcase />
        )}

        {/* ─── IMPLEMENTATION AUDIT & BENCHMARKS ─── */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono text-[#14B8A6] uppercase font-bold tracking-widest">
            <IconCheck size={16} />
            <span>Engineering Discipline &amp; Motion Principles</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#95A6A6] font-sans">
            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <h4 className="text-sm font-bold text-white font-display">1. Performance &amp; Hardware Acceleration</h4>
              <p className="leading-relaxed">
                All scroll-triggered transformations exclusively animate <code className="text-[#14B8A6] font-mono">transform</code>, <code className="text-[#14B8A6] font-mono">opacity</code>, and GPU-accelerated <code className="text-[#14B8A6] font-mono">clip-path</code>. Eliminates DOM geometry reflows (<code className="text-[#FF7D5A] font-mono">top</code>, <code className="text-[#FF7D5A] font-mono">height</code>, <code className="text-[#FF7D5A] font-mono">width</code>).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <h4 className="text-sm font-bold text-white font-display">2. Negative Viewport Margins</h4>
              <p className="leading-relaxed">
                Scroll triggers enforce negative thresholds (<code className="text-[#14B8A6] font-mono">margin: '-60px'</code>). Content earns its entrance well within the user's conscious focus rather than popping clumsily at the browser edge.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <h4 className="text-sm font-bold text-white font-display">3. Lenis Momentum Coordination</h4>
              <p className="leading-relaxed">
                Compatible with the root <code className="text-[#14B8A6] font-mono">ReactLenis</code> momentum engine. Internal scroll elements isolate event bubbling via <code className="text-[#14B8A6] font-mono">data-lenis-prevent="true"</code>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
