import * as THREE from 'three';
import type { BranchSegment } from './TurtleInterpreter';
import type { PlatformConfig } from './PlatformConfig';

/**
 * NEST CONFIG
 *
 * Describes a "nest" — a concave bowl placed at a fork junction in the tree.
 * The nest serves as a player localization anchor and diagnostic reference point.
 *
 * The primary nest sits at the first fork junction (where the trunk splits),
 * but any fork junction can become a nest via re-localization.
 */

export interface NestConfig {
  /** Index of the parent branch whose endpoint is the fork */
  parentBranchIndex: number;
  /** World position of the fork junction (center of the nest) */
  nestPosition: THREE.Vector3;
  /** Radius of the nest bowl (derived from child branch spread) */
  nestRadius: number;
  /** Up direction at the nest (normalized parent branch direction) */
  nestUp: THREE.Vector3;
  /** Quaternion rotating world-Y to nestUp */
  nestOrientation: THREE.Quaternion;
  /** Anchor points where child branches emanate from the fork */
  nestBranchAnchors: NestBranchAnchor[];
  /** Inner hemisphere radius (interaction zone) */
  viewNearRadius: number;
  /** Outer hemisphere radius (LOD/draw-distance boundary) */
  viewFarRadius: number;
  /** Depth of the concave bowl */
  depth: number;
}

export interface NestBranchAnchor {
  /** World position of the anchor point */
  position: THREE.Vector3;
  /** Direction the child branch heads from this anchor */
  direction: THREE.Vector3;
  /** Index of the child branch in the branches array */
  branchIndex: number;
}

/** Result from fork junction detection */
export interface ForkJunction {
  /** World position of the fork point (parent branch endpoint) */
  forkPoint: THREE.Vector3;
  /** Indices of child branches emanating from this fork */
  childIndices: number[];
  /** Index of the parent branch whose endpoint is this fork */
  parentIndex: number;
}

// Reusable temporaries for computation — zero allocation in hot paths
const _dir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/**
 * Find all children of a given branch, returning the fork point and child indices.
 * Returns null if the branch has no children (leaf branch).
 */
export function findForkJunction(
  branches: BranchSegment[],
  parentIndex: number,
): ForkJunction | null {
  if (parentIndex < 0 || parentIndex >= branches.length) return null;

  const parent = branches[parentIndex]!;
  const childIndices: number[] = [];

  for (let i = 0; i < branches.length; i++) {
    if (branches[i]!.parentIndex === parentIndex) {
      childIndices.push(i);
    }
  }

  if (childIndices.length === 0) return null;

  return {
    forkPoint: parent.end.clone(),
    childIndices,
    parentIndex,
  };
}

/**
 * Walk the trunk chain from index 0 to find the last contiguous depth-0
 * segment before branching occurs. Handles multi-segment trunks where
 * consecutive G commands produce chained segments at depth 0.
 */
export function findTrunkTip(branches: BranchSegment[]): number {
  if (branches.length === 0) return -1;

  let tip = 0;
  for (let i = 1; i < branches.length; i++) {
    const b = branches[i]!;
    if (b.depth === 0 && b.parentIndex === tip) {
      tip = i;
    } else {
      break;
    }
  }
  return tip;
}

/**
 * Compute full nest configuration for a fork junction.
 *
 * Nest radius = max(child distances from fork) × 1.3, floored at 2× trunk radius.
 * Bowl depth = nestRadius × 0.3.
 * View near = nestRadius × 1.5.
 * View far = max(treeSpan × 0.5, nestRadius × 5).
 */
