/**
 * Terrain - Procedural ground plane
 * Will evolve into WebGPU heightmaps driven by codebase topology
 */

import { useRef } from 'react';
import { Color, type Mesh } from 'three';

interface TerrainProps {
  size?: number;
  color?: string;
}

export function Terrain({ size = 500, color = '#2d5016' }: TerrainProps) {
  const meshRef = useRef<Mesh>(null);

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size, 64, 64]} />
      <meshStandardMaterial color={new Color(color)} roughness={0.8} />
    </mesh>
  );
}
