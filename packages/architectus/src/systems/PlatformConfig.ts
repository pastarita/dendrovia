import type { TreeGeometry } from './TurtleInterpreter';
import type { WorldIndex } from '@dendrovia/shared';

// Re-export NestConfig types for convenience
export type { NestConfig, NestBranchAnchor } from './NestConfig';

/**
 * PLATFORM CONFIG
 *
 * Topology-derived configuration for the root platform, character scale,
 * and camera perspective. All dimensions scale proportionally from the
 * root trunk radius as the fundamental unit.
 *
 * Why dynamic: a 20-file project produces a small tree with trunk radius 0.3;
 * React (7000 files) produces a massive tree. The platform, character, and
 * camera must scale so the "ant on a manifold" feel stays consistent.
 *
 * The reference configuration is trunkRadius = 0.3 (the LSystem default).
 * All ratios are calibrated against this baseline.
 */

export interface PlatformConfig {
  /** World position of the root trunk base */
  origin: [number, number, number];
  /** Radius of the root trunk segment — the fundamental unit */
  trunkRadius: number;
  /** Length of the root trunk segment */
  trunkLength: number;
  /** Total vertical extent of the tree (bounding box Y range) */
  treeHeight: number;
  /** Max horizontal extent of the tree (max of X, Z bounding ranges) */
  treeSpan: number;
}

/**
 * All concrete dimensions derived from PlatformConfig.
 * Computed once per topology change, consumed by RootPlatform + CameraRig.
 */
export interface PlatformDimensions {
  // Platform geometry
  platformRadius: number;
  platformThickness: number;
  wellRadius: number;
  wellHeight: number;
  rimTubeRadius: number;
  innerRingInner: number;
  innerRingOuter: number;
  outerRingInner: number;
  outerRingOuter: number;
  routeLength: number;
  routeRadiusBase: number;
  routeRadiusTip: number;

  // Character scale
  playerHeight: number;
  moveSpeed: number;
  strafeSpeed: number;
  jumpStrength: number;
  gravityStrength: number;
  lookAheadDistance: number;
  surfaceDamping: number;

  // Camera
  falconPosition: [number, number, number];
  falconTarget: [number, number, number];
  spawnPoint: [number, number, number];
  falconMinDistance: number;
  falconMaxDistance: number;

  // Detection
  platformRadiusSq: number;
  platformYThreshold: number;
}

// --- Proportion ratios (calibrated against trunkRadius = 0.3 baseline) ---

/** Platform disc radius = 10x trunk radius */
const PLATFORM_RADIUS_K = 10;
/** Platform disc thickness = 0.5x trunk radius */
const PLATFORM_THICKNESS_K = 0.5;
/** Center well radius = 1.17x trunk radius */
const WELL_RADIUS_K = 1.17;
/** Center well height = 1x trunk radius */
const WELL_HEIGHT_K = 1.0;
/** Rim torus tube radius = 0.1x trunk radius */
const RIM_TUBE_K = 0.1;
/** Route indicator length = 5x trunk radius */
const ROUTE_LENGTH_K = 5;
/** Route base radius = 0.067x trunk radius */
const ROUTE_BASE_K = 0.067;
/** Route tip radius = 0.05x trunk radius */
const ROUTE_TIP_K = 0.05;
/** Ring groove width = 0.33x trunk radius */
const RING_WIDTH_K = 0.33;

/** Inner ring at 33% of platform radius */
const INNER_RING_POS = 0.33;
/** Outer ring at 83% of platform radius */
const OUTER_RING_POS = 0.83;

/**
 * Reference trunk radius — the baseline all SURFACE_CONFIG
 * values were tuned against. Scale factor = trunkRadius / REF.
 */
const REF_TRUNK_RADIUS = 0.3;

/** Reference SURFACE_CONFIG values (at trunkRadius = 0.3) */
const REF = {
  playerHeight: 1.5,
  moveSpeed: 4.0,
  strafeSpeed: 2.0,
  jumpStrength: 5.0,
  gravityStrength: 12.0,
  lookAheadDistance: 3.0,
  surfaceDamping: 0.15,
} as const;

/**
 * Derive all concrete dimensions from a PlatformConfig.
 */
