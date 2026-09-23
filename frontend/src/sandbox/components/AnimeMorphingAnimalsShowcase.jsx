import React, { useState, useEffect, useRef } from 'react';
import { animate, morphTo, stagger, remove } from 'animejs';
import {
  IconPaw,
  IconPlayerPlay,
  IconPlayerPause,
  IconReload,
  IconPalette,
  IconCode,
  IconCheck,
  IconCopy,
  IconSparkles,
  IconGauge,
  IconEye,
  IconLayersSubtract,
  IconFlame
} from '@tabler/icons-react';

const ANIMAL_DATA = {
  eagle: {
    id: 'eagle',
    name: 'Soaring Eagle',
    realm: 'Sky Sovereign • Celestial Winds',
    stats: { wingspan: '2.4m', speed: '320 km/h', poise: 'Dominant' },
    // 32-point normalized coordinates centered in 300x300 viewBox
    path: 'M 150 65 L 175 95 L 205 85 L 235 80 L 265 85 L 275 105 L 255 125 L 280 135 L 260 155 L 285 170 L 255 185 L 225 180 L 200 200 L 175 225 L 160 250 L 150 235 L 140 250 L 125 225 L 100 200 L 75 180 L 45 185 L 15 170 L 40 155 L 20 135 L 45 125 L 25 105 L 35 85 L 65 80 L 95 85 L 125 95 Z'
  },
  stag: {
    id: 'stag',
    name: 'Imperial Stag',
    realm: 'Forest Monarch • Ancient Roots',
    stats: { height: '1.9m', antlers: '16 Points', poise: 'Regal' },
    path: 'M 150 120 L 165 105 L 155 75 L 175 50 L 195 65 L 210 40 L 225 55 L 245 35 L 235 70 L 255 80 L 240 100 L 220 95 L 210 115 L 180 140 L 190 195 L 180 245 L 165 255 L 150 245 L 135 255 L 120 245 L 110 195 L 120 140 L 90 115 L 80 95 L 60 100 L 45 80 L 65 70 L 55 35 L 75 55 L 90 40 L 105 65 L 125 50 L 145 75 L 135 105 Z'
  },
  panther: {
    id: 'panther',
    name: 'Shadow Panther',
    realm: 'Nocturnal Stalker • Silent Grace',
    stats: { agility: '98%', stealth: 'Absolute', poise: 'Lethal' },
    path: 'M 60 180 L 75 155 L 95 145 L 110 130 L 135 135 L 160 120 L 185 115 L 210 125 L 225 140 L 240 145 L 255 160 L 265 180 L 245 185 L 230 170 L 215 180 L 200 215 L 185 245 L 170 245 L 175 210 L 160 190 L 140 185 L 125 200 L 115 245 L 100 245 L 90 210 L 80 195 L 65 195 Z'
  },
  swan: {
    id: 'swan',
    name: 'Celestial Swan',
    realm: 'Limpid Waters • Ethereal Purity',
    stats: { grace: '100%', plumage: 'Silken', poise: 'Noble' },
    path: 'M 190 80 L 205 70 L 220 75 L 225 90 L 215 105 L 195 120 L 180 145 L 180 170 L 205 165 L 240 160 L 270 170 L 285 195 L 270 220 L 235 235 L 180 240 L 130 235 L 90 215 L 75 190 L 85 175 L 115 175 L 145 185 L 160 165 L 160 130 L 170 105 Z'
  },
  dolphin: {
    id: 'dolphin',
    name: 'Solar Dolphin',
    realm: 'Abyssal Navigator • Harmonic Waves',
    stats: { speed: '60 km/h', sonar: 'Precision', poise: 'Playful' },
    path: 'M 50 185 L 75 150 L 105 130 L 145 115 L 180 105 L 200 75 L 215 100 L 240 115 L 265 140 L 275 155 L 255 160 L 235 155 L 215 170 L 180 200 L 150 215 L 120 205 L 85 195 Z'
  }
};

const COLOR_PALETTES = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Aurora',
    stops: ['#174849', '#266F71', '#14B8A6'],
    stroke: '#2DD4BF',
    glow: 'rgba(45, 212, 191, 0.45)',
    particle: '#5EEAD4'
  },
  amber: {
    id: 'amber',
    name: 'Golden Sunburst',
    stops: ['#451A03', '#B45309', '#F59E0B'],
    stroke: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.45)',
    particle: '#FDE68A'
  },
  indigo: {
    id: 'indigo',
    name: 'Celestial Violet',
    stops: ['#1E1B4B', '#4F46E5', '#A855F7'],
    stroke: '#C084FC',
    glow: 'rgba(192, 132, 252, 0.45)',
    particle: '#E9D5FF'
  },
  crimson: {
    id: 'crimson',
    name: 'Imperial Rose',
    stops: ['#4C0519', '#BE123C', '#FB7185'],
    stroke: '#FDA4AF',
    glow: 'rgba(251, 113, 133, 0.45)',
    particle: '#FFE4E6'
  },
  cyan: {
    id: 'cyan',
    name: 'Neon Cyber',
    stops: ['#082F49', '#0284C7', '#38BDF8'],
    stroke: '#00F0FF',
    glow: 'rgba(0, 240, 255, 0.45)',
    particle: '#BAE6FD'
  }
};

