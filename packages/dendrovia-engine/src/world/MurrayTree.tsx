/**
 * MurrayTree - Fractal tree visualization
 * Represents code structure following Murray's Law for branching
 * This is a simple placeholder - will evolve into L-Systems
 */

import { useRef } from 'react';
import { Mesh, CylinderGeometry, MeshStandardMaterial, Color } from 'three';
import { useFrame } from '@react-three/fiber';

interface MurrayTreeProps {
  position?: [number, number, number];
  height?: number;
  complexity?: number;
}

export function MurrayTree({
  position = [0, 0, 0],
  height = 10,
  complexity = 1,
}: MurrayTreeProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Simple rotation for now
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Trunk */}
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.8, height, 8]} />
        <meshStandardMaterial color={new Color(0.3, 0.2, 0.1)} />
      </mesh>

      {/* Simple branch placeholder */}
      <mesh position={[0, height / 2, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, height * 0.6, 6]} />
        <meshStandardMaterial color={new Color(0.35, 0.25, 0.12)} />
      </mesh>

      {/* Canopy placeholder */}
      <mesh position={[0, height * 0.8, 0]} castShadow>
        <sphereGeometry args={[height * 0.4, 8, 8]} />
        <meshStandardMaterial color={new Color(0.1, 0.4, 0.1)} />
      </mesh>
    </group>
  );
}