export function computeNestConfig(
  branches: BranchSegment[],
  parentBranchIndex: number,
  platformConfig: PlatformConfig,
): NestConfig | null {
  const fork = findForkJunction(branches, parentBranchIndex);
  if (!fork) return null;

  const parent = branches[parentBranchIndex]!;
  const forkPoint = fork.forkPoint;

  // Compute nest up vector from parent branch direction
  const nestUp = _dir
    .copy(parent.end)
    .sub(parent.start)
    .normalize()
    .clone();

  // Compute orientation quaternion: rotates world-Y to nestUp
  const nestOrientation = new THREE.Quaternion().setFromUnitVectors(_up, nestUp);

  // Compute anchor points and distances
  const anchors: NestBranchAnchor[] = [];
  let maxDist = 0;

  for (const childIdx of fork.childIndices) {
    const child = branches[childIdx]!;
    const dist = forkPoint.distanceTo(child.start);
    if (dist > maxDist) maxDist = dist;

    const dir = new THREE.Vector3()
      .copy(child.end)
      .sub(child.start)
      .normalize();

    anchors.push({
      position: child.start.clone(),
      direction: dir,
      branchIndex: childIdx,
    });
  }

  // Nest radius: max child distance × 1.3, floored at 2× trunk radius
  const nestRadius = Math.max(maxDist, platformConfig.trunkRadius * 2) * 1.3;
  const depth = nestRadius * 0.3;
  const viewNearRadius = nestRadius * 1.5;
  const viewFarRadius = Math.max(platformConfig.treeSpan * 0.5, nestRadius * 5);

  // Elevate nest position above the raw fork point for better visual prominence
  const elevatedPosition = forkPoint.clone().addScaledVector(nestUp, nestRadius * 0.5);

  return {
    parentBranchIndex,
    nestPosition: elevatedPosition,
    nestRadius,
    nestUp,
    nestOrientation,
    nestBranchAnchors: anchors,
    viewNearRadius,
    viewFarRadius,
    depth,
  };
}

/**
 * Convenience: compute nest config for the root trunk's first fork junction.
 * Follows the trunk chain to find the actual tip segment.
 */
export function computeRootNest(
  branches: BranchSegment[],
  platformConfig: PlatformConfig,
): NestConfig | null {
  if (branches.length === 0) return null;
  const trunkTip = findTrunkTip(branches);
  if (trunkTip < 0) return null;
  return computeNestConfig(branches, trunkTip, platformConfig);
}

/**
 * Generate a concave parabolic bowl profile for LatheGeometry.
 *
 * The profile goes from center (t=0) to rim (t=1):
 *   y = depth × (t² - 1) + rimHeight × t²
 *
 * Returns an array of Vector2 points where x = radius, y = height.
 */
export function createBowlProfile(
  nestRadius: number,
  depth: number,
  rimHeight: number,
  segments: number,
): THREE.Vector2[] {
  const points: THREE.Vector2[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const r = t * nestRadius;
    const y = depth * (t * t - 1) + rimHeight * t * t;
    points.push(new THREE.Vector2(r, y));
  }

  return points;
}

/** Falcon orbit constants (static defaults, also readable from authored params store) */
export const FALCON_ORBIT_SPEED = 0.15; // rad/s
export const FALCON_ORBIT_LAPS = 1.5; // how many full orbits before approach
export const FALCON_ORBIT_DURATION = (FALCON_ORBIT_LAPS * 2 * Math.PI) / FALCON_ORBIT_SPEED;
export const FALCON_APPROACH_DURATION = 4.0; // seconds for fly-in

/**
 * Dynamic getters that read from the authored params store when available,
 * falling back to the static constants above.
 */
let _storeAvailable = false;
let _getStoreParams: (() => { orbitSpeed: number; orbitLaps: number; approachDuration: number }) | null = null;

/** Register the store accessor — called once from useCameraEditorStore init */
export function registerFalconParamAccessor(
  accessor: () => { orbitSpeed: number; orbitLaps: number; approachDuration: number },
): void {
  _getStoreParams = accessor;
  _storeAvailable = true;
}

export function getFalconOrbitSpeed(): number {
  return _storeAvailable && _getStoreParams ? _getStoreParams().orbitSpeed : FALCON_ORBIT_SPEED;
}

export function getFalconOrbitLaps(): number {
  return _storeAvailable && _getStoreParams ? _getStoreParams().orbitLaps : FALCON_ORBIT_LAPS;
}

export function getFalconApproachDuration(): number {
  return _storeAvailable && _getStoreParams ? _getStoreParams().approachDuration : FALCON_APPROACH_DURATION;
}

/**
 * Compute falcon orbit camera position at a given angle.
 * Pure orbit math — no phase logic. Used by both the live camera and path visualization.
 */
export function falconOrbitAtAngle(
  angle: number,
  elapsedTime: number,
  nestConfig: NestConfig,
  platformConfig: PlatformConfig,
): THREE.Vector3 {
  const semiMajor = platformConfig.treeSpan * 0.8;
  const semiMinor = platformConfig.treeSpan * 0.5;
  const baseY = nestConfig.nestPosition.y + platformConfig.treeHeight * 0.6;
  const yOscillation = 0.15 * platformConfig.treeHeight * Math.sin(0.7 * elapsedTime);

  return new THREE.Vector3(
    nestConfig.nestPosition.x + semiMajor * Math.cos(angle),
    baseY + yOscillation,
    nestConfig.nestPosition.z + semiMinor * Math.sin(angle),
  );
}

