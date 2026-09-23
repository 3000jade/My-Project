import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import {
  IconVectorBezier2,
  IconBuildingSkyscraper,
  IconReload,
  IconRadar,
  IconPalette,
  IconCopy,
  IconCheck,
  IconCode,
  IconSparkles,
  IconPlayerPlay,
  IconPlayerPause,
  IconColorFilter,
  IconShape,
  IconCircleDot
} from '@tabler/icons-react';

const cx = 150;
const cy = 150;
const toPath = (pts) => 'M ' + pts.map((p) => `${p[0]} ${p[1]}`).join(' L ') + ' Z';

// Unified 16-Vertex Geometry Library
const circlePts = Array.from({ length: 16 }, (_, i) => {
  const a = (i * 2 * Math.PI) / 16 - Math.PI / 2;
  return [Math.round(cx + 110 * Math.cos(a)), Math.round(cy + 110 * Math.sin(a))];
});

const squirclePts = Array.from({ length: 16 }, (_, i) => {
  const a = (i * 2 * Math.PI) / 16 - Math.PI / 2;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const r = 118 / Math.pow(Math.pow(Math.abs(sa), 4) + Math.pow(Math.abs(ca), 4), 0.25);
  return [Math.round(cx + r * ca), Math.round(cy + r * sa)];
});

const diamondPts = [
  [150, 35], [179, 64], [208, 93], [236, 121],
  [265, 150], [236, 179], [208, 208], [179, 236],
  [150, 265], [121, 236], [93, 208], [64, 179],
  [35, 150], [64, 121], [93, 93], [121, 64]
];

const hexCorners = [
  [150, 36], [245, 91], [245, 201], [150, 256], [55, 201], [55, 91]
];
const hexPts = [];
for (let i = 0; i < 16; i++) {
  const tTotal = (i / 16) * 6;
  const segIdx = Math.floor(tTotal) % 6;
  const segT = tTotal - Math.floor(tTotal);
  const p1 = hexCorners[segIdx];
  const p2 = hexCorners[(segIdx + 1) % 6];
  hexPts.push([
    Math.round(p1[0] + (p2[0] - p1[0]) * segT),
    Math.round(p1[1] + (p2[1] - p1[1]) * segT)
  ]);
}

const starPts = Array.from({ length: 16 }, (_, i) => {
  const r = i % 2 === 0 ? 120 : 55;
  const a = (i * 2 * Math.PI) / 16 - Math.PI / 2;
  return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))];
});

const shieldPts = [
  [150, 42], [185, 45], [225, 55], [245, 75],
  [252, 120], [245, 170], [225, 215], [190, 245],
  [150, 268], [110, 245], [75, 215], [55, 170],
  [48, 120], [55, 75], [75, 55], [115, 45]
];

const pillPts = [
  [150, 85], [195, 85], [235, 98], [255, 125],
  [255, 150], [255, 175], [235, 202], [195, 215],
  [150, 215], [105, 215], [65, 202], [45, 175],
  [45, 150], [45, 125], [65, 98], [105, 85]
];

const blobPts = Array.from({ length: 16 }, (_, i) => {
  const a = (i * 2 * Math.PI) / 16 - Math.PI / 2;
  const r = 110 + 22 * Math.sin(3 * a) + 12 * Math.cos(2 * a);
  return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))];
});

const SHAPES = {
  circle: { id: 'circle', label: 'Circle', pts: circlePts, path: toPath(circlePts), formula: 'r = 110 (16-point circle)' },
  squircle: { id: 'squircle', label: 'Squircle', pts: squirclePts, path: toPath(squirclePts), formula: 'r = 118 / (|sin|^4 + |cos|^4)^0.25' },
  diamond: { id: 'diamond', label: 'Diamond', pts: diamondPts, path: toPath(diamondPts), formula: '4-quadrant faceted rhombus' },
  hexagon: { id: 'hexagon', label: 'Hexagon', pts: hexPts, path: toPath(hexPts), formula: '6-vertex regular polygon' },
  shield: { id: 'shield', label: 'Luxury Shield', pts: shieldPts, path: toPath(shieldPts), formula: 'architectural crest contour' },
  star: { id: 'star', label: 'Octagram Star', pts: starPts, path: toPath(starPts), formula: 'R_out=120 R_in=55 (8-point star)' },
  pill: { id: 'pill', label: 'Capsule Pill', pts: pillPts, path: toPath(pillPts), formula: 'horizontal stadium pill geometry' },
  blob: { id: 'blob', label: 'Liquid Blob', pts: blobPts, path: toPath(blobPts), formula: 'r = 110 + 22*sin(3a) + 12*cos(2a)' }
};

