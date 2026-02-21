/**
 * PantheonVestibule — Entry dome scene with bonsai tree and tool pedestals.
 * The initial scene after URL submission, before full tree loads.
 */

import React from "react";

export const PantheonVestibule: React.FC = () => {
  return (
    <group>
      {/* Dome shell */}
      <mesh position={[0, 5, 0]}>
        <sphereGeometry args={[10, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#1a1510"
          transparent
          opacity={0.3}
          side={2}
        />
      </mesh>
      {/* Central bonsai placeholder */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 1, 8]} />
        <meshStandardMaterial color="#5f4b1e" />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#1e5f3b" />
      </mesh>
    </group>
  );
};
