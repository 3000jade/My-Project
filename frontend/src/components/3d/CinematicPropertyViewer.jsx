import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  IconSun,
  IconMoon,
  IconSparkles,
  IconFocusCentered,
  IconMaximize,
  IconCompass,
  IconBuildingSkyscraper,
  IconLayersIntersect,
  IconInfoCircle,
  IconCheck,
  IconVolume,
  IconVolumeOff
} from '@tabler/icons-react';

// Hotspot definition data
const HOTSPOTS = [
  {
    id: 'terrace',
    name: 'Cantilever Sky Terrace & Pool',
    position: [2.5, 1.8, 1.8],
    cameraPos: [6, 4, 6],
    description: 'Suspended 18-meter heated infinity lap pool with frameless structural glass balustrades.',
    specs: '68 sqm • Western Sunset View'
  },
  {
    id: 'living',
    name: 'Double-Height Living Pavilion',
    position: [-0.5, 0.9, 1.5],
    cameraPos: [2, 2.5, 5],
    description: '7.2-meter soaring ceiling with motorized acoustic solar louvers and Italian Calacatta fireplace.',
    specs: '140 sqm • Integrated Sound'
  },
  {
    id: 'penthouse',
    name: 'Master Penthouse Suite',
    position: [0.8, 2.8, -0.2],
    cameraPos: [3, 4.5, 4],
    description: 'Private upper-level sanctuary featuring dual walk-in dressing suites and volcanic limestone soak tub.',
    specs: '110 sqm • Private Elevator'
  },
  {
    id: 'gallery',
    name: 'Automotive Gallery & Lounge',
    position: [-2.2, -0.2, 0.5],
    cameraPos: [-5, 1.5, 5],
    description: 'Climate-controlled 4-vehicle showroom with turntable showcase and integrated wine tasting lounge.',
    specs: '85 sqm • Biometric Access'
  }
];

