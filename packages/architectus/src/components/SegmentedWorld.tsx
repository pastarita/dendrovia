import { useMemo } from 'react';
import * as THREE from 'three';
import type { ProceduralPalette } from '@dendrovia/shared';
import { useSegmentStore } from '../store/useSegmentStore';
import { useRendererStore } from '../store/useRendererStore';
import { SDFBackdrop } from './SDFBackdrop';
import { RootPlatform } from './RootPlatform';
import { SegmentRenderer } from './SegmentRenderer';
import { SegmentDistanceUpdater } from './SegmentDistanceUpdater';
import { WorldFog } from './WorldFog';

/**
 * SEGMENTED WORLD
 *
 * Scene root for segmented world rendering. Replaces DendriteWorld
 * when the world index has loaded (worldReady === true).
 *
 * Iterates segments from the segment store and renders each via
 * SegmentRenderer, which handles per-segment LOD decisions.
 *
 * Also includes:
 *   - SegmentDistanceUpdater (O(N) distance checks every 10 frames)
 *   - WorldFog (hides loading boundaries)
 *   - SDFBackdrop (optional fullscreen shader backdrop)
 */

interface SegmentedWorldProps {
  palette: ProceduralPalette;
}

export function SegmentedWorld({ palette }: SegmentedWorldProps) {
  const segments = useSegmentStore((s) => s.segments);
  const worldIndex = useSegmentStore((s) => s.worldIndex);
  const generatedAssets = useRendererStore((s) => s.generatedAssets);
  const sdfBackdrop = useRendererStore((s) => s.sdfBackdrop);

  // Resolve mushroom mesh data from generated assets
  const mushMeshData = generatedAssets?.meshes ?? null;

  // Resolve first available shader source for SDF backdrop
  const firstShaderSource = useMemo(() => {
    if (!generatedAssets?.shaders) return null;
    const entries = Object.values(generatedAssets.shaders);
    return entries.length > 0 ? entries[0] : null;
  }, [generatedAssets?.shaders]);

  // Derive route directions from world index placements
  const routes = useMemo(() => {
    if (!worldIndex?.placements) return [];
    return worldIndex.placements.map((p) => ({
      direction: new THREE.Vector3(p.centroid[0], 0, p.centroid[2]).normalize(),
      label: p.label,
    }));
  }, [worldIndex]);

  // Convert segments map to array for rendering
  const segmentArray = useMemo(
    () => Array.from(segments.values()),
    [segments],
  );

  return (
    <group name="segmented-world">
      {/* Root platform — persistent spawn base at origin (outside segment map) */}
      <RootPlatform palette={palette} routes={routes} rootName="world" />

      {/* Distance tracking + load triggering */}
      <SegmentDistanceUpdater />

      {/* Atmospheric fog */}
      <WorldFog />

      {/* SDF backdrop — fullscreen raymarching shader behind the scene */}
      {sdfBackdrop && firstShaderSource && (
        <SDFBackdrop shaderSource={firstShaderSource} palette={palette} />
      )}

      {/* Render each segment at its LOD level */}
      {segmentArray.map((segment) => (
        <SegmentRenderer
          key={segment.id}
          segment={segment}
          palette={palette}
          mushMeshData={mushMeshData}
        />
      ))}
    </group>
  );
}