const PALETTES = {
  pine: {
    id: 'pine',
    label: 'Pine & Mint',
    glowColor: 'rgba(20, 184, 166, 0.45)',
    accent: '#14B8A6',
    stops: ['#174849', '#266F71', '#14B8A6']
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset Coral',
    glowColor: 'rgba(244, 162, 97, 0.45)',
    accent: '#F4A261',
    stops: ['#266F71', '#E76F51', '#F4A261']
  },
  cyber: {
    id: 'cyber',
    label: 'Electric Cyan',
    glowColor: 'rgba(0, 229, 255, 0.45)',
    accent: '#00E5FF',
    stops: ['#0B132B', '#1C2541', '#00E5FF']
  },
  amethyst: {
    id: 'amethyst',
    label: 'Royal Amethyst',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    accent: '#F43F5E',
    stops: ['#2E1065', '#7C3AED', '#F43F5E']
  },
  gold: {
    id: 'gold',
    label: 'Obsidian Gold',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    accent: '#EAB308',
    stops: ['#18181B', '#3F3F46', '#EAB308']
  }
};

const SPRING_PRESETS = {
  smooth: { stiffness: 140, damping: 20, label: 'Cinematic Smooth' },
  bouncy: { stiffness: 280, damping: 14, label: 'Elastic Bouncy' },
  snappy: { stiffness: 450, damping: 28, label: 'Snappy Precision' }
};

