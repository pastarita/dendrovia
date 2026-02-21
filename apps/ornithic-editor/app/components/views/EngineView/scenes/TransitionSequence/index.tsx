/**
 * TransitionSequence — Nest-build swirl animation.
 * Plays during the parse→render transition.
 */

import React from "react";

export interface TransitionSequenceProps {
  active: boolean;
}

export const TransitionSequence: React.FC<TransitionSequenceProps> = ({
  active,
}) => {
  if (!active) return null;

  return (
    <group>
      {/* Swirl particle placeholder */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[3, 0.05, 8, 64]} />
        <meshStandardMaterial color="#c77b3f" transparent opacity={0.6} />
      </mesh>
    </group>
  );
};
