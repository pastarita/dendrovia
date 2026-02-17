/**
 * SegmentPlacementPrecomputer — computes spatial bounds for each segment at build time.
 *
 * For each TopologyChunk, runs the build-time LSystem compiler and TurtleInterpreter
 * to produce branch geometry, then computes centroid, bounding radius, and convex hull
 * vertices. The result is a WorldIndex (~2KB) that tells the runtime where every
 * segment lives in 3D space — without processing the full tree.
 *
 * Uses the IMAGINARIUM TurtleInterpreter (pure math, no THREE.js dependency).
 */

import type {
  StoryArc,
  TopologyChunk,
  PrecomputedPlacement,
  WorldIndex,
  CodeTopology,
} from '@dendrovia/shared';
import { compile as compileLSystem, expandLSystem } from '../distillation/LSystemCompiler';
import { interpret, type TurtleSegment } from '../distillation/TurtleInterpreter';

type Vec3 = [number, number, number];

/**
 * Precompute spatial placements for all chunks.
 *
 * Each segment's tree is compiled into an L-system, interpreted into 3D segments,
 * then spatial bounds are extracted. Segments are spatially offset so they don't
 * overlap in world space.
 */
export function precomputePlacements(
  chunks: TopologyChunk[],
  storyArc: StoryArc,
): WorldIndex {
  const segmentMap = new Map(storyArc.segments.map(s => [s.id, s]));
  const placements: PrecomputedPlacement[] = [];

  // First pass: compute local geometry for each chunk
  const localGeometries: Array<{
    chunk: TopologyChunk;
    segments: TurtleSegment[];
    localCentroid: Vec3;
    localRadius: number;
  }> = [];

  for (const chunk of chunks) {
    const segment = segmentMap.get(chunk.segmentId);
    if (!segment) continue;

    // Build sub-topology for the LSystem compiler
    const subTopology: CodeTopology = {
      files: chunk.files,
      commits: [],
      tree: chunk.tree,
      hotspots: chunk.hotspots,
    };

    // Compile L-system from chunk's tree and interpret into 3D geometry
    const lsystemRule = compileLSystem(subTopology);
    const expanded = expandLSystem(lsystemRule);
    const turtleSegments = interpret(expanded, lsystemRule.angle);

    // Compute local centroid and radius
    const localCentroid = computeCentroid(turtleSegments);
    const localRadius = computeRadius(turtleSegments, localCentroid);

    localGeometries.push({ chunk, segments: turtleSegments, localCentroid, localRadius });
  }

  // Second pass: offset segments in world space so they don't overlap
  // Arrange in a ring layout for N segments
  const offsets = computeSegmentOffsets(localGeometries.map(g => g.localRadius));

  for (let i = 0; i < localGeometries.length; i++) {
    const { chunk, segments: turtleSegments, localCentroid, localRadius } = localGeometries[i];
    const segment = segmentMap.get(chunk.segmentId)!;
    const offset = offsets[i];

    // World-space centroid = local centroid + offset
    const worldCentroid: Vec3 = [
      localCentroid[0] + offset[0],
      localCentroid[1] + offset[1],
      localCentroid[2] + offset[2],
    ];

    // Compute convex hull in world space
    const worldPoints = collectPoints(turtleSegments).map(
      (p): Vec3 => [p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]],
    );
    const hullVertices = computeConvexHull2D(worldPoints);

    placements.push({
      segmentId: chunk.segmentId,
      label: segment.label,
      ordinal: segment.ordinal,
      centroid: worldCentroid,
      radius: localRadius,
      hullVertices,
      fileCount: chunk.fileCount,
      phase: segment.phase,
      mood: segment.mood,
    });
  }

  // Sort by ordinal
  placements.sort((a, b) => a.ordinal - b.ordinal);

  // Compute world-level bounds
  const worldCentroid = computeWorldCentroid(placements);
  const worldRadius = computeWorldRadius(placements, worldCentroid);

  return {
    version: '1.0.0',
    segmentCount: placements.length,
    placements,
    worldCentroid,
    worldRadius,
    generatedAt: new Date().toISOString(),
  };
}

