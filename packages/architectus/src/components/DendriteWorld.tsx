import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { FileTreeNode, Hotspot, ProceduralPalette, LSystemRule, StoryArc } from '@dendrovia/shared';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { BranchEnteredEvent, EncounterTriggeredEvent, DamageDealtEvent } from '@dendrovia/shared';
import { LSystem } from '../systems/LSystem';
import { TurtleInterpreter } from '../systems/TurtleInterpreter';
import { SpatialIndex } from '../systems/SpatialIndex';
import { mapNodesToSegments } from '../systems/SegmentMapper';
import { BranchInstances } from './BranchInstances';
import { NodeInstances } from './NodeInstances';
import { MushroomInstances } from './MushroomInstances';
import { ParticleInstances } from './ParticleInstances';
import { SegmentOverlay } from './SegmentOverlay';
import { SDFBackdrop } from './SDFBackdrop';
import { RootPlatform } from './RootPlatform';
import { useRendererStore } from '../store/useRendererStore';
import { ParticleSystem, BURST_CONFIG } from '../systems/ParticleSystem';

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
  /** Story arc from LUDUS — drives segment overlay glow regions (D7) */
  storyArc?: StoryArc | null;
  /** Currently active segment ID (quest target) for pulsing highlight */
  activeSegmentId?: string | null;
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
 * Uses SpatialIndex for O(1) average-case proximity queries instead of
 * the previous O(n) linear scan. Checks every ~10 frames.
 */
