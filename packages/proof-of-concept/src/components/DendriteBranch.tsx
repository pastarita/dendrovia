/**
 * ARCHITECTUS: Procedural Branch Rendering
 *
 * This component renders a single SDF-based branch.
 * In the full version, this would use the generated GLSL shader.
 * For the POC, we use a simple mesh approximation.
 */

import { GameEvents, getEventBus } from '@dendrovia/shared';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { Mesh } from 'three';

// Load generated palette (in real version, this would be dynamic)
const palette = {
  primary: '#4d9a6c',
  glow: '#6dffaa',
};

export function DendriteBranch({ onClick }: { onClick: () => void }) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Gentle animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const handleClick = () => {
    const eventBus = getEventBus();
    eventBus.emit(GameEvents.NODE_CLICKED, {
      nodeId: 'package.json',
      filePath: 'package.json',
      position: [0, 0, 0] as [number, number, number],
    });
    onClick();
  };

  return (
    <group>
      {/* Main trunk */}
      <mesh
        ref={meshRef}
        position={[0, 1, 0]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.1, 0.15, 2, 16]} />
        <meshStandardMaterial
          color={hovered ? palette.glow : palette.primary}
          emissive={hovered ? palette.glow : palette.primary}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Branches (complexity visualization) */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        const height = 0.5 + i * 0.2;
        const x = Math.sin(angle) * 0.5;
        const z = Math.cos(angle) * 0.5;

        return (
          <mesh key={i} position={[x, height + 1, z]} rotation={[Math.PI / 4, angle, 0]}>
            <cylinderGeometry args={[0.03, 0.05, 0.6, 8]} />
            <meshStandardMaterial color={palette.primary} emissive={palette.primary} emissiveIntensity={0.2} />
          </mesh>
        );
      })}

      {/* Glow effect when hovered */}
      {hovered && <pointLight position={[0, 1, 0]} color={palette.glow} intensity={2} distance={3} />}
    </group>
  );
}
