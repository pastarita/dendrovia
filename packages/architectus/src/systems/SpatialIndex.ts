import * as THREE from 'three';
import type { NodeMarker, BranchSegment } from './TurtleInterpreter';

/**
 * SPATIAL INDEX
 *
 * 3D spatial hash grid for O(1) average-case proximity queries.
 * Replaces the O(n) linear scan in BranchTracker.
 *
 * Strategy: divide world space into uniform cells. Each cell stores
 * indices of nodes/segments whose positions fall within it. Queries
 * check only the cell containing the query point plus its 26 neighbors.
 *
 * Cell size is auto-computed from the scene bounding box and node count
 * to balance between too-fine (memory) and too-coarse (still O(n) per cell).
 */

/** Result of a nearest-segment query */
export interface NearestSegmentResult {
  /** The closest branch segment */
  segment: BranchSegment;
  /** Index of the segment in the original array */
  index: number;
  /** Parametric position along segment (0 = start, 1 = end) */
  t: number;
  /** Distance from query point to nearest point on segment */
  distance: number;
  /** The closest point on the segment axis */
  point: THREE.Vector3;
}

// Reusable temporaries to avoid allocation in hot queries
const _diff = new THREE.Vector3();
const _segDir = new THREE.Vector3();
const _closest = new THREE.Vector3();

/**
 * Hash a cell coordinate to a string key.
 * Using string keys with a Map is simpler than perfect hashing
 * and fast enough for our scale (< 100k cells).
 */
function cellKey(cx: number, cy: number, cz: number): string {
  return `${cx},${cy},${cz}`;
}

export class SpatialIndex {
  private cellSize: number;
  private nodeGrid = new Map<string, number[]>();
  private segmentGrid = new Map<string, number[]>();
  private nodes: NodeMarker[] = [];
  private segments: BranchSegment[] = [];

  constructor(cellSize = 5) {
    this.cellSize = cellSize;
  }

