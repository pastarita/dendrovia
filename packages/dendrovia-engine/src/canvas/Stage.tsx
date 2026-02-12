/**
 * Stage - The R3F Canvas Entry Point
 * Orchestrates the entire 3D scene with camera, lighting, and effects
 */

import { Canvas } from '@react-three/fiber';
import { Skybox } from './Skybox';
import { Lighting } from './Lighting';
import { Effects } from './Effects';
import type { ReactNode } from 'react';

interface StageProps {
  children?: ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
}

export function Stage({
  children,
  cameraPosition = [0, 50, 100],
  fov = 75
}: StageProps) {
  return (
    <Canvas
      camera={{
        position: cameraPosition,
        fov,
        near: 0.1,
        far: 2000,
      }}
      shadows
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
    >
      {/* Environmental Setup */}
      <Skybox />
      <Lighting />

      {/* Game World Content */}
      {children}

      {/* Post Processing */}
      <Effects />
    </Canvas>
  );
}
