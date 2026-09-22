import { useState, useRef, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconReload,
  IconSparkles,
  IconLayersSubtract,
  IconCamera,
  IconEye,
  IconAdjustmentsHorizontal
} from '@tabler/icons-react';

// Layer Assets
import layerSky from './assets/parallax/layer-sky.png';
import layerHouse from './assets/parallax/layer-house.png';
import layerGateLeft from './assets/parallax/layer-gate-left.png';
import layerGateRight from './assets/parallax/layer-gate-right.png';
import layerThresholdLeft from './assets/parallax/layer-threshold-left.png';
import layerThresholdRight from './assets/parallax/layer-threshold-right.png';
import layerHeadlightBloom from './assets/parallax/layer-headlight-bloom.png';

const MODES = [
  {
    id: 'zoom',
    name: 'Parallax Zoom',
    subtitle: 'Concentric Focal Push-In',
    desc: 'Simulates camera dolly movement toward a focal vanishing point. Foreground scales up rapidly (2.4x) and diverges outward, while midground scales moderately (1.35x) and background sky stays anchored (1.05x).'
  },
  {
    id: 'pan',
    name: 'Parallax Pan',
    subtitle: 'Differential Velocity Multipliers',
    desc: 'Simulates horizontal/vertical camera panning. Closer layers move at maximum speed (1.0x velocity), midground moves at 0.35x, and distant background moves at 0.08x to establish depth.'
  },
  {
    id: 'arc',
    name: 'Parallax Arc',
    subtitle: 'Counter-Directional Motion',
    desc: 'The signature anime camera orbit. As the camera arcs around the subject, foreground flora glides in one direction while background horizon hills and clouds shift in the opposing direction.'
  }
];

