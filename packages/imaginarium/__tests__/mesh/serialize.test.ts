/**
 * Tests for mesh serialization and adapter functions.
 */

import { describe, test, expect } from 'bun:test';
import {
  buildFromProfile,
  buildFromIndexed,
  toFlatArrays,
} from '../../src/mesh/HalfEdgeMesh.js';
import {
  serialize,
  deserializeToHalfEdge,
  deserializeToFlat,
  deserializeWithFallback,
} from '../../src/mesh/serialize.js';
import {
  profileToHalfEdge,
  cylinderToHalfEdge,
  specimenToHalfEdge,
  fallbackMeshFromProfile,
  applyPipelineToProfile,
} from '../../src/mesh/adapters.js';
import { smooth } from '../../src/mesh/ops/smooth.js';
import { subdivide } from '../../src/mesh/ops/subdivide.js';
import { pipe } from '../../src/mesh/pipeline.js';
import type { ProfileGeometry, CylinderGeometry, MushroomMeshData } from '../../src/mycology/assets/MeshGenerator.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function testProfile(): ProfileGeometry {
  return {
    points: [[0, 1], [0.3, 0.8], [0.5, 0.3], [0.2, 0]],
    segments: 8,
  };
}

function testCylinder(): CylinderGeometry {
  return {
    radiusTop: 0.1,
    radiusBottom: 0.15,
    height: 0.5,
    radialSegments: 6,
  };
}

