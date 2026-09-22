import React, { useState, useRef, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconReload,
  IconSparkles,
  IconLayersSubtract,
  IconCamera,
  IconAdjustmentsHorizontal,
  IconCode,
  IconCheck,
  IconCopy,
  IconCompass,
  IconEye,
  IconEyeOff,
  IconVectorBezier2,
  IconPhoto,
  IconStack2,
  IconTexture
} from '@tabler/icons-react';

// Photographic Layer Assets (Cleaned Plate & Textured Master Plate)
import cleanHeroPlate from '../../sandbox/assets/hero-dahlia-cleaned.jpg';
import texturedHeroPlate from '../../sandbox/assets/hero-dahlia-texture-pro.jpg';
import layerSkyPng from '../../sandbox/assets/parallax/layer-sky.png';
import layerHousePng from '../../sandbox/assets/parallax/layer-house.png';
import layerGateLeftPng from '../../sandbox/assets/parallax/layer-gate-left.png';
import layerGateRightPng from '../../sandbox/assets/parallax/layer-gate-right.png';
import layerThresholdLeftPng from '../../sandbox/assets/parallax/layer-threshold-left.png';
import layerThresholdRightPng from '../../sandbox/assets/parallax/layer-threshold-right.png';
import layerHeadlightBloomPng from '../../sandbox/assets/parallax/layer-headlight-bloom.png';

// Scalable Vector SVG Cutout Layer Assets (with Nano Banana Pro Shaders)
import layer0SkySvg from '../../sandbox/assets/parallax/svg/layer-0-sky.svg';
import layer1VillasSvg from '../../sandbox/assets/parallax/svg/layer-1-background-villas.svg';
import layer2MainVillaSvg from '../../sandbox/assets/parallax/svg/layer-2-main-villa.svg';
import layer3GatesSvg from '../../sandbox/assets/parallax/svg/layer-3-gate-perimeter.svg';
import layer4PalmsSvg from '../../sandbox/assets/parallax/svg/layer-4-tropical-palms.svg';
import layer5DrivewaySvg from '../../sandbox/assets/parallax/svg/layer-5-cobblestone-driveway.svg';

const MODES = [
  {
    id: 'zoom',
    name: 'Parallax Zoom',
    subtitle: 'Concentric Focal Push-In',
    formula: 'ΔX = d_layer · (p - 0.15), Scale = 1 + s_layer · p',
    desc: 'Simulates camera dolly movement toward a focal vanishing point. Foreground driveway scales rapidly (2.5x) and sweeps past camera, gates split outward, while the central villa zooms into sharp focus (1.45x) and celestial sky stays anchored (1.06x).'
  },
  {
    id: 'pan',
    name: 'Parallax Pan',
    subtitle: 'Differential Velocity Multipliers',
    formula: 'ΔX = V_multiplier · ΔPan (Driveway: 1.0x, Palms: 0.85x, Gates: 0.65x, Villa: 0.45x, Sky: 0.08x)',
    desc: 'Simulates horizontal camera panning across 6 spatial planes. Near layers translate at full velocity while distant background sky moves at fractional velocity (0.08x), creating realistic depth and scale.'
  },
  {
    id: 'arc',
    name: 'Parallax Arc',
    subtitle: 'Counter-Directional Motion',
    formula: 'Foreground ΔX > 0 (Orbit) ⟷ Background ΔX < 0 (Counter-Drift)',
    desc: 'The signature anime camera orbit technique. As the camera arcs around the property, foreground driveway and palms sweep with the camera while the background sky counter-drifts in the opposing direction.'
  }
];