export default function AnimatedVectorShapeShowcase() {
  const [activeMode, setActiveMode] = useState('transitions'); // 'transitions' | 'blueprint' | 'morph'
  const [drawKey, setDrawKey] = useState(0);
  const [isScanning, setIsScanning] = useState(true);
  const [activeZone, setActiveZone] = useState(null);
  const [theme, setTheme] = useState('cad');
  const [copied, setCopied] = useState(false);

  // Morph mode states
  const [morphShape, setMorphShape] = useState('blob');
  const [isRotating, setIsRotating] = useState(true);
  const [gradientSpeed, setGradientSpeed] = useState('normal');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Transitions mode states
  const [selectedShape, setSelectedShape] = useState('squircle');
  const [previousShape, setPreviousShape] = useState(SHAPES.squircle);
  const [selectedPalette, setSelectedPalette] = useState('pine');
  const [springPhysicsPreset, setSpringPhysicsPreset] = useState('smooth');
  const [isAutoMorphing, setIsAutoMorphing] = useState(false);
  const [showVertices, setShowVertices] = useState(true);
  const [morphEffect, setMorphEffect] = useState('all'); // 'all' | 'shockwave' | 'chromatic' | 'wobble' | 'pure'
  const [morphTriggerKey, setMorphTriggerKey] = useState(0);
  const wobbleControls = useAnimationControls();

  const handleSelectShape = (shapeId) => {
    if (shapeId === selectedShape) return;
    setPreviousShape(SHAPES[selectedShape]);
    setSelectedShape(shapeId);
    setMorphTriggerKey((k) => k + 1);
  };

  // Trigger wobble without unmounting the morphing path
  useEffect(() => {
    if (morphTriggerKey === 0) return;
    if (morphEffect === 'all' || morphEffect === 'wobble') {
      wobbleControls.start({
        scale: [1, 0.94, 1.04, 0.98, 1],
        rotate: [0, -4, 3, -1, 0],
        transition: {
          duration: 0.75,
          ease: [0.22, 1, 0.36, 1]
        }
      });
    }
  }, [morphTriggerKey, morphEffect, wobbleControls]);

  // Auto-morph sequence
  useEffect(() => {
    if (!isAutoMorphing || activeMode !== 'transitions') return;
    const shapeKeys = Object.keys(SHAPES);
    const paletteKeys = Object.keys(PALETTES);

    const interval = setInterval(() => {
      setSelectedShape((prev) => {
        setPreviousShape(SHAPES[prev]);
        const nextIdx = (shapeKeys.indexOf(prev) + 1) % shapeKeys.length;
        return shapeKeys[nextIdx];
      });
      setMorphTriggerKey((k) => k + 1);
      setSelectedPalette((prev) => {
        const nextIdx = (paletteKeys.indexOf(prev) + 1) % paletteKeys.length;
        return paletteKeys[nextIdx];
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isAutoMorphing, activeMode]);

  const themeStyles = {
    cad: {
      bg: 'bg-[#09111E]',
      border: 'border-cyan-500/20',
      grid: 'stroke-cyan-500/10',
      wallStroke: '#00E5FF',
      subStroke: '#38BDF8',
      accentStroke: '#67E8F9',
      scanColor: 'from-transparent via-cyan-400/25 to-transparent',
      glow: 'shadow-[0_0_50px_rgba(0,229,255,0.15)]',
      label: 'CAD Cyberspace Blueprint'
    },
    emerald: {
      bg: 'bg-[#061C19]',
      border: 'border-emerald-500/20',
      grid: 'stroke-emerald-500/10',
      wallStroke: '#14B8A6',
      subStroke: '#F4A261',
      accentStroke: '#34D399',
      scanColor: 'from-transparent via-emerald-400/25 to-transparent',
      glow: 'shadow-[0_0_50px_rgba(20,184,166,0.15)]',
      label: 'Emerald Architectural Luxury'
    },
    minimal: {
      bg: 'bg-[#18181B]',
      border: 'border-stone-700',
      grid: 'stroke-stone-700/30',
      wallStroke: '#FAFAFA',
      subStroke: '#A1A1AA',
      accentStroke: '#E4E4E7',
      scanColor: 'from-transparent via-white/20 to-transparent',
      glow: 'shadow-[0_0_50px_rgba(255,255,255,0.08)]',
      label: 'Monochrome Minimalist'
    }
  };

  const currentTheme = themeStyles[theme];
  const activeShape = SHAPES[selectedShape];
  const activePalette = PALETTES[selectedPalette];
  const activeSpring = SPRING_PRESETS[springPhysicsPreset];

  const zones = [
    { id: 'living', name: 'Grand Sky Atrium', area: '142 m²', x: 130, y: 150, w: 180, h: 120 },
    { id: 'master', name: 'Master Suite Sanctuary', area: '88 m²', x: 340, y: 110, w: 150, h: 130 },
    { id: 'terrace', name: 'Cantilevered Ocean Deck', area: '110 m²', x: 130, y: 290, w: 220, h: 80 },
    { id: 'pool', name: 'Suspended Lap Pool', area: '45 m²', x: 370, y: 270, w: 120, h: 100 }
  ];

  const handleCopySnippet = () => {
    let code = '';
    if (activeMode === 'transitions') {
      code = `// Unified 16-Vertex Liquid Morphing with Framer Motion
<svg viewBox="0 0 300 300" className="w-72 h-72">
  <defs>
    <linearGradient id="morphGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <motion.stop offset="0%" animate={{ stopColor: "${activePalette.stops[0]}" }} transition={{ duration: 0.8 }} />
      <motion.stop offset="50%" animate={{ stopColor: "${activePalette.stops[1]}" }} transition={{ duration: 0.8 }} />
      <motion.stop offset="100%" animate={{ stopColor: "${activePalette.stops[2]}" }} transition={{ duration: 0.8 }} />
    </linearGradient>
  </defs>
  <motion.path
    animate={{ d: "${activeShape.path}" }}
    transition={{
      type: "spring",
      stiffness: ${activeSpring.stiffness},
      damping: ${activeSpring.damping}
    }}
    fill="url(#morphGrad)"
    stroke="#FFFFFF"
    strokeWidth="2.5"
  />
</svg>`;
    } else {
      code = `// Kinetic SVG Path Drawing with Spring Physics
<motion.path
  d="M 110 90 L 510 90 L 510 260 L 530 260 L 530 380 Z"
  initial={{ pathLength: 0, opacity: 0 }}
  animate={{ pathLength: 1, opacity: 1 }}
  transition={{
    pathLength: { duration: 2.4, ease: [0.16, 1, 0.3, 1] },
    opacity: { duration: 0.2 }
  }}
  stroke="#00E5FF"
  strokeWidth={3}
  fill="none"
/>`;
    }
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 40;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 40;
    setMousePos({ x, y });
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-[#174849]">
      {/* Top Banner & Mode Switcher */}
      <div className="p-6 sm:p-8 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-b from-[#FBFBFA] to-white">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#266F71]/10 text-[#266F71] text-xs font-semibold uppercase tracking-wider mb-2">
            <IconVectorBezier2 className="w-3.5 h-3.5" />
            Interactive Vector &amp; Shape Lab
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-[#174849]">
            Kinetic SVG Path &amp; Fluid Shape Animation
          </h3>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            Unified 16-vertex liquid morphing engine, precision SVG path drawing, and continuous chromatic colorway transitions.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 self-start md:self-auto shrink-0 flex-wrap gap-1">
          <button
            onClick={() => setActiveMode('transitions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'transitions'
                ? 'bg-white text-[#174849] shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <IconPalette className="w-4 h-4 text-[#266F71]" />
            Shape &amp; Color Transitions
          </button>
          <button
            onClick={() => setActiveMode('blueprint')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'blueprint'
                ? 'bg-white text-[#174849] shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <IconBuildingSkyscraper className="w-4 h-4" />
            CAD Blueprint Vector
          </button>
          <button
            onClick={() => setActiveMode('morph')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === 'morph'
                ? 'bg-white text-[#174849] shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <IconSparkles className="w-4 h-4" />
            Spline &amp; Morpher
          </button>
        </div>
      </div>

      {/* MODE 1: SHAPE & COLOR TRANSITION LAB (16-VERTEX FLUID MORPH) */}
      {activeMode === 'transitions' && (
        <div className="p-6 sm:p-8 space-y-6">
          {/* Controls Bar */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
            {/* Shape Selector Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1.5">
                  <IconShape className="w-3.5 h-3.5 text-[#266F71]" /> 16-Vertex Shape:
                </span>
                {Object.values(SHAPES).map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => handleSelectShape(shape.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedShape === shape.id
                        ? 'bg-[#174849] text-white shadow-sm scale-105'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowVertices((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    showVertices
                      ? 'bg-[#266F71]/15 text-[#174849] border border-[#266F71]/40'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <IconCircleDot className="w-3.5 h-3.5 text-[#266F71]" />
                  {showVertices ? 'Hide Nodes' : 'Show 16 Nodes'}
                </button>

                <button
                  onClick={() => setIsAutoMorphing((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isAutoMorphing
                      ? 'bg-amber-500 text-white shadow-md animate-pulse'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {isAutoMorphing ? <IconPlayerPause className="w-3.5 h-3.5" /> : <IconPlayerPlay className="w-3.5 h-3.5 text-amber-600" />}
                  {isAutoMorphing ? 'Auto: ON' : 'Play Auto-Morph'}
                </button>
              </div>
            </div>

            {/* Morph Transition FX Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-stone-200/80">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1.5">
                  <IconSparkles className="w-3.5 h-3.5 text-[#266F71]" /> Morph FX Effect:
                </span>
                {[
                  { id: 'all', label: 'All FX (Combined)' },
                  { id: 'shockwave', label: 'Liquid Shockwave' },
                  { id: 'chromatic', label: 'Chromatic RGB Split' },
                  { id: 'wobble', label: 'Elastic Wobble' },
                  { id: 'pure', label: 'Pure Geometric Glide' }
                ].map((fx) => (
                  <button
                    key={fx.id}
                    onClick={() => setMorphEffect(fx.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      morphEffect === fx.id
                        ? 'bg-[#266F71] text-white shadow-2xs'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {fx.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Palette & Spring Physics Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-stone-200/80">
              {/* Palette Swatches */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1.5">
                  <IconColorFilter className="w-3.5 h-3.5 text-[#266F71]" /> Palette:
                </span>
                {Object.values(PALETTES).map((pal) => (
                  <button
                    key={pal.id}
                    onClick={() => setSelectedPalette(pal.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedPalette === pal.id
                        ? 'bg-white ring-2 ring-[#174849] shadow-sm text-[#174849]'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 opacity-80'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-inner"
                      style={{ background: `linear-gradient(135deg, ${pal.stops[0]}, ${pal.stops[2]})` }}
                    />
                    {pal.label}
                  </button>
                ))}
              </div>

              {/* Spring Physics Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 font-medium">Physics:</span>
                <div className="flex gap-1">
                  {Object.entries(SPRING_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => setSpringPhysicsPreset(key)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        springPhysicsPreset === key
                          ? 'bg-[#266F71] text-white shadow-2xs'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {preset.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Transition Stage */}
          <div className="relative w-full rounded-2xl bg-gradient-to-br from-[#0B0C0A] via-[#101414] to-[#0A0E0E] border border-stone-800 aspect-[16/10] sm:aspect-[21/10] overflow-hidden flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            {/* Ambient Radial Glow */}
            <motion.div
              animate={{
                background: `radial-gradient(circle at 50% 50%, ${activePalette.glowColor}, transparent 65%)`
              }}
              transition={{ duration: 1 }}
              className="absolute inset-0 pointer-events-none"
            />

            {/* Grid Backdrop Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

            {/* THE UNIFIED 16-VERTEX LIQUID MORPHING SVG */}
            <svg
              viewBox="0 0 300 300"
              className="w-72 h-72 sm:w-88 sm:h-88 relative z-10 select-none overflow-visible"
            >
              <defs>
                {/* Dynamically Interpolating SVG Gradient */}
                <linearGradient id="activeShapeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <motion.stop
                    offset="0%"
                    animate={{ stopColor: activePalette.stops[0] }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                  />
                  <motion.stop
                    offset="50%"
                    animate={{ stopColor: activePalette.stops[1] }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                  />
                  <motion.stop
                    offset="100%"
                    animate={{ stopColor: activePalette.stops[2] }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                  />
                </linearGradient>

                {/* Soft Specular Glow Filter */}
                <filter id="shapeSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Liquid Shockwave Ripple Effect originating from previous shape */}
              {(morphEffect === 'all' || morphEffect === 'shockwave') && (
                <motion.path
                  key={`shockwave-${morphTriggerKey}`}
                  d={previousShape.path}
                  initial={{ scale: 0.96, opacity: 0.9 }}
                  animate={{ scale: 1.38, opacity: 0 }}
                  transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: '150px 150px' }}
                  fill="none"
                  stroke={activePalette.accent}
                  strokeWidth="2"
                  strokeDasharray="6 6"
                />
              )}

              {/* 2. Chromatic RGB Dispersion Ghosts */}
              {(morphEffect === 'all' || morphEffect === 'chromatic') && (
                <>
                  <motion.path
                    key={`chroma-cyan-${morphTriggerKey}`}
                    d={previousShape.path}
                    initial={{ x: -10, y: -6, opacity: 0.7, scale: 1 }}
                    animate={{ x: 0, y: 0, opacity: 0, scale: 1.06 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    fill="none"
                    stroke="#00E5FF"
                    strokeWidth="2"
                    style={{ mixBlendMode: 'screen', transformOrigin: '150px 150px' }}
                  />
                  <motion.path
                    key={`chroma-coral-${morphTriggerKey}`}
                    d={previousShape.path}
                    initial={{ x: 10, y: 6, opacity: 0.7, scale: 1 }}
                    animate={{ x: 0, y: 0, opacity: 0, scale: 1.06 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    fill="none"
                    stroke="#FB7185"
                    strokeWidth="2"
                    style={{ mixBlendMode: 'screen', transformOrigin: '150px 150px' }}
                  />
                </>
              )}

              {/* 3. The Main Shape with Elastic Inertia Wobble (Permanently Mounted for Frame-Perfect Morph) */}
              <motion.g
                animate={wobbleControls}
                style={{ transformOrigin: '150px 150px' }}
              >
                {/* The Butter-Smooth Liquid Morphing Path */}
                <motion.path
                  animate={{ d: activeShape.path }}
                  transition={{
                    d: {
                      type: 'spring',
                      stiffness: activeSpring.stiffness,
                      damping: activeSpring.damping
                    }
                  }}
                  fill="url(#activeShapeGrad)"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter="url(#shapeSoftGlow)"
                  className="cursor-pointer"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                />

                {/* Optional 16-Vertex Node Markers */}
                {showVertices &&
                  activeShape.pts.map((pt, idx) => (
                    <motion.g key={idx}>
                      <motion.circle
                        animate={{ cx: pt[0], cy: pt[1] }}
                        transition={{
                          type: 'spring',
                          stiffness: activeSpring.stiffness,
                          damping: activeSpring.damping
                        }}
                        r="4"
                        fill="#FFFFFF"
                        stroke={activePalette.accent}
                        strokeWidth="2"
                      />
                      <motion.circle
                        animate={{ cx: pt[0], cy: pt[1] }}
                        transition={{
                          type: 'spring',
                          stiffness: activeSpring.stiffness,
                          damping: activeSpring.damping
                        }}
                        r="9"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="0.75"
                        opacity="0.4"
                      />
                    </motion.g>
                  ))}

                {/* Center Monogram & Typography */}
                <g className="pointer-events-none select-none">
                  <text
                    x="150"
                    y="152"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    className="font-display font-black text-2xl tracking-widest drop-shadow-md"
                  >
                    CP
                  </text>
                  <text
                    x="150"
                    y="172"
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.75)"
                    className="font-mono text-[9px] uppercase tracking-widest"
                  >
                    {activeShape.label}
                  </text>
                </g>
              </motion.g>
            </svg>

            {/* Telemetry Card */}
            <div className="absolute bottom-4 left-4 z-20 p-3.5 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 text-white max-w-xs space-y-1.5 shadow-2xl pointer-events-none">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">16-Vertex Coordinate Path</span>
                <span className="text-[10px] font-mono text-stone-400">{activeSpring.label}</span>
              </div>
              <p className="text-xs font-mono text-stone-200 bg-white/5 px-2 py-1 rounded border border-white/5 truncate">
                {activeShape.formula}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Gradient:</span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-stone-300">
                  {activePalette.stops.map((hex, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: hex }} />
                      {hex}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Morph Pipeline Badge: Current Shape ➔ Next Shape */}
            <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-stone-300 text-xs font-mono flex items-center gap-2 shadow-lg">
              <span className="text-cyan-400 font-bold">{previousShape ? previousShape.label : activeShape.label}</span>
              <span className="text-stone-400 animate-pulse">➔</span>
              <span className="text-white font-bold">{activeShape.label}</span>
              <span className="text-[10px] text-stone-400 bg-white/10 px-2 py-0.5 rounded-full ml-1">Deforming</span>
            </div>

            {/* Corner Status Badge */}
            <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-stone-300 text-[10px] font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              SPRING TWEEN ENGINE • 16 VERTEX MORPH
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: CAD BLUEPRINT VECTOR */}
      {activeMode === 'blueprint' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setDrawKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-stone-200 text-xs font-semibold text-[#174849] hover:bg-stone-100 hover:border-stone-300 transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <IconReload className="w-3.5 h-3.5 text-[#266F71]" />
                Replay Vector Draw
              </button>

              <button
                onClick={() => setIsScanning((s) => !s)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  isScanning
                    ? 'bg-[#266F71] text-white border-[#266F71] shadow-xs'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <IconRadar className="w-3.5 h-3.5" />
                LiDAR Scanner: {isScanning ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-500">Theme:</span>
              <div className="flex gap-1.5">
                {[
                  { id: 'cad', label: 'Cyberspace CAD', bg: 'bg-[#00E5FF]' },
                  { id: 'emerald', label: 'Emerald Luxury', bg: 'bg-[#14B8A6]' },
                  { id: 'minimal', label: 'Monochrome', bg: 'bg-stone-200' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    title={t.label}
                    className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                      theme === t.id ? 'border-[#174849] scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${t.bg}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`relative w-full rounded-2xl ${currentTheme.bg} ${currentTheme.border} ${currentTheme.glow} border overflow-hidden transition-colors duration-500 aspect-[16/10] sm:aspect-[21/10] flex items-center justify-center`}
          >
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="cadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" className={currentTheme.grid} strokeWidth="1" />
                    <circle cx="40" cy="40" r="1.5" className={currentTheme.grid} fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cadGrid)" />
              </svg>
            </div>

            {isScanning && (
              <motion.div
                key={`scanner-${drawKey}`}
                animate={{ y: ['-10%', '110%'] }}
                transition={{ duration: 4.5, ease: 'linear', repeat: Infinity }}
                className={`absolute inset-x-0 h-28 bg-gradient-to-b ${currentTheme.scanColor} pointer-events-none z-10 border-b border-cyan-400/40`}
              />
            )}

            <svg
              key={drawKey}
              viewBox="0 0 600 420"
              className="w-full h-full max-w-[860px] p-4 select-none relative z-20"
            >
              <defs>
                <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 1.8, duration: 0.8 }}
                className="font-mono text-[9px] fill-stone-400 select-none"
              >
                <line x1="100" y1="60" x2="520" y2="60" stroke={currentTheme.accentStroke} strokeWidth="1" strokeDasharray="3 3" />
                <path d="M 100 55 L 100 65 M 520 55 L 520 65" stroke={currentTheme.accentStroke} strokeWidth="1.5" />
                <text x="310" y="52" textAnchor="middle" fill={currentTheme.accentStroke} fontWeight="bold">38.40 METERS TOTAL EXTENT</text>

                <line x1="70" y1="90" x2="70" y2="390" stroke={currentTheme.accentStroke} strokeWidth="1" strokeDasharray="3 3" />
                <path d="M 65 90 L 75 90 M 65 390 L 75 390" stroke={currentTheme.accentStroke} strokeWidth="1.5" />
                <text x="55" y="245" textAnchor="middle" transform="rotate(-90 55 245)" fill={currentTheme.accentStroke} fontWeight="bold">24.20 METERS</text>
              </motion.g>

              {zones.map((zone) => {
                const isHovered = activeZone?.id === zone.id;
                return (
                  <motion.rect
                    key={zone.id}
                    x={zone.x}
                    y={zone.y}
                    width={zone.w}
                    height={zone.h}
                    rx="8"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: isHovered ? 0.25 : 0.05,
                      fill: currentTheme.wallStroke
                    }}
                    transition={{ duration: 0.3 }}
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveZone(zone)}
                    onMouseLeave={() => setActiveZone(null)}
                  />
                );
              })}

              <motion.path
                d="M 110 90 L 510 90 L 510 260 L 530 260 L 530 380 L 360 380 L 360 390 L 110 390 Z"
                fill="none"
                stroke={currentTheme.wallStroke}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#vectorGlow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 2.4, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.2 }
                }}
              />

              <motion.path
                d="M 330 90 L 330 260 L 510 260 M 330 260 L 110 260 M 360 260 L 360 380 M 230 260 L 230 390"
                fill="none"
                stroke={currentTheme.subStroke}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.9 }}
                transition={{
                  pathLength: { delay: 0.8, duration: 2.0, ease: [0.16, 1, 0.3, 1] },
                  opacity: { delay: 0.8, duration: 0.3 }
                }}
              />

              <motion.path
                d="M 110 260 Q 70 325 110 390"
                fill="none"
                stroke={currentTheme.accentStroke}
                strokeWidth="2.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1.4, duration: 1.6, ease: 'easeInOut' }}
              />

              <motion.g
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 0.8 }}
              >
                <rect
                  x="380"
                  y="280"
                  width="130"
                  height="85"
                  rx="6"
                  fill="none"
                  stroke={currentTheme.accentStroke}
                  strokeWidth="1.5"
                />
                {[0, 1, 2, 3].map((idx) => (
                  <motion.path
                    key={idx}
                    d={`M 395 ${300 + idx * 16} Q 445 ${295 + idx * 16} 495 ${300 + idx * 16}`}
                    fill="none"
                    stroke={currentTheme.accentStroke}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    animate={{
                      d: [
                        `M 395 ${300 + idx * 16} Q 445 ${295 + idx * 16} 495 ${300 + idx * 16}`,
                        `M 395 ${300 + idx * 16} Q 445 ${305 + idx * 16} 495 ${300 + idx * 16}`,
                        `M 395 ${300 + idx * 16} Q 445 ${295 + idx * 16} 495 ${300 + idx * 16}`
                      ]
                    }}
                    transition={{ duration: 3 + idx * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ))}
              </motion.g>

              {[
                { cx: 110, cy: 90 },
                { cx: 330, cy: 90 },
                { cx: 510, cy: 90 },
                { cx: 110, cy: 260 },
                { cx: 330, cy: 260 },
                { cx: 510, cy: 260 },
                { cx: 110, cy: 390 },
                { cx: 360, cy: 390 },
                { cx: 530, cy: 380 }
              ].map((pin, i) => (
                <motion.g key={i}>
                  <motion.circle
                    cx={pin.cx}
                    cy={pin.cy}
                    r="4"
                    fill={currentTheme.wallStroke}
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  />
                  <motion.circle
                    cx={pin.cx}
                    cy={pin.cy}
                    r="10"
                    fill="none"
                    stroke={currentTheme.wallStroke}
                    strokeWidth="1"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.8, 2.2] }}
                    transition={{ delay: 1.5 + i * 0.2, duration: 2.5, repeat: Infinity }}
                  />
                </motion.g>
              ))}

              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0, duration: 0.6 }}
                className="font-sans text-[10px] font-bold tracking-wider pointer-events-none uppercase"
              >
                <text x="210" y="195" textAnchor="middle" fill="#FFFFFF">Sky Atrium</text>
                <text x="420" y="170" textAnchor="middle" fill="#FFFFFF">Master Suite</text>
                <text x="220" y="325" textAnchor="middle" fill="#FFFFFF">Cantilever Terrace</text>
                <text x="445" y="325" textAnchor="middle" fill="#FFFFFF">Lap Pool</text>
              </motion.g>
            </svg>

            <AnimatePresence>
              {activeZone && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="absolute bottom-6 left-6 z-30 p-4 rounded-xl bg-black/80 backdrop-blur-xl border border-white/20 text-white shadow-2xl pointer-events-none flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                    <IconBuildingSkyscraper className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-semibold">Active Zone Inspection</span>
                    <h5 className="text-sm font-bold">{activeZone.name}</h5>
                    <p className="text-xs text-stone-300 font-mono mt-0.5">Floor Area: <span className="text-white font-bold">{activeZone.area}</span></p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-stone-300 text-[10px] font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              SVG RENDERING ENGINE • LIVE PATH VECTOR
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: SPLINE & SHAPE MORPHER */}
      {activeMode === 'morph' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-stone-600 mr-1">Shape Pattern:</span>
              {[
                { id: 'blob', label: 'Liquid Droplet' },
                { id: 'crystal', label: 'Kinetic Crystal' },
                { id: 'gyro', label: 'Orbital Gyroscope' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setMorphShape(s.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    morphShape === s.id
                      ? 'bg-[#174849] text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRotating((r) => !r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isRotating
                    ? 'bg-[#266F71] text-white border-[#266F71]'
                    : 'bg-white text-stone-600 border-stone-200'
                }`}
              >
                Rotation: {isRotating ? 'Active' : 'Paused'}
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-500">Speed:</span>
                {['slow', 'normal', 'fast'].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setGradientSpeed(spd)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase cursor-pointer ${
                      gradientSpeed === spd
                        ? 'bg-stone-800 text-white font-bold'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {spd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            onMouseMove={handleMouseMove}
            className="relative w-full rounded-2xl bg-gradient-to-br from-[#0B0C0A] via-[#121A1A] to-[#0A1616] border border-stone-800 aspect-[16/10] sm:aspect-[21/10] overflow-hidden flex items-center justify-center cursor-crosshair shadow-[0_0_60px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(38,111,113,0.25),transparent_70%)] pointer-events-none" />

            {morphShape === 'blob' && (
              <motion.div
                animate={{
                  x: mousePos.x,
                  y: mousePos.y,
                  rotate: isRotating ? 360 : 0
                }}
                transition={{
                  rotate: {
                    duration: gradientSpeed === 'fast' ? 8 : gradientSpeed === 'slow' ? 24 : 14,
                    repeat: Infinity,
                    ease: 'linear'
                  },
                  x: { type: 'spring', damping: 20, stiffness: 150 },
                  y: { type: 'spring', damping: 20, stiffness: 150 }
                }}
                className="relative w-72 h-72 sm:w-88 sm:h-88 flex items-center justify-center"
              >
                <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_0_40px_rgba(20,184,166,0.35)]">
                  <defs>
                    <linearGradient id="blobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#14B8A6" />
                      <stop offset="50%" stopColor="#266F71" />
                      <stop offset="100%" stopColor="#F4A261" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    animate={{
                      d: [
                        'M 100 20 C 145 20 180 55 180 100 C 180 145 140 180 100 180 C 55 180 20 140 20 100 C 20 60 55 20 100 20 Z',
                        'M 100 15 C 160 30 185 70 175 120 C 165 170 130 185 85 175 C 40 165 15 130 25 80 C 35 30 60 10 100 15 Z',
                        'M 100 30 C 150 10 190 60 170 110 C 150 160 120 190 70 170 C 20 150 10 90 40 50 C 70 10 70 40 100 30 Z',
                        'M 100 20 C 145 20 180 55 180 100 C 180 145 140 180 100 180 C 55 180 20 140 20 100 C 20 60 55 20 100 20 Z'
                      ]
                    }}
                    transition={{
                      duration: gradientSpeed === 'fast' ? 4 : gradientSpeed === 'slow' ? 12 : 7,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    fill="url(#blobGrad)"
                    fillOpacity="0.85"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </svg>

                <motion.div
                  animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-inner"
                />
              </motion.div>
            )}

            {morphShape === 'crystal' && (
              <motion.div
                animate={{
                  rotate: isRotating ? [0, 180, 360] : 0,
                  scale: [1, 1.05, 0.98, 1]
                }}
                transition={{
                  rotate: { duration: 16, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' }
                }}
                className="relative w-72 h-72 sm:w-80 sm:h-80"
              >
                <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_0_35px_rgba(0,229,255,0.4)]">
                  <defs>
                    <linearGradient id="crystalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  <motion.polygon
                    points="100,20 170,60 170,140 100,180 30,140 30,60"
                    fill="url(#crystalGrad)"
                    stroke="#00E5FF"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                  />

                  <motion.path
                    d="M 100 20 L 100 180 M 30 60 L 170 140 M 30 140 L 170 60"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    animate={{ strokeDashoffset: [0, 40] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  />

                  <polygon
                    points="100,50 145,130 55,130"
                    fill="rgba(255,255,255,0.1)"
                    stroke="#F4A261"
                    strokeWidth="2"
                  />
                </svg>
              </motion.div>
            )}

            {morphShape === 'gyro' && (
              <div className="relative w-72 h-72 sm:w-84 sm:h-84 flex items-center justify-center">
                {[
                  { size: 'w-72 h-72', duration: 12, border: 'border-cyan-400', dash: 'border-dashed' },
                  { size: 'w-56 h-56', duration: 8, border: 'border-emerald-400', dash: 'border-dotted' },
                  { size: 'w-40 h-40', duration: 5, border: 'border-amber-400', dash: 'border-solid' }
                ].map((ring, idx) => (
                  <motion.div
                    key={idx}
                    animate={{
                      rotateX: [0, 180, 360],
                      rotateY: [0, 360],
                      rotateZ: isRotating ? 360 : 0
                    }}
                    transition={{
                      duration: ring.duration,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className={`absolute ${ring.size} rounded-full border-2 ${ring.border} ${ring.dash} opacity-80 shadow-[0_0_20px_rgba(20,184,166,0.3)]`}
                  />
                ))}

                <motion.div
                  animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-300 shadow-[0_0_30px_#00E5FF]"
                />
              </div>
            )}

            <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-cyan-400">
              SPRING ATTRACTOR: X={mousePos.x.toFixed(0)}px Y={mousePos.y.toFixed(0)}px
            </div>
          </div>
        </div>
      )}

      {/* Code Snippet & Integration Reference */}
      <div className="p-6 sm:p-8 bg-stone-50 border-t border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#174849] uppercase tracking-wider">
            <IconCode className="w-4 h-4 text-[#266F71]" />
            {activeMode === 'transitions' ? 'Unified 16-Vertex SVG Path Morphing & Spring Physics' : 'Framer Motion Path Length Drawing Pattern'}
          </div>
          <button
            onClick={handleCopySnippet}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-all shadow-2xs cursor-pointer"
          >
            {copied ? (
              <>
                <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <IconCopy className="w-3.5 h-3.5 text-stone-500" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-[#0B0C0A] text-stone-200 font-mono text-xs overflow-x-auto border border-stone-800 leading-relaxed">
          <code>
            {activeMode === 'transitions'
              ? `// Unified 16-Vertex Liquid Morphing with Framer Motion
<svg viewBox="0 0 300 300" className="w-72 h-72">
  <defs>
    <linearGradient id="morphGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <motion.stop offset="0%" animate={{ stopColor: "${activePalette.stops[0]}" }} transition={{ duration: 0.8 }} />
      <motion.stop offset="50%" animate={{ stopColor: "${activePalette.stops[1]}" }} transition={{ duration: 0.8 }} />
      <motion.stop offset="100%" animate={{ stopColor: "${activePalette.stops[2]}" }} transition={{ duration: 0.8 }} />
    </linearGradient>
  </defs>
  <motion.path
    animate={{ d: "${activeShape.path}" }}
    transition={{
      type: "spring",
      stiffness: ${activeSpring.stiffness},
      damping: ${activeSpring.damping}
    }}
    fill="url(#morphGrad)"
    stroke="#FFFFFF"
    strokeWidth="2.5"
  />
</svg>`
              : `// 1. Kinetic SVG Path Drawing (stroke-dashoffset spring transition)
<motion.path
  d="M 110 90 L 510 90 L 510 260 L 530 260 L 530 380 Z"
  initial={{ pathLength: 0, opacity: 0 }}
  animate={{ pathLength: 1, opacity: 1 }}
  transition={{
    pathLength: { duration: 2.4, ease: [0.16, 1, 0.3, 1] },
    opacity: { duration: 0.2 }
  }}
  stroke="#00E5FF"
  strokeWidth={3}
  fill="none"
/>`}
          </code>
        </pre>
      </div>
    </div>
  );
}
