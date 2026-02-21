/**
 * CoordinationZone — Full-scale tree + nest scene.
 * The primary workspace view after parsing completes.
 */

import React from "react";

export const CoordinationZone: React.FC = () => {
  return (
    <group>
      {/* Platform */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[15, 64]} />
        <meshStandardMaterial color="#1a1510" />
      </mesh>
      {/* Tree placeholder — will be driven by topology data */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 4, 12]} />
        <meshStandardMaterial color="#5f4b1e" />
      </mesh>
    </group>
  );
};
