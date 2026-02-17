import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ProceduralPalette, LSystemRule } from '@dendrovia/shared';
import type { SegmentState } from '../store/useSegmentStore';
import { useSegmentStore } from '../store/useSegmentStore';
import { getQuality } from '../store/useRendererStore';
import { LSystem } from '../systems/LSystem';
import { TurtleInterpreter } from '../systems/TurtleInterpreter';
import { BranchInstances } from './BranchInstances';
import { NodeInstances } from './NodeInstances';
import { MushroomInstances } from './MushroomInstances';
import { SegmentHull } from './SegmentHull';

/**
 * SEGMENT RENDERER
 *
 * Renders a single segment at the appropriate LOD based on camera distance.
 *
 * LOD tiers (distance measured as multiples of segment radius):
 *   hidden   → >20x radius: nothing rendered
 *   hull     → >8x radius:  translucent convex silhouette (1 draw call)
 *   branches → >3x radius:  BranchInstances + NodeInstances
 *   full     → <3x radius:  branches + nodes + mushrooms
 *
 * lodBias from quality presets shifts thresholds closer for lower-end GPUs.
 * Opacity fades in over ~20 frames when transitioning up in detail.
 */

interface SegmentRendererProps {
  segment: SegmentState;
  palette: ProceduralPalette;
  mushMeshData: Map<string, any> | null;
}

/** LOD thresholds (in multiples of segment radius). */
const LOD_THRESHOLDS = {
  hidden: 20,
  hull: 8,
  branches: 3,
};

type LODLevel = 'hidden' | 'hull' | 'branches' | 'full';

/** Compute the visual LOD tier for a segment. */
function computeLOD(
  distance: number,
  radius: number,
  lodBias: number,
): LODLevel {
  // lodBias shifts thresholds inward (higher bias = more aggressive culling)
  const biasScale = 1 - lodBias * 0.12;
  const safeRadius = Math.max(radius, 1);
  const ratio = distance / safeRadius;

  if (ratio > LOD_THRESHOLDS.hidden * biasScale) return 'hidden';
  if (ratio > LOD_THRESHOLDS.hull * biasScale) return 'hull';
  if (ratio > LOD_THRESHOLDS.branches * biasScale) return 'branches';
  return 'full';
}

/** Fade speed: opacity per frame (reaches 1.0 in ~20 frames at 60fps). */
const FADE_SPEED = 0.05;

export function SegmentRenderer({ segment, palette, mushMeshData }: SegmentRendererProps) {
  const opacityRef = useRef(segment.opacity);
  const prevLodRef = useRef<LODLevel>('hidden');

  // Compute LOD from distance
  const lodBias = getQuality().lodBias;
  const lod = computeLOD(
    segment.distanceToCamera,
    segment.placement.radius,
    lodBias,
  );

  // Detect LOD transitions for fade-in
  if (lod !== prevLodRef.current) {
    const lodOrder: LODLevel[] = ['hidden', 'hull', 'branches', 'full'];
    const prevIdx = lodOrder.indexOf(prevLodRef.current);
    const currIdx = lodOrder.indexOf(lod);
    // If transitioning to higher detail, reset opacity for fade-in
    if (currIdx > prevIdx) {
      opacityRef.current = 0;
    }
    prevLodRef.current = lod;
  }

  // Animate opacity fade-in
  useFrame(() => {
    if (opacityRef.current < 1) {
      opacityRef.current = Math.min(1, opacityRef.current + FADE_SPEED);
      useSegmentStore.getState().setSegmentOpacity(segment.id, opacityRef.current);
    }
  });

  // Generate tree geometry from segment's topology data (memoized)
  const treeGeometry = useMemo(() => {
    if (!segment.data?.topology?.tree) return null;
    const lSystem = LSystem.fromTopology(segment.data.topology.tree);
    const turtleString = lSystem.expand();
    const lsystemRule = segment.data.lsystem;
    const interpreter = new TurtleInterpreter(lsystemRule?.angle);
    return interpreter.interpret(turtleString);
  }, [segment.data?.topology?.tree, segment.data?.lsystem]);

  // Resolve palette: per-segment if available, else global
  const segPalette = segment.data?.palette ?? palette;

  // Hidden: render nothing
  if (lod === 'hidden') return null;

  const opacity = opacityRef.current;

  // Hull: lightweight convex silhouette
  if (lod === 'hull' || !treeGeometry) {
    return (
      <group name={`segment-${segment.id}`}>
        <SegmentHull placement={segment.placement} opacity={opacity} />
      </group>
    );
  }

  // Branches: topology geometry (no mushrooms)
  if (lod === 'branches') {
    return (
      <group name={`segment-${segment.id}`}>
        <BranchInstances
          branches={treeGeometry.branches}
          palette={{
            primary: segPalette.primary,
            secondary: segPalette.secondary,
            glow: segPalette.glow,
          }}
        />
        <NodeInstances
          nodes={treeGeometry.nodes}
          palette={{
            accent: segPalette.accent,
            glow: segPalette.glow,
          }}
        />
      </group>
    );
  }

  // Full: branches + nodes + mushrooms
  const specimens = segment.data?.specimens ?? null;

  return (
    <group name={`segment-${segment.id}`}>
      <BranchInstances
        branches={treeGeometry.branches}
        palette={{
          primary: segPalette.primary,
          secondary: segPalette.secondary,
          glow: segPalette.glow,
        }}
      />
      <NodeInstances
        nodes={treeGeometry.nodes}
        palette={{
          accent: segPalette.accent,
          glow: segPalette.glow,
        }}
      />
      {specimens && specimens.length > 0 && mushMeshData && mushMeshData.size > 0 && (
        <MushroomInstances
          specimens={specimens}
          meshData={mushMeshData}
          palette={segPalette}
        />
      )}
    </group>
  );
}
