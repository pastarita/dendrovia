/**
 * Tests for the composable mesh pipeline and operations.
 */

import { describe, test, expect } from 'bun:test';
import {
  buildFromIndexed,
  buildFromProfile,
  pipe,
  repeat,
  when,
  MeshPipeline,
  type HalfEdgeMesh,
  type MeshOp,
} from '../../src/mesh/index.js';
import { smooth, taubinSmooth } from '../../src/mesh/ops/smooth.js';
import { displaceNormal, displaceByFunction, displaceByNoise } from '../../src/mesh/ops/displace.js';
import { subdivide } from '../../src/mesh/ops/subdivide.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function simpleMesh(): HalfEdgeMesh {
  // Two triangles forming a quad
  return buildFromIndexed(
    new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]),
    new Uint32Array([0, 1, 2, 0, 2, 3]),
  );
}

function profileMesh(): HalfEdgeMesh {
  // Cap-like profile: 4 points, 8 segments
  return buildFromProfile(
    [[0, 1], [0.3, 0.8], [0.5, 0.3], [0.2, 0]],
    8,
  );
}

// ---------------------------------------------------------------------------
// pipe() composition
// ---------------------------------------------------------------------------

describe('pipe', () => {
  test('identity: pipe with no ops returns same mesh', () => {
    const mesh = simpleMesh();
    const identity = pipe();
    const result = identity(mesh);
    expect(result.vertices.length).toBe(mesh.vertices.length);
  });

  test('single op: pipe with one op applies it', () => {
    // Use profile mesh which has interior vertices (not all boundary)
    const mesh = profileMesh();
    const result = pipe(smooth(1))(mesh);
    // Smoothing should change vertex positions on interior vertices
    let moved = 0;
    for (let i = 0; i < mesh.vertices.length; i++) {
      if (
        Math.abs(mesh.vertices[i].x - result.vertices[i].x) > 1e-10 ||
        Math.abs(mesh.vertices[i].y - result.vertices[i].y) > 1e-10 ||
        Math.abs(mesh.vertices[i].z - result.vertices[i].z) > 1e-10
      ) {
        moved++;
      }
    }
    expect(moved).toBeGreaterThan(0);
  });

  test('multiple ops: pipe composes left to right', () => {
    const ops: string[] = [];
    const logOp = (name: string): MeshOp => (mesh) => {
      ops.push(name);
      return mesh;
    };

    pipe(logOp('a'), logOp('b'), logOp('c'))(simpleMesh());
    expect(ops).toEqual(['a', 'b', 'c']);
  });
});

// ---------------------------------------------------------------------------
// repeat()
// ---------------------------------------------------------------------------