// Architectural 3D Procedural Model
function ArchitecturalDuplexModel({ lightingMode, activeHotspot, onSelectHotspot, isWireframe }) {
  const groupRef = useRef();

  // Color & Material themes based on lighting
  const isNight = lightingMode === 'twilight';
  const isSunset = lightingMode === 'golden';

  const materials = useMemo(() => {
    if (isWireframe) {
      const wireMat = new THREE.MeshBasicMaterial({
        color: '#14B8A6',
        wireframe: true,
        transparent: true,
        opacity: 0.65
      });
      return {
        concrete: wireMat,
        wood: wireMat,
        darkMetal: wireMat,
        glass: wireMat,
        water: wireMat,
        interior: wireMat
      };
    }

    return {
      concrete: new THREE.MeshStandardMaterial({
        color: isNight ? '#333b3d' : isSunset ? '#eedfd5' : '#e6e8e8',
        roughness: 0.8,
        metalness: 0.1
      }),
      wood: new THREE.MeshStandardMaterial({
        color: isNight ? '#4a3324' : '#8B5A2B',
        roughness: 0.6,
        metalness: 0.1
      }),
      darkMetal: new THREE.MeshStandardMaterial({
        color: isNight ? '#151a1a' : '#1f2424',
        roughness: 0.3,
        metalness: 0.8
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: isNight ? '#4aa8d8' : '#c2e5f2',
        transmission: 0.85,
        opacity: 0.45,
        transparent: true,
        roughness: 0.1,
        metalness: 0.1,
        ior: 1.5
      }),
      water: new THREE.MeshStandardMaterial({
        color: isNight ? '#0b4a6f' : '#15803d',
        roughness: 0.1,
        metalness: 0.6,
        transparent: true,
        opacity: 0.8
      }),
      interiorGlow: new THREE.MeshStandardMaterial({
        color: '#ffc57a',
        emissive: isNight ? '#ff9a3c' : isSunset ? '#ffaa4a' : '#ffe0b2',
        emissiveIntensity: isNight ? 1.8 : isSunset ? 1.0 : 0.2,
        roughness: 0.4
      })
    };
  }, [lightingMode, isWireframe, isNight, isSunset]);

  return (
    <group ref={groupRef} position={[0, -0.6, 0]}>
      {/* Ground Foundation Slab */}
      <mesh position={[0, -0.15, 0]} material={materials.concrete} receiveShadow>
        <boxGeometry args={[9, 0.3, 7]} />
      </mesh>

      {/* Driveway & Walkway pavers */}
      <mesh position={[-2.4, -0.01, 1.8]} material={materials.darkMetal} receiveShadow>
        <boxGeometry args={[3.2, 0.05, 3]} />
      </mesh>

      {/* Level 1: Main Living Pavilion (Double-height core) */}
      <mesh position={[-0.8, 0.85, 0]} material={materials.concrete} castShadow receiveShadow>
        <boxGeometry args={[4.2, 1.7, 4.4]} />
      </mesh>

      {/* Level 1 Floor-to-ceiling glass front */}
      <mesh position={[-0.8, 0.85, 2.22]} material={materials.glass}>
        <boxGeometry args={[3.8, 1.5, 0.05]} />
      </mesh>

      {/* Interior warm illuminated core */}
      <mesh position={[-0.8, 0.85, 0.5]} material={materials.interiorGlow}>
        <boxGeometry args={[2.5, 1.2, 2.5]} />
      </mesh>

      {/* Level 2: Cantilevered Master Suite (Upper Volume) */}
      <mesh position={[1.2, 2.2, 0.4]} material={materials.concrete} castShadow receiveShadow>
        <boxGeometry args={[4.4, 1.5, 3.8]} />
      </mesh>

      {/* Level 2 Teak Slat Facade Accent */}
      <mesh position={[2.8, 2.2, 2.32]} material={materials.wood}>
        <boxGeometry args={[1.0, 1.4, 0.08]} />
      </mesh>

      {/* Level 2 Panoramic Glass Curtain Wall */}
      <mesh position={[0.8, 2.2, 2.32]} material={materials.glass}>
        <boxGeometry args={[2.8, 1.35, 0.05]} />
      </mesh>

      {/* Level 2 Interior Light */}
      <mesh position={[1.2, 2.2, 0.6]} material={materials.interiorGlow}>
        <boxGeometry args={[2.8, 1.0, 2.2]} />
      </mesh>

      {/* Cantilever Sky Terrace Deck */}
      <mesh position={[2.4, 1.4, 1.8]} material={materials.darkMetal} castShadow>
        <boxGeometry args={[3.2, 0.18, 3.4]} />
      </mesh>

      {/* Infinity Lap Pool (Inset on terrace) */}
      <mesh position={[2.6, 1.48, 2.0]} material={materials.water}>
        <boxGeometry args={[2.4, 0.12, 1.8]} />
      </mesh>

      {/* Glass Balustrade on Sky Terrace */}
      <mesh position={[2.4, 1.8, 3.45]} material={materials.glass}>
        <boxGeometry args={[3.1, 0.65, 0.04]} />
      </mesh>
      <mesh position={[3.95, 1.8, 1.8]} material={materials.glass}>
        <boxGeometry args={[0.04, 0.65, 3.3]} />
      </mesh>

      {/* Roof Canopy with solar overhang */}
      <mesh position={[0.8, 3.05, 0.4]} material={materials.darkMetal} castShadow>
        <boxGeometry args={[5.2, 0.18, 4.6]} />
      </mesh>

      {/* Structural Minimalist Columns */}
      <mesh position={[3.6, 0.7, 3.2]} material={materials.darkMetal} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.4, 16]} />
      </mesh>
      <mesh position={[1.2, 0.7, 3.2]} material={materials.darkMetal} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.4, 16]} />
      </mesh>

      {/* Interactive 3D Hotspots */}
      {HOTSPOTS.map((spot) => {
        const isSelected = activeHotspot?.id === spot.id;
        return (
          <group key={spot.id} position={spot.position}>
            <Html center distanceFactor={12}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectHotspot(spot);
                }}
                aria-label={`View ${spot.name}`}
                className={`group relative flex items-center justify-center p-2 rounded-full cursor-pointer transition-all duration-300 ${
                  isSelected ? 'scale-125' : 'hover:scale-110'
                }`}
              >
                {/* Ping ring */}
                <span
                  className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                    isSelected ? 'bg-amber-400' : 'bg-[#14B8A6]'
                  }`}
                />
                {/* Solid center pill */}
                <span
                  className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg border-2 border-white transition-colors ${
                    isSelected ? 'bg-amber-500 text-white' : 'bg-[#174849] text-white'
                  }`}
                >
                  <IconFocusCentered className="w-3.5 h-3.5" />
                </span>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// Camera choreography controller
