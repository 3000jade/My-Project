import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, DepthOfField } from '@react-three/postprocessing';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import * as THREE from 'three';
import Button from '../components/ui/Button';

gsap.registerPlugin(ScrollTrigger);

// --- Procedural Textures ---
function generateNoiseTexture(size = 512, intensity = 0.5, scale = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(size, size);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const v = Math.random() * 255 * intensity + (255 * (1 - intensity));
    imgData.data[i] = v;
    imgData.data[i + 1] = v;
    imgData.data[i + 2] = v;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(scale, scale);
  texture.needsUpdate = true;
  return texture;
}

const noiseTex = generateNoiseTexture(512, 0.15, 4); // Wall bump
const puddleTex = generateNoiseTexture(512, 0.6, 2); // Driveway roughness variation

// --- High-End PBR Materials ---
const createBuildingMaterials = () => ({
  wallMat: new THREE.MeshStandardMaterial({
    color: '#e5e5e5',
    roughness: 0.85,
    metalness: 0.05,
    bumpMap: noiseTex,
    bumpScale: 0.002
  }),
  darkWallMat: new THREE.MeshStandardMaterial({
    color: '#2a2a2a',
    roughness: 0.9,
    bumpMap: noiseTex,
    bumpScale: 0.005
  }),
  glassMat: new THREE.MeshPhysicalMaterial({
    color: '#d4ecf9',
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.4,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  }),
  woodMat: new THREE.MeshStandardMaterial({
    color: '#8b5a2b',
    roughness: 0.6,
    metalness: 0.1,
    bumpMap: noiseTex,
    bumpScale: 0.01
  }),
  roofMat: new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.7,
    bumpMap: noiseTex,
    bumpScale: 0.01
  })
});

const driveMat = new THREE.MeshStandardMaterial({
  color: '#333333',
  roughness: 0.35,
  roughnessMap: puddleTex,
  metalness: 0.15
});

// --- Components ---

