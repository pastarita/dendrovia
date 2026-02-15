import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { FileTreeNode, Hotspot, ProceduralPalette, LSystemRule } from '@dendrovia/shared';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { BranchEnteredEvent } from '@dendrovia/shared';
import { LSystem } from '../systems/LSystem';
import { TurtleInterpreter, type NodeMarker } from '../systems/TurtleInterpreter';
import { BranchInstances } from './BranchInstances';
import { NodeInstances } from './NodeInstances';
import { MushroomInstances } from './MushroomInstances';
import { useRendererStore } from '../store/useRendererStore';

/**
 * DENDRITE WORLD
 *
 * The core scene container that transforms code topology into a 3D tree.
 *
 * Pipeline:
 *   1. FileTreeNode (from CHRONOS) → LSystem.fromTopology()
 *   2. LSystem.expand() → turtle string
 *   3. TurtleInterpreter.interpret() → BranchSegment[] + NodeMarker[]
 *   4. BranchInstances + NodeInstances → GPU-instanced geometry
 *
 * This component is memoized — it only regenerates when topology changes.
 */

interface DendriteWorldProps {
  topology: FileTreeNode;
  hotspots?: Hotspot[];
  palette: ProceduralPalette;
  /** Optional L-system rules from IMAGINARIUM. When provided, the angle and
   *  iterations override the defaults derived from topology. */
  lsystemOverride?: LSystemRule;
}

/**
 * Derives a branchId from a node path by taking its parent directory.
 * e.g. "src/utils/helpers.ts" -> "src/utils"
 */
function deriveBranchId(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash > 0 ? path.substring(0, lastSlash) : 'root';
}

/**
 * BRANCH TRACKER
 *
 * Runs inside the R3F render loop to detect which branch (directory) the
 * camera is closest to. When the branch changes, emits BRANCH_ENTERED
 * and updates the store's playerBranchId.
 *
 * Checks every ~10 frames to avoid per-frame overhead.
 */
function BranchTracker({ nodes }: { nodes: NodeMarker[] }) {
  const { camera } = useThree();
  const frameCounter = useRef(0);
  const _pos = useRef(new THREE.Vector3());

  useFrame(() => {
    frameCounter.current += 1;
    // Only check every 10 frames (~6 times/sec at 60fps)
    if (frameCounter.current % 10 !== 0) return;
    if (nodes.length === 0) return;

    // Find the closest node to the camera
    let closestDist = Infinity;
    let closestNode: NodeMarker | null = null;
    _pos.current.copy(camera.position);

    for (let i = 0; i < nodes.length; i++) {
      const d = _pos.current.distanceToSquared(nodes[i].position);
      if (d < closestDist) {
        closestDist = d;
        closestNode = nodes[i];
      }
    }

    if (!closestNode) return;

    const newBranchId = deriveBranchId(closestNode.path);
    const currentBranchId = useRendererStore.getState().playerBranchId;

    if (newBranchId !== currentBranchId) {
      useRendererStore.getState().setPlayerBranch(newBranchId);

      getEventBus().emit<BranchEnteredEvent>(GameEvents.BRANCH_ENTERED, {
        branchId: newBranchId,
        filePath: closestNode.path,
        depth: closestNode.depth,
      });
    }
  });

  return null;
}

export function DendriteWorld({ topology, hotspots = [], palette, lsystemOverride }: DendriteWorldProps) {
  // Pull generated assets from the store (loaded by AssetBridge)
  const generatedAssets = useRendererStore((s) => s.generatedAssets);

  // Generate tree geometry from topology (memoized — expensive computation)
  // When IMAGINARIUM provides L-system rules, use its angle for the interpreter.
  const treeGeometry = useMemo(() => {
    const lSystem = LSystem.fromTopology(topology, hotspots);
    const turtleString = lSystem.expand();
    const defaultAngle = lsystemOverride?.angle;
    const interpreter = new TurtleInterpreter(defaultAngle);
    return interpreter.interpret(turtleString);
  }, [topology, hotspots, lsystemOverride]);

  // Resolve mushroom rendering data from generated assets.
  // Both specimens and meshes must be present to render mushroom instances.
  const mushroomSpecimens = generatedAssets?.mycology?.specimens ?? null;
  const mushroomMeshes = generatedAssets?.meshes ?? null;

  return (
    <group name="dendrite-world">
      {/* Branch proximity tracker — emits BRANCH_ENTERED events */}
      <BranchTracker nodes={treeGeometry.nodes} />

      {/* Branch geometry — instanced cylinders */}
      <BranchInstances
        branches={treeGeometry.branches}
        palette={{
          primary: palette.primary,
          secondary: palette.secondary,
          glow: palette.glow,
        }}
      />

      {/* Node markers — instanced spheres */}
      <NodeInstances
        nodes={treeGeometry.nodes}
        palette={{
          accent: palette.accent,
          glow: palette.glow,
        }}
      />

      {/* Mushroom specimens — instanced meshes from IMAGINARIUM mycology */}
      {mushroomSpecimens && mushroomSpecimens.length > 0 && mushroomMeshes && mushroomMeshes.size > 0 && (
        <MushroomInstances
          specimens={mushroomSpecimens}
          meshData={mushroomMeshes}
          palette={palette}
        />
      )}
    </group>
  );
}