  /**
   * Build the spatial index from turtle interpreter output.
   * Call once after topology changes (memoized in DendriteWorld).
   */
  rebuild(nodes: NodeMarker[], segments: BranchSegment[], boundingBox?: THREE.Box3): void {
    this.nodes = nodes;
    this.segments = segments;
    this.nodeGrid.clear();
    this.segmentGrid.clear();

    // Auto-compute cell size if we have enough data
    if (nodes.length > 0 && boundingBox) {
      const size = new THREE.Vector3();
      boundingBox.getSize(size);
      const maxExtent = Math.max(size.x, size.y, size.z);
      // Target ~8-15 cells along longest axis for good distribution
      const targetCells = Math.max(8, Math.min(20, Math.ceil(Math.sqrt(nodes.length))));
      this.cellSize = Math.max(1, maxExtent / targetCells);
    }

    // Index nodes
    for (let i = 0; i < nodes.length; i++) {
      const pos = nodes[i]!.position;
      const key = this.posToKey(pos.x, pos.y, pos.z);
      let bucket = this.nodeGrid.get(key);
      if (!bucket) {
        bucket = [];
        this.nodeGrid.set(key, bucket);
      }
      bucket.push(i);
    }

    // Index segments — insert into all cells the segment passes through
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      this.insertSegment(i, seg);
    }
  }

  /**
   * Find the nearest node to a query position.
   * Checks the query cell + 26 neighbors (3x3x3 cube).
   */
  nearestNode(position: THREE.Vector3, maxRadius = Infinity): NodeMarker | null {
    const cx = Math.floor(position.x / this.cellSize);
    const cy = Math.floor(position.y / this.cellSize);
    const cz = Math.floor(position.z / this.cellSize);

    let bestDist = maxRadius * maxRadius; // Compare squared distances
    let bestNode: NodeMarker | null = null;

    // Search 3x3x3 neighborhood
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = cellKey(cx + dx, cy + dy, cz + dz);
          const bucket = this.nodeGrid.get(key);
          if (!bucket) continue;

          for (let i = 0; i < bucket.length; i++) {
            const node = this.nodes[bucket[i]!]!;
            const dist = position.distanceToSquared(node.position);
            if (dist < bestDist) {
              bestDist = dist;
              bestNode = node;
            }
          }
        }
      }
    }

    return bestNode;
  }

  /**
   * Find all nodes within a radius of the query position.
   */
  queryRadius(position: THREE.Vector3, radius: number): NodeMarker[] {
    const r2 = radius * radius;
    const cellRadius = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(position.x / this.cellSize);
    const cy = Math.floor(position.y / this.cellSize);
    const cz = Math.floor(position.z / this.cellSize);

    const results: NodeMarker[] = [];

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        for (let dz = -cellRadius; dz <= cellRadius; dz++) {
          const key = cellKey(cx + dx, cy + dy, cz + dz);
          const bucket = this.nodeGrid.get(key);
          if (!bucket) continue;

          for (let i = 0; i < bucket.length; i++) {
            const node = this.nodes[bucket[i]!]!;
            if (position.distanceToSquared(node.position) <= r2) {
              results.push(node);
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Find the nearest branch segment to a query position.
   * Returns the segment, parametric t, distance, and closest point.
   */
  nearestSegment(position: THREE.Vector3): NearestSegmentResult | null {
    const cx = Math.floor(position.x / this.cellSize);
    const cy = Math.floor(position.y / this.cellSize);
    const cz = Math.floor(position.z / this.cellSize);

    let bestDist = Infinity;
    let bestResult: NearestSegmentResult | null = null;

    // Search 3x3x3 neighborhood
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = cellKey(cx + dx, cy + dy, cz + dz);
          const bucket = this.segmentGrid.get(key);
          if (!bucket) continue;

          for (let i = 0; i < bucket.length; i++) {
            const segIdx = bucket[i]!;
            const seg = this.segments[segIdx]!;
            const result = this.pointToSegmentDistance(position, seg, segIdx);
            if (result.distance < bestDist) {
              bestDist = result.distance;
              bestResult = result;
            }
          }
        }
      }
    }

    return bestResult;
  }

  /** Total node count (for diagnostics) */
  get nodeCount(): number {
    return this.nodes.length;
  }

  /** Total segment count (for diagnostics) */
  get segmentCount(): number {
    return this.segments.length;
  }

  /** Number of occupied node cells (for diagnostics) */
  get nodeCellCount(): number {
    return this.nodeGrid.size;
  }

  // --- Private helpers ---

  private posToKey(x: number, y: number, z: number): string {
    return cellKey(
      Math.floor(x / this.cellSize),
      Math.floor(y / this.cellSize),
      Math.floor(z / this.cellSize),
    );
  }

  /**
   * Insert a segment into all cells it passes through.
   * Uses a simple approach: insert at start cell, end cell, and midpoint cell.
   * For short segments (relative to cell size) this is sufficient.
   * For long segments, we walk along the segment axis.
   */
  private insertSegment(index: number, seg: BranchSegment): void {
    const sx = Math.floor(seg.start.x / this.cellSize);
    const sy = Math.floor(seg.start.y / this.cellSize);
    const sz = Math.floor(seg.start.z / this.cellSize);
    const ex = Math.floor(seg.end.x / this.cellSize);
    const ey = Math.floor(seg.end.y / this.cellSize);
    const ez = Math.floor(seg.end.z / this.cellSize);

    // If start and end are in the same cell, single insert
    if (sx === ex && sy === ey && sz === ez) {
      this.addToSegmentGrid(cellKey(sx, sy, sz), index);
      return;
    }

    // Walk from start to end, inserting into each cell we pass through
    const length = seg.start.distanceTo(seg.end);
    const steps = Math.ceil(length / this.cellSize) + 1;
    const visited = new Set<string>();

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = seg.start.x + (seg.end.x - seg.start.x) * t;
      const y = seg.start.y + (seg.end.y - seg.start.y) * t;
      const z = seg.start.z + (seg.end.z - seg.start.z) * t;
      const key = this.posToKey(x, y, z);
      if (!visited.has(key)) {
        visited.add(key);
        this.addToSegmentGrid(key, index);
      }
    }
  }

  private addToSegmentGrid(key: string, index: number): void {
    let bucket = this.segmentGrid.get(key);
    if (!bucket) {
      bucket = [];
      this.segmentGrid.set(key, bucket);
    }
    bucket.push(index);
  }

  /**
   * Compute the closest point on a line segment to a query point.
   * Returns parametric t, distance, and the closest point.
   */
  private pointToSegmentDistance(
    point: THREE.Vector3,
    seg: BranchSegment,
    segIndex: number,
  ): NearestSegmentResult {
    _segDir.subVectors(seg.end, seg.start);
    const segLenSq = _segDir.lengthSq();

    let t: number;
    if (segLenSq < 1e-10) {
      // Degenerate segment (zero length)
      t = 0;
    } else {
      _diff.subVectors(point, seg.start);
      t = Math.max(0, Math.min(1, _diff.dot(_segDir) / segLenSq));
    }

    _closest.copy(seg.start).addScaledVector(_segDir, t);
    const distance = point.distanceTo(_closest);

    return {
      segment: seg,
      index: segIndex,
      t,
      distance,
      point: _closest.clone(),
    };
  }
}