function testSpecimenMeshData(): MushroomMeshData {
  return {
    specimenId: 'test-specimen',
    cap: testProfile(),
    stem: testCylinder(),
    instanceData: {
      position: [0, 0, 0],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
      color: [1, 0.8, 0.6],
      emissive: [0, 0, 0],
    },
    lod: {
      billboard: false,
      billboardThreshold: 30,
      clusterCount: 1,
      clusterRadius: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

describe('serialize', () => {
  test('produces valid SerializedMeshData with version 1', () => {
    const mesh = buildFromProfile([[0.5, 0], [1, 0.5]], 4);
    const data = serialize(mesh);
    expect(data.version).toBe(1);
    expect(data.format).toBe('indexed'); // default without topology
    expect(data.positions.length).toBe(mesh.vertices.length * 3);
    expect(data.normals.length).toBe(mesh.vertices.length * 3);
    expect(data.indices.length).toBe(mesh.faces.length * 3);
    expect(data.vertexCount).toBe(mesh.vertices.length);
    expect(data.faceCount).toBe(mesh.faces.length);
  });

  test('omits topology by default', () => {
    const mesh = buildFromProfile([[0.5, 0], [1, 0.5]], 4);
    const data = serialize(mesh);
    expect(data.topology).toBeUndefined();
  });

  test('includes topology when requested', () => {
    const mesh = buildFromProfile([[0.5, 0], [1, 0.5]], 4);
    const data = serialize(mesh, { includeTopology: true });
    expect(data.topology).toBeDefined();
    expect(data.topology!.halfedges.length).toBe(mesh.halfedges.length);
    expect(data.topology!.vertexHalfedges.length).toBe(mesh.vertices.length);
    expect(data.topology!.faceHalfedges.length).toBe(mesh.faces.length);
    expect(data.format).toBe('halfedge');
  });

  test('includes metadata when provided', () => {
    const mesh = buildFromProfile([[0.5, 0], [1, 0.5]], 4);
    const data = serialize(mesh, {
      meta: {
        genus: 'Amanita',
        pipeline: ['subdivide(1)', 'smooth(3)'],
        generatedAt: 1234567890,
        sourceHash: 'abc123',
      },
    });
    expect(data.meta!.genus).toBe('Amanita');
    expect(data.meta!.pipeline).toEqual(['subdivide(1)', 'smooth(3)']);
  });

  test('output is JSON-serializable (no typed arrays, no circular refs)', () => {
    const mesh = buildFromProfile([[0.5, 0], [1, 0.5], [0.3, 1]], 6);
    const data = serialize(mesh, { includeTopology: true });
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(parsed.positions.length).toBe(data.positions.length);
    expect(parsed.indices.length).toBe(data.indices.length);
  });

  test('no NaN values in positions or normals', () => {
    const mesh = buildFromProfile([[0.5, 0], [1, 0.5], [0.3, 1]], 8);
    const data = serialize(mesh);
    for (const v of data.positions) expect(Number.isNaN(v)).toBe(false);
    for (const v of data.normals) expect(Number.isNaN(v)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Deserialization
// ---------------------------------------------------------------------------

describe('deserializeToHalfEdge', () => {
  test('round-trips without topology', () => {
    const original = buildFromProfile([[0.5, 0], [1, 0.5]], 4);
    const data = serialize(original);
    const restored = deserializeToHalfEdge(data);

    expect(restored).not.toBeNull();
    expect(restored!.vertices.length).toBe(original.vertices.length);
    expect(restored!.faces.length).toBe(original.faces.length);
  });

  test('round-trips with topology (fast path)', () => {
    const original = buildFromProfile([[0.5, 0], [1, 0.5]], 4);
    const data = serialize(original, { includeTopology: true });
    const restored = deserializeToHalfEdge(data);

    expect(restored).not.toBeNull();
    expect(restored!.vertices.length).toBe(original.vertices.length);
    expect(restored!.halfedges.length).toBe(original.halfedges.length);
    expect(restored!.faces.length).toBe(original.faces.length);
  });

  test('preserves vertex positions through round-trip', () => {
    const original = buildFromProfile([[0.5, 0], [1, 0.5]], 4);
    const data = serialize(original, { includeTopology: true });
    const restored = deserializeToHalfEdge(data)!;

    for (let i = 0; i < original.vertices.length; i++) {
      expect(restored.vertices[i].x).toBeCloseTo(original.vertices[i].x, 10);
      expect(restored.vertices[i].y).toBeCloseTo(original.vertices[i].y, 10);
      expect(restored.vertices[i].z).toBeCloseTo(original.vertices[i].z, 10);
    }
  });

  test('returns null for malformed data', () => {
    expect(deserializeToHalfEdge(null)).toBeNull();
    expect(deserializeToHalfEdge({})).toBeNull();
    expect(deserializeToHalfEdge({ version: 2 })).toBeNull();
    expect(deserializeToHalfEdge({ version: 1, positions: [], indices: [] })).toBeNull();
    expect(deserializeToHalfEdge('garbage')).toBeNull();
  });
});

describe('deserializeToFlat', () => {
  test('produces typed arrays from serialized data', () => {
    const mesh = buildFromProfile([[0.5, 0], [1, 0.5]], 4);
    const data = serialize(mesh);
    const flat = deserializeToFlat(data);

    expect(flat).not.toBeNull();
    expect(flat!.positions).toBeInstanceOf(Float32Array);
    expect(flat!.normals).toBeInstanceOf(Float32Array);
    expect(flat!.indices).toBeInstanceOf(Uint32Array);
    expect(flat!.positions.length).toBe(mesh.vertices.length * 3);
  });

  test('returns null for malformed data', () => {
    expect(deserializeToFlat(null)).toBeNull();
    expect(deserializeToFlat({ version: 99 })).toBeNull();
  });
});

describe('deserializeWithFallback', () => {
  test('returns FlatMeshData for valid input', () => {
    const mesh = buildFromProfile([[0.5, 0], [1, 0.5]], 4);
    const data = serialize(mesh);
    const flat = deserializeWithFallback(data);

    expect(flat).not.toBeNull();
    expect(flat!.positions).toBeInstanceOf(Float32Array);
  });

  test('returns null for completely invalid input', () => {
    expect(deserializeWithFallback('not a mesh')).toBeNull();
    expect(deserializeWithFallback(42)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Adapters
// ---------------------------------------------------------------------------

describe('profileToHalfEdge', () => {
  test('converts ProfileGeometry to HalfEdgeMesh', () => {
    const profile = testProfile();
    const mesh = profileToHalfEdge(profile);
    expect(mesh.vertices.length).toBeGreaterThan(0);
    expect(mesh.faces.length).toBeGreaterThan(0);
  });

  test('vertex count matches profile × segments', () => {
    const profile = testProfile(); // 4 points, 8 segments
    const mesh = profileToHalfEdge(profile);
    // (8+1) rings * 4 points = 36 vertices
    expect(mesh.vertices.length).toBe(36);
  });
});

describe('cylinderToHalfEdge', () => {
  test('converts CylinderGeometry to HalfEdgeMesh', () => {
    const cyl = testCylinder();
    const mesh = cylinderToHalfEdge(cyl);
    expect(mesh.vertices.length).toBeGreaterThan(0);
    expect(mesh.faces.length).toBeGreaterThan(0);
  });
});

describe('specimenToHalfEdge', () => {
  test('returns cap and stem meshes', () => {
    const data = testSpecimenMeshData();
    const { cap, stem } = specimenToHalfEdge(data);
    expect(cap.vertices.length).toBeGreaterThan(0);
    expect(cap.faces.length).toBeGreaterThan(0);
    expect(stem.vertices.length).toBeGreaterThan(0);
    expect(stem.faces.length).toBeGreaterThan(0);
  });

  test('cap and stem are independent meshes', () => {
    const data = testSpecimenMeshData();
    const { cap, stem } = specimenToHalfEdge(data);
    // Different vertex counts (cap has more points than stem)
    expect(cap.vertices.length).not.toBe(stem.vertices.length);
  });
});

// ---------------------------------------------------------------------------
// Fallback chain
// ---------------------------------------------------------------------------

describe('fallbackMeshFromProfile', () => {
  test('produces valid FlatMeshData', () => {
    const profile = testProfile();
    const flat = fallbackMeshFromProfile(profile);
    expect(flat.positions).toBeInstanceOf(Float32Array);
    expect(flat.normals).toBeInstanceOf(Float32Array);
    expect(flat.indices).toBeInstanceOf(Uint32Array);
    expect(flat.positions.length).toBeGreaterThan(0);
  });
});

describe('applyPipelineToProfile', () => {
  test('applies pipeline and returns FlatMeshData', () => {
    const profile = testProfile();
    const pipeline = pipe(subdivide(1), smooth(2));
    const flat = applyPipelineToProfile(profile, pipeline);
    expect(flat.positions).toBeInstanceOf(Float32Array);
    // Subdivided → more vertices than raw profile
    expect(flat.positions.length / 3).toBeGreaterThan(profile.points.length * (profile.segments + 1));
  });

  test('falls back to base mesh if pipeline throws', () => {
    const profile = testProfile();
    const brokenPipeline = () => { throw new Error('boom'); };
    const flat = applyPipelineToProfile(profile, brokenPipeline as any);
    // Should still return valid mesh data (fallback)
    expect(flat.positions).toBeInstanceOf(Float32Array);
    expect(flat.positions.length).toBeGreaterThan(0);
  });

  test('fallback mesh matches direct profile conversion', () => {
    const profile = testProfile();
    const brokenPipeline = () => { throw new Error('boom'); };
    const fallback = applyPipelineToProfile(profile, brokenPipeline as any);
    const direct = fallbackMeshFromProfile(profile);
    // Should produce identical results
    expect(fallback.positions.length).toBe(direct.positions.length);
    for (let i = 0; i < fallback.positions.length; i++) {
      expect(fallback.positions[i]).toBe(direct.positions[i]);
    }
  });
});

// ---------------------------------------------------------------------------
// Integration: serialize → deserialize → render-ready
// ---------------------------------------------------------------------------

describe('full pipeline integration', () => {
  test('profile → enrich → serialize → deserialize → flat arrays', () => {
    const profile = testProfile();
    const mesh = profileToHalfEdge(profile);
    const enriched = pipe(subdivide(1), smooth(2))(mesh);
    const serialized = serialize(enriched, {
      meta: { genus: 'Amanita', pipeline: ['subdivide(1)', 'smooth(2)'] },
    });
    const json = JSON.stringify(serialized);
    const parsed = JSON.parse(json);
    const flat = deserializeWithFallback(parsed);

    expect(flat).not.toBeNull();
    expect(flat!.positions).toBeInstanceOf(Float32Array);
    // Enriched mesh has more vertices than base
    expect(flat!.positions.length / 3).toBeGreaterThan(profile.points.length * (profile.segments + 1));
  });

  test('serialized size is reasonable (<50KB for a mushroom cap)', () => {
    const profile = testProfile();
    const mesh = profileToHalfEdge(profile);
    const enriched = pipe(subdivide(1), smooth(2))(mesh);
    const serialized = serialize(enriched);
    const json = JSON.stringify(serialized);
    const sizeKB = json.length / 1024;
    expect(sizeKB).toBeLessThan(50);
  });

  test('deterministic: same input → identical serialized output', () => {
    const profile = testProfile();
    const pipeline = pipe(subdivide(1), smooth(2));

    const run1 = serialize(pipeline(profileToHalfEdge(profile)));
    const run2 = serialize(pipeline(profileToHalfEdge(profile)));

    const json1 = JSON.stringify(run1);
    const json2 = JSON.stringify(run2);
    expect(json1).toBe(json2);
  });
});