function DustParticles() {
  const count = 300;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 20;
      pos[i + 1] = Math.random() * 10;
      pos[i + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  const pointsRef = useRef();
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = timeRef.current * 0.01;
      pointsRef.current.position.y = Math.sin(timeRef.current * 0.1) * 0.2;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#ffd28f" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function BuildingUnit({ position, isRight, opacity, exploded, name, isNight }) {
  const group = useRef();
  const materials = useMemo(() => createBuildingMaterials(), []);

  useFrame(() => {
    if (group.current) {
      group.current.traverse((child) => {
        if (child.isMesh && child.material && child.material !== materials.glassMat) {
          child.material.transparent = true;
          child.material.opacity = THREE.MathUtils.lerp(child.material.opacity, opacity, 0.1);
        }
      });
    }
  });

  const explodeY = exploded ? 4 : 0;
  const roofY = exploded ? 8 : 0;

  return (
    <group ref={group} position={position} name={name}>
      {/* Interior Light (Activates at Night) */}
      <pointLight position={[0, 2, 2]} intensity={isNight ? 2 : 0} color="#ffb86c" distance={10} castShadow={isNight} />
      <pointLight position={[0, 6, 2]} intensity={isNight && exploded ? 2 : (isNight ? 0.5 : 0)} color="#ffb86c" distance={10} />

      {/* Ground Floor */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow material={materials.wallMat}>
        <boxGeometry args={[6, 3, 8]} />
      </mesh>

      {/* Front Glass Window */}
      <mesh position={[0, 1.5, 4.05]} material={materials.glassMat}>
        <planeGeometry args={[5, 2.5]} />
      </mesh>

      {/* Second Floor (Explodable) */}
      <group position={[0, explodeY, 0]}>
        <mesh position={[0, 4.5, 0]} castShadow receiveShadow material={materials.wallMat}>
          <boxGeometry args={[6, 3, 8]} />
        </mesh>

        {/* Balcony */}
        <mesh position={[0, 3, 4.5]} receiveShadow castShadow material={materials.woodMat}>
          <boxGeometry args={[6, 0.2, 2]} />
        </mesh>

        {/* Balcony Glass */}
        <mesh position={[0, 3.5, 5.5]} material={materials.glassMat}>
          <planeGeometry args={[6, 1]} />
        </mesh>

        <Html position={[isRight ? 1 : -1, 5, 5]} distanceFactor={15} center>
          <div className="bg-black/80 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap border border-white/20 pointer-events-none transition-opacity duration-300" style={{ opacity: opacity }}>
            Master Suite Balcony
          </div>
        </Html>

        {/* Roof (Explodable further) */}
        <group position={[0, roofY, 0]}>
          <mesh position={[0, 6.2, 0]} castShadow receiveShadow material={materials.roofMat}>
            <boxGeometry args={[6.4, 0.4, 8.4]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Firewall({ opacity }) {
  const ref = useRef();
  const firewallMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2a2a2a',
    roughness: 0.9,
    bumpMap: noiseTex,
    bumpScale: 0.005
  }), []);

  useFrame(() => {
    if (ref.current) {
      ref.current.material.transparent = true;
      ref.current.material.opacity = THREE.MathUtils.lerp(ref.current.material.opacity, opacity, 0.1);
    }
  });

  return (
    <group>
      <mesh ref={ref} position={[0, 3, 0]} receiveShadow castShadow material={firewallMat}>
        <boxGeometry args={[0.5, 6.5, 8.5]} />
      </mesh>
      <Html position={[0, 3, 4.5]} distanceFactor={15} center>
        <div className="bg-[#266F71]/90 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap shadow-lg pointer-events-none transition-opacity duration-300" style={{ opacity: opacity }}>
          Shared Acoustic Firewall
        </div>
      </Html>
    </group>
  );
}

function DuplexScene({ activeUnit, exploded, setControlsTarget, disableOrbit, controlsRef, timeOfDay }) {
  const { camera, gl } = useThree();
  const sceneGroupRef = useRef();
  const sunLightRef = useRef();

  // Opacities
  const opacities = {
    A: activeUnit === 'B' ? 0.1 : 1,
    B: activeUnit === 'A' ? 0.1 : 1,
    firewall: activeUnit === 'full' ? 1 : 0.2
  };

  // Sync controls and Mouse Parallax
  useFrame(({ pointer }) => {
    // Sync OrbitControls Target
    if (controlsRef && controlsRef.current) {
      controlsRef.current.target.copy(setControlsTarget);
      controlsRef.current.update();
    }

    // Mouse Parallax Effect
    if (sceneGroupRef.current) {
      gsap.to(sceneGroupRef.current.rotation, {
        x: -pointer.y * 0.02,
        y: pointer.x * 0.05,
        duration: 2,
        ease: 'power3.out'
      });
    }

    // Day/Night Sun interpolation
    if (sunLightRef.current) {
      // timeOfDay: 0 = Dusk, 1 = Golden Hour
      const targetIntensity = timeOfDay === 1 ? 2.5 : 0.5;
      const targetColor = timeOfDay === 1 ? '#ffeedd' : '#88aaff'; // Golden to Cool Blue

      sunLightRef.current.intensity = THREE.MathUtils.lerp(sunLightRef.current.intensity, targetIntensity, 0.05);
      sunLightRef.current.color.lerp(new THREE.Color(targetColor), 0.05);

      // Sun position
      const targetY = timeOfDay === 1 ? 15 : 5;
      const targetZ = timeOfDay === 1 ? 10 : -10;
      sunLightRef.current.position.y = THREE.MathUtils.lerp(sunLightRef.current.position.y, targetY, 0.05);
      sunLightRef.current.position.z = THREE.MathUtils.lerp(sunLightRef.current.position.z, targetZ, 0.05);
    }
  });

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".scroll-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          if (self.isActive && self.progress > 0 && self.progress < 1) disableOrbit(true);
        },
        onLeave: () => disableOrbit(false),
        onLeaveBack: () => disableOrbit(false),
      }
    });

    // 1. Hero View -> Firewall
    tl.to(camera.position, { x: 0, y: 5, z: 12, ease: "power2.inOut" })
      .to(setControlsTarget, { x: 0, y: 3, z: 0, ease: "power2.inOut" }, "<");

    // 2. Firewall -> Unit A Ground
    tl.to(camera.position, { x: -3.5, y: 1.5, z: 6, ease: "power2.inOut" })
      .to(setControlsTarget, { x: -3.5, y: 1.5, z: 0, ease: "power2.inOut" }, "<");

    // 3. Unit A Ground -> Second Floor
    tl.to(camera.position, { x: -3.5, y: 6, z: 8, ease: "power2.inOut" })
      .to(setControlsTarget, { x: -3.5, y: 4.5, z: 0, ease: "power2.inOut" }, "<");

    // 4. Second Floor -> Overhead Backyard
    tl.to(camera.position, { x: 0, y: 20, z: -5, ease: "power2.inOut" })
      .to(setControlsTarget, { x: 0, y: 0, z: -2, ease: "power2.inOut" }, "<");

  }, { scope: document.body });

  // Handle Unit Selection Camera Jump
  useEffect(() => {
    if (window.scrollY > 100) return; // Prevent jump if deep scrolled

    if (activeUnit === 'A') {
      gsap.to(camera.position, { x: -8, y: 6, z: 12, duration: 1.5, ease: "power3.inOut" });
      gsap.to(setControlsTarget, { x: -3.5, y: 3, z: 0, duration: 1.5, ease: "power3.inOut" });
    } else if (activeUnit === 'B') {
      gsap.to(camera.position, { x: 8, y: 6, z: 12, duration: 1.5, ease: "power3.inOut" });
      gsap.to(setControlsTarget, { x: 3.5, y: 3, z: 0, duration: 1.5, ease: "power3.inOut" });
    } else {
      gsap.to(camera.position, { x: 15, y: 12, z: 20, duration: 1.5, ease: "power3.inOut" });
      gsap.to(setControlsTarget, { x: 0, y: 3, z: 0, duration: 1.5, ease: "power3.inOut" });
    }
  }, [activeUnit]);

  return (
    <group ref={sceneGroupRef}>
      {/* High-End IBL Lighting */}
      <Environment preset="sunset" background blur={0.8} />
      <ambientLight intensity={timeOfDay === 1 ? 0.3 : 0.8} color={timeOfDay === 1 ? '#ffffff' : '#445588'} />

      <directionalLight
        ref={sunLightRef}
        castShadow
        position={[10, 15, 10]}
        intensity={2.5}
        color="#ffeedd"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      >
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15, 0.1, 50]} />
      </directionalLight>

      {/* Dynamic Dust Particles */}
      <DustParticles />

      <BuildingUnit name="UnitA" position={[-3.25, 0, 0]} isRight={false} opacity={opacities.A} exploded={exploded} isNight={timeOfDay === 0} />
      <Firewall opacity={opacities.firewall} />
      <BuildingUnit name="UnitB" position={[3.25, 0, 0]} isRight={true} opacity={opacities.B} exploded={exploded} isNight={timeOfDay === 0} />

      {/* Ground Plane (Grass/Concrete base) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#4a5e3f" roughness={1} />
      </mesh>

      {/* Driveways (Wet PBR Look) */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-3.25, -0.05, 7]}>
        <planeGeometry args={[6, 6]} />
        <primitive object={driveMat} attach="material" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[3.25, -0.05, 7]}>
        <planeGeometry args={[6, 6]} />
        <primitive object={driveMat} attach="material" />
      </mesh>

      <ContactShadows resolution={512} scale={30} blur={2.5} opacity={0.6} far={10} color="#000000" />

      {/* Cinematic Post-Processing */}
      <EffectComposer multisampling={0} disableNormalPass>
        <Bloom luminanceThreshold={0.85} luminanceSmoothing={0.9} intensity={0.5} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <Noise opacity={0.03} />
      </EffectComposer>
    </group>
  );
}

