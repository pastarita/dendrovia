import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { ProceduralPalette } from '@dendrovia/shared';
import { useSegmentStore } from '../store/useSegmentStore';
import { useRendererStore } from '../store/useRendererStore';
import { SDFBackdrop } from './SDFBackdrop';
import { RootPlatform } from './RootPlatform';
import { SegmentRenderer } from './SegmentRenderer';
import { SegmentDistanceUpdater } from './SegmentDistanceUpdater';
import { WorldFog } from './WorldFog';
import { configFromWorldIndex } from '../systems/PlatformConfig';
import { NestPlatform } from './NestPlatform';
import { ViewFrame } from './ViewFrame';
import { NestInspector } from './NestInspector';

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

/**
 * Reads activeNest from store and renders NestPlatform + ViewFrame.
 * Used in SegmentedWorld where full tree geometry isn't available locally.
 */
function NestFromStore({
  palette,
  viewFrameVisible,
}: {
  palette: { primary: string; secondary: string; glow: string; accent: string };
  viewFrameVisible: boolean;
}) {
  const activeNest = useRendererStore((s) => s.activeNest);
  if (!activeNest) return null;
  return (
    <>
      <NestPlatform nestConfig={activeNest} palette={palette} />
      <ViewFrame
        nestConfig={activeNest}
        visible={viewFrameVisible}
        palette={palette}
      />
    </>
  );
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

  // Compute platform config from world index extent
  const platformConfig = useMemo(() => {
    if (!worldIndex) return null;
    return configFromWorldIndex(worldIndex);
  }, [worldIndex]);

  // Publish platform config to store for CameraRig
  useEffect(() => {
    if (platformConfig) {
      useRendererStore.getState().setPlatformConfig(platformConfig);
    }
    return () => useRendererStore.getState().setPlatformConfig(null);
  }, [platformConfig]);

  // Read view frame visibility from store
  const viewFrameVisible = useRendererStore((s) => s.viewFrameVisible);

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
      {/* Root platform — persistent spawn base, scaled to world extent */}
      {platformConfig && (
        <RootPlatform palette={palette} routes={routes} config={platformConfig} />
      )}

      {/* Nest platform + view frame (from store activeNest, set by DendriteWorld path) */}
      <NestFromStore palette={palette} viewFrameVisible={viewFrameVisible} />

      {/* Inspection mode — measurements + debug labels */}
      <NestInspector />

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
