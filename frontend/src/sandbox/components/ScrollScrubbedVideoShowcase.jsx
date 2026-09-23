import React, { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  IconVideo,
  IconPlayerPlay,
  IconPlayerPause,
  IconAdjustmentsHorizontal,
  IconCompass,
  IconLayersLinked,
  IconSparkles,
  IconGauge,
  IconCode,
  IconCheck,
  IconCamera,
  IconMaximize,
  IconEye,
  IconEyeOff,
  IconFocusCentered,
  IconRefresh,
  IconCpu
} from '@tabler/icons-react';

const TOTAL_FRAMES = 60;

export default function ScrollScrubbedVideoShowcase() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  // Engines: 'canvas' (Apple frame sequence) vs 'video' (Native HTML5 video)
  const [engineMode, setEngineMode] = useState('canvas');
  // Control Mode: 'scroll' (Lenis scroll-driven) vs 'manual' (Slider) vs 'auto' (Auto loop)
  const [controlMode, setControlMode] = useState('scroll');
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);
  const [manualProgress, setManualProgress] = useState(0);

  // Visual Overlays & Helpers
  const [showOverlays, setShowOverlays] = useState(true);
  const [showCameraGrid, setShowCameraGrid] = useState(false);
  const [useSmoothing, setUseSmoothing] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showArchDocs, setShowArchDocs] = useState(false);

  // Telemetry state
  const [currentFrame, setCurrentFrame] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(2.4);
  const [scrubDirection, setScrubDirection] = useState('Forward');
  const lastProgressRef = useRef(0);

  // Cached frame images
  const imagesRef = useRef([]);
  const [framesLoaded, setFramesLoaded] = useState(false);

  // Preload frames for Canvas Engine
  useEffect(() => {
    let loadedCount = 0;
    const imgs = [];

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/frames/villa_${frameNum}.webp`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= TOTAL_FRAMES) {
          setFramesLoaded(true);
        }
      };
      imgs.push(img);
    }
    imagesRef.current = imgs;
  }, []);

  // Track scroll on the tall pin container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Render canvas frame
  const renderFrame = (progress) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frameIdx = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.floor(progress * (TOTAL_FRAMES - 1)))
    );
    setCurrentFrame(frameIdx);

    const img = imagesRef.current[frameIdx];
    if (img && img.complete && img.naturalWidth > 0) {
      // Ensure canvas resolution matches display
      if (canvas.width !== 960 || canvas.height !== 540) {
        canvas.width = 960;
        canvas.height = 540;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  };

  // Sync Native Video Element
  const syncVideoTime = (progress) => {
    const video = videoRef.current;
    if (!video || !video.duration || isNaN(video.duration)) return;
    const targetTime = progress * video.duration;
    setVideoCurrentTime(targetTime);

    // Fast seek without playback stutter
    if (Math.abs(video.currentTime - targetTime) > 0.04) {
      video.currentTime = targetTime;
    }
  };

  // Handle progress updates (from scroll, manual, or auto)
  const updatePlayback = (progress) => {
    // Detect direction
    if (progress > lastProgressRef.current + 0.002) {
      setScrubDirection('Forward ⏩');
    } else if (progress < lastProgressRef.current - 0.002) {
      setScrubDirection('Reverse ⏪');
    }
    lastProgressRef.current = progress;

    if (engineMode === 'canvas') {
      renderFrame(progress);
    } else {
      syncVideoTime(progress);
    }
  };

  // Listen to Lenis / Framer Motion scroll in 'scroll' mode
  useEffect(() => {
    if (controlMode !== 'scroll') return;

    return scrollYProgress.on('change', (latest) => {
      updatePlayback(latest);
    });
  }, [scrollYProgress, controlMode, engineMode, framesLoaded]);

  // Initial draw when frames loaded
  useEffect(() => {
    if (framesLoaded && engineMode === 'canvas') {
      renderFrame(controlMode === 'scroll' ? scrollYProgress.get() : manualProgress);
    }
  }, [framesLoaded, engineMode]);

  // Auto-play loop when auto mode active
  useEffect(() => {
    let animId;
    let dir = 1;
    let val = manualProgress;

    if (controlMode === 'auto' && isPlayingAuto) {
      const step = () => {
        val += 0.004 * dir;
        if (val >= 0.99) {
          val = 0.99;
          dir = -1;
        } else if (val <= 0.01) {
          val = 0.01;
          dir = 1;
        }
        setManualProgress(val);
        updatePlayback(val);
        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [controlMode, isPlayingAuto]);

  // Manual slider change handler
  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setManualProgress(val);
    if (controlMode === 'auto') setIsPlayingAuto(false);
    updatePlayback(val);
  };

  const handleCopyCode = () => {
    const code = `// Scroll-Scrubbed Video / Canvas Sequence Engine
import { useScroll } from 'framer-motion';

const { scrollYProgress } = useScroll({
  target: pinContainerRef,
  offset: ['start start', 'end end']
});

// Apple Canvas Method (Zero Stutter):
scrollYProgress.on('change', (progress) => {
  const frameIndex = Math.floor(progress * (TOTAL_FRAMES - 1));
  ctx.drawImage(preloadedImages[frameIndex], 0, 0, width, height);
});

// Native Video Method:
scrollYProgress.on('change', (progress) => {
  if (video.duration) {
    video.currentTime = progress * video.duration;
  }
});`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Dynamic Parallax Overlays linked to scrollYProgress
  const effectiveProgress = controlMode === 'scroll' ? scrollYProgress : null;

  // Phase 1 Overlay (10% to 35%)
  const phase1Opacity = useTransform(scrollYProgress, [0.08, 0.16, 0.30, 0.38], [0, 1, 1, 0]);
  const phase1Y = useTransform(scrollYProgress, [0.08, 0.38], [40, -40]);

  // Phase 2 Overlay (40% to 65%)
  const phase2Opacity = useTransform(scrollYProgress, [0.38, 0.46, 0.60, 0.68], [0, 1, 1, 0]);
  const phase2Y = useTransform(scrollYProgress, [0.38, 0.68], [50, -50]);

  // Phase 3 Overlay (70% to 95%)
  const phase3Opacity = useTransform(scrollYProgress, [0.68, 0.76, 0.90, 0.98], [0, 1, 1, 0]);
  const phase3Y = useTransform(scrollYProgress, [0.68, 0.98], [40, -30]);

  // Calculated camera focal length simulation
  const progressRatio = controlMode === 'scroll' ? (lastProgressRef.current || 0) : manualProgress;
  const simulatedFocalLength = Math.round(24 + progressRatio * 61); // 24mm to 85mm

  return (
    <div className="w-full space-y-8">
      {/* Control & Configuration Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-mono font-semibold mb-2 border border-indigo-200">
              <IconVideo className="w-3.5 h-3.5 text-indigo-600" />
              Generative Video Pipeline • Replaced Static Canvas with Generated 720p Video
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-[#174849]">
              Scroll-Scrubbed Generative Video Experience
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
              Replaced static image frames with an <strong>autonomously generated 720p WebM video</strong> featuring animated water caustics in the infinity pool, dynamic golden-hour twilight shifts, and a 3D camera dolly sweep. Playback timeline synchronizes directly with Lenis scroll progress.
            </p>
          </div>

          {/* Action Buttons: Workspace Rule #6 compliant (h-[54px]) */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowArchDocs(!showArchDocs)}
              className="h-[54px] px-5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-2 border bg-stone-50 hover:bg-stone-100 text-[#174849] border-stone-200 shadow-xs"
            >
              <IconCpu className="w-4 h-4 text-[#266F71]" />
              {showArchDocs ? 'Hide Architecture Guide' : 'Apple vs Video Architecture'}
            </button>

            <button
              onClick={handleCopyCode}
              className="h-[54px] px-5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-2 border bg-[#174849] text-white hover:bg-[#1f595b] shadow-xs"
            >
              {copiedCode ? <IconCheck className="w-4 h-4 text-emerald-300" /> : <IconCode className="w-4 h-4" />}
              {copiedCode ? 'Code Copied!' : 'Copy Scrub Engine'}
            </button>
          </div>
        </div>

        {/* Engine Switcher & Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
          {/* Dual Engine Switcher */}
          <div className="md:col-span-5 flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-stone-600 uppercase tracking-wider">Engine:</span>
            <div className="inline-flex p-1 bg-white rounded-xl border border-stone-200 shadow-2xs">
              <button
                onClick={() => setEngineMode('canvas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  engineMode === 'canvas'
                    ? 'bg-[#174849] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <IconSparkles className="w-3.5 h-3.5 text-amber-300" />
                Apple Canvas (60 FPS)
              </button>
              <button
                onClick={() => setEngineMode('video')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  engineMode === 'video'
                    ? 'bg-[#174849] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <IconVideo className="w-3.5 h-3.5 text-indigo-300" />
                Native HTML5 Video
              </button>
            </div>
          </div>

          {/* Control Mode & Visual Helpers */}
          <div className="md:col-span-7 flex items-center gap-2 flex-wrap justify-start md:justify-end">
            <div className="inline-flex p-1 bg-white rounded-xl border border-stone-200 shadow-2xs">
              <button
                onClick={() => { setControlMode('scroll'); setIsPlayingAuto(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  controlMode === 'scroll' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <IconCompass className="w-3.5 h-3.5" />
                Lenis Scroll Pin
              </button>
              <button
                onClick={() => { setControlMode('manual'); setIsPlayingAuto(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  controlMode === 'manual' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <IconAdjustmentsHorizontal className="w-3.5 h-3.5" />
                Timeline Scrub
              </button>
              <button
                onClick={() => {
                  setControlMode('auto');
                  setIsPlayingAuto(!isPlayingAuto);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  controlMode === 'auto' && isPlayingAuto ? 'bg-amber-600 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {isPlayingAuto ? <IconPlayerPause className="w-3.5 h-3.5" /> : <IconPlayerPlay className="w-3.5 h-3.5" />}
                Auto Loop
              </button>
            </div>

            {/* Overlays Toggle */}
            <button
              onClick={() => setShowOverlays(!showOverlays)}
              className={`p-2 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                showOverlays ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white text-stone-400 border-stone-200'
              }`}
              title="Toggle Parallax Overlays"
            >
              {showOverlays ? <IconEye className="w-4 h-4" /> : <IconEyeOff className="w-4 h-4" />}
            </button>

            {/* Camera Grid Toggle */}
            <button
              onClick={() => setShowCameraGrid(!showCameraGrid)}
              className={`p-2 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                showCameraGrid ? 'bg-indigo-50 text-indigo-800 border-indigo-300' : 'bg-white text-stone-400 border-stone-200'
              }`}
              title="Toggle Rule-of-Thirds Grid"
            >
              <IconFocusCentered className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Manual Scrub Bar */}
        {controlMode !== 'scroll' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center gap-4 justify-between"
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-mono font-bold text-indigo-900 flex items-center gap-1.5">
                <IconGauge className="w-4 h-4 text-indigo-700" />
                Scrub Position: {Math.round(manualProgress * 100)}%
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={manualProgress}
                onChange={handleSliderChange}
                className="w-48 sm:w-80 accent-[#174849] cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-stone-500">Jump To:</span>
              {[
                { label: '0% Start', val: 0 },
                { label: '50% Mid', val: 0.5 },
                { label: '100% End', val: 1 },
              ].map((jump) => (
                <button
                  key={jump.label}
                  onClick={() => {
                    setManualProgress(jump.val);
                    updatePlayback(jump.val);
                    if (controlMode === 'auto') setIsPlayingAuto(false);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-white text-stone-700 hover:bg-stone-100 border border-stone-200 cursor-pointer shadow-2xs"
                >
                  {jump.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ARCHITECTURE COMPARISON DRAWER */}
      <AnimatePresence>
        {showArchDocs && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-stone-900 text-stone-100 p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h4 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <IconCpu className="w-5 h-5 text-amber-400" />
                Why Apple Uses &lt;canvas&gt; Sequences Over Native &lt;video&gt;
              </h4>
              <span className="text-xs font-mono text-stone-400">Production Engineering Benchmark</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-stone-300">
              <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700 space-y-2">
                <span className="font-mono font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                  1. Apple Canvas Sequence (Selected Default)
                </span>
                <p>
                  Pre-extracting video into 60 to 120 compressed WebP frames ensures <strong>instantaneous 60/120 FPS seeking</strong> in both directions. There is no hardware video decoder stall when scrubbing backward, zero buffering latency, and zero audio codec overhead.
                </p>
              </div>

              <div className="bg-stone-800/60 p-4 rounded-2xl border border-stone-700 space-y-2">
                <span className="font-mono font-bold text-indigo-300 uppercase tracking-wider text-[11px]">
                  2. Native HTML5 Video Element
                </span>
                <p>
                  Uses a single MP4/WebM file (`video.currentTime = scroll * duration`). Great for small file sizes, but can exhibit micro-stutter when scrolling backward if the MP4 GOP (Group of Pictures) keyframe distance is greater than 2 to 4 frames.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PINNED SCROLL VIEWPORT CONTAINER (Height = 260vh for smooth travel) */}
      <div
        ref={containerRef}
        className={`relative w-full ${
          controlMode === 'scroll' ? 'h-[260vh]' : 'h-[620px] sm:h-[720px]'
        }`}
      >
        {/* Sticky Viewport Stage */}
        <div className={`${
          controlMode === 'scroll' ? 'sticky top-20' : 'relative'
        } w-full h-[600px] sm:h-[700px] rounded-3xl overflow-hidden border border-stone-300 shadow-2xl bg-black select-none`}>

          {/* ENGINE 1: APPLE CANVAS SEQUENCE */}
          {engineMode === 'canvas' && (
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              className="w-full h-full object-cover pointer-events-none"
            />
          )}

          {/* ENGINE 2: NATIVE HTML5 VIDEO */}
          {engineMode === 'video' && (
            <video
              ref={videoRef}
              src="/video/generated_villa_flythrough.webm"
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={(e) => setVideoDuration(e.target.duration || 6.0)}
              className="w-full h-full object-cover pointer-events-none"
            />
          )}

          {/* CAMERA RULE-OF-THIRDS OVERLAY */}
          {showCameraGrid && (
            <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 border border-white/20">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
              {/* Reticle center mark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-8 h-8 border border-amber-400/60 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                </div>
              </div>
            </div>
          )}

          {/* FLOATING TELEMETRY HUD (Top-Right) */}
          <div className="absolute top-4 right-4 z-20 bg-black/75 backdrop-blur-md text-white p-4 rounded-2xl border border-white/20 shadow-xl space-y-2.5 max-w-xs pointer-events-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[11px] font-mono tracking-widest text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Video Sync HUD
              </span>
              <span className="text-[10px] font-mono text-white/60">
                {engineMode === 'canvas' ? 'Canvas 60fps' : 'HTML5 Video'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-stone-200">
                <span className="text-stone-400">Timeline:</span>
                <span className="font-bold text-emerald-300">
                  {engineMode === 'canvas'
                    ? `Frame ${String(currentFrame + 1).padStart(2, '0')} / ${TOTAL_FRAMES}`
                    : `${videoCurrentTime.toFixed(2)}s / ${videoDuration.toFixed(2)}s`}
                </span>
              </div>

              <div className="flex items-center justify-between text-stone-200">
                <span className="text-stone-400">Direction:</span>
                <span className="font-bold text-amber-300">{scrubDirection}</span>
              </div>

              <div className="flex items-center justify-between text-stone-200">
                <span className="text-stone-400">Simulated Lens:</span>
                <span className="font-bold text-indigo-300">{simulatedFocalLength}mm Push-In</span>
              </div>
            </div>
          </div>

          {/* PARALLAX EDITORIAL OVERLAYS (Phase 1, 2, 3) */}
          {showOverlays && (
            <>
              {/* PHASE 1: MONOLITHIC ELEVATION */}
              <motion.div
                style={controlMode === 'scroll' ? { opacity: phase1Opacity, y: phase1Y } : { opacity: manualProgress >= 0.05 && manualProgress <= 0.35 ? 1 : 0 }}
                className="absolute top-16 left-6 sm:left-12 z-20 max-w-sm bg-black/60 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-white shadow-xl pointer-events-none transition-opacity duration-300"
              >
                <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest font-bold block mb-1">
                  Phase 01 • Architectural Form
                </span>
                <h4 className="text-xl font-bold font-display leading-tight">
                  Cantilevered Monolith
                </h4>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Sculpted Italian basalt masses hover over an infinity pool plane, oriented 14° South-West to harvest passive solar warmth.
                </p>
                <div className="mt-2 text-[10px] font-mono text-stone-400">
                  Elevation: +340m • Bearing: 214° SW
                </div>
              </motion.div>

              {/* PHASE 2: CANOPY CANTILEVER */}
              <motion.div
                style={controlMode === 'scroll' ? { opacity: phase2Opacity, y: phase2Y } : { opacity: manualProgress >= 0.36 && manualProgress <= 0.68 ? 1 : 0 }}
                className="absolute bottom-24 right-6 sm:right-12 z-20 max-w-sm bg-black/60 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-white shadow-xl pointer-events-none transition-opacity duration-300"
              >
                <span className="text-[10px] font-mono text-emerald-300 uppercase tracking-widest font-bold block mb-1">
                  Phase 02 • Structural Glass
                </span>
                <h4 className="text-xl font-bold font-display leading-tight">
                  Seamless Floor-To-Ceiling
                </h4>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  Low-iron acoustic glazing with concealed Swiss motorized tracks retract completely into the architectural basalt fins.
                </p>
                <div className="mt-2 text-[10px] font-mono text-stone-400">
                  Thermal Coefficient: U-0.12 • Acoustic: 48dB
                </div>
              </motion.div>

              {/* PHASE 3: INTERIOR PENTHOUSE SANCTUARY */}
              <motion.div
                style={controlMode === 'scroll' ? { opacity: phase3Opacity, y: phase3Y } : { opacity: manualProgress >= 0.69 ? 1 : 0 }}
                className="absolute top-20 right-6 sm:right-16 z-20 max-w-sm bg-black/60 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-white shadow-xl pointer-events-none transition-opacity duration-300"
              >
                <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest font-bold block mb-1">
                  Phase 03 • Living Sanctuary
                </span>
                <h4 className="text-xl font-bold font-display leading-tight">
                  Zenith Coastal Light
                </h4>
                <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                  The primary suite gazes directly into the Pacific horizon, bathed in the amber glow of sunset light.
                </p>
                <div className="mt-2 text-[10px] font-mono text-stone-400">
                  Total Floorplate: 840 m² • Completed 2026
                </div>
              </motion.div>
            </>
          )}

          {/* BOTTOM TIMELINE PROGRESS BAR */}
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20 z-20 pointer-events-none">
            <div
              className="h-full bg-emerald-400 transition-all duration-75"
              style={{
                width: `${Math.round(
                  (controlMode === 'scroll' ? (lastProgressRef.current || 0) : manualProgress) * 100
                )}%`,
              }}
            />
          </div>

          {/* SCENIC VIGNETTE */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.6)] rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