/** Collect all start and end points from turtle segments. */
function collectPoints(segments: TurtleSegment[]): Vec3[] {
  const points: Vec3[] = [];
  for (const seg of segments) {
    points.push(seg.start, seg.end);
  }
  return points;
}

/** Compute centroid of turtle segments (average of all endpoints). */
function computeCentroid(segments: TurtleSegment[]): Vec3 {
  if (segments.length === 0) return [0, 0, 0];

  const points = collectPoints(segments);
  const sum: Vec3 = [0, 0, 0];
  for (const p of points) {
    sum[0] += p[0];
    sum[1] += p[1];
    sum[2] += p[2];
  }
  const n = points.length;
  return [sum[0] / n, sum[1] / n, sum[2] / n];
}

/** Compute bounding radius from centroid. */
function computeRadius(segments: TurtleSegment[], centroid: Vec3): number {
  if (segments.length === 0) return 1;

  let maxDistSq = 0;
  for (const seg of segments) {
    for (const p of [seg.start, seg.end]) {
      const dx = p[0] - centroid[0];
      const dy = p[1] - centroid[1];
      const dz = p[2] - centroid[2];
      maxDistSq = Math.max(maxDistSq, dx * dx + dy * dy + dz * dz);
    }
  }

  return Math.max(Math.sqrt(maxDistSq), 1);
}

/**
 * Compute spatial offsets for segments arranged in a line along X axis.
 * Each segment is placed with a gap of 2x its radius from its neighbor.
 */
function computeSegmentOffsets(radii: number[]): Vec3[] {
  if (radii.length === 0) return [];
  if (radii.length === 1) return [[0, 0, 0]];

  const offsets: Vec3[] = [];
  let currentX = 0;

  for (let i = 0; i < radii.length; i++) {
    if (i === 0) {
      offsets.push([0, 0, 0]);
      currentX = radii[0];
    } else {
      const gap = radii[i - 1] + radii[i] + 2; // 2-unit buffer between segments
      currentX += gap;
      offsets.push([currentX, 0, 0]);
    }
  }

  // Center the layout around origin
  const totalWidth = currentX;
  const halfWidth = totalWidth / 2;
  for (const offset of offsets) {
    offset[0] -= halfWidth;
  }

  return offsets;
}

/**
 * Compute 2D convex hull (XZ plane) via Andrew's monotone chain.
 * Returns hull vertices in CCW order. Y is preserved from input.
 */
function computeConvexHull2D(points: Vec3[]): Vec3[] {
  if (points.length <= 3) return points;

  // Project to XZ, sort by X then Z
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[2] - b[2]);

  const cross2D = (o: Vec3, a: Vec3, b: Vec3) =>
    (a[0] - o[0]) * (b[2] - o[2]) - (a[2] - o[2]) * (b[0] - o[0]);

  // Lower hull
  const lower: Vec3[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross2D(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  // Upper hull
  const upper: Vec3[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross2D(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove last point of each half (duplicate of the other's first)
  lower.pop();
  upper.pop();

  return [...lower, ...upper];
}

/** Compute world centroid from all placements. */
function computeWorldCentroid(placements: PrecomputedPlacement[]): Vec3 {
  if (placements.length === 0) return [0, 0, 0];

  const sum: Vec3 = [0, 0, 0];
  for (const p of placements) {
    sum[0] += p.centroid[0];
    sum[1] += p.centroid[1];
    sum[2] += p.centroid[2];
  }
  const n = placements.length;
  return [sum[0] / n, sum[1] / n, sum[2] / n];
}

/** Compute world radius: max distance from world centroid to any segment edge. */
function computeWorldRadius(placements: PrecomputedPlacement[], worldCentroid: Vec3): number {
  let maxDist = 0;
  for (const p of placements) {
    const dx = p.centroid[0] - worldCentroid[0];
    const dy = p.centroid[1] - worldCentroid[1];
    const dz = p.centroid[2] - worldCentroid[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + p.radius;
    maxDist = Math.max(maxDist, dist);
  }
  return Math.max(maxDist, 1);
}