export default function ParallaxLabPage() {
  const [activeMode, setActiveMode] = useState('zoom');
  const [scrubProgress, setScrubProgress] = useState(0); // 0 to 1
  const [isPlaying, setIsPlaying] = useState(false);
  const [enableTilt, setEnableTilt] = useState(true);
  const [enableBlur, setEnableBlur] = useState(true);

  // Mouse position for tilt
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const springConfig = { stiffness: 140, damping: 20 };
  const smoothMouseX = useSpring(mouse.x, springConfig);
  const smoothMouseY = useSpring(mouse.y, springConfig);

  const rotateY = useTransform(smoothMouseX, [-1, 1], enableTilt ? [-3, 3] : [0, 0]);
  const rotateX = useTransform(smoothMouseY, [-1, 1], enableTilt ? [2.5, -2.5] : [0, 0]);

  // Auto-play loop
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

  // Calculate transforms for each mode
  const p = scrubProgress; // 0.0 to 1.0

  let transforms = {
    sky: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
    house: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
    gateLeft: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
    gateRight: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
    threshLeft: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 },
    threshRight: { x: 0, y: 0, scale: 1, blur: 0, opacity: 1 }
  };

  if (activeMode === 'zoom') {
    // 1. CONCENTRIC PARALLAX ZOOM (Focal Origin: 48% 54%)
    transforms.sky = {
      x: 0,
      y: -30 * p,
      scale: 1 + 0.06 * p,
      blur: 0,
      opacity: 1
    };
    transforms.house = {
      x: 0,
      y: -35 * p,
      scale: 1 + 0.45 * p,
      blur: 0,
      opacity: 1
    };
    transforms.gateLeft = {
      x: -320 * Math.max(0, p - 0.15) * 1.5,
      y: 0,
      scale: 1 + 0.9 * p,
      blur: 0,
      opacity: Math.max(0, 1 - p * 1.6)
    };
    transforms.gateRight = {
      x: 320 * Math.max(0, p - 0.15) * 1.5,
      y: 0,
      scale: 1 + 0.9 * p,
      blur: 0,
      opacity: Math.max(0, 1 - p * 1.6)
    };
    transforms.threshLeft = {
      x: -380 * p,
      y: 90 * p,
      scale: 1 + 1.5 * p,
      blur: enableBlur ? 8 * p : 0,
      opacity: Math.max(0, 1 - p * 2.2)
    };
    transforms.threshRight = {
      x: 380 * p,
      y: 70 * p,
      scale: 1 + 1.5 * p,
      blur: enableBlur ? 8 * p : 0,
      opacity: Math.max(0, 1 - p * 2.2)
    };
  } else if (activeMode === 'pan') {
    // 2. PARALLAX PAN (Linear velocity multipliers: FG: 1.0x, Gate: 0.6x, House: 0.35x, Sky: 0.08x)
    const panOffset = (p - 0.5) * 400; // -200px to +200px
    transforms.sky = { x: panOffset * 0.08, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.house = { x: panOffset * 0.35, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.gateLeft = { x: panOffset * 0.6, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.gateRight = { x: panOffset * 0.6, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.threshLeft = { x: panOffset * 1.0, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.threshRight = { x: panOffset * 1.0, y: 0, scale: 1.05, blur: 0, opacity: 1 };
  } else if (activeMode === 'arc') {
    // 3. PARALLAX ARC (Counter-Directional Orbital Shift)
    const orbit = (p - 0.5) * 350; // -175px to +175px
    // Foreground moves in direction of pan, background moves in OPPOSITE direction
    transforms.sky = { x: -orbit * 0.25, y: 0, scale: 1.08, blur: 0, opacity: 1 };
    transforms.house = { x: orbit * 0.15, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.gateLeft = { x: orbit * 0.55, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.gateRight = { x: orbit * 0.55, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.threshLeft = { x: orbit * 1.15, y: 0, scale: 1.05, blur: 0, opacity: 1 };
    transforms.threshRight = { x: orbit * 1.15, y: 0, scale: 1.05, blur: 0, opacity: 1 };
  }

  return (
    <div className="min-h-screen bg-[#070b0b] text-white p-6 md:p-10 flex flex-col items-center">
      {/* Top Header */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-3">
            <IconSparkles size={14} />
            <span>After Effects 2D/2.5D Translation Lab</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-white">
            Anime Parallax <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Motion Lab</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-xl font-sans">
            Testing the 3 core animation techniques from mclelun's After Effects tutorial: Pan, Zoom, and Arc.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider transition-all uppercase ${
                activeMode === mode.id
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Viewport & Stage */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Visual Stage (2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 bg-[#071313] shadow-2xl flex items-center justify-center select-none perspective-[1200px]"
          >
            <motion.div
              style={{
                rotateY,
                rotateX,
                transformStyle: 'preserve-3d'
              }}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
            >
              {/* Layer 4: Sky */}
              <motion.div
                style={{
                  x: transforms.sky.x,
                  y: transforms.sky.y,
                  scale: transforms.sky.scale,
                  transformOrigin: '48% 54%'
                }}
                className="absolute inset-0 w-full h-full z-[1] pointer-events-none transform-gpu"
              >
                <img src={layerSky} alt="Sky" className="w-full h-full object-cover" />
              </motion.div>

              {/* Layer 3: House */}
              <motion.div
                style={{
                  x: transforms.house.x,
                  y: transforms.house.y,
                  scale: transforms.house.scale,
                  transformOrigin: '48% 54%'
                }}
                className="absolute inset-0 w-full h-full z-[2] pointer-events-none transform-gpu"
              >
                <img src={layerHouse} alt="House" className="w-full h-full object-cover" />
              </motion.div>

              {/* Headlight Bloom */}
              <motion.div
                style={{
                  x: transforms.house.x,
                  y: transforms.house.y,
                  scale: transforms.house.scale,
                  transformOrigin: '48% 54%'
                }}
                className="absolute inset-0 w-full h-full z-[2] pointer-events-none mix-blend-screen opacity-70 transform-gpu"
              >
                <img src={layerHeadlightBloom} alt="Bloom" className="w-full h-full object-cover" />
              </motion.div>

              {/* Layer 2: Gate Left */}
              <motion.div
                style={{
                  x: transforms.gateLeft.x,
                  y: transforms.gateLeft.y,
                  scale: transforms.gateLeft.scale,
                  opacity: transforms.gateLeft.opacity,
                  transformOrigin: '48% 54%'
                }}
                className="absolute inset-0 w-full h-full z-[3] pointer-events-none transform-gpu"
              >
                <img src={layerGateLeft} alt="Gate Left" className="w-full h-full object-cover" />
              </motion.div>

              {/* Layer 2: Gate Right */}
              <motion.div
                style={{
                  x: transforms.gateRight.x,
                  y: transforms.gateRight.y,
                  scale: transforms.gateRight.scale,
                  opacity: transforms.gateRight.opacity,
                  transformOrigin: '48% 54%'
                }}
                className="absolute inset-0 w-full h-full z-[3] pointer-events-none transform-gpu"
              >
                <img src={layerGateRight} alt="Gate Right" className="w-full h-full object-cover" />
              </motion.div>

              {/* Layer 1: Threshold Left */}
              <motion.div
                style={{
                  x: transforms.threshLeft.x,
                  y: transforms.threshLeft.y,
                  scale: transforms.threshLeft.scale,
                  opacity: transforms.threshLeft.opacity,
                  filter: transforms.threshLeft.blur > 0 ? `blur(${transforms.threshLeft.blur}px)` : 'none',
                  transformOrigin: '48% 54%'
                }}
                className="absolute inset-0 w-full h-full z-[5] pointer-events-none transform-gpu"
              >
                <img src={layerThresholdLeft} alt="Threshold Left" className="w-full h-full object-cover" />
              </motion.div>

              {/* Layer 1: Threshold Right */}
              <motion.div
                style={{
                  x: transforms.threshRight.x,
                  y: transforms.threshRight.y,
                  scale: transforms.threshRight.scale,
                  opacity: transforms.threshRight.opacity,
                  filter: transforms.threshRight.blur > 0 ? `blur(${transforms.threshRight.blur}px)` : 'none',
                  transformOrigin: '48% 54%'
                }}
                className="absolute inset-0 w-full h-full z-[5] pointer-events-none transform-gpu"
              >
                <img src={layerThresholdRight} alt="Threshold Right" className="w-full h-full object-cover" />
              </motion.div>

              {/* On-stage HUD Watermark */}
              <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/15 text-[10px] font-mono text-emerald-400">
                MODE: {activeMode.toUpperCase()} • TIMELINE: {(p * 100).toFixed(0)}%
              </div>
            </motion.div>
          </div>

          {/* Interactive Scrub Bar & Controls */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center justify-center font-bold"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <IconPlayerPause size={18} /> : <IconPlayerPlay size={18} />}
            </button>

            <button
              onClick={() => { setScrubProgress(0); setIsPlaying(false); }}
              className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center"
              aria-label="Reset"
            >
              <IconReload size={18} />
            </button>

            <div className="flex-1 w-full flex items-center gap-3">
              <span className="text-[11px] font-mono text-gray-400">0%</span>
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
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {(p * 100).toFixed(0)}%
              </span>
            </div>

            {/* Toggle Toggles */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input
                  type="checkbox"
                  checked={enableTilt}
                  onChange={(e) => setEnableTilt(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>3D Tilt</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
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

        {/* Real-time Math Inspector & Theory (1 col) */}
        <div className="flex flex-col gap-6">
          {/* Active Mode Info */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <IconCamera size={16} />
              <span>{MODES.find(m => m.id === activeMode)?.subtitle}</span>
            </div>
            <h2 className="text-xl font-bold font-display text-white">
              {MODES.find(m => m.id === activeMode)?.name}
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              {MODES.find(m => m.id === activeMode)?.desc}
            </p>
          </div>

          {/* Real-time Layer Math Inspector */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-gray-300">
                <IconAdjustmentsHorizontal size={16} className="text-emerald-400" />
                <span>Real-Time Layer Metrics</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">LIVE FEED</span>
            </div>

            <div className="flex flex-col gap-2 font-mono text-[11px]">
              {/* Foreground Left */}
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center">
                <span className="text-gray-400">L1 Foreground</span>
                <span className="text-emerald-400 font-bold">
                  ΔX: {transforms.threshLeft.x.toFixed(0)}px • S: {transforms.threshLeft.scale.toFixed(2)}x
                </span>
              </div>

              {/* Gate Left */}
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center">
                <span className="text-gray-400">L2 Gatepost</span>
                <span className="text-teal-300 font-bold">
                  ΔX: {transforms.gateLeft.x.toFixed(0)}px • S: {transforms.gateLeft.scale.toFixed(2)}x
                </span>
              </div>

              {/* House */}
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center">
                <span className="text-gray-400">L3 Dream House</span>
                <span className="text-cyan-300 font-bold">
                  ΔY: {transforms.house.y.toFixed(0)}px • S: {transforms.house.scale.toFixed(2)}x
                </span>
              </div>

              {/* Sky */}
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex justify-between items-center">
                <span className="text-gray-400">L4 Celestial Sky</span>
                <span className="text-purple-300 font-bold">
                  ΔY: {transforms.sky.y.toFixed(0)}px • S: {transforms.sky.scale.toFixed(2)}x
                </span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-gray-500 pt-2 border-t border-white/10 flex justify-between">
              <span>Vanishing Point: 48% 54%</span>
              <span>GPU Accelerated</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
