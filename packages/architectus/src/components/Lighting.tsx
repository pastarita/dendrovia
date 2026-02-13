import { useRendererStore } from '../store/useRendererStore';

/**
 * Tron-aesthetic lighting setup.
 *
 * Low ambient (dark world) + strong directional (sharp shadows) +
 * hemisphere for subtle ground-to-sky gradient. The dendrites themselves
 * provide light via emissive materials + bloom.
 */
export function Lighting() {
  const shadows = useRendererStore((s) => s.quality.shadows);

  return (
    <>
      {/* Subtle ambient — the world is dark, light comes from the dendrites */}
      <ambientLight intensity={0.15} color="#1a1a2e" />

      {/* Main directional — Monument Valley-style top-down key light */}
      <directionalLight
        position={[10, 20, -5]}
        intensity={0.6}
        color="#e0e0ff"
        castShadow={shadows}
        shadow-mapSize-width={shadows ? 2048 : 0}
        shadow-mapSize-height={shadows ? 2048 : 0}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Fill light from below — gives the "floating in void" feel */}
      <directionalLight
        position={[-5, -10, 5]}
        intensity={0.1}
        color="#00ffff"
      />

      {/* Hemisphere: dark ground, slightly blue sky */}
      <hemisphereLight
        args={['#1a1a3e', '#0a0a0a', 0.2]}
      />
    </>
  );
}