function BranchTracker({ spatialIndex }: { spatialIndex: SpatialIndex }) {
  const { camera } = useThree();
  const frameCounter = useRef(0);

  useFrame(() => {
    frameCounter.current += 1;
    // Only check every 10 frames (~6 times/sec at 60fps)
    if (frameCounter.current % 10 !== 0) return;
    if (spatialIndex.nodeCount === 0) return;

    const closestNode = spatialIndex.nearestNode(camera.position);
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

export function DendriteWorld({ topology, hotspots = [], palette, lsystemOverride, storyArc, activeSegmentId }: DendriteWorldProps) {
  // Pull generated assets and SDF backdrop toggle from the store
  const generatedAssets = useRendererStore((s) => s.generatedAssets);
  const sdfBackdrop = useRendererStore((s) => s.sdfBackdrop);

  // D8: Particle system ref for burst calls from event handlers
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const onParticleSystemReady = useCallback((system: ParticleSystem) => {
    particleSystemRef.current = system;
  }, []);

  // Generate tree geometry from topology (memoized — expensive computation)
  // When IMAGINARIUM provides L-system rules, use its angle for the interpreter.
  const treeGeometry = useMemo(() => {
    const lSystem = LSystem.fromTopology(topology, hotspots);
    const turtleString = lSystem.expand();
    const defaultAngle = lsystemOverride?.angle;
    const interpreter = new TurtleInterpreter(defaultAngle);
    return interpreter.interpret(turtleString);
  }, [topology, hotspots, lsystemOverride]);

  // Build spatial index from geometry (memoized — rebuilds only when tree changes)
  const spatialIndex = useMemo(() => {
    const index = new SpatialIndex();
    index.rebuild(treeGeometry.nodes, treeGeometry.branches, treeGeometry.boundingBox);
    return index;
  }, [treeGeometry]);

  // D4: Publish spatial index to store so CameraRig can access it
  useEffect(() => {
    useRendererStore.getState().setSpatialIndex(spatialIndex);
    return () => useRendererStore.getState().setSpatialIndex(null);
  }, [spatialIndex]);

  // Compute route indicators from depth-0 branches that have the root trunk as parent
  const routes = useMemo(() => {
    return treeGeometry.branches
      .filter((b) => b.depth === 0 && b.parentIndex === 0)
      .map((b) => ({
        direction: new THREE.Vector3().subVectors(b.end, b.start).normalize(),
        label: '',
      }));
  }, [treeGeometry.branches]);

  // Publish root spawn point to store
  useEffect(() => {
    useRendererStore.getState().setRootSpawnPoint([0, 0.8, -2.5]);
    return () => useRendererStore.getState().setRootSpawnPoint(null);
  }, [treeGeometry]);

  // Resolve mushroom rendering data from generated assets.
  // Both specimens and meshes must be present to render mushroom instances.
  const mushroomSpecimens = generatedAssets?.mycology?.specimens ?? null;
  const mushroomMeshes = generatedAssets?.meshes ?? null;

  // Resolve first available shader source for SDF backdrop
  const firstShaderSource = useMemo(() => {
    if (!generatedAssets?.shaders) return null;
    const entries = Object.values(generatedAssets.shaders);
    return entries.length > 0 ? entries[0] : null;
  }, [generatedAssets?.shaders]);

  // D7: Map story arc segments to spatial placements for the overlay
  const segmentPlacements = useMemo(() => {
    if (!storyArc) return new Map();
    return mapNodesToSegments(treeGeometry.nodes, storyArc);
  }, [treeGeometry.nodes, storyArc]);

  // D6: Bounding box for particle system ambient spawning
  const sceneBounds = useMemo(() => {
    return treeGeometry.boundingBox.clone().expandByScalar(2);
  }, [treeGeometry.boundingBox]);

  // D8: Listen to LUDUS events for visual feedback
  useEffect(() => {
    const bus = getEventBus();
    const store = useRendererStore.getState;

    // ENCOUNTER_TRIGGERED → emissive pulse on target node
    const unsubEncounter = bus.on<EncounterTriggeredEvent>(
      GameEvents.ENCOUNTER_TRIGGERED,
      (event) => {
        // Use the nearest node to the encounter position as the target
        const nearest = spatialIndex.nearestNode(
          new THREE.Vector3(...event.position),
        );
        if (nearest) {
          store().setEncounterNode(nearest.path);
          // Clear encounter after 2 seconds
          setTimeout(() => store().setEncounterNode(null), 2000);
        }
      },
    );

    // DAMAGE_DEALT → particle burst at impact position
    const unsubDamage = bus.on<DamageDealtEvent>(
      GameEvents.DAMAGE_DEALT,
      (event) => {
        // DamageDealtEvent has no position — use encounter node position or camera
        const encounterNodeId = store().encounterNodeId;
        let burstPos: THREE.Vector3 | null = null;

        if (encounterNodeId) {
          const node = treeGeometry.nodes.find((n) => n.path === encounterNodeId);
          if (node) burstPos = node.position.clone();
        }

        if (!burstPos) return;

        const ps = particleSystemRef.current;
        if (ps) {
          const burstColor = event.isCritical
            ? new THREE.Color('#ffaa00')
            : new THREE.Color('#ff4444');
          ps.burst(burstPos, { ...BURST_CONFIG, color: burstColor });
        }
      },
    );

    return () => {
      unsubEncounter();
      unsubDamage();
    };
  }, [spatialIndex, treeGeometry.nodes]);

  return (
    <group name="dendrite-world">
      {/* Root platform — persistent spawn base at origin */}
      <RootPlatform palette={palette} routes={routes} rootName={topology.name} />

      {/* SDF backdrop — fullscreen raymarching shader behind the scene */}
      {sdfBackdrop && firstShaderSource && (
        <SDFBackdrop
          shaderSource={firstShaderSource}
          palette={palette}
        />
      )}

      {/* Branch proximity tracker — emits BRANCH_ENTERED events (O(1) via SpatialIndex) */}
      <BranchTracker spatialIndex={spatialIndex} />

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

      {/* D6: Ambient firefly particles + D8: burst VFX via systemRef */}
      <ParticleInstances bounds={sceneBounds} color={palette.glow} systemRef={onParticleSystemReady} />

      {/* D7: Story arc segment glow regions */}
      {segmentPlacements.size > 0 && (
        <SegmentOverlay
          placements={segmentPlacements}
          activeSegmentId={activeSegmentId}
          glowColor={palette.glow}
        />
      )}
    </group>
  );
}
