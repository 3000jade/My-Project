import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IconBuildingSkyscraper,
  IconMapPin,
  IconBook2,
  IconBoxModel2,
  IconLayoutDashboard,
  IconArrowRight,
  IconSparkles,
  IconCpu,
  IconDeviceAnalytics
} from '@tabler/icons-react';

const MODULES = [
  {
    id: 'valuation',
    title: 'Algorithmic Home Valuation',
    path: '/sandbox/valuation',
    category: 'PropTech Algorithm',
    badge: 'Live Tool',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    description: 'Instant multi-variant real estate valuation calculator factoring location metrics, square meters, property tiers, and historical appreciation models.',
    icon: IconBuildingSkyscraper,
    tech: ['React Hooks', 'Dynamic Multi-tier CMA', 'Framer Motion']
  },
  {
    id: 'neighborhoods',
    title: 'Curated Neighborhood Guides',
    path: '/sandbox/neighborhoods',
    category: 'Interactive Geo Intelligence',
    badge: 'Content System',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Comprehensive directory of premier residential enclaves (Makati CBD, BGC, Forbes Park) complete with walk scores, school ratings, and price trajectories.',
    icon: IconMapPin,
    tech: ['Dynamic Filtering', 'Categorized Tabs', 'Dataset Mocks']
  },
  {
    id: 'journal',
    title: 'Market Intelligence Journal',
    path: '/sandbox/journal',
    category: 'Editorial Publications',
    badge: 'Editorial',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'High-net-worth real estate analysis, macroeconomic property shifts, and off-market acquisition strategies formatted in an editorial magazine layout.',
    icon: IconBook2,
    tech: ['Editorial Typography', 'Responsive Grid', 'Staggered Reveals']
  },
  {
    id: '3d-demo',
    title: 'Cinematic 3D Duplex Viewer',
    path: '/sandbox/3d-demo',
    category: '3D WebGL / R3F',
    badge: 'Three.js Experience',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description: 'High-fidelity procedural architectural visualizer featuring full camera orbit controls, floor level exploration, daylight simulation, and scroll choreography.',
    icon: IconBoxModel2,
    tech: ['Three.js', 'React Three Fiber', 'GSAP ScrollTrigger', 'OrbitControls']
  },
  {
    id: 'ui-ux-labs',
    title: 'UI/UX Component Labs',
    path: '/sandbox/ui-ux-labs',
    category: 'Design System & Interaction',
    badge: '30+ Interactive Demos',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Interactive testbed showcasing physics-based spring modals, liquid text kerning, optical lens distortion, catwalk horizontal scroll, and video scrubbing.',
    icon: IconLayoutDashboard,
    tech: ['Framer Motion Springs', 'Tailwind v4 CSS', 'Canvas Scrubbing', 'Lenis Momentum']
  },
  {
    id: 'parallax-lab',
    title: 'Anime Parallax Motion Lab',
    path: '/sandbox/parallax-lab',
    category: '2.5D Motion Engineering',
    badge: 'After Effects Techniques',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: "Interactive testbed exploring the 3 core anime parallax camera movements from mclelun: Pan (velocity multipliers), Zoom (focal push-in), and Arc (counter-directional orbit).",
    icon: IconBoxModel2,
    tech: ['Framer Motion', 'Z-Depth Math', 'Dynamic Bokeh Blur', 'Live Metrics']
  }
];

export default function SandboxHubPage() {
  return (
    <div className="min-h-[calc(100vh-72px)] bg-gradient-to-b from-[#070b0b] via-[#091010] to-[#050808] px-6 md:px-12 lg:px-20 py-16">
      <div className="max-w-[1500px] mx-auto">
        
        {/* Hero Section */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-6">
            <IconSparkles size={14} />
            <span>Isolated Development Environment</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white mb-6 leading-tight">
            Sandbox <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Labs & Preview</span>
          </h1>
          
          <p className="text-gray-400 text-base md:text-lg leading-relaxed font-sans mb-8">
            This dedicated environment houses exploratory interfaces, interactive algorithms, 3D spatial visualizers, and editorial systems isolated from the main consumer luxury portal.
          </p>

          {/* Quick Metrics Pill Bar */}
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-gray-300">
              <IconCpu size={16} className="text-emerald-400" />
              <span>5 Modules Mounted</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-gray-300">
              <IconDeviceAnalytics size={16} className="text-teal-400" />
              <span>Vite HMR Active</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Isolated Routes (`/sandbox/*`)</span>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="group relative flex flex-col justify-between p-7 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-[0_10px_35px_rgba(16,185,129,0.1)]"
              >
                <div>
                  {/* Top Bar: Icon + Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                      <Icon size={24} />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${mod.badgeColor}`}>
                      {mod.badge}
                    </span>
                  </div>

                  {/* Category */}
                  <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400/80 mb-2 block">
                    {mod.category}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">
                    {mod.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-400 font-sans leading-relaxed mb-6">
                    {mod.description}
                  </p>
                </div>

                <div>
                  {/* Tech Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {mod.tech.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded text-[10px] font-mono text-gray-400 bg-white/[0.04] border border-white/5"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Launch CTA */}
                  <Link
                    to={mod.path}
                    className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider font-sans bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:border-emerald-400/50 transition-all duration-200"
                  >
                    <span>Launch Module</span>
                    <IconArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