function CameraRig({ targetPos, autoOrbit }) {
  const controlsRef = useRef();

  useFrame((state, delta) => {
    if (controlsRef.current) {
      if (autoOrbit) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 0.8;
      } else {
        controlsRef.current.autoRotate = false;
      }

      if (targetPos) {
        // Smoothly interpolate camera position towards target
        state.camera.position.lerp(new THREE.Vector3(...targetPos), delta * 2.5);
      }
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={false} // Prevents scroll hijacking
      enablePan={false}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.1}
      dampingFactor={0.05}
    />
  );
}

export default function CinematicPropertyViewer() {
  const [lightingMode, setLightingMode] = useState('twilight'); // 'golden', 'twilight', 'day', 'wireframe'
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState(HOTSPOTS[0]);
  const [cameraTarget, setCameraTarget] = useState(HOTSPOTS[0].cameraPos);
  const [audioAmbient, setAudioAmbient] = useState(false);

  const handleSelectHotspot = (spot) => {
    setActiveHotspot(spot);
    setCameraTarget(spot.cameraPos);
    setAutoOrbit(false);
  };

  const handleResetCamera = (preset) => {
    setActiveHotspot(null);
    if (preset === 'front') {
      setCameraTarget([0, 3, 7]);
    } else if (preset === 'aerial') {
      setCameraTarget([6, 6, 6]);
    } else if (preset === 'terrace') {
      setCameraTarget([5, 3.5, 4]);
    }
  };

  return (
    <div className="relative w-full h-[580px] sm:h-[680px] rounded-3xl overflow-hidden bg-[#0A1818] border border-white/10 shadow-2xl select-none">
      {/* 3D WebGL Canvas */}
      <Canvas
        shadows
        camera={{ position: [6, 4, 6], fov: 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Environmental Lighting based on mode */}
        {lightingMode === 'golden' && (
          <>
            <ambientLight intensity={0.7} color="#fed7aa" />
            <directionalLight
              position={[8, 4, 5]}
              intensity={2.2}
              color="#fb923c"
              castShadow
              shadow-mapSize={1024}
            />
            <directionalLight position={[-6, 2, -4]} intensity={0.4} color="#38bdf8" />
          </>
        )}

        {lightingMode === 'twilight' && (
          <>
            <ambientLight intensity={0.4} color="#60a5fa" />
            <directionalLight
              position={[7, 5, 4]}
              intensity={1.0}
              color="#38bdf8"
              castShadow
            />
            <pointLight position={[0, 2, 2]} intensity={2.5} color="#ffedd5" distance={10} />
            <pointLight position={[2.5, 1.5, 2]} intensity={2.0} color="#38bdf8" distance={6} />
          </>
        )}

        {lightingMode === 'day' && (
          <>
            <ambientLight intensity={0.9} color="#ffffff" />
            <directionalLight
              position={[6, 8, 5]}
              intensity={2.0}
              color="#ffffff"
              castShadow
            />
          </>
        )}

        {lightingMode === 'wireframe' && (
          <>
            <ambientLight intensity={1.5} color="#14b8a6" />
          </>
        )}

        <ArchitecturalDuplexModel
          lightingMode={lightingMode}
          activeHotspot={activeHotspot}
          onSelectHotspot={handleSelectHotspot}
          isWireframe={lightingMode === 'wireframe'}
        />

        <CameraRig targetPos={cameraTarget} autoOrbit={autoOrbit} />
      </Canvas>

      {/* TOP HUD: Property Identity & Coordinates */}
      <div className="absolute top-5 left-5 right-5 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 pointer-events-auto flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#14B8A6] animate-pulse"></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest text-[#14B8A6] font-bold uppercase">
                APEX-DPX-01
              </span>
              <span className="text-[10px] text-white/40">•</span>
              <span className="text-[10px] text-white/70 font-mono">14°33'02"N 121°03'18"E</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white font-display">
              The Glass Monolith Duplex Penthouse
            </h4>
          </div>
        </div>

        {/* TOP RIGHT: Atmosphere Switcher & Controls */}
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 pointer-events-auto">
          <button
            onClick={() => setLightingMode('twilight')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              lightingMode === 'twilight'
                ? 'bg-[#266F71] text-white shadow'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <IconMoon className="w-3.5 h-3.5 text-sky-300" />
            <span className="hidden sm:inline">Twilight</span>
          </button>
          <button
            onClick={() => setLightingMode('golden')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              lightingMode === 'golden'
                ? 'bg-[#FB8E5D] text-white shadow'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <IconSun className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">Golden Hour</span>
          </button>
          <button
            onClick={() => setLightingMode('day')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              lightingMode === 'day'
                ? 'bg-stone-200 text-[#174849] shadow'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <IconSparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden sm:inline">Daylight</span>
          </button>
          <button
            onClick={() => setLightingMode('wireframe')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              lightingMode === 'wireframe'
                ? 'bg-[#14B8A6] text-black shadow'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <IconLayersIntersect className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Blueprint</span>
          </button>
        </div>
      </div>

      {/* BOTTOM LEFT: Selected Hotspot Telemetry Card */}
      <div className="absolute bottom-5 left-5 max-w-sm w-full pointer-events-auto">
        {activeHotspot ? (
          <div className="bg-black/75 backdrop-blur-xl p-5 rounded-2xl border border-white/15 text-white shadow-2xl">
            <div className="flex items-center justify-between text-xs text-[#14B8A6] mb-1 font-mono uppercase tracking-wider">
              <span>Spatial Hotspot Inspector</span>
              <span>{activeHotspot.specs}</span>
            </div>
            <h4 className="text-base font-bold font-display text-white">{activeHotspot.name}</h4>
            <p className="text-xs text-stone-300 mt-2 leading-relaxed">{activeHotspot.description}</p>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-white/50">Click and drag 3D model to rotate</span>
              <button
                onClick={() => setAutoOrbit(!autoOrbit)}
                className="text-xs font-semibold text-[#14B8A6] hover:underline cursor-pointer"
              >
                {autoOrbit ? 'Pause Orbit' : 'Resume 360° Orbit'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-black/60 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-white/80 text-xs">
            Select any floating 3D marker on the duplex to inspect architectural features.
          </div>
        )}
      </div>

      {/* BOTTOM RIGHT: Camera View Angle Presets */}
      <div className="absolute bottom-5 right-5 flex items-center gap-2 pointer-events-auto">
        <div className="bg-black/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 text-xs">
          <span className="text-[10px] uppercase font-mono text-stone-400 px-2">Camera:</span>
          <button
            onClick={() => handleResetCamera('aerial')}
            className="px-2.5 py-1 text-stone-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            Aerial 45°
          </button>
          <button
            onClick={() => handleResetCamera('front')}
            className="px-2.5 py-1 text-stone-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            Front Elevation
          </button>
          <button
            onClick={() => handleResetCamera('terrace')}
            className="px-2.5 py-1 text-stone-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            Terrace
          </button>
        </div>

        <button
          onClick={() => setAutoOrbit(!autoOrbit)}
          title="Toggle 360° Auto-Orbit"
          className={`p-3 rounded-2xl border border-white/10 backdrop-blur-md transition-all cursor-pointer ${
            autoOrbit ? 'bg-[#266F71] text-white' : 'bg-black/60 text-stone-300 hover:text-white'
          }`}
        >
          <IconCompass className={`w-4 h-4 ${autoOrbit ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        </button>
      </div>
    </div>
  );
}
