import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';

function Starfield(props) {
  const ref = useRef();
  
  // Generate 4000 particles in a sphere using useMemo so it only calculates once
  const sphere = useMemo(() => random.inSphere(new Float32Array(4000), { radius: 1.5 }), []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    // Slow, cinematic rotation
    ref.current.rotation.x -= delta / 15;
    ref.current.rotation.y -= delta / 20;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#0d9488" /* Elegant teal color matching our theme */
          size={0.004}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}

export default function DynamicBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 2]}>
        <Starfield />
      </Canvas>
    </div>
  );
}
