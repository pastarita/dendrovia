/**
 * Effects - Post Processing Pipeline
 * Bloom for magical elements, vignette for atmosphere
 */

import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export function Effects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={0.3}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.9}
      />
      <Vignette
        offset={0.3}
        darkness={0.5}
      />
    </EffectComposer>
  );
}
