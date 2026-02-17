import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSegmentStore } from '../store/useSegmentStore';

/**
 * WORLD FOG
 *
 * Adds exponential-squared fog to the scene based on world radius.
 * Hides loading boundaries by obscuring distant segments.
 *
 * Fog starts at ~30% of world radius, fully obscures at ~90%.
 * Color matches the scene background for seamless blending.
 */

const FOG_COLOR = '#0a0a0a';

export function WorldFog() {
  const { scene } = useThree();
  const worldReady = useSegmentStore((s) => s.worldReady);
  const worldIndex = useSegmentStore((s) => s.worldIndex);

  useEffect(() => {
    if (!worldReady || !worldIndex) {
      // No segmented world — use a default gentle fog
      scene.fog = new THREE.FogExp2(FOG_COLOR, 0.008);
      return;
    }

    // Compute fog density from world radius
    // FogExp2 density: visibility ~ exp(-density * distance^2)
    // We want ~95% opacity at 90% of world radius
    // -ln(0.05) / (0.9 * worldRadius)^2 ≈ density
    const extent = Math.max(worldIndex.worldRadius, 20);
    const farEdge = extent * 0.9;
    const density = Math.sqrt(-Math.log(0.05)) / farEdge;

    scene.fog = new THREE.FogExp2(FOG_COLOR, density);

    return () => {
      scene.fog = null;
    };
  }, [scene, worldReady, worldIndex]);

  return null;
}