export default function Duplex3DPage() {
  const [activeUnit, setActiveUnit] = useState('full');
  const [exploded, setExploded] = useState(false);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState(1); // 1 = Golden Hour, 0 = Dusk

  const controlsRef = useRef();
  const controlsTarget = useRef(new THREE.Vector3(0, 3, 0));

  return (
    <div className="relative w-full bg-[#111111] min-h-screen overflow-hidden">

      {/* Controls HUD */}
      <div className="fixed top-32 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
        {/* Unit Selector */}
        <div className="flex gap-2 p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-2xl">
          <button onClick={() => setActiveUnit('full')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeUnit === 'full' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}>Full Duplex</button>
          <button onClick={() => setActiveUnit('A')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeUnit === 'A' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}>Unit A (Left)</button>
          <button onClick={() => setActiveUnit('B')} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${activeUnit === 'B' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}>Unit B (Right)</button>
        </div>

        {/* Time of Day Slider */}
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 shadow-2xl">
          <span className="text-xs text-white/70 font-semibold tracking-wider uppercase">Dusk</span>
          <input
            type="range"
            min="0" max="1" step="0.01"
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
            className="w-32 accent-white"
          />
          <span className="text-xs text-white/70 font-semibold tracking-wider uppercase">Golden Hour</span>
        </div>
      </div>

      <div className="fixed bottom-10 right-10 z-50">
        <Button
          variant={exploded ? "primary" : "outline"}
          onClick={() => setExploded(!exploded)}
          className="shadow-2xl"
        >
          {exploded ? 'Collapse Floors' : 'Explode Floors'}
        </Button>
      </div>

      {/* 3D Canvas fixed in background */}
      <div className="fixed inset-0 z-0 h-screen w-screen">
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          camera={{ position: [15, 12, 20], fov: 45 }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1,
            powerPreference: 'default'
          }}
          dpr={[1, 1.5]}
          onCreated={({ gl }) => {
            gl.shadowMap.type = THREE.PCFShadowMap;
          }}
        />
        <DuplexScene
          activeUnit={activeUnit}
          exploded={exploded}
          setControlsTarget={controlsTarget.current}
          controlsRef={controlsRef}
          disableOrbit={(val) => setOrbitEnabled(!val)}
          timeOfDay={timeOfDay}
        />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2 + 0.1}
          enabled={orbitEnabled}
        />
      </div>

      {/* Scrollable Content overlay for GSAP ScrollTrigger */}
      <div className="scroll-container relative z-10 w-full pointer-events-none mt-[100vh]">

        <section className="h-screen w-full flex items-center justify-start px-10 md:px-20">
          <div className="max-w-sm bg-black/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl pointer-events-auto border border-white/10 transition-transform duration-500 hover:-translate-y-2">
            <h2 className="text-3xl font-bold mb-4 text-white">Cinematic Living</h2>
            <p className="text-gray-300">Experience true architectural visualization. Dynamic PBR materials interact with golden hour ambient occlusion.</p>
          </div>
        </section>

        <section className="h-screen w-full flex items-center justify-end px-10 md:px-20">
          <div className="max-w-sm bg-black/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl pointer-events-auto border border-white/10 transition-transform duration-500 hover:-translate-y-2">
            <h2 className="text-3xl font-bold mb-4 text-white">Acoustic Separation</h2>
            <p className="text-gray-300">The 500mm concrete firewall ensures complete noise isolation, offering the privacy of a single-family home.</p>
          </div>
        </section>

        <section className="h-screen w-full flex items-center justify-start px-10 md:px-20">
          <div className="max-w-sm bg-black/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl pointer-events-auto border border-white/10 transition-transform duration-500 hover:-translate-y-2">
            <h2 className="text-3xl font-bold mb-4 text-white">Physical Glass</h2>
            <p className="text-gray-300">Accurate light transmission, refraction (IOR: 1.52), and clearcoat reflections create breathtaking realism.</p>
          </div>
        </section>

        <section className="h-screen w-full flex items-center justify-end px-10 md:px-20">
          <div className="max-w-sm bg-black/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl pointer-events-auto border border-white/10 transition-transform duration-500 hover:-translate-y-2">
            <h2 className="text-3xl font-bold mb-4 text-white">Master Suites</h2>
            <p className="text-gray-300">Elevated living spaces featuring private balconies overlooking the glowing driveway reflections.</p>
          </div>
        </section>

        <section className="h-screen w-full flex items-center justify-center px-10 md:px-20 pb-[20vh]">
          <div className="max-w-md bg-black/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl pointer-events-auto border border-white/10 text-center transition-transform duration-500 hover:-translate-y-2">
            <h2 className="text-3xl font-bold mb-4 text-white">Interactive Environment</h2>
            <p className="text-gray-300">Use the slider above to shift time from Dusk to Golden Hour, watching interior lights bloom naturally in the dark.</p>
          </div>
        </section>

      </div>
    </div>
  );
}
