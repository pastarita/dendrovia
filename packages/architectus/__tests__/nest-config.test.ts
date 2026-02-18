import { describe, test, expect } from 'bun:test';
import * as THREE from 'three';
import {
  findForkJunction,
  findTrunkTip,
  computeNestConfig,
  computeRootNest,
  createBowlProfile,
  falconOrbitPosition,
} from '../src/systems/NestConfig';
import type { BranchSegment } from '../src/systems/TurtleInterpreter';
import type { PlatformConfig } from '../src/systems/PlatformConfig';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBranch(overrides: Partial<BranchSegment> & { start: THREE.Vector3; end: THREE.Vector3 }): BranchSegment {
  return {
    startRadius: 0.3,
    endRadius: 0.285,
    depth: 0,
    parentIndex: -1,
    ...overrides,
  };
}

/** Standard trunk + 3 children fork topology */
function makeSymmetricFork(): BranchSegment[] {
  const trunk = makeBranch({
    start: new THREE.Vector3(0, 0, 0),
    end: new THREE.Vector3(0, 3, 0),
    parentIndex: -1,
    depth: 0,
  });

  const child0 = makeBranch({
    start: new THREE.Vector3(0, 3, 0),
    end: new THREE.Vector3(1, 5, 0),
    parentIndex: 0,
    depth: 1,
    startRadius: 0.21,
    endRadius: 0.2,
  });

  const child1 = makeBranch({
    start: new THREE.Vector3(0, 3, 0),
    end: new THREE.Vector3(-1, 5, 0.5),
    parentIndex: 0,
    depth: 1,
    startRadius: 0.21,
    endRadius: 0.2,
  });

  const child2 = makeBranch({
    start: new THREE.Vector3(0, 3, 0),
    end: new THREE.Vector3(0, 5, -1),
    parentIndex: 0,
    depth: 1,
    startRadius: 0.21,
    endRadius: 0.2,
  });

  return [trunk, child0, child1, child2];
}

const DEFAULT_PLATFORM: PlatformConfig = {
  origin: [0, 0, 0],
  trunkRadius: 0.3,
  trunkLength: 3.0,
  treeHeight: 10,
  treeSpan: 8,
};

// ---------------------------------------------------------------------------
// findForkJunction
// ---------------------------------------------------------------------------