export default function AnimeParallaxShowcase() {
  const [activeMode, setActiveMode] = useState('zoom');
  const [engineMode, setEngineMode] = useState('svg'); // 'svg' | 'photo'
  const [scrubProgress, setScrubProgress] = useState(0); // 0 to 1
  const [isPlaying, setIsPlaying] = useState(false);
  const [enableTilt, setEnableTilt] = useState(true);
  const [enableBlur, setEnableBlur] = useState(true);
  const [enableNanoTexture, setEnableNanoTexture] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Individual Layer Visibility Toggles (Comp Switcher)
  const [layerVisibility, setLayerVisibility] = useState({
    sky: true,
    villas: true,
    mainVilla: true,
    gates: true,
    palms: true,
    driveway: true
  });

  const toggleLayer = (layerKey) => {
    setLayerVisibility((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  // Mouse position for tilt
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const springConfig = { stiffness: 140, damping: 20 };
  const smoothMouseX = useSpring(mouse.x, springConfig);
  const smoothMouseY = useSpring(mouse.y, springConfig);

  const rotateY = useTransform(smoothMouseX, [-1, 1], enableTilt ? [-3.5, 3.5] : [0, 0]);
  const rotateX = useTransform(smoothMouseY, [-1, 1], enableTilt ? [3, -3] : [0, 0]);

  // Auto-play scrub loop
  useEffect(() => {
    let animId;
    if (isPlaying) {
      let direction = 1;
      const step = () => {
        setScrubProgress((prev) => {
          let next = prev + 0.006 * direction;
          if (next >= 1) {
            next = 1;
            direction = -1;
          } else if (next <= 0) {
            next = 0;
            direction = 1;
          }
          return next;
        });
        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  const handleMouseMove = (e) => {
    if (!enableTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMouse({ x, y });
  };

  const handleMouseLeave = () => {
    setMouse({ x: 0, y: 0 });
  };

  // Calculate transforms across 6 spatial planes
  const p = scrubProgress; // 0.0 to 1.0

  let transforms = {
    sky: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
    villas: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
    mainVilla: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
    gates: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
    palms: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
    driveway: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 }
  };

  if (activeMode === 'zoom') {
    // 1. Concentric Parallax Zoom (Focal Origin: 48% 54%)
    transforms.sky = {
      x: 0,
      y: -30 * p,
      scale: 1 + 0.06 * p,
      blur: 0,
      opacity: 1
    };
    transforms.villas = {
      x: 0,
      y: -32 * p,
      scale: 1 + 0.22 * p,
      blur: 0,
      opacity: 1
    };
    transforms.mainVilla = {
      x: 0,
      y: -35 * p,
      scale: 1 + 0.45 * p,
      blur: 0,
      opacity: 1
    };
    transforms.gates = {
      x: 0,
      y: -10 * p,
      scale: 1 + 0.95 * p,
      blur: 0,
      opacity: Math.max(0, 1 - p * 1.5)
    };
    transforms.palms = {
      x: 0,
      y: 15 * p,
      scale: 1 + 1.25 * p,
      blur: enableBlur ? 4 * p : 0,
      opacity: Math.max(0, 1 - p * 1.8)
    };
    transforms.driveway = {
      x: 0,
      y: 95 * p,
      scale: 1 + 1.6 * p,
      blur: enableBlur ? 8 * p : 0,
      opacity: Math.max(0, 1 - p * 2.2)
    };
  } else if (activeMode === 'pan') {
    // 2. Parallax Pan (Differential velocity multipliers across 6 planes)
    const panOffset = (p - 0.5) * 400; // -200px to +200px
    transforms.sky = { x: panOffset * 0.08, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.villas = { x: panOffset * 0.25, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.mainVilla = { x: panOffset * 0.45, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.gates = { x: panOffset * 0.65, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.palms = { x: panOffset * 0.85, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.driveway = { x: panOffset * 1.00, y: 0, scale: 1.05, blur: 0, opacity: 1 };
  } else if (activeMode === 'arc') {
    // 3. Parallax Arc (Counter-directional orbital shift)
    const orbit = (p - 0.5) * 350; // -175px to +175px
    transforms.sky = { x: -orbit * 0.25, y: 0, scale: 1.08, blur: 0, opacity: 1 };
    transforms.villas = { x: orbit * 0.15, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.mainVilla = { x: orbit * 0.35, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.gates = { x: orbit * 0.65, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.palms = { x: orbit * 0.95, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.driveway = { x: orbit * 1.20, y: 0, scale: 1.05, blur: 0, opacity: 1 };
  }

  const handleCopyCode = () => {
    const active = MODES.find((m) => m.id === activeMode);
    const snippet = `// Anime 2.5D Multi-Plane Parallax - ${active.name} (${engineMode.toUpperCase()} Engine)
// Nano Banana Pro Shaders: ${enableNanoTexture ? 'ACTIVE (Tactile FeTurbulence & Specular)' : 'INACTIVE'}
const transforms = {
  driveway:  { x: ${(transforms.driveway.x).toFixed(1)}, scale: ${(transforms.driveway.scale).toFixed(2)}, blur: ${(transforms.driveway.blur).toFixed(1)} },
  palms:     { x: ${(transforms.palms.x).toFixed(1)}, scale: ${(transforms.palms.scale).toFixed(2)} },
  gates:     { x: ${(transforms.gates.x).toFixed(1)}, scale: ${(transforms.gates.scale).toFixed(2)} },
  mainVilla: { y: ${(transforms.mainVilla.y).toFixed(1)}, scale: ${(transforms.mainVilla.scale).toFixed(2)} },
  villas:    { y: ${(transforms.villas.y).toFixed(1)}, scale: ${(transforms.villas.scale).toFixed(2)} },
  sky:       { y: ${(transforms.sky.y).toFixed(1)}, scale: ${(transforms.sky.scale).toFixed(2)} }
};`;
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeModeData = MODES.find((m) => m.id === activeMode) || MODES[0];

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 mb-3">
            <IconSparkles className="w-3.5 h-3.5 text-emerald-600" />
            After Effects 2.5D Anime Methodology • Nano Banana Pro Textures
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#174849] tracking-tight">
            Anime Multi-Layer Parallax Lab <span className="text-[#266F71] font-normal text-xl">(Zoom • Pan • Arc)</span>
          </h2>
          <p className="text-sm text-stone-600 mt-2 max-w-3xl leading-relaxed">
            Multi-plane depth translation based on mclelun's After Effects 2D animation principles, enhanced with <strong>Nano Banana Pro</strong> tactile micro-textures: chiseled ledger stone, organic cedar grain, damp cobblestone specular sheen, and ribbed traveler's palm fibers.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex p-1 rounded-xl bg-stone-200/70 border border-stone-300/60 shadow-xs self-start md:self-auto">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all uppercase cursor-pointer ${
                activeMode === mode.id
                  ? 'bg-[#174849] text-white shadow-sm'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-300/50'
              }`}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* Engine Switcher Bar & Layer Solo Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-stone-100 border border-stone-200/80 shadow-2xs">
        {/* Render Engine Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
              Pipeline:
            </span>
            <div className="inline-flex p-0.5 rounded-lg bg-stone-200 border border-stone-300">
              <button
                onClick={() => setEngineMode('svg')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  engineMode === 'svg'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                <IconVectorBezier2 size={14} />
                <span>Vector SVG</span>
              </button>
              <button
                onClick={() => setEngineMode('photo')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  engineMode === 'photo'
                    ? 'bg-[#174849] text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                <IconPhoto size={14} />
                <span>Photo 2.5D</span>
              </button>
            </div>
          </div>

          {/* Nano Banana Pro Texture Toggle Button */}
          <button
            onClick={() => setEnableNanoTexture(!enableNanoTexture)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
              enableNanoTexture
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 shadow-xs'
                : 'bg-stone-200 border-stone-300 text-stone-500'
            }`}
          >
            <IconTexture size={14} className={enableNanoTexture ? 'text-amber-600 animate-pulse' : 'text-stone-400'} />
            <span>Nano Banana Pro</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              enableNanoTexture ? 'bg-amber-600 text-white' : 'bg-stone-300 text-stone-600'
            }`}>
              {enableNanoTexture ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Layer Visibility Solo Controls (Comp Switcher) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-mono text-stone-500 mr-1 hidden sm:inline">Layers:</span>
          {[
            { id: 'sky', label: 'Sky' },
            { id: 'villas', label: 'Villas' },
            { id: 'mainVilla', label: 'Main Villa' },
            { id: 'gates', label: 'Gates' },
            { id: 'palms', label: 'Palms' },
            { id: 'driveway', label: 'Driveway' }
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer.id)}
              aria-label={`Toggle ${layer.label}`}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer ${
                layerVisibility[layer.id]
                  ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                  : 'bg-stone-200/80 text-stone-400 border border-stone-300/80 line-through'
              }`}
            >
              {layerVisibility[layer.id] ? <IconEye size={12} /> : <IconEyeOff size={12} />}
              <span>{layer.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Visual Viewport + Metric Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 16:9 Viewport & Playback Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-stone-800 bg-[#071313] shadow-2xl flex items-center justify-center select-none perspective-[1200px] ${
              enableNanoTexture ? 'ring-1 ring-amber-500/20' : ''
            }`}
          >
            <motion.div
              style={{
                rotateY,
                rotateX,
                transformStyle: 'preserve-3d'
              }}
              className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
                enableNanoTexture ? 'filter contrast-[1.04] saturate-[1.05]' : ''
              }`}
            >
              {/* ======================================================== */}
              {/* PIPELINE 1: PURE SCALABLE VECTOR SVG CUTOUT ENGINE       */}
              {/* ======================================================== */}
              {engineMode === 'svg' && (
                <>
                  {/* Layer 0: Celestial Sky */}
                  {layerVisibility.sky && (
                    <motion.div
                      style={{
                        x: transforms.sky.x,
                        y: transforms.sky.y,
                        scale: transforms.sky.scale,
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[1] pointer-events-none transform-gpu"
                    >
                      <img src={layer0SkySvg} alt="Vector Celestial Sky Layer" className="w-full h-full object-cover" />
                    </motion.div>
                  )}

                  {/* Layer 1: Background Flanking Villas */}
                  {layerVisibility.villas && (
                    <motion.div
                      style={{
                        x: transforms.villas.x,
                        y: transforms.villas.y,
                        scale: transforms.villas.scale,
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[2] pointer-events-none transform-gpu"
                    >
                      <img src={layer1VillasSvg} alt="Vector Background Villas Layer" className="w-full h-full object-cover" />
                    </motion.div>
                  )}

                  {/* Layer 2: Central Luxury Villa */}
                  {layerVisibility.mainVilla && (
                    <motion.div
                      style={{
                        x: transforms.mainVilla.x,
                        y: transforms.mainVilla.y,
                        scale: transforms.mainVilla.scale,
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[3] pointer-events-none transform-gpu"
                    >
                      <img src={layer2MainVillaSvg} alt="Vector Main Villa Layer" className="w-full h-full object-cover" />
                    </motion.div>
                  )}

                  {/* Layer 3: Perimeter Gates & Entrance Fence */}
                  {layerVisibility.gates && (
                    <motion.div
                      style={{
                        x: activeMode === 'zoom' ? -180 * p : transforms.gates.x,
                        y: transforms.gates.y,
                        scale: transforms.gates.scale,
                        opacity: transforms.gates.opacity,
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[4] pointer-events-none transform-gpu"
                    >
                      <img src={layer3GatesSvg} alt="Vector Gates Layer" className="w-full h-full object-cover" />
                    </motion.div>
                  )}

                  {/* Layer 4: Tropical Palms & Landscape Foliage */}
                  {layerVisibility.palms && (
                    <motion.div
                      style={{
                        x: activeMode === 'zoom' ? 140 * p : transforms.palms.x,
                        y: transforms.palms.y,
                        scale: transforms.palms.scale,
                        opacity: transforms.palms.opacity,
                        filter: transforms.palms.blur > 0 ? `blur(${transforms.palms.blur}px)` : 'none',
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[5] pointer-events-none transform-gpu"
                    >
                      <img src={layer4PalmsSvg} alt="Vector Palms Layer" className="w-full h-full object-cover" />
                    </motion.div>
                  )}

                  {/* Layer 5: Foreground Cobblestone Driveway & Sedan */}
                  {layerVisibility.driveway && (
                    <motion.div
                      style={{
                        x: transforms.driveway.x,
                        y: transforms.driveway.y,
                        scale: transforms.driveway.scale,
                        opacity: transforms.driveway.opacity,
                        filter: transforms.driveway.blur > 0 ? `blur(${transforms.driveway.blur}px)` : 'none',
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[6] pointer-events-none transform-gpu"
                    >
                      <img src={layer5DrivewaySvg} alt="Vector Driveway Layer" className="w-full h-full object-cover" />
                    </motion.div>
                  )}
                </>
              )}

              {/* ======================================================== */}
              {/* PIPELINE 2: PHOTOGRAPHIC 2.5D COMPOSITE ENGINE          */}
              {/* ======================================================== */}
              {engineMode === 'photo' && (
                <>
                  {/* Photo Sky */}
                  {layerVisibility.sky && (
                    <motion.div
                      style={{
                        x: transforms.sky.x,
                        y: transforms.sky.y,
                        scale: transforms.sky.scale,
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[1] pointer-events-none transform-gpu"
                    >
                      <img
                        src={enableNanoTexture ? texturedHeroPlate : layerSkyPng}
                        alt="Celestial Sky Layer"
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}

                  {/* Photo House */}
                  {layerVisibility.mainVilla && (
                    <motion.div
                      style={{
                        x: transforms.mainVilla.x,
                        y: transforms.mainVilla.y,
                        scale: transforms.mainVilla.scale,
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[2] pointer-events-none transform-gpu"
                    >
                      <img
                        src={enableNanoTexture ? texturedHeroPlate : layerHousePng}
                        alt="Dahlia Estate House Layer"
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  )}

                  {/* Headlight Bloom */}
                  <motion.div
                    style={{
                      x: transforms.mainVilla.x,
                      y: transforms.mainVilla.y,
                      scale: transforms.mainVilla.scale,
                      transformOrigin: '48% 54%'
                    }}
                    className="absolute inset-0 w-full h-full z-[2] pointer-events-none mix-blend-screen opacity-70 transform-gpu"
                  >
                    <img src={layerHeadlightBloomPng} alt="Automotive Bloom Layer" className="w-full h-full object-cover" />
                  </motion.div>

                  {/* Photo Gate Left */}
                  {layerVisibility.gates && (
                    <motion.div
                      style={{
                        x: activeMode === 'zoom' ? -320 * Math.max(0, p - 0.15) * 1.5 : transforms.gates.x,
                        y: transforms.gates.y,
                        scale: transforms.gates.scale,
                        opacity: transforms.gates.opacity,
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[3] pointer-events-none transform-gpu"
                    >
                      <img src={layerGateLeftPng} alt="Gatepost Left" className="w-full h-full object-cover" />
                    </motion.div>
                  )}

                  {/* Photo Gate Right */}
                  {layerVisibility.gates && (
                    <motion.div
                      style={{
                        x: activeMode === 'zoom' ? 320 * Math.max(0, p - 0.15) * 1.5 : transforms.gates.x,
                        y: transforms.gates.y,
                        scale: transforms.gates.scale,
                        opacity: transforms.gates.opacity,
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[3] pointer-events-none transform-gpu"
                    >
                      <img src={layerGateRightPng} alt="Gatepost Right" className="w-full h-full object-cover" />
                    </motion.div>
                  )}

                  {/* Foreground Driveway / Threshold Left */}
                  {layerVisibility.driveway && (
                    <motion.div
                      style={{
                        x: activeMode === 'zoom' ? -380 * p : transforms.driveway.x,
                        y: activeMode === 'zoom' ? 90 * p : transforms.driveway.y,
                        scale: transforms.driveway.scale,
                        opacity: transforms.driveway.opacity,
                        filter: transforms.driveway.blur > 0 ? `blur(${transforms.driveway.blur}px)` : 'none',
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[5] pointer-events-none transform-gpu"
                    >
                      <img src={layerThresholdLeftPng} alt="Foreground Threshold Left" className="w-full h-full object-cover" />
                    </motion.div>
                  )}

                  {/* Foreground Driveway / Threshold Right */}
                  {layerVisibility.driveway && (
                    <motion.div
                      style={{
                        x: activeMode === 'zoom' ? 380 * p : transforms.driveway.x,
                        y: activeMode === 'zoom' ? 70 * p : transforms.driveway.y,
                        scale: transforms.driveway.scale,
                        opacity: transforms.driveway.opacity,
                        filter: transforms.driveway.blur > 0 ? `blur(${transforms.driveway.blur}px)` : 'none',
                        transformOrigin: '48% 54%'
                      }}
                      className="absolute inset-0 w-full h-full z-[5] pointer-events-none transform-gpu"
                    >
                      <img src={layerThresholdRightPng} alt="Foreground Threshold Right" className="w-full h-full object-cover" />
                    </motion.div>
                  )}
                </>
              )}

              {/* HUD Badge Overlay */}
              <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-lg border border-white/15 text-[11px] font-mono text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  {engineMode === 'svg' ? 'VECTOR SVG (6 PLANES)' : 'PHOTO 2.5D (CLEAN)'} • MODE: {activeMode.toUpperCase()} • TIMELINE: {(p * 100).toFixed(0)}%
                </span>
              </div>

              {/* Nano Texture Status Badge */}
              {enableNanoTexture && (
                <div className="absolute top-4 right-4 z-20 px-2.5 py-1 bg-amber-500/20 backdrop-blur-md rounded-lg border border-amber-500/40 text-[10px] font-mono text-amber-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Tactile Material Shaders Active</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Interactive Timeline Scrub Bar & Toggles */}
          <div className="p-4 rounded-xl bg-stone-900 text-white border border-stone-800 flex flex-col sm:flex-row items-center gap-4 shadow-md">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center justify-center font-bold cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
              </button>

              <button
                onClick={() => { setScrubProgress(0); setIsPlaying(false); }}
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center cursor-pointer"
                aria-label="Reset"
              >
                <IconReload size={18} />
              </button>
            </div>

            <div className="flex-1 w-full flex items-center gap-3">
              <span className="text-[11px] font-mono text-stone-400">0%</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={scrubProgress}
                onChange={(e) => {
                  setScrubProgress(parseFloat(e.target.value));
                  setIsPlaying(false);
                }}
                className="flex-1 accent-emerald-400 h-2 bg-white/10 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-emerald-400 font-bold min-w-[35px]">
                {(p * 100).toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <label className="flex items-center gap-2 cursor-pointer text-stone-300 select-none">
                <input
                  type="checkbox"
                  checked={enableTilt}
                  onChange={(e) => setEnableTilt(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>3D Tilt</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-300 select-none">
                <input
                  type="checkbox"
                  checked={enableBlur}
                  onChange={(e) => setEnableBlur(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>DoF Blur</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Theoretical Breakdown & Live Metrics Inspector */}
        <div className="flex flex-col gap-4">
          {/* Active Mode Concept Card */}
          <div className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#266F71] font-mono text-xs font-bold uppercase tracking-wider">
                <IconCamera size={16} />
                <span>{activeModeData.subtitle}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-bold">
                {engineMode === 'svg' ? '6-Plane Scalable Vector SVG Engine' : 'Photographic Composite'}
              </span>
            </div>
            <h3 className="text-xl font-bold font-display text-[#174849]">
              {activeModeData.name}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {activeModeData.desc}
            </p>
            <div className="p-2.5 rounded-lg bg-stone-100 border border-stone-200 text-[11px] font-mono text-[#174849]">
              <span className="font-semibold text-emerald-700">Formula: </span>
              {activeModeData.formula}
            </div>
          </div>

          {/* Nano Banana Pro Tactile Texture Breakdown Card */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-2xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-900 uppercase">
                <IconTexture size={15} className="text-amber-600" />
                <span>Nano Banana Pro Texture Shaders</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold">
                TACTILE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="p-1.5 rounded bg-white border border-amber-200/70">
                <div className="text-amber-800 font-bold">Ledger Stone</div>
                <div className="text-stone-500">feTurbulence (f=0.045)</div>
              </div>
              <div className="p-1.5 rounded bg-white border border-amber-200/70">
                <div className="text-amber-800 font-bold">Cedar Grain</div>
                <div className="text-stone-500">Anisotropic (0.015×0.22)</div>
              </div>
              <div className="p-1.5 rounded bg-white border border-amber-200/70">
                <div className="text-amber-800 font-bold">Wet Cobble</div>
                <div className="text-stone-500">Specular Diffuse Light</div>
              </div>
              <div className="p-1.5 rounded bg-white border border-amber-200/70">
                <div className="text-amber-800 font-bold">Palm Fronds</div>
                <div className="text-stone-500">Ribbed Leaf Veins</div>
              </div>
            </div>
          </div>

          {/* Real-time Layer Math Inspector (All 6 Planes) */}
          <div className="p-5 rounded-2xl bg-[#091515] text-white border border-stone-800 shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-stone-300">
                <IconAdjustmentsHorizontal size={16} className="text-emerald-400" />
                <span>6-Plane Layer Metrics</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                LIVE FEED
              </span>
            </div>

            <div className="flex flex-col gap-1.5 font-mono text-[10px]">
              {/* Driveway */}
              <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center">
                <span className="text-stone-400">L5 Cobblestone Driveway</span>
                <span className="text-emerald-400 font-bold">
                  ΔX: {transforms.driveway.x.toFixed(0)}px • S: {transforms.driveway.scale.toFixed(2)}x
                </span>
              </div>

              {/* Palms */}
              <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center">
                <span className="text-stone-400">L4 Tropical Palms</span>
                <span className="text-emerald-300 font-bold">
                  ΔX: {transforms.palms.x.toFixed(0)}px • S: {transforms.palms.scale.toFixed(2)}x
                </span>
              </div>

              {/* Gates */}
              <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center">
                <span className="text-stone-400">L3 Perimeter Gates</span>
                <span className="text-teal-300 font-bold">
                  ΔX: {transforms.gates.x.toFixed(0)}px • S: {transforms.gates.scale.toFixed(2)}x
                </span>
              </div>

              {/* Main Villa */}
              <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center">
                <span className="text-stone-400">L2 Central Villa</span>
                <span className="text-cyan-300 font-bold">
                  ΔY: {transforms.mainVilla.y.toFixed(0)}px • S: {transforms.mainVilla.scale.toFixed(2)}x
                </span>
              </div>

              {/* Background Villas */}
              <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center">
                <span className="text-stone-400">L1 Background Villas</span>
                <span className="text-blue-300 font-bold">
                  ΔY: {transforms.villas.y.toFixed(0)}px • S: {transforms.villas.scale.toFixed(2)}x
                </span>
              </div>

              {/* Sky */}
              <div className="p-2 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center">
                <span className="text-stone-400">L0 Celestial Sky</span>
                <span className="text-purple-300 font-bold">
                  ΔY: {transforms.sky.y.toFixed(0)}px • S: {transforms.sky.scale.toFixed(2)}x
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] font-mono text-stone-400">
              <span>Vanishing Point: 48% 54%</span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                {copiedCode ? <IconCheck size={12} /> : <IconCopy size={12} />}
                <span>{copiedCode ? 'Copied' : 'Copy Values'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
