/**
 * Skybox - Procedurally Generated Sky
 * Eventually driven by repository "mood" (commit frequency, bug density, etc.)
 */

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BackSide, Color, type Mesh } from 'three';

export function Skybox() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_state) => {
    // Subtle rotation for dynamic feel
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0001;
    }
  });

  return (
    <mesh ref={meshRef} scale={[1000, 1000, 1000]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color={new Color(0.1, 0.15, 0.25)} side={BackSide} fog={false} />
    </mesh>
  );
}
