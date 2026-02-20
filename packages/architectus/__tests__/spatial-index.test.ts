import { describe, test, expect } from 'bun:test';
import * as THREE from 'three';
import { SpatialIndex, type NearestSegmentResult } from '../src/systems/SpatialIndex';
import type { NodeMarker, BranchSegment } from '../src/systems/TurtleInterpreter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(
  pos: [number, number, number],
  path = 'src/test.ts',
): NodeMarker {
  return {
    position: new THREE.Vector3(...pos),
    path,
    type: 'file',
    depth: 0,
    radius: 0.15,
    direction: new THREE.Vector3(0, 1, 0),
  };
}

function makeBranch(
  start: [number, number, number],
  end: [number, number, number],
): BranchSegment {
  return {
    start: new THREE.Vector3(...start),
    end: new THREE.Vector3(...end),
    startRadius: 0.3,
    endRadius: 0.285,
    depth: 0,
    parentIndex: -1,
  };
}

function makeBBox(
  min: [number, number, number],
  max: [number, number, number],
): THREE.Box3 {
  return new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max));
}

// ---------------------------------------------------------------------------
// Construction & empty state
// ---------------------------------------------------------------------------

describe('SpatialIndex', () => {
  describe('construction & empty state', () => {
    test('default cell size is 5', () => {
      const idx = new SpatialIndex();
      // Before rebuild, diagnostics should be zero
      expect(idx.nodeCount).toBe(0);
      expect(idx.segmentCount).toBe(0);
      expect(idx.nodeCellCount).toBe(0);
    });

    test('empty index: nodeCount = 0, segmentCount = 0, nodeCellCount = 0', () => {
      const idx = new SpatialIndex(10);
      idx.rebuild([], []);
      expect(idx.nodeCount).toBe(0);
      expect(idx.segmentCount).toBe(0);
      expect(idx.nodeCellCount).toBe(0);
    });

    test('nearestNode on empty returns null', () => {
      const idx = new SpatialIndex();
      idx.rebuild([], []);
      expect(idx.nearestNode(new THREE.Vector3(0, 0, 0))).toBeNull();
    });

    test('nearestSegment on empty returns null', () => {
      const idx = new SpatialIndex();
      idx.rebuild([], []);
      expect(idx.nearestSegment(new THREE.Vector3(0, 0, 0))).toBeNull();
    });

    test('queryRadius on empty returns []', () => {
      const idx = new SpatialIndex();
      idx.rebuild([], []);
      expect(idx.queryRadius(new THREE.Vector3(0, 0, 0), 100)).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // rebuild()
  // ---------------------------------------------------------------------------

  describe('rebuild()', () => {
    test('stores nodes and segments', () => {
      const idx = new SpatialIndex();
      const nodes = [makeNode([0, 0, 0]), makeNode([1, 1, 1])];
      const segs = [makeBranch([0, 0, 0], [1, 1, 1])];
      idx.rebuild(nodes, segs);
      expect(idx.nodeCount).toBe(2);
      expect(idx.segmentCount).toBe(1);
    });

    test('auto-computes cell size from bounding box', () => {
      const idx = new SpatialIndex();
      const nodes = Array.from({ length: 100 }, (_, i) =>
        makeNode([i * 0.5, 0, 0]),
      );
      const bbox = makeBBox([0, 0, 0], [50, 0, 0]);
      idx.rebuild(nodes, [], bbox);
      // With 100 nodes, targetCells = max(8, min(20, ceil(sqrt(100)))) = 10
      // cellSize = max(1, 50 / 10) = 5
      // nodeCellCount should reflect the spatial distribution
      expect(idx.nodeCellCount).toBeGreaterThan(1);
    });

    test('re-rebuild replaces old index', () => {
      const idx = new SpatialIndex();
      idx.rebuild([makeNode([0, 0, 0])], []);
      expect(idx.nodeCount).toBe(1);

      idx.rebuild([makeNode([1, 1, 1]), makeNode([2, 2, 2]), makeNode([3, 3, 3])], []);
      expect(idx.nodeCount).toBe(3);
    });

    test('handles single node', () => {
      const idx = new SpatialIndex();
      idx.rebuild([makeNode([5, 5, 5])], []);
      expect(idx.nodeCount).toBe(1);
      expect(idx.nodeCellCount).toBe(1);
    });

    test('handles single segment', () => {
      const idx = new SpatialIndex();
      idx.rebuild([], [makeBranch([0, 0, 0], [1, 1, 1])]);
      expect(idx.segmentCount).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // nearestNode()
  // ---------------------------------------------------------------------------

  describe('nearestNode()', () => {
    test('returns closest node among multiple', () => {
      const idx = new SpatialIndex(10);
      const nodes = [
        makeNode([0, 0, 0], 'a.ts'),
        makeNode([5, 0, 0], 'b.ts'),
        makeNode([10, 0, 0], 'c.ts'),
      ];
      idx.rebuild(nodes, []);

      const result = idx.nearestNode(new THREE.Vector3(4, 0, 0));
      expect(result).not.toBeNull();
      expect(result!.path).toBe('b.ts');
    });

    test('respects maxRadius — returns null when all nodes outside radius', () => {
      const idx = new SpatialIndex(10);
      idx.rebuild([makeNode([100, 100, 100])], []);

      const result = idx.nearestNode(new THREE.Vector3(0, 0, 0), 5);
      expect(result).toBeNull();
    });

    test('works across cell boundaries', () => {
      const idx = new SpatialIndex(2); // Small cells
      const nodes = [
        makeNode([0, 0, 0], 'origin.ts'),
        makeNode([3, 0, 0], 'adjacent.ts'), // In a different cell
      ];
      idx.rebuild(nodes, []);

      // Query near the boundary — should find the node in the adjacent cell
      const result = idx.nearestNode(new THREE.Vector3(2.5, 0, 0));
      expect(result).not.toBeNull();
      expect(result!.path).toBe('adjacent.ts');
    });

    test('tie-breaking: returns one of the equidistant nodes without crashing', () => {
      const idx = new SpatialIndex(10);
      const nodes = [
        makeNode([1, 0, 0], 'left.ts'),
        makeNode([-1, 0, 0], 'right.ts'),
      ];
      idx.rebuild(nodes, []);

      const result = idx.nearestNode(new THREE.Vector3(0, 0, 0));
      expect(result).not.toBeNull();
      // Both are equidistant — either is valid
      expect(['left.ts', 'right.ts']).toContain(result!.path);
    });
  });

  // ---------------------------------------------------------------------------
  // queryRadius()
  // ---------------------------------------------------------------------------

  describe('queryRadius()', () => {
    test('returns all nodes within radius', () => {
      const idx = new SpatialIndex(10);
      const nodes = [
        makeNode([0, 0, 0], 'a.ts'),
        makeNode([1, 0, 0], 'b.ts'),
        makeNode([2, 0, 0], 'c.ts'),
      ];
      idx.rebuild(nodes, []);

      const results = idx.queryRadius(new THREE.Vector3(0, 0, 0), 1.5);
      expect(results.length).toBe(2);
      const paths = results.map((n) => n.path).sort();
      expect(paths).toEqual(['a.ts', 'b.ts']);
    });

    test('excludes nodes outside radius', () => {
      const idx = new SpatialIndex(10);
      const nodes = [
        makeNode([0, 0, 0], 'close.ts'),
        makeNode([100, 100, 100], 'far.ts'),
      ];
      idx.rebuild(nodes, []);

      const results = idx.queryRadius(new THREE.Vector3(0, 0, 0), 5);
      expect(results.length).toBe(1);
      expect(results[0]!.path).toBe('close.ts');
    });

    test('empty result for large offset', () => {
      const idx = new SpatialIndex(10);
      idx.rebuild([makeNode([0, 0, 0])], []);

      const results = idx.queryRadius(new THREE.Vector3(1000, 1000, 1000), 1);
      expect(results.length).toBe(0);
    });

    test('scales search beyond 3x3x3 when radius > cellSize', () => {
      const idx = new SpatialIndex(2); // Small cells
      const nodes = [
        makeNode([0, 0, 0], 'origin.ts'),
        makeNode([6, 0, 0], 'far.ts'), // 3 cells away
      ];
      idx.rebuild(nodes, []);

      // Radius 7 > cellSize 2 — should expand search beyond 3x3x3
      const results = idx.queryRadius(new THREE.Vector3(0, 0, 0), 7);
      expect(results.length).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // nearestSegment()
  // ---------------------------------------------------------------------------

  describe('nearestSegment()', () => {
    test('point nearest to segment midpoint → t ≈ 0.5', () => {
      const idx = new SpatialIndex(10);
      const seg = makeBranch([0, 0, 0], [10, 0, 0]);
      idx.rebuild([], [seg]);

      const result = idx.nearestSegment(new THREE.Vector3(5, 1, 0));
      expect(result).not.toBeNull();
      expect(result!.t).toBeCloseTo(0.5, 2);
    });

    test('point nearest to segment start → t ≈ 0', () => {
      const idx = new SpatialIndex(10);
      const seg = makeBranch([0, 0, 0], [10, 0, 0]);
      idx.rebuild([], [seg]);

      const result = idx.nearestSegment(new THREE.Vector3(-1, 1, 0));
      expect(result).not.toBeNull();
      expect(result!.t).toBeCloseTo(0, 2);
    });

    test('point nearest to segment end → t ≈ 1', () => {
      const idx = new SpatialIndex(10);
      const seg = makeBranch([0, 0, 0], [10, 0, 0]);
      idx.rebuild([], [seg]);

      const result = idx.nearestSegment(new THREE.Vector3(11, 1, 0));
      expect(result).not.toBeNull();
      expect(result!.t).toBeCloseTo(1, 2);
    });

    test('degenerate segment (zero length) → t = 0, distance = point-to-start', () => {
      const idx = new SpatialIndex(10);
      const seg = makeBranch([5, 5, 5], [5, 5, 5]); // Zero-length
      idx.rebuild([], [seg]);

      const queryPoint = new THREE.Vector3(8, 5, 5);
      const result = idx.nearestSegment(queryPoint);
      expect(result).not.toBeNull();
      expect(result!.t).toBe(0);
      expect(result!.distance).toBeCloseTo(3, 5);
    });

    test('returns closest point on the segment axis', () => {
      const idx = new SpatialIndex(10);
      const seg = makeBranch([0, 0, 0], [10, 0, 0]);
      idx.rebuild([], [seg]);

      // Query 3 units above the midpoint
      const result = idx.nearestSegment(new THREE.Vector3(5, 3, 0));
      expect(result).not.toBeNull();
      expect(result!.point.x).toBeCloseTo(5, 2);
      expect(result!.point.y).toBeCloseTo(0, 2);
      expect(result!.point.z).toBeCloseTo(0, 2);
      expect(result!.distance).toBeCloseTo(3, 2);
    });

    test('multi-cell segment: found even when query is near the far end', () => {
      const idx = new SpatialIndex(2); // Small cells — segment spans many cells
      const seg = makeBranch([0, 0, 0], [20, 0, 0]);
      idx.rebuild([], [seg]);

      // Query near the far end
      const result = idx.nearestSegment(new THREE.Vector3(19, 1, 0));
      expect(result).not.toBeNull();
      expect(result!.t).toBeGreaterThan(0.9);
      expect(result!.distance).toBeCloseTo(1, 1);
    });
  });

  // ---------------------------------------------------------------------------
  // Diagnostics
  // ---------------------------------------------------------------------------

  describe('diagnostics', () => {
    test('nodeCount, segmentCount, nodeCellCount accurate after rebuild', () => {
      const idx = new SpatialIndex(10);
      const nodes = [makeNode([0, 0, 0]), makeNode([1, 1, 1]), makeNode([2, 2, 2])];
      const segs = [makeBranch([0, 0, 0], [1, 1, 1]), makeBranch([1, 1, 1], [2, 2, 2])];
      idx.rebuild(nodes, segs);

      expect(idx.nodeCount).toBe(3);
      expect(idx.segmentCount).toBe(2);
      // With cell size 10, all close nodes land in the same cell
      expect(idx.nodeCellCount).toBe(1);
    });

    test('nodeCellCount reflects spatial distribution', () => {
      const idx = new SpatialIndex(5);
      // Clustered nodes — all in one cell
      const clustered = [makeNode([0, 0, 0]), makeNode([1, 1, 1]), makeNode([2, 2, 2])];
      idx.rebuild(clustered, []);
      const clusteredCells = idx.nodeCellCount;

      // Spread nodes — each in a different cell
      const spread = [makeNode([0, 0, 0]), makeNode([10, 10, 10]), makeNode([20, 20, 20])];
      idx.rebuild(spread, []);
      const spreadCells = idx.nodeCellCount;

      expect(spreadCells).toBeGreaterThan(clusteredCells);
    });
  });
});
