import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Button from './Button';
import StarTwinkleCanvas from './StarTwinkleCanvas';
import VectorHUDOverlay from './VectorHUDOverlay';

// Import transparent layer assets
import layerSky from '../../assets/parallax/layer-sky.png';
import layerVillas from '../../assets/parallax/layer-villas.png';
import layerGround from '../../assets/parallax/layer-ground.png';
import layerFgLeft from '../../assets/parallax/layer-foreground-left.png';
import layerFgRight from '../../assets/parallax/layer-foreground-right.png';

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

  // 1. SCROLL PHYSICS
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Layer Transforms on Scroll
  const skyY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const skyScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);

  const villasY = useTransform(scrollYProgress, [0, 0.85], [0, -35]);
  const villasScale = useTransform(scrollYProgress, [0, 0.85], [1, 1.15]);

  const groundY = useTransform(scrollYProgress, [0, 0.85], [0, 45]);
  const groundScale = useTransform(scrollYProgress, [0, 0.85], [1, 1.18]);

  // Lateral Multi-Vector Parting for Foreground Elements
  const fgLeftX = useTransform(scrollYProgress, [0.2, 0.75], [0, -240]);
  const fgLeftY = useTransform(scrollYProgress, [0.2, 0.75], [0, 80]);
  const fgLeftScale = useTransform(scrollYProgress, [0.2, 0.75], [1, 1.25]);
  const fgLeftOpacity = useTransform(scrollYProgress, [0.45, 0.75], [1, 0.2]);

  const fgRightX = useTransform(scrollYProgress, [0.2, 0.75], [0, 240]);
  const fgRightY = useTransform(scrollYProgress, [0.2, 0.75], [0, 60]);
  const fgRightScale = useTransform(scrollYProgress, [0.2, 0.75], [1, 1.20]);
  const fgRightOpacity = useTransform(scrollYProgress, [0.45, 0.75], [1, 0.2]);

  // HUD and Editorial Overlays
  const hudOpacity = useTransform(scrollYProgress, [0.28, 0.38, 0.65, 0.75], [0, 1, 1, 0]);
  const initialTitleOpacity = useTransform(scrollYProgress, [0.0, 0.28], [1, 0]);
  const initialTitleY = useTransform(scrollYProgress, [0.0, 0.28], [0, -40]);

  const ctaOpacity = useTransform(scrollYProgress, [0.72, 0.88], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.72, 0.88], [40, 0]);

  // 2. MOUSE TILT PHYSICS
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const springConfig = { stiffness: 140, damping: 22 };
  const smoothMouseX = useSpring(mousePos.x, springConfig);
  const smoothMouseY = useSpring(mousePos.y, springConfig);

  const stageRotateY = useTransform(smoothMouseX, [-1, 1], [-2.5, 2.5]);
  const stageRotateX = useTransform(smoothMouseY, [-1, 1], [2.0, -2.0]);

  const fgTiltX = useTransform(smoothMouseX, [-1, 1], [25, -25]);
  const fgTiltY = useTransform(smoothMouseY, [-1, 1], [15, -15]);

  const midTiltX = useTransform(smoothMouseX, [-1, 1], [10, -10]);
  const midTiltY = useTransform(smoothMouseY, [-1, 1], [6, -6]);

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
      className={`relative w-full h-[220vh] bg-[#071313] ${className}`}
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
          {/* 1. LAYER SKY & STARFIELD */}
          <motion.div
            style={{
              y: prefersReducedMotion ? 0 : skyY,
              scale: prefersReducedMotion ? 1 : skyScale
            }}
            className="absolute inset-0 w-full h-full z-[1] pointer-events-none transform-gpu will-change-transform"
          >
            <img
              src={layerSky}
              alt="Dusk Sky & Constellations"
              className="w-full h-full object-cover object-center"
            />
            <StarTwinkleCanvas starCount={70} />
            {/* Ambient Radial Color Lighting */}
            <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[55%] bg-[#174849]/25 blur-[140px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[50%] bg-[#FB8E5D]/15 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
          </motion.div>

          {/* 2. LAYER VILLAS (MIDGROUND) */}
          <motion.div
            style={{
              y: prefersReducedMotion ? 0 : villasY,
              scale: prefersReducedMotion ? 1 : villasScale,
              x: prefersReducedMotion ? 0 : midTiltX
            }}
            className="absolute inset-0 w-full h-full z-[2] pointer-events-none transform-gpu will-change-transform"
          >
            <img
              src={layerVillas}
              alt="Illuminated Modern Duplexes"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* 3. LAYER GROUND & HARDSCAPE */}
          <motion.div
            style={{
              y: prefersReducedMotion ? 0 : groundY,
              scale: prefersReducedMotion ? 1 : groundScale,
              x: prefersReducedMotion ? 0 : midTiltX
            }}
            className="absolute inset-0 w-full h-full z-[3] pointer-events-none transform-gpu will-change-transform"
          >
            <img
              src={layerGround}
              alt="Cobblestone Hardscape Driveway"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* 4. ARCHITECTURAL VECTOR HUD */}
          <VectorHUDOverlay opacity={prefersReducedMotion ? 0.8 : hudOpacity} />

          {/* 5. FOREGROUND LEFT (Dahlia Street Sign & Anthurium Flora) */}
          <motion.div
            style={{
              x: prefersReducedMotion ? 0 : fgLeftX,
              y: prefersReducedMotion ? 0 : fgLeftY,
              scale: prefersReducedMotion ? 1 : fgLeftScale,
              opacity: prefersReducedMotion ? 1 : fgLeftOpacity,
              translateX: prefersReducedMotion ? 0 : fgTiltX,
              translateY: prefersReducedMotion ? 0 : fgTiltY
            }}
            className="absolute inset-0 w-full h-full z-[5] pointer-events-none transform-gpu will-change-transform"
          >
            <img
              src={layerFgLeft}
              alt="Dahlia Street Post and Flora"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* 6. FOREGROUND RIGHT (Palms & Boundary Fence) */}
          <motion.div
            style={{
              x: prefersReducedMotion ? 0 : fgRightX,
              y: prefersReducedMotion ? 0 : fgRightY,
              scale: prefersReducedMotion ? 1 : fgRightScale,
              opacity: prefersReducedMotion ? 1 : fgRightOpacity,
              translateX: prefersReducedMotion ? 0 : fgTiltX,
              translateY: prefersReducedMotion ? 0 : fgTiltY
            }}
            className="absolute inset-0 w-full h-full z-[5] pointer-events-none transform-gpu will-change-transform"
          >
            <img
              src={layerFgRight}
              alt="Perimeter Palms and Tropical Shrubs"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>

          {/* 7. INITIAL STAGE EDITORIAL TITLE (0% -> 25%) */}
          <motion.div
            style={{
              opacity: prefersReducedMotion ? 1 : initialTitleOpacity,
              y: prefersReducedMotion ? 0 : initialTitleY
            }}
            className="relative z-[6] text-center flex flex-col items-center justify-center px-6 max-w-4xl mx-auto pointer-events-none"
          >
            <div className="inline-flex items-center px-5 py-2 rounded-full text-[11px] font-bold font-mono bg-black/40 text-white/90 backdrop-blur-md uppercase tracking-[0.25em] mb-6 border border-white/20 shadow-xl gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FB8E5D] animate-ping" />
              DAHLIA ENCLAVE • PHASE 3
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-white mb-6 leading-[1.08] drop-shadow-2xl">
              Where Architecture <br className="hidden sm:inline" />
              <span className="text-[#FB8E5D]">Embraces the Night.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-white/80 font-light max-w-2xl mx-auto leading-relaxed mb-8 drop-shadow-md">
              A private enclave of contemporary biophilic duplexes on Dahlia Street. Experience mastercrafted living harmonized with tropical nature.
            </p>

            <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#FB8E5D] uppercase animate-bounce mt-2 bg-black/30 px-4 py-2 rounded-full border border-white/10 backdrop-blur-xs">
              <span>Scroll to enter the enclave</span>
              <span>↓</span>
            </div>
          </motion.div>

          {/* 8. CONCLUDING RESOLUTION & CTA DECK (72% -> 100%) */}
          <motion.div
            style={{
              opacity: prefersReducedMotion ? 1 : ctaOpacity,
              y: prefersReducedMotion ? 0 : ctaY
            }}
            className="absolute bottom-16 sm:bottom-20 z-[6] w-full max-w-4xl mx-auto px-6 text-center flex flex-col items-center pointer-events-auto"
          >
            <div className="bg-black/60 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/15 shadow-2xl flex flex-col items-center">
              <span className="text-[11px] font-mono tracking-widest text-[#FB8E5D] uppercase mb-2">
                NOW ACCEPTING PRIVATE INQUIRIES
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display text-white mb-4 tracking-tight">
                Discover Dahlia Enclave's Curated Residences
              </h2>
              <p className="text-xs sm:text-sm text-white/80 max-w-xl mb-6 font-light leading-relaxed">
                Step inside our exclusive Phase 3 inventory. Tour tailored two-story floorplans and secure priority allocation today.
              </p>

              {/* ACTION BUTTONS (STRICT h-[54px] REQUIREMENT) */}
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