/**
 * Compute falcon auto-orbit camera position and look target.
 *
 * Two phases:
 *   1. Orbit: elliptical path around nest (FALCON_ORBIT_LAPS laps)
 *   2. Approach: smooth bezier fly-in from orbit edge toward nest
 *
 * Returns phase alongside position/target so the component can track state.
 */
export function falconOrbitPosition(
  elapsedTime: number,
  nestConfig: NestConfig,
  platformConfig: PlatformConfig,
): { position: THREE.Vector3; target: THREE.Vector3; phase: 'orbit' | 'approach' | 'arrived' } {
  const cx = nestConfig.nestPosition.x;
  const cz = nestConfig.nestPosition.z;

  // Use dynamic getters for authored params (fall back to constants)
  const orbitSpeed = getFalconOrbitSpeed();
  const orbitLaps = getFalconOrbitLaps();
  const approachDuration = getFalconApproachDuration();
  const orbitDuration = (orbitLaps * 2 * Math.PI) / orbitSpeed;

  if (elapsedTime < orbitDuration) {
    // --- Orbit phase ---
    const angle = elapsedTime * orbitSpeed;
    const position = falconOrbitAtAngle(angle, elapsedTime, nestConfig, platformConfig);
    const target = nestConfig.nestPosition.clone();
    return { position, target, phase: 'orbit' };
  }

  // --- Approach phase ---
  const approachTime = elapsedTime - orbitDuration;

  if (approachTime >= approachDuration) {
    // Arrived — hover just above the nest
    const arriveY = nestConfig.nestPosition.y + nestConfig.depth + nestConfig.nestRadius * 0.8;
    const position = new THREE.Vector3(cx, arriveY, cz);
    const target = nestConfig.nestPosition.clone();
    return { position, target, phase: 'arrived' };
  }

  // Bezier fly-in: from last orbit position → above nest
  const t = approachTime / approachDuration;
  // Smooth ease-in-out
  const ease = t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // Start position: where orbit ended
  const endAngle = orbitDuration * orbitSpeed;
  const orbitEndPos = falconOrbitAtAngle(endAngle, orbitDuration, nestConfig, platformConfig);

  // End position: just above nest
  const arriveY = nestConfig.nestPosition.y + nestConfig.depth + nestConfig.nestRadius * 0.8;
  const nestAbove = new THREE.Vector3(cx, arriveY, cz);

  // Midpoint control: elevated halfway between orbit and nest
  const midX = (orbitEndPos.x + cx) * 0.5;
  const midZ = (orbitEndPos.z + cz) * 0.5;
  const midY = Math.max(orbitEndPos.y, arriveY) + platformConfig.treeHeight * 0.2;
  const controlPoint = new THREE.Vector3(midX, midY, midZ);

  // Quadratic bezier
  const position = new THREE.Vector3();
  position.x = (1 - ease) * (1 - ease) * orbitEndPos.x + 2 * (1 - ease) * ease * controlPoint.x + ease * ease * nestAbove.x;
  position.y = (1 - ease) * (1 - ease) * orbitEndPos.y + 2 * (1 - ease) * ease * controlPoint.y + ease * ease * nestAbove.y;
  position.z = (1 - ease) * (1 - ease) * orbitEndPos.z + 2 * (1 - ease) * ease * controlPoint.z + ease * ease * nestAbove.z;

  const target = nestConfig.nestPosition.clone();
  return { position, target, phase: 'approach' };
}

/**
 * Generate an array of points along the full falcon flight path
 * (orbit + approach) for debug visualization.
 */
export function falconPathPoints(
  nestConfig: NestConfig,
  platformConfig: PlatformConfig,
  samplesPerLap: number = 64,
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  // Orbit phase samples
  const orbitSamples = Math.ceil(samplesPerLap * FALCON_ORBIT_LAPS);
  for (let i = 0; i <= orbitSamples; i++) {
    const t = (i / orbitSamples) * FALCON_ORBIT_DURATION;
    const { position } = falconOrbitPosition(t, nestConfig, platformConfig);
    points.push(position);
  }

  // Approach phase samples
  const approachSamples = Math.ceil(samplesPerLap * 0.5);
  for (let i = 1; i <= approachSamples; i++) {
    const t = FALCON_ORBIT_DURATION + (i / approachSamples) * FALCON_APPROACH_DURATION;
    const { position } = falconOrbitPosition(t, nestConfig, platformConfig);
    points.push(position);
  }

  return points;
}