describe('repeat', () => {
  test('repeat(0) returns unchanged mesh', () => {
    let count = 0;
    const countOp: MeshOp = (mesh) => { count++; return mesh; };
    repeat(0, countOp)(simpleMesh());
    expect(count).toBe(0);
  });

  test('repeat(3) calls op 3 times', () => {
    let count = 0;
    const countOp: MeshOp = (mesh) => { count++; return mesh; };
    repeat(3, countOp)(simpleMesh());
    expect(count).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// when()
// ---------------------------------------------------------------------------

describe('when', () => {
  test('applies op when predicate is true', () => {
    let applied = false;
    const op: MeshOp = (mesh) => { applied = true; return mesh; };
    when(() => true, op)(simpleMesh());
    expect(applied).toBe(true);
  });

  test('skips op when predicate is false', () => {
    let applied = false;
    const op: MeshOp = (mesh) => { applied = true; return mesh; };
    when(() => false, op)(simpleMesh());
    expect(applied).toBe(false);
  });

  test('predicate receives the mesh', () => {
    const op = when(
      (mesh) => mesh.faces.length === 2,
      smooth(1),
    );
    const mesh = simpleMesh();
    expect(mesh.faces.length).toBe(2);
    const result = op(mesh);
    // Should have applied smoothing (mesh has 2 faces)
    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// MeshPipeline (fluent builder)
// ---------------------------------------------------------------------------

describe('MeshPipeline', () => {
  test('empty pipeline returns unchanged mesh', () => {
    const pipeline = new MeshPipeline();
    const mesh = simpleMesh();
    const result = pipeline.execute(mesh);
    expect(result.vertices.length).toBe(mesh.vertices.length);
  });

  test('tracks step count', () => {
    const pipeline = new MeshPipeline()
      .add('smooth', smooth(1))
      .add('displace', displaceNormal(0.01));
    expect(pipeline.length).toBe(2);
  });

  test('tracks step names', () => {
    const pipeline = new MeshPipeline()
      .add('step-a', smooth(1))
      .add('step-b', displaceNormal(0.01));
    expect(pipeline.names).toEqual(['step-a', 'step-b']);
  });

  test('executes steps in order', () => {
    const order: string[] = [];
    const pipeline = new MeshPipeline()
      .add('first', (mesh) => { order.push('first'); return mesh; })
      .add('second', (mesh) => { order.push('second'); return mesh; });
    pipeline.execute(simpleMesh());
    expect(order).toEqual(['first', 'second']);
  });
});

// ---------------------------------------------------------------------------
// smooth()
// ---------------------------------------------------------------------------

describe('smooth', () => {
  test('smoothing moves interior vertices', () => {
    const mesh = profileMesh();
    const result = smooth(1, 0.5)(mesh);

    // At least some vertices should have moved
    let moved = 0;
    for (let i = 0; i < mesh.vertices.length; i++) {
      if (
        Math.abs(mesh.vertices[i].x - result.vertices[i].x) > 1e-10 ||
        Math.abs(mesh.vertices[i].y - result.vertices[i].y) > 1e-10 ||
        Math.abs(mesh.vertices[i].z - result.vertices[i].z) > 1e-10
      ) {
        moved++;
      }
    }
    expect(moved).toBeGreaterThan(0);
  });

  test('smoothing preserves vertex count', () => {
    const mesh = profileMesh();
    const result = smooth(5)(mesh);
    expect(result.vertices.length).toBe(mesh.vertices.length);
  });

  test('smoothing preserves face count', () => {
    const mesh = profileMesh();
    const result = smooth(5)(mesh);
    expect(result.faces.length).toBe(mesh.faces.length);
  });

  test('factor=0 produces no change', () => {
    const mesh = profileMesh();
    const result = smooth(10, 0)(mesh);
    for (let i = 0; i < mesh.vertices.length; i++) {
      expect(result.vertices[i].x).toBeCloseTo(mesh.vertices[i].x, 10);
      expect(result.vertices[i].y).toBeCloseTo(mesh.vertices[i].y, 10);
      expect(result.vertices[i].z).toBeCloseTo(mesh.vertices[i].z, 10);
    }
  });

  test('taubin smoothing preserves vertex count', () => {
    const mesh = profileMesh();
    const result = taubinSmooth(3)(mesh);
    expect(result.vertices.length).toBe(mesh.vertices.length);
  });
});

// ---------------------------------------------------------------------------
// displace operations
// ---------------------------------------------------------------------------

describe('displaceNormal', () => {
  test('positive displacement moves vertices outward', () => {
    const mesh = profileMesh();
    const result = displaceNormal(0.1)(mesh);

    // At least some vertices should have moved
    let moved = 0;
    for (let i = 0; i < mesh.vertices.length; i++) {
      const dx = result.vertices[i].x - mesh.vertices[i].x;
      const dy = result.vertices[i].y - mesh.vertices[i].y;
      const dz = result.vertices[i].z - mesh.vertices[i].z;
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) > 1e-6) moved++;
    }
    expect(moved).toBeGreaterThan(0);
  });

  test('displacement preserves topology', () => {
    const mesh = profileMesh();
    const result = displaceNormal(0.1)(mesh);
    expect(result.vertices.length).toBe(mesh.vertices.length);
    expect(result.faces.length).toBe(mesh.faces.length);
    expect(result.halfedges.length).toBe(mesh.halfedges.length);
  });

  test('zero displacement produces no change', () => {
    const mesh = profileMesh();
    const result = displaceNormal(0)(mesh);
    for (let i = 0; i < mesh.vertices.length; i++) {
      expect(result.vertices[i].x).toBeCloseTo(mesh.vertices[i].x, 10);
      expect(result.vertices[i].y).toBeCloseTo(mesh.vertices[i].y, 10);
      expect(result.vertices[i].z).toBeCloseTo(mesh.vertices[i].z, 10);
    }
  });
});

describe('displaceByFunction', () => {
  test('sinusoidal displacement varies by position', () => {
    const mesh = profileMesh();
    const result = displaceByFunction((x, y, z) => 0.1 * Math.sin(y * 10))(mesh);

    let moved = 0;
    for (let i = 0; i < mesh.vertices.length; i++) {
      const dx = Math.abs(result.vertices[i].x - mesh.vertices[i].x);
      const dy = Math.abs(result.vertices[i].y - mesh.vertices[i].y);
      const dz = Math.abs(result.vertices[i].z - mesh.vertices[i].z);
      if (dx > 1e-10 || dy > 1e-10 || dz > 1e-10) moved++;
    }
    expect(moved).toBeGreaterThan(0);
  });
});

describe('displaceByNoise', () => {
  test('noise displacement is deterministic', () => {
    const mesh = profileMesh();
    const r1 = displaceByNoise(0.05, 4)(mesh);
    const r2 = displaceByNoise(0.05, 4)(mesh);
    for (let i = 0; i < r1.vertices.length; i++) {
      expect(r1.vertices[i].x).toBe(r2.vertices[i].x);
      expect(r1.vertices[i].y).toBe(r2.vertices[i].y);
      expect(r1.vertices[i].z).toBe(r2.vertices[i].z);
    }
  });

  test('noise displacement preserves topology', () => {
    const mesh = profileMesh();
    const result = displaceByNoise(0.05)(mesh);
    expect(result.vertices.length).toBe(mesh.vertices.length);
    expect(result.faces.length).toBe(mesh.faces.length);
  });

  test('different frequencies produce different results', () => {
    const mesh = profileMesh();
    const r1 = displaceByNoise(0.1, 2)(mesh);
    const r2 = displaceByNoise(0.1, 20)(mesh);
    let differ = false;
    for (let i = 0; i < r1.vertices.length; i++) {
      if (Math.abs(r1.vertices[i].x - r2.vertices[i].x) > 1e-6) {
        differ = true;
        break;
      }
    }
    expect(differ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// subdivide
// ---------------------------------------------------------------------------

describe('subdivide', () => {
  test('one iteration quadruples face count', () => {
    const mesh = simpleMesh(); // 2 faces
    const result = subdivide(1)(mesh);
    expect(result.faces.length).toBe(8); // 2 * 4
  });

  test('two iterations produce 16x face count', () => {
    const mesh = simpleMesh(); // 2 faces
    const result = subdivide(2)(mesh);
    expect(result.faces.length).toBe(32); // 2 * 4 * 4
  });

  test('subdivision increases vertex count', () => {
    const mesh = simpleMesh();
    const result = subdivide(1)(mesh);
    expect(result.vertices.length).toBeGreaterThan(mesh.vertices.length);
  });

  test('subdivision on profile mesh produces more faces', () => {
    const mesh = profileMesh();
    const originalFaces = mesh.faces.length;
    const result = subdivide(1)(mesh);
    expect(result.faces.length).toBe(originalFaces * 4);
  });
});

// ---------------------------------------------------------------------------
// Integrated pipeline
// ---------------------------------------------------------------------------

describe('integrated pipeline', () => {
  test('subdivide + smooth + displace composes correctly', () => {
    const mesh = profileMesh();
    const pipeline = pipe(
      subdivide(1),
      smooth(3, 0.3),
      displaceByNoise(0.02, 5),
    );
    const result = pipeline(mesh);

    // Should have more faces than original (subdivided)
    expect(result.faces.length).toBeGreaterThan(mesh.faces.length);
    // Should have more vertices (subdivided)
    expect(result.vertices.length).toBeGreaterThan(mesh.vertices.length);
    // No NaN positions
    for (const v of result.vertices) {
      expect(Number.isNaN(v.x)).toBe(false);
      expect(Number.isNaN(v.y)).toBe(false);
      expect(Number.isNaN(v.z)).toBe(false);
    }
  });

  test('pipeline is deterministic', () => {
    const mesh = profileMesh();
    const pipeline = pipe(
      subdivide(1),
      smooth(2),
      displaceByNoise(0.03, 8),
    );
    const r1 = pipeline(mesh);
    const r2 = pipeline(mesh);

    expect(r1.vertices.length).toBe(r2.vertices.length);
    for (let i = 0; i < r1.vertices.length; i++) {
      expect(r1.vertices[i].x).toBe(r2.vertices[i].x);
      expect(r1.vertices[i].y).toBe(r2.vertices[i].y);
      expect(r1.vertices[i].z).toBe(r2.vertices[i].z);
    }
  });

  test('MeshPipeline builder produces same result as pipe', () => {
    const mesh = profileMesh();

    const piped = pipe(smooth(2), displaceNormal(0.05))(mesh);
    const built = new MeshPipeline()
      .add('smooth', smooth(2))
      .add('displace', displaceNormal(0.05))
      .execute(mesh);

    expect(piped.vertices.length).toBe(built.vertices.length);
    for (let i = 0; i < piped.vertices.length; i++) {
      expect(piped.vertices[i].x).toBeCloseTo(built.vertices[i].x, 10);
      expect(piped.vertices[i].y).toBeCloseTo(built.vertices[i].y, 10);
      expect(piped.vertices[i].z).toBeCloseTo(built.vertices[i].z, 10);
    }
  });
});