export function deriveDimensions(config: PlatformConfig): PlatformDimensions {
  const r = config.trunkRadius;
  const scale = r / REF_TRUNK_RADIUS;

  const platformRadius = r * PLATFORM_RADIUS_K;
  const ringWidth = r * RING_WIDTH_K;
  const innerCenter = platformRadius * INNER_RING_POS;
  const outerCenter = platformRadius * OUTER_RING_POS;

  // Falcon camera: position at distance proportional to tree extent,
  // elevated to ~60% tree height, looking at trunk midpoint
  const extent = Math.max(config.treeHeight, config.treeSpan, platformRadius * 2);
  const falconDist = extent * 1.2;
  const falconY = config.treeHeight * 0.6 + config.origin[1];
  const ox = config.origin[0];
  const oy = config.origin[1];
  const oz = config.origin[2];

  return {
    // Platform geometry
    platformRadius,
    platformThickness: r * PLATFORM_THICKNESS_K,
    wellRadius: r * WELL_RADIUS_K,
    wellHeight: r * WELL_HEIGHT_K,
    rimTubeRadius: r * RIM_TUBE_K,
    innerRingInner: innerCenter - ringWidth / 2,
    innerRingOuter: innerCenter + ringWidth / 2,
    outerRingInner: outerCenter - ringWidth / 2,
    outerRingOuter: outerCenter + ringWidth / 2,
    routeLength: r * ROUTE_LENGTH_K,
    routeRadiusBase: r * ROUTE_BASE_K,
    routeRadiusTip: r * ROUTE_TIP_K,

    // Character scale — all linearly proportional to trunk radius
    playerHeight: REF.playerHeight * scale,
    moveSpeed: REF.moveSpeed * scale,
    strafeSpeed: REF.strafeSpeed * scale,
    jumpStrength: REF.jumpStrength * scale,
    gravityStrength: REF.gravityStrength * scale,
    lookAheadDistance: REF.lookAheadDistance * scale,
    surfaceDamping: REF.surfaceDamping, // damping ratio is scale-invariant

    // Camera
    falconPosition: [
      ox + falconDist * 0.6,
      falconY,
      oz - falconDist * 0.8,
    ],
    falconTarget: [
      ox,
      oy + config.trunkLength * 0.5,
      oz,
    ],
    spawnPoint: [
      ox,
      oy + REF.playerHeight * scale,
      oz - platformRadius * 0.8,
    ],
    falconMinDistance: extent * 0.15,
    falconMaxDistance: extent * 4,

    // Detection
    platformRadiusSq: platformRadius * platformRadius,
    platformYThreshold: oy + REF.playerHeight * scale,
  };
}

/**
 * Compute PlatformConfig from rendered tree geometry.
 * Used by DendriteWorld after the L-system + turtle pipeline runs.
 */
export function configFromTreeGeometry(geo: TreeGeometry): PlatformConfig {
  const rootBranch = geo.branches[0];
  if (!rootBranch) {
    return configFallback();
  }

  const bb = geo.boundingBox;
  const origin: [number, number, number] = [
    rootBranch.start.x,
    rootBranch.start.y,
    rootBranch.start.z,
  ];

  return {
    origin,
    trunkRadius: rootBranch.startRadius,
    trunkLength: rootBranch.start.distanceTo(rootBranch.end),
    treeHeight: bb.max.y - bb.min.y,
    treeSpan: Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z),
  };
}

/**
 * Compute PlatformConfig from a WorldIndex (segmented loading).
 * Estimates from the global placement extent since per-branch
 * geometry isn't available at the world level.
 */
export function configFromWorldIndex(worldIndex: WorldIndex): PlatformConfig {
  const placements = worldIndex.placements;
  if (!placements || placements.length === 0) {
    return configFallback();
  }

  // Compute world extent from all segment placements
  let maxDist = 0;
  let maxY = 0;
  for (const p of placements) {
    const [cx, cy, cz] = p.centroid;
    const dist = Math.sqrt(cx * cx + cz * cz) + p.radius;
    if (dist > maxDist) maxDist = dist;
    const top = cy + p.radius;
    if (top > maxY) maxY = top;
  }

  // Use default trunk radius (matches ARCHITECTUS LSystem default of 0.3)
  const trunkRadius = 0.3;
  // Estimate trunk length from first segment height or default
  const firstPlacement = placements[0]!;
  const trunkLength = Math.max(firstPlacement.radius * 0.5, 3.0);

  return {
    origin: [0, 0, 0],
    trunkRadius,
    trunkLength,
    treeHeight: Math.max(maxY, 10),
    treeSpan: Math.max(maxDist * 2, 10),
  };
}

/**
 * Convenience: compute NestConfig from TreeGeometry + PlatformConfig.
 */
export function nestFromTreeGeometry(
  geo: TreeGeometry,
  platformConfig: PlatformConfig,
): import('./NestConfig').NestConfig | null {
  // Lazy import to avoid circular dependency
  const { computeRootNest } = require('./NestConfig') as typeof import('./NestConfig');
  return computeRootNest(geo.branches, platformConfig);
}

/** Hardcoded fallback for when no topology is available (demo mode) */
function configFallback(): PlatformConfig {
  return {
    origin: [0, 0, 0],
    trunkRadius: 0.3,
    trunkLength: 3.0,
    treeHeight: 15,
    treeSpan: 10,
  };
}
