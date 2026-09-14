import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Button from './Button';
import StarTwinkleCanvas from './StarTwinkleCanvas';
import VectorHUDOverlay from './VectorHUDOverlay';

// Import Dream Gate Concentric Depth Layers
import layerSky from '../../assets/parallax/layer-sky.png';
import layerHouse from '../../assets/parallax/layer-house.png';
import layerGateLeft from '../../assets/parallax/layer-gate-left.png';
import layerGateRight from '../../assets/parallax/layer-gate-right.png';
import layerThresholdLeft from '../../assets/parallax/layer-threshold-left.png';
import layerThresholdRight from '../../assets/parallax/layer-threshold-right.png';
import layerHeadlightBloom from '../../assets/parallax/layer-headlight-bloom.png';

export default function ParallaxMultiVectorHero({
  onExplore,
  onRequestValuation,
  className = ''
}) {
  const containerRef = useRef(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [canHover, setCanHover] = useState(true);

  // Check user motion preferences and touch environment
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(motionQuery.matches);
      const handleMotionChange = (e) => setPrefersReducedMotion(e.matches);
      motionQuery.addEventListener('change', handleMotionChange);

      const hoverQuery = window.matchMedia('(hover: hover)');
      setCanHover(hoverQuery.matches);
      const handleHoverChange = (e) => setCanHover(e.matches);
      hoverQuery.addEventListener('change', handleHoverChange);

      return () => {
        motionQuery.removeEventListener('change', handleMotionChange);
        hoverQuery.removeEventListener('change', handleHoverChange);
      };
    }
  }, []);

  // 1. SCROLL PHYSICS: Continuous Spatial Zoom through the Gate into the House
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Vanishing point anchor: Front entrance of the main duplex villa (48% 54%)
  const focalOrigin = '48% 54%';

  // LAYER 4: Celestial Sky (Infinity Anchor)
  const skyY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const skyScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);

  // LAYER 3: The Dream House (Main Duplex Villa - Zoom Target)
  // Dollies smoothly from establishing view (1.0) deep into the illuminated front entrance (1.52)
  const houseScale = useTransform(scrollYProgress, [0, 1], [1.0, 1.52]);
  const houseY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  // LAYER 2: The Dream Gate (Left & Right Gateposts & Wooden Fence)
  // Moves forward (1.0 -> 2.1) and splits outward like gates opening as you cross the threshold
  const gateScale = useTransform(scrollYProgress, [0.1, 0.65], [1.0, 2.1]);
  const gateLeftX = useTransform(scrollYProgress, [0.15, 0.65], [0, -380]);
  const gateLeftOpacity = useTransform(scrollYProgress, [0.35, 0.65], [1.0, 0.0]);

  const gateRightX = useTransform(scrollYProgress, [0.15, 0.65], [0, 380]);
  const gateRightOpacity = useTransform(scrollYProgress, [0.35, 0.65], [1.0, 0.0]);

  // Volumetric Headlight & Gate Lantern Glow
  const headlightBloomOpacity = useTransform(scrollYProgress, [0, 0.25, 0.55], [0.6, 1.0, 0.0]);

  // LAYER 1: The Outer Street Threshold (Dahlia Street Post, Anthuriums, Overhanging Canopy)
  // Nearest to camera: zooms rapidly past lens (1.0 -> 2.7) with dynamic optical DoF bokeh blur
  const threshScale = useTransform(scrollYProgress, [0, 0.45], [1.0, 2.7]);
  const threshLeftX = useTransform(scrollYProgress, [0, 0.45], [0, -420]);
  const threshLeftY = useTransform(scrollYProgress, [0, 0.45], [0, 120]);
  const threshLeftOpacity = useTransform(scrollYProgress, [0.2, 0.45], [1.0, 0.0]);

  const threshRightX = useTransform(scrollYProgress, [0, 0.45], [0, 420]);
  const threshRightY = useTransform(scrollYProgress, [0, 0.45], [0, 90]);
  const threshRightOpacity = useTransform(scrollYProgress, [0.2, 0.45], [1.0, 0.0]);

  // Optical Depth of Field (Bokeh Blur) as threshold objects fly close to camera lens
  const threshBlurValue = useTransform(scrollYProgress, [0, 0.4], [0, 8]);
  const threshBlurFilter = useTransform(threshBlurValue, (v) =>
    prefersReducedMotion ? 'none' : `blur(${v}px)`
  );

  // HUD & Narrative Overlays
  const hudOpacity = useTransform(scrollYProgress, [0.18, 0.28, 0.65, 0.74], [0, 1, 1, 0]);
  const initialTitleOpacity = useTransform(scrollYProgress, [0.0, 0.2], [1, 0]);
  const initialTitleY = useTransform(scrollYProgress, [0.0, 0.2], [0, -40]);

  const arrivalCardOpacity = useTransform(scrollYProgress, [0.72, 0.88], [0, 1]);
  const arrivalCardY = useTransform(scrollYProgress, [0.72, 0.88], [40, 0]);

  // 2. MOUSE TILT SPRING PHYSICS
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const springConfig = { stiffness: 140, damping: 22 };
  const smoothMouseX = useSpring(mousePos.x, springConfig);
  const smoothMouseY = useSpring(mousePos.y, springConfig);

  const stageRotateY = useTransform(smoothMouseX, [-1, 1], [-2.5, 2.5]);
  const stageRotateX = useTransform(smoothMouseY, [-1, 1], [2.0, -2.0]);

  const threshTiltX = useTransform(smoothMouseX, [-1, 1], [30, -30]);
  const threshTiltY = useTransform(smoothMouseY, [-1, 1], [18, -18]);

  const gateTiltX = useTransform(smoothMouseX, [-1, 1], [18, -18]);
  const gateTiltY = useTransform(smoothMouseY, [-1, 1], [10, -10]);

  const houseTiltX = useTransform(smoothMouseX, [-1, 1], [8, -8]);
  const houseTiltY = useTransform(smoothMouseY, [-1, 1], [5, -5]);

  const handleMouseMove = (e) => {
    if (!canHover || prefersReducedMotion) return;
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    mouseX.current = x;
    mouseY.current = y;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-[240vh] bg-[#071313] ${className}`}
    >
      {/* Pinned Viewport Stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center select-none perspective-[1200px]">
        <motion.div
          style={{
            rotateY: prefersReducedMotion ? 0 : stageRotateY,
            rotateX: prefersReducedMotion ? 0 : stageRotateX,
            transformStyle: 'preserve-3d'
          }}
          className="relative w-full h-full max-w-[1920px] max-h-[1080px] flex items-center justify-center overflow-hidden"
        >
          {/* LAYER 4: CELESTIAL SKY & STARFIELD (INFINITY) */}
          <motion.div
            style={{
              y: prefersReducedMotion ? 0 : skyY,
              scale: prefersReducedMotion ? 1 : skyScale,
              transformOrigin: focalOrigin
            }}
            className="absolute inset-0 w-full h-full z-[1] pointer-events-none transform-gpu will-change-transform"
          >
            <img
              src={layerSky}
              alt="Dusk Sky & Constellations"
              className="w-full h-full object-cover object-center"
            />
            <StarTwinkleCanvas starCount={70} />
            {/* Ambient Radial Color Highlights */}
            <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[55%] bg-[#174849]/25 blur-[140px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[50%] bg-[#FB8E5D]/15 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
          </motion.div>

          {/* LAYER 3: THE DREAM HOUSE (DUPLEX VILLA & PRISTINE DRIVEWAY) */}
          <motion.div
            style={{
              scale: prefersReducedMotion ? 1 : houseScale,
              y: prefersReducedMotion ? 0 : houseY,
              x: prefersReducedMotion ? 0 : houseTiltX,
              transformOrigin: focalOrigin
            }}
            className="absolute inset-0 w-full h-full z-[2] pointer-events-none transform-gpu will-change-transform"
          >
            <img
              src={layerHouse}
              alt="The Dream House • Dahlia Enclave Villa"
              className="w-full h-full object-cover object-center"
            />
            {/* Subtle Warm Balcony & Window Pulse */}
            <div className="absolute top-[28%] left-[45%] w-[22%] h-[24%] bg-[#FB8E5D]/10 blur-[60px] rounded-full mix-blend-screen pointer-events-none" />
          </motion.div>

          {/* VOLUMETRIC HEADLIGHT BLOOM LAYER */}
          <motion.div
            style={{
              opacity: prefersReducedMotion ? 0.4 : headlightBloomOpacity,
              scale: prefersReducedMotion ? 1 : houseScale,
              y: prefersReducedMotion ? 0 : houseY,
              x: prefersReducedMotion ? 0 : houseTiltX,
              transformOrigin: focalOrigin
            }}
            className="absolute inset-0 w-full h-full z-[2] pointer-events-none mix-blend-screen transform-gpu will-change-transform"
          >
            <img
              src={layerHeadlightBloom}
              alt="Volumetric Car Headlight Rays"
              className="w-full h-full object-cover object-center opacity-85"
            />
          </motion.div>

          {/* LAYER 2: THE DREAM GATE - LEFT (Center Palms, Left Pillar & Fence) */}
          <motion.div
            style={{
              scale: prefersReducedMotion ? 1 : gateScale,
              x: prefersReducedMotion ? 0 : gateLeftX,
              opacity: prefersReducedMotion ? 1 : gateLeftOpacity,
              translateX: prefersReducedMotion ? 0 : gateTiltX,
              translateY: prefersReducedMotion ? 0 : gateTiltY,
              transformOrigin: focalOrigin
            }}
            className="absolute inset-0 w-full h-full z-[3] pointer-events-none transform-gpu will-change-transform"
          >
            <img
              src={layerGateLeft}
              alt="Dream Gate Left Pillar and Fence"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* LAYER 2: THE DREAM GATE - RIGHT (Sliding Wooden Gate, Right Pillar & Car) */}
          <motion.div
            style={{
              scale: prefersReducedMotion ? 1 : gateScale,
              x: prefersReducedMotion ? 0 : gateRightX,
              opacity: prefersReducedMotion ? 1 : gateRightOpacity,
              translateX: prefersReducedMotion ? 0 : gateTiltX,
              translateY: prefersReducedMotion ? 0 : gateTiltY,
              transformOrigin: focalOrigin
            }}
            className="absolute inset-0 w-full h-full z-[3] pointer-events-none transform-gpu will-change-transform"
          >
            <img
              src={layerGateRight}
              alt="Dream Gate Sliding Wooden Gate and Right Pillar"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* ARCHITECTURAL VECTOR HUD */}
          <VectorHUDOverlay opacity={prefersReducedMotion ? 0.8 : hudOpacity} />

          {/* LAYER 1: OUTER THRESHOLD - LEFT (Dahlia Signpost, Anthuriums, Canopy) */}
          <motion.div
            style={{
              scale: prefersReducedMotion ? 1 : threshScale,
              x: prefersReducedMotion ? 0 : threshLeftX,
              y: prefersReducedMotion ? 0 : threshLeftY,
              opacity: prefersReducedMotion ? 1 : threshLeftOpacity,
              translateX: prefersReducedMotion ? 0 : threshTiltX,
              translateY: prefersReducedMotion ? 0 : threshTiltY,
              filter: threshBlurFilter,
              transformOrigin: focalOrigin
            }}
            className="absolute inset-0 w-full h-full z-[5] pointer-events-none transform-gpu will-change-transform"
          >
            <img
              src={layerThresholdLeft}
              alt="Dahlia Street Post and Tropical Flora"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* LAYER 1: OUTER THRESHOLD - RIGHT (Flowering Shrubs & Palm Fronds) */}
          <motion.div
            style={{
              scale: prefersReducedMotion ? 1 : threshScale,
              x: prefersReducedMotion ? 0 : threshRightX,
              y: prefersReducedMotion ? 0 : threshRightY,
              opacity: prefersReducedMotion ? 1 : threshRightOpacity,
              translateX: prefersReducedMotion ? 0 : threshTiltX,
              translateY: prefersReducedMotion ? 0 : threshTiltY,
              filter: threshBlurFilter,
              transformOrigin: focalOrigin
            }}
            className="absolute inset-0 w-full h-full z-[5] pointer-events-none transform-gpu will-change-transform"
          >
            <img
              src={layerThresholdRight}
              alt="Perimeter Palms and Flowering Shrubs"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* INITIAL STAGE EDITORIAL TITLE: AT THE GATE OF YOUR DREAMS (0% -> 20%) */}
          <motion.div
            style={{
              opacity: prefersReducedMotion ? 1 : initialTitleOpacity,
              y: prefersReducedMotion ? 0 : initialTitleY
            }}
            className="relative z-[6] text-center flex flex-col items-center justify-center px-6 max-w-4xl mx-auto pointer-events-none"
          >
            <div className="inline-flex items-center px-5 py-2 rounded-full text-[11px] font-bold font-mono bg-black/40 text-white/90 backdrop-blur-md uppercase tracking-[0.25em] mb-6 border border-white/20 shadow-xl gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FB8E5D] animate-ping" />
              DAHLIA ENCLAVE • THE GATE OF YOUR DREAMS
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-white mb-6 leading-[1.08] drop-shadow-2xl">
              Where Architecture <br className="hidden sm:inline" />
              <span className="text-[#FB8E5D]">Embraces the Night.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-white/80 font-light max-w-2xl mx-auto leading-relaxed mb-8 drop-shadow-md">
              Stand before the private boundary of contemporary biophilic living. Scroll to unlock the gate and enter your sanctuary.
            </p>

            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#FB8E5D] uppercase animate-bounce mt-2 bg-black/30 px-4 py-2 rounded-full border border-white/10 backdrop-blur-xs">
              <span>Scroll to enter the gate</span>
              <span>↓</span>
            </div>
          </motion.div>

          {/* FINAL ARRIVAL CARD: ARRIVAL AT THE DREAM HOUSE (72% -> 100%) */}
          <motion.div
            style={{
              opacity: prefersReducedMotion ? 1 : arrivalCardOpacity,
              y: prefersReducedMotion ? 0 : arrivalCardY
            }}
            className="absolute bottom-16 sm:bottom-20 z-[6] w-full max-w-4xl mx-auto px-6 text-center flex flex-col items-center pointer-events-auto"
          >
            <div className="bg-black/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/15 shadow-2xl flex flex-col items-center">
              <span className="text-[11px] font-mono tracking-widest text-[#FB8E5D] uppercase mb-2">
                SANCTUARY REACHED • PHASE 3 LOT 12
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display text-white mb-4 tracking-tight">
                Welcome to Your Dream Residence
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl mb-6 font-light leading-relaxed">
                You have arrived at the center villa. Tour tailored two-story biophilic floorplans, teak wood terraces, and private grounds today.
              </p>

              {/* ACTION BUTTONS (STRICT h-[54px] REQUIREMENT PER AGENTS.MD) */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
                <Button
                  onClick={onExplore}
                  variant="primary"
                  className="h-[54px] px-8 bg-[#174849] hover:bg-[#103536] text-white shadow-[0_10px_30px_rgba(23,72,73,0.4)] border-none font-bold tracking-widest text-xs flex items-center justify-center rounded-lg"
                >
                  Explore Residences
                </Button>
                <Button
                  onClick={onRequestValuation}
                  variant="outline"
                  className="h-[54px] px-8 bg-white/10 hover:bg-white/20 text-white border-2 border-white/40 font-bold tracking-widest text-xs backdrop-blur-sm flex items-center justify-center rounded-lg"
                >
                  Schedule Private Viewing
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