describe('findForkJunction', () => {
  test('detects symmetric fork at trunk tip', () => {
    const branches = makeSymmetricFork();
    const fork = findForkJunction(branches, 0);
    expect(fork).not.toBeNull();
    expect(fork!.childIndices).toEqual([1, 2, 3]);
    expect(fork!.forkPoint.x).toBeCloseTo(0);
    expect(fork!.forkPoint.y).toBeCloseTo(3);
    expect(fork!.forkPoint.z).toBeCloseTo(0);
  });

  test('returns null for leaf branch with no children', () => {
    const branches = makeSymmetricFork();
    const fork = findForkJunction(branches, 1); // child0 has no children
    expect(fork).toBeNull();
  });

  test('returns null for out-of-range parentIndex', () => {
    const branches = makeSymmetricFork();
    expect(findForkJunction(branches, -1)).toBeNull();
    expect(findForkJunction(branches, 99)).toBeNull();
  });

  test('returns null for empty branches array', () => {
    expect(findForkJunction([], 0)).toBeNull();
  });

  test('detects single child fork', () => {
    const trunk = makeBranch({
      start: new THREE.Vector3(0, 0, 0),
      end: new THREE.Vector3(0, 3, 0),
      parentIndex: -1,
    });
    const child = makeBranch({
      start: new THREE.Vector3(0, 3, 0),
      end: new THREE.Vector3(1, 5, 0),
      parentIndex: 0,
      depth: 1,
    });
    const fork = findForkJunction([trunk, child], 0);
    expect(fork).not.toBeNull();
    expect(fork!.childIndices).toEqual([1]);
  });

  test('detects asymmetric fork with varying child positions', () => {
    const trunk = makeBranch({
      start: new THREE.Vector3(0, 0, 0),
      end: new THREE.Vector3(0, 3, 0),
      parentIndex: -1,
    });
    const near = makeBranch({
      start: new THREE.Vector3(0, 3, 0),
      end: new THREE.Vector3(0.5, 4, 0),
      parentIndex: 0,
      depth: 1,
    });
    const far = makeBranch({
      start: new THREE.Vector3(0, 3, 0),
      end: new THREE.Vector3(-3, 6, 2),
      parentIndex: 0,
      depth: 1,
    });
    const fork = findForkJunction([trunk, near, far], 0);
    expect(fork).not.toBeNull();
    expect(fork!.childIndices.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// findTrunkTip
// ---------------------------------------------------------------------------

describe('findTrunkTip', () => {
  test('returns 0 for single-segment trunk', () => {
    const branches = makeSymmetricFork();
    expect(findTrunkTip(branches)).toBe(0);
  });

  test('returns -1 for empty array', () => {
    expect(findTrunkTip([])).toBe(-1);
  });

  test('follows multi-segment trunk chain', () => {
    const seg0 = makeBranch({
      start: new THREE.Vector3(0, 0, 0),
      end: new THREE.Vector3(0, 1, 0),
      parentIndex: -1,
      depth: 0,
    });
    const seg1 = makeBranch({
      start: new THREE.Vector3(0, 1, 0),
      end: new THREE.Vector3(0, 2, 0),
      parentIndex: 0,
      depth: 0,
    });
    const seg2 = makeBranch({
      start: new THREE.Vector3(0, 2, 0),
      end: new THREE.Vector3(0, 3, 0),
      parentIndex: 1,
      depth: 0,
    });
    const child = makeBranch({
      start: new THREE.Vector3(0, 3, 0),
      end: new THREE.Vector3(1, 4, 0),
      parentIndex: 2,
      depth: 1,
    });
    expect(findTrunkTip([seg0, seg1, seg2, child])).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// computeNestConfig
// ---------------------------------------------------------------------------

describe('computeNestConfig', () => {
  test('computes valid nest at trunk fork', () => {
    const branches = makeSymmetricFork();
    const nest = computeNestConfig(branches, 0, DEFAULT_PLATFORM);
    expect(nest).not.toBeNull();
    // Nest is elevated above the fork point by nestRadius * 0.5
    expect(nest!.nestPosition.y).toBeGreaterThan(3);
    expect(nest!.nestRadius).toBeGreaterThan(0);
    expect(nest!.depth).toBeGreaterThan(0);
    expect(nest!.nestBranchAnchors.length).toBe(3);
  });

  test('nest radius is at least 2× trunk radius × 1.3', () => {
    const branches = makeSymmetricFork();
    const nest = computeNestConfig(branches, 0, DEFAULT_PLATFORM);
    expect(nest!.nestRadius).toBeGreaterThanOrEqual(DEFAULT_PLATFORM.trunkRadius * 2 * 1.3);
  });

  test('view radii are proportional to nest radius', () => {
    const branches = makeSymmetricFork();
    const nest = computeNestConfig(branches, 0, DEFAULT_PLATFORM);
    expect(nest!.viewNearRadius).toBeCloseTo(nest!.nestRadius * 1.5);
    expect(nest!.viewFarRadius).toBeGreaterThanOrEqual(nest!.nestRadius * 5);
  });

  test('nestUp is normalized', () => {
    const branches = makeSymmetricFork();
    const nest = computeNestConfig(branches, 0, DEFAULT_PLATFORM);
    expect(nest!.nestUp.length()).toBeCloseTo(1);
  });

  test('returns null for leaf branch', () => {
    const branches = makeSymmetricFork();
    expect(computeNestConfig(branches, 1, DEFAULT_PLATFORM)).toBeNull();
  });

  test('returns null for out-of-range index', () => {
    const branches = makeSymmetricFork();
    expect(computeNestConfig(branches, 99, DEFAULT_PLATFORM)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// computeRootNest
// ---------------------------------------------------------------------------

describe('computeRootNest', () => {
  test('returns nest at trunk tip fork', () => {
    const branches = makeSymmetricFork();
    const nest = computeRootNest(branches, DEFAULT_PLATFORM);
    expect(nest).not.toBeNull();
    expect(nest!.parentBranchIndex).toBe(0);
  });

  test('returns null for empty branches', () => {
    expect(computeRootNest([], DEFAULT_PLATFORM)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createBowlProfile
// ---------------------------------------------------------------------------

describe('createBowlProfile', () => {
  test('returns correct number of points', () => {
    const profile = createBowlProfile(1.0, 0.3, 0.05, 16);
    expect(profile.length).toBe(17); // segments + 1
  });

  test('center is lowest point', () => {
    const profile = createBowlProfile(1.0, 0.3, 0.05, 32);
    const centerY = profile[0]!.y;
    for (let i = 1; i < profile.length; i++) {
      expect(profile[i]!.y).toBeGreaterThanOrEqual(centerY);
    }
  });

  test('rim is highest point', () => {
    const profile = createBowlProfile(1.0, 0.3, 0.05, 32);
    const rimY = profile[profile.length - 1]!.y;
    for (let i = 0; i < profile.length - 1; i++) {
      expect(profile[i]!.y).toBeLessThanOrEqual(rimY + 0.001);
    }
  });

  test('profile is monotonically non-decreasing in Y', () => {
    const profile = createBowlProfile(1.5, 0.5, 0.1, 64);
    for (let i = 1; i < profile.length; i++) {
      expect(profile[i]!.y).toBeGreaterThanOrEqual(profile[i - 1]!.y - 0.001);
    }
  });

  test('x goes from 0 at center to nestRadius at rim', () => {
    const radius = 2.0;
    const profile = createBowlProfile(radius, 0.3, 0.05, 16);
    expect(profile[0]!.x).toBeCloseTo(0);
    expect(profile[profile.length - 1]!.x).toBeCloseTo(radius);
  });
});

// ---------------------------------------------------------------------------
// falconOrbitPosition
// ---------------------------------------------------------------------------

describe('falconOrbitPosition', () => {
  const branches = makeSymmetricFork();
  const nest = computeNestConfig(branches, 0, DEFAULT_PLATFORM)!;

  test('returns valid position and target', () => {
    const result = falconOrbitPosition(0, nest, DEFAULT_PLATFORM);
    expect(result.position).toBeInstanceOf(THREE.Vector3);
    expect(result.target).toBeInstanceOf(THREE.Vector3);
    expect(Number.isFinite(result.position.x)).toBe(true);
    expect(Number.isFinite(result.position.y)).toBe(true);
    expect(Number.isFinite(result.position.z)).toBe(true);
  });

  test('target is the nest position', () => {
    const result = falconOrbitPosition(5, nest, DEFAULT_PLATFORM);
    expect(result.target.x).toBeCloseTo(nest.nestPosition.x);
    expect(result.target.y).toBeCloseTo(nest.nestPosition.y);
    expect(result.target.z).toBeCloseTo(nest.nestPosition.z);
  });

  test('orbits around nest center over time', () => {
    const p0 = falconOrbitPosition(0, nest, DEFAULT_PLATFORM).position;
    const p1 = falconOrbitPosition(10, nest, DEFAULT_PLATFORM).position;
    const p2 = falconOrbitPosition(20, nest, DEFAULT_PLATFORM).position;

    // Positions should differ (orbit is moving)
    expect(p0.distanceTo(p1)).toBeGreaterThan(0.1);
    expect(p1.distanceTo(p2)).toBeGreaterThan(0.1);
  });

  test('position stays above nest Y level', () => {
    for (let t = 0; t < 100; t += 5) {
      const result = falconOrbitPosition(t, nest, DEFAULT_PLATFORM);
      expect(result.position.y).toBeGreaterThan(nest.nestPosition.y);
    }
  });
});
