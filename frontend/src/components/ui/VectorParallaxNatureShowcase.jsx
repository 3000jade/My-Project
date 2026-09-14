import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  IconMountain,
  IconTrees,
  IconPaw,
  IconEye,
  IconEyeOff,
  IconAdjustmentsHorizontal,
  IconPlayerPlay,
  IconPlayerPause,
  IconDownload,
  IconSparkles,
  IconRefresh,
  IconLayersLinked,
  IconCheck,
  IconCopy,
  IconLayersSubtract,
  IconInfoCircle,
  IconCompass,
  IconGauge,
  IconCode,
  IconMaximize
} from '@tabler/icons-react';

import vectorMountainsBg from '../../assets/vector_mountains_bg.jpg';
import vectorHillsMidground from '../../assets/vector_hills_midground.png';
import vectorAnimalsForeground from '../../assets/vector_animals_foreground.png';
import vectorAnimalsIsolated from '../../assets/vector_animals_isolated.png';

export default function VectorParallaxNatureShowcase() {
  const containerRef = useRef(null);
  const [interactiveScrub, setInteractiveScrub] = useState(0.5);
  const [controlMode, setControlMode] = useState('scroll'); // 'scroll' | 'manual' | 'auto'
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [showInspector, setShowInspector] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeAssetTab, setActiveAssetTab] = useState('all');

  // Layer visibility toggles
  const [layersVisible, setLayersVisible] = useState({
    mountains: true,
    hills: true,
    animals: true,
    isolatedAnimals: true,
  });

  // Track page scroll on container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Layer Parallax Transforms for scroll mode:
  // Requirement:
  // 1. Mountains move slowest (rate: 0.25x)
  // 2. Rolling green hills move at medium speed (rate: 0.65x)
  // 3. Animals & foreground move at normal speed (rate: 1.0x)
  const mountainScrollY = useTransform(scrollYProgress, [0, 1], ['-8%', '12%']);
  const hillsScrollY = useTransform(scrollYProgress, [0, 1], ['-20%', '30%']);
  const animalsScrollY = useTransform(scrollYProgress, [0, 1], ['-32%', '50%']);

  // Manual scrub offsets based on interactiveScrub (0 to 1)
  const manualMountainY = (interactiveScrub - 0.5) * 40 * speedMultiplier;
  const manualHillsY = (interactiveScrub - 0.5) * 95 * speedMultiplier;
  const manualAnimalsY = (interactiveScrub - 0.5) * 160 * speedMultiplier;

  // Auto-play loop when auto mode is engaged
  useEffect(() => {
    let animationFrameId;
    let direction = 1;
    let current = interactiveScrub;

    if (controlMode === 'auto' && isPlayingAuto) {
      const step = () => {
        current += 0.003 * direction;
        if (current >= 0.98) {
          current = 0.98;
          direction = -1;
        } else if (current <= 0.02) {
          current = 0.02;
          direction = 1;
        }
        setInteractiveScrub(current);
        animationFrameId = requestAnimationFrame(step);
      };
      animationFrameId = requestAnimationFrame(step);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [controlMode, isPlayingAuto]);

  const toggleLayer = (key) => {
    setLayersVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyCode = () => {
    const code = `// Multi-Layered Parallax with Framer Motion
import { motion, useScroll, useTransform } from 'framer-motion';

const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });

// Velocity calibration:
const mountainY = useTransform(scrollYProgress, [0, 1], ['-8%', '12%']);  // Slowest
const hillsY = useTransform(scrollYProgress, [0, 1], ['-20%', '30%']);   // Medium
const animalsY = useTransform(scrollYProgress, [0, 1], ['-32%', '50%']); // Normal`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Asset specs for inspector
  const assets = [
    {
      id: 'mountains',
      title: 'Image 1: Distant Mountains (Background)',
      src: vectorMountainsBg,
      speed: 'Slowest (0.25x)',
      depth: 'Z: -300px',
      type: 'RGB Panorama',
      description: 'Atmospheric layers of lavender and soft blue mountain ridges with dawn gradient sky. Calibrated as anchor.',
    },
    {
      id: 'hills',
      title: 'Image 2: Rolling Green Hills (Midground)',
      src: vectorHillsMidground,
      speed: 'Medium (0.65x)',
      depth: 'Z: -120px',
      type: 'Transparent RGBA PNG',
      description: 'Lush undulating sage hills punctuated with pine silhouettes and subtle atmospheric fog horizon.',
    },
    {
      id: 'animals',
      title: 'Image 3: Woodland Animals (Foreground)',
      src: vectorAnimalsForeground,
      speed: 'Normal (1.00x)',
      depth: 'Z: 0px',
      type: 'Transparent RGBA PNG',
      description: 'Detailed grassy ridge, woodland pine silhouettes, and majestic stag deer & fox standing alert.',
    },
    {
      id: 'isolated',
      title: 'Bonus Sprite: Woodland Animals Silhouette',
      src: vectorAnimalsIsolated,
      speed: 'Dynamic Micro-Parallax',
      depth: 'Z: +40px',
      type: 'Cropped RGBA Asset',
      description: 'Direct transparent cutout of the woodland stag and alert fox for independent positioning and micro-animations.',
    },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-semibold mb-2 border border-emerald-200">
              <IconMountain className="w-3.5 h-3.5 text-[#266F71]" />
              Flat Layered Vector Parallax • 3-Tier Velocity Physics
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-[#174849]">
              Multi-Layered Vector Parallax Stage
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
              Three separate vector assets engineered with consistent lighting, color harmony, and camera perspective.
              Parallax physics calibrated with strict velocity differentials: <strong>Mountains move slowest</strong>, <strong>Rolling hills at medium speed</strong>, and <strong>Woodland animals at normal scrolling speed</strong>.
            </p>
          </div>

          {/* Action Buttons: Workspace Rule #6 compliant (h-[54px]) */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowInspector(!showInspector)}
              className="h-[54px] px-5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-2 border bg-stone-50 hover:bg-stone-100 text-[#174849] border-stone-200 shadow-xs"
            >
              <IconLayersLinked className="w-4 h-4 text-[#266F71]" />
              {showInspector ? 'Hide Asset Inspector' : 'Inspect Layer Assets'}
            </button>

            <button
              onClick={handleCopyCode}
              className="h-[54px] px-5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-2 border bg-[#174849] text-white hover:bg-[#1f595b] shadow-xs"
            >
              {copiedCode ? <IconCheck className="w-4 h-4 text-emerald-300" /> : <IconCode className="w-4 h-4" />}
              {copiedCode ? 'Copied Physics!' : 'Copy Parallax Code'}
            </button>
          </div>
        </div>

        {/* Interactive Mode & Layer Toggles Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
          {/* Mode Switcher */}
          <div className="md:col-span-5 flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-stone-600 uppercase tracking-wider">Mode:</span>
            <div className="inline-flex p-1 bg-white rounded-xl border border-stone-200 shadow-2xs">
              <button
                onClick={() => { setControlMode('scroll'); setIsPlayingAuto(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  controlMode === 'scroll' ? 'bg-[#174849] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <IconCompass className="w-3.5 h-3.5" />
                Page Scroll
              </button>
              <button
                onClick={() => { setControlMode('manual'); setIsPlayingAuto(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  controlMode === 'manual' ? 'bg-[#174849] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <IconAdjustmentsHorizontal className="w-3.5 h-3.5" />
                Scrub Slider
              </button>
              <button
                onClick={() => {
                  setControlMode('auto');
                  setIsPlayingAuto(!isPlayingAuto);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  controlMode === 'auto' && isPlayingAuto ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {isPlayingAuto ? <IconPlayerPause className="w-3.5 h-3.5" /> : <IconPlayerPlay className="w-3.5 h-3.5" />}
                {isPlayingAuto ? 'Pause Auto' : 'Auto Tour'}
              </button>
            </div>
          </div>

          {/* Layer Visibility Pills */}
          <div className="md:col-span-7 flex items-center gap-2 flex-wrap justify-start md:justify-end">
            <span className="text-xs font-mono font-bold text-stone-600 uppercase tracking-wider">Layers:</span>
            <button
              onClick={() => toggleLayer('mountains')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 border ${
                layersVisible.mountains
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                  : 'bg-stone-100 text-stone-400 border-stone-200 line-through'
              }`}
            >
              <IconMountain className="w-3 h-3" />
              L1: Mountains (Slow)
            </button>

            <button
              onClick={() => toggleLayer('hills')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 border ${
                layersVisible.hills
                  ? 'bg-teal-50 text-teal-800 border-teal-300 font-semibold'
                  : 'bg-stone-100 text-stone-400 border-stone-200 line-through'
              }`}
            >
              <IconTrees className="w-3 h-3" />
              L2: Hills (Medium)
            </button>

            <button
              onClick={() => toggleLayer('animals')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 border ${
                layersVisible.animals
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                  : 'bg-stone-100 text-stone-400 border-stone-200 line-through'
              }`}
            >
              <IconPaw className="w-3 h-3" />
              L3: Animals (Normal)
            </button>
          </div>
        </div>

        {/* Manual Scrub Controls Bar (when in manual or auto mode) */}
        {controlMode !== 'scroll' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex flex-col sm:flex-row items-center gap-4 justify-between"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-mono font-bold text-amber-900 flex items-center gap-1.5">
                <IconGauge className="w-4 h-4 text-amber-700" />
                Scrub Position: {Math.round(interactiveScrub * 100)}%
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={interactiveScrub}
                onChange={(e) => {
                  setInteractiveScrub(parseFloat(e.target.value));
                  if (controlMode === 'auto') setIsPlayingAuto(false);
                }}
                className="w-48 sm:w-64 accent-[#174849] cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-stone-600">Intensity:</span>
              {[0.5, 1, 1.5].map((mult) => (
                <button
                  key={mult}
                  onClick={() => setSpeedMultiplier(mult)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    speedMultiplier === mult
                      ? 'bg-[#174849] text-white'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* MAIN PARALLAX STAGE (PINNED SCENIC VIEWPORT) */}
      <div
        ref={containerRef}
        className="relative w-full h-[620px] sm:h-[720px] rounded-3xl overflow-hidden border border-stone-300 shadow-2xl bg-[#D6E3E9] select-none"
      >
        {/* Layer 0: Subtle Morning Dawn Glow Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5E6E8] via-[#E8ECEF] to-[#CAD9DD] pointer-events-none" />

        {/* LAYER 1: DISTANT MOUNTAINS (MOVES SLOWEST - 0.25x) */}
        {layersVisible.mountains && (
          <motion.div
            className="absolute inset-0 w-full h-[125%] -top-[12%] pointer-events-none"
            style={{
              y: controlMode === 'scroll' ? mountainScrollY : `${manualMountainY}px`,
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          >
            <img
              src={vectorMountainsBg}
              alt="Layer 1 - Distant Mountains"
              className="w-full h-full object-cover object-bottom"
            />
          </motion.div>
        )}

        {/* LAYER 2: ROLLING GREEN HILLS (MOVES MEDIUM - 0.65x) */}
        {layersVisible.hills && (
          <motion.div
            className="absolute inset-0 w-full h-[135%] -top-[20%] pointer-events-none"
            style={{
              y: controlMode === 'scroll' ? hillsScrollY : `${manualHillsY}px`,
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          >
            <img
              src={vectorHillsMidground}
              alt="Layer 2 - Rolling Green Hills"
              className="w-full h-full object-cover object-bottom"
            />
          </motion.div>
        )}

        {/* LAYER 3: FOREGROUND WOODLAND ANIMALS & RIDGE (MOVES NORMAL - 1.00x) */}
        {layersVisible.animals && (
          <motion.div
            className="absolute inset-0 w-full h-[145%] -top-[28%] pointer-events-none"
            style={{
              y: controlMode === 'scroll' ? animalsScrollY : `${manualAnimalsY}px`,
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          >
            <img
              src={vectorAnimalsForeground}
              alt="Layer 3 - Foreground Animals & Pines"
              className="w-full h-full object-cover object-bottom"
            />
          </motion.div>
        )}

        {/* FLOATING TELEMETRY HUD (Top-Right) */}
        <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md text-white p-4 rounded-2xl border border-white/20 shadow-xl space-y-2.5 max-w-xs pointer-events-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[11px] font-mono tracking-widest text-emerald-300 font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Telemetry HUD
            </span>
            <span className="text-[10px] font-mono text-white/60">
              {controlMode === 'scroll' ? 'Scroll Active' : 'Manual Scrub'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            {/* L1 Telemetry */}
            <div className="flex items-center justify-between text-stone-200">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                L1 Mountains:
              </span>
              <span className="font-bold text-indigo-200">0.25x (Slowest)</span>
            </div>

            {/* L2 Telemetry */}
            <div className="flex items-center justify-between text-stone-200">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                L2 Green Hills:
              </span>
              <span className="font-bold text-teal-200">0.65x (Medium)</span>
            </div>

            {/* L3 Telemetry */}
            <div className="flex items-center justify-between text-stone-200">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                L3 Animals Ridge:
              </span>
              <span className="font-bold text-amber-200">1.00x (Normal)</span>
            </div>
          </div>
        </div>

        {/* SCENIC HERO OVERLAY CAPTION (Bottom-Left) */}
        <div className="absolute bottom-6 left-6 z-20 max-w-md bg-white/85 backdrop-blur-md p-5 rounded-2xl border border-white/40 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#266F71] mb-1">
            <IconSparkles className="w-3.5 h-3.5" />
            Nano Banana Pro Vector Suite
          </div>
          <h4 className="text-xl font-bold font-display text-[#174849] leading-tight">
            Highland Morning Solitude
          </h4>
          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
            Crafted with harmonized palettes: soft lavender mountain ridges, sage rolling pastures, and dark purple silhouettes of the woodland stag and alert fox.
          </p>
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-stone-200/60">
            <span className="text-[10px] font-mono text-stone-500">Speed Ratio:</span>
            <span className="text-[10px] font-mono bg-stone-200/70 text-stone-800 px-2 py-0.5 rounded font-bold">
              1 : 2.6 : 4.0
            </span>
          </div>
        </div>

        {/* VIGNETTE GRADIENT FOR CINEMATIC DEPTH */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.15)] rounded-3xl" />
      </div>

      {/* ASSET INSPECTOR MODAL / EXPANDABLE DRAWER */}
      <AnimatePresence>
        {showInspector && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-lg space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-[#266F71] tracking-wider">
                  Asset Dissection & Transparency Verification
                </span>
                <h4 className="text-xl font-bold font-display text-[#174849]">
                  Individual Vector Layer Assets
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Verify how the 3 distinct vector assets seamlessly align with identical perspective, lighting, and palette.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                {['all', 'mountains', 'hills', 'animals', 'isolated'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveAssetTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer ${
                      activeAssetTab === tab
                        ? 'bg-white text-[#174849] font-bold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {assets
                .filter((a) => activeAssetTab === 'all' || a.id === activeAssetTab)
                .map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Preview with Checkerboard for Transparency */}
                      <div
                        className="w-full h-44 rounded-xl overflow-hidden border border-stone-200 relative flex items-center justify-center"
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                          backgroundColor: '#f9fafb',
                        }}
                      >
                        <img
                          src={asset.src}
                          alt={asset.title}
                          className="w-full h-full object-contain"
                        />
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 text-white backdrop-blur-sm">
                          {asset.type}
                        </span>
                      </div>

                      {/* Details */}
                      <h5 className="font-bold text-sm text-[#174849] mt-3">{asset.title}</h5>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">{asset.description}</p>
                    </div>

                    <div className="pt-3 border-t border-stone-200 flex items-center justify-between text-xs font-mono">
                      <span className="text-stone-500">Parallax Speed:</span>
                      <span className="font-bold text-[#266F71]">{asset.speed}</span>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