const EASING_PRESETS = [
  { id: 'inOutCubic', label: 'Cubic Flow' },
  { id: 'outElastic', label: 'Elastic Bounce' },
  { id: 'outExpo', label: 'Snappy Expo' },
  { id: 'inOutQuad', label: 'Balanced Quad' }
];

export default function AnimeMorphingAnimalsShowcase() {
  const [activeAnimalKey, setActiveAnimalKey] = useState('eagle');
  const [previousAnimalKey, setPreviousAnimalKey] = useState('eagle');
  const [activePaletteKey, setActivePaletteKey] = useState('emerald');
  const [easing, setEasing] = useState('inOutCubic');
  const [morphDuration, setMorphDuration] = useState(1100);
  const [displayMode, setDisplayMode] = useState('hybrid'); // 'fill' | 'stroke' | 'hybrid'
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  // SVG references
  const containerRef = useRef(null);
  const visiblePathRef = useRef(null);
  const particlesRef = useRef(null);
  const isMorphingRef = useRef(false);

  const activeAnimal = ANIMAL_DATA[activeAnimalKey];
  const activePalette = COLOR_PALETTES[activePaletteKey];

  const handleSelectAnimal = (animalId) => {
    if (animalId === activeAnimalKey) return;
    setPreviousAnimalKey(activeAnimalKey);
    setActiveAnimalKey(animalId);
  };

  // Auto-play interval
  useEffect(() => {
    if (!isAutoPlaying) return;
    const keys = Object.keys(ANIMAL_DATA);

    const timer = setInterval(() => {
      setActiveAnimalKey((prev) => {
        setPreviousAnimalKey(prev);
        const nextIdx = (keys.indexOf(prev) + 1) % keys.length;
        return keys[nextIdx];
      });
    }, 3200);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  // Set initial path once on mount
  useEffect(() => {
    if (visiblePathRef.current && !visiblePathRef.current.getAttribute('d')) {
      visiblePathRef.current.setAttribute('d', ANIMAL_DATA.eagle.path);
    }
  }, []);

  // Execute Anime.js Path Morph whenever activeAnimalKey changes
  useEffect(() => {
    if (!visiblePathRef.current || !containerRef.current) return;
    const targetElement = containerRef.current.querySelector(`#target-${activeAnimalKey}`);
    if (!targetElement) return;

    // Ensure initial path exists in DOM
    if (!visiblePathRef.current.getAttribute('d')) {
      visiblePathRef.current.setAttribute('d', ANIMAL_DATA[activeAnimalKey].path);
      return;
    }

    isMorphingRef.current = true;

    // Remove any running animation on this element so it morphs seamlessly from its current state
    remove(visiblePathRef.current);

    // 1. Morph the SVG Path d attribute from CURRENT shape in DOM into TARGET shape
    const pathAnim = animate(visiblePathRef.current, {
      d: morphTo(targetElement, 0.28),
      ease: easing,
      duration: morphDuration,
      onComplete: () => {
        isMorphingRef.current = false;
      }
    });

    // 2. Animate Stagger Particles radiating outward on morph
    if (particlesRef.current) {
      const particles = particlesRef.current.querySelectorAll('.spirit-particle');
      animate(particles, {
        scale: [
          { value: 0.2, duration: 100 },
          { value: 1.4, duration: 400, ease: 'outQuad' },
          { value: 1, duration: 600, ease: 'outElastic(1, .6)' }
        ],
        opacity: [
          { value: 0.3, duration: 100 },
          { value: 1, duration: 350 },
          { value: 0.6, duration: 550 }
        ],
        delay: stagger(45, { from: 'center' })
      });
    }

    return () => {
      if (visiblePathRef.current) remove(visiblePathRef.current);
    };
  }, [activeAnimalKey, easing, morphDuration]);

  // Trigger kinetic stroke sketch
  const triggerStrokeSketch = () => {
    if (!visiblePathRef.current) return;
    const path = visiblePathRef.current;
    const length = path.getTotalLength ? path.getTotalLength() : 800;

    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    animate(path, {
      strokeDashoffset: [length, 0],
      duration: 1600,
      ease: 'inOutCubic'
    });
  };

  const handleCopyCode = () => {
    const code = `// Morphing Animals with Anime.js v4 & React
import React, { useEffect, useRef } from 'react';
import { animate, morphTo, remove } from 'animejs';

export function MorphingAnimal({ targetSelector }) {
  const pathRef = useRef(null);

  useEffect(() => {
    if (!pathRef.current) return;

    // Anime.js v4 morphTo dynamically resamples SVG curves
    const anim = animate(pathRef.current, {
      d: morphTo(targetSelector, 0.28),
      duration: 1200,
      ease: 'inOutCubic'
    });

    return () => remove(pathRef.current);
  }, [targetSelector]);

  return (
    <svg viewBox="0 0 300 300">
      <path ref={pathRef} fill="url(#animalGrad)" stroke="#2DD4BF" strokeWidth="2.5" />
    </svg>
  );
}`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate 16 circular particle orbit coordinates
  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 16;
    const r = 135;
    return {
      x: 150 + Math.round(r * Math.cos(angle)),
      y: 150 + Math.round(r * Math.sin(angle)),
      id: i
    };
  });

  return (
    <div
      ref={containerRef}
      className="w-full bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden text-[#174849]"
    >

      {/* Header Banner */}
      <div className="p-6 sm:p-8 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-b from-[#FBFBFA] to-white">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#266F71]/10 text-[#266F71] text-xs font-semibold uppercase tracking-wider mb-2">
            <IconPaw className="w-3.5 h-3.5 text-[#266F71]" />
            Anime.js v4 • Kinetic Vector Engine
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-[#174849]">
            Morphing Animal Silhouettes &amp; Fluid Mesh Interpolation
          </h3>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            Leveraging Anime.js <code className="bg-stone-100 px-1 py-0.5 rounded text-xs font-mono text-[#174849]">morphTo()</code> to dynamically resample and morph high-polygon SVG animal vectors with elastic eases and particle staggers.
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={triggerStrokeSketch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-stone-200 text-xs font-semibold text-[#174849] hover:bg-stone-100 hover:border-stone-300 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <IconReload className="w-3.5 h-3.5 text-[#266F71]" />
            Sketch Stroke
          </button>

          <button
            onClick={() => setIsAutoPlaying((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isAutoPlaying
                ? 'bg-amber-500 text-white shadow-md animate-pulse'
                : 'bg-[#174849] text-white hover:bg-[#266F71]'
            }`}
          >
            {isAutoPlaying ? <IconPlayerPause className="w-3.5 h-3.5" /> : <IconPlayerPlay className="w-3.5 h-3.5" />}
            {isAutoPlaying ? 'Auto-Morphing: ON' : 'Auto Cycle'}
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Controls Toolbar */}
        <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
          {/* Animal Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1.5">
                <IconPaw className="w-3.5 h-3.5 text-[#266F71]" /> Animal:
              </span>
              {Object.values(ANIMAL_DATA).map((animal) => (
                <button
                  key={animal.id}
                  onClick={() => handleSelectAnimal(animal.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeAnimalKey === animal.id
                      ? 'bg-[#174849] text-white shadow-sm scale-105'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {animal.name}
                </button>
              ))}
            </div>

            {/* View Mode (Fill, Stroke, Hybrid) */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200">
              {[
                { id: 'hybrid', label: 'Hologram Hybrid' },
                { id: 'fill', label: 'Solid Fill' },
                { id: 'stroke', label: 'Wireframe Stroke' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setDisplayMode(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    displayMode === m.id
                      ? 'bg-[#266F71] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Palette & Easing Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-stone-200/80">
            {/* Color Palette */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-1 flex items-center gap-1.5">
                <IconPalette className="w-3.5 h-3.5 text-[#266F71]" /> Colorway:
              </span>
              {Object.values(COLOR_PALETTES).map((pal) => (
                <button
                  key={pal.id}
                  onClick={() => setActivePaletteKey(pal.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePaletteKey === pal.id
                      ? 'bg-white ring-2 ring-[#174849] shadow-sm text-[#174849]'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 opacity-80'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-inner"
                    style={{ background: `linear-gradient(135deg, ${pal.stops[0]}, ${pal.stops[2]})` }}
                  />
                  {pal.name}
                </button>
              ))}
            </div>

            {/* Easing Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Easing:</span>
              <div className="flex gap-1">
                {EASING_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setEasing(preset.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      easing === preset.id
                        ? 'bg-[#174849] text-white shadow-2xs'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stage Canvas */}
        <div className="relative w-full rounded-2xl bg-gradient-to-br from-[#060A0A] via-[#0D1414] to-[#080D0E] border border-stone-800 aspect-[16/10] sm:aspect-[21/10] overflow-hidden flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          {/* Ambient Stage Glow */}
          <div
            className="absolute inset-0 transition-colors duration-1000 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${activePalette.glow}, transparent 70%)`
            }}
          />

          {/* Matrix Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />

          {/* Stagger Particle Ring */}
          <div ref={particlesRef} className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {particles.map((pt) => (
              <div
                key={pt.id}
                className="spirit-particle absolute w-2 h-2 rounded-full shadow-lg"
                style={{
                  left: `calc(50% + ${pt.x - 150}px)`,
                  top: `calc(50% + ${pt.y - 150}px)`,
                  backgroundColor: activePalette.particle,
                  boxShadow: `0 0 12px ${activePalette.particle}`
                }}
              />
            ))}
          </div>

          {/* The Master Anime.js Morphing SVG Canvas */}
          <svg
            viewBox="0 0 300 300"
            className="w-72 h-72 sm:w-92 sm:h-92 relative z-10 select-none overflow-visible"
          >
            <defs>
              <linearGradient id="animalGradientFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={activePalette.stops[0]} />
                <stop offset="50%" stopColor={activePalette.stops[1]} />
                <stop offset="100%" stopColor={activePalette.stops[2]} />
              </linearGradient>

              <filter id="animalAuraGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Target animal reference paths for Anime.js morphTo() */}
              {Object.entries(ANIMAL_DATA).map(([key, data]) => (
                <path key={key} id={`target-${key}`} d={data.path} />
              ))}
            </defs>

            {/* The Morphing Target Path: Untouched by React JSX diffing so Anime.js transforms from current DOM coordinates */}
            <path
              ref={visiblePathRef}
              fill={
                displayMode === 'stroke'
                  ? 'none'
                  : displayMode === 'hybrid'
                  ? 'url(#animalGradientFill)'
                  : 'url(#animalGradientFill)'
              }
              fillOpacity={displayMode === 'hybrid' ? '0.85' : '1'}
              stroke={displayMode === 'fill' ? 'none' : activePalette.stroke}
              strokeWidth={displayMode === 'stroke' ? '3' : '2.5'}
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#animalAuraGlow)"
              className="cursor-pointer"
            />
          </svg>

          {/* Morph Pipeline Badge: Current Animal ➔ Next Animal */}
          <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-stone-300 text-xs font-mono flex items-center gap-2 shadow-lg">
            <span className="text-amber-400 font-bold">{ANIMAL_DATA[previousAnimalKey]?.name || ANIMAL_DATA.eagle.name}</span>
            <span className="text-stone-400 animate-pulse">➔</span>
            <span className="text-white font-bold">{activeAnimal.name}</span>
            <span className="text-[10px] text-stone-400 bg-white/10 px-2 py-0.5 rounded-full ml-1">Deforming</span>
          </div>

          {/* Floating Telemetry & Lore Card */}
          <div className="absolute bottom-4 left-4 z-20 p-4 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 text-white max-w-xs space-y-2 shadow-2xl pointer-events-none">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-mono uppercase text-teal-400 font-bold">Anime.js Path Vector</span>
              <span className="text-[10px] font-mono text-stone-400">{easing}</span>
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight text-white">{activeAnimal.name}</h4>
              <p className="text-[11px] text-stone-300 font-mono mt-0.5">{activeAnimal.realm}</p>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-white/10 text-[10px] font-mono text-stone-300">
              {Object.entries(activeAnimal.stats).map(([k, v]) => (
                <div key={k}>
                  <span className="text-stone-400 uppercase text-[9px] block">{k}</span>
                  <span className="text-teal-300 font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engine Status Callout */}
          <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 text-stone-300 text-[10px] font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            ANIME.JS V4 • MORPHTO() ENGINE
          </div>
        </div>

        {/* Code Snippet */}
        <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#174849] uppercase tracking-wider">
              <IconCode className="w-4 h-4 text-[#266F71]" />
              Anime.js v4 Path Morphing Pattern
            </div>
            <button
              onClick={handleCopyCode}
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
            <code>{`// Anime.js v4 SVG Path Morphing with React Lifecycle Safety
import { animate, morphTo, remove } from 'animejs';

useEffect(() => {
  if (!pathRef.current) return;

  // morphTo resamples target SVG path and animates 'd' smoothly
  const animation = animate(pathRef.current, {
    d: morphTo('#target-${activeAnimalKey}', 0.28),
    ease: '${easing}',
    duration: ${morphDuration}
  });

  // Strict cleanup on re-render / unmount
  return () => remove(pathRef.current);
}, ['${activeAnimalKey}']);`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
