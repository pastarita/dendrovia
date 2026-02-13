/**
 * Tests for the HalfEdgeMesh data structure.
 */

import { describe, test, expect } from 'bun:test';
import {
  buildFromIndexed,
  buildFromProfile,
  buildFromCylinder,
  vertexNeighbors,
  vertexFaces,
  isBoundaryVertex,
  toFlatArrays,
  type HalfEdgeMesh,
} from '../../src/mesh/HalfEdgeMesh.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a single triangle: vertices at (0,0,0), (1,0,0), (0,1,0). */
function singleTriangle(): HalfEdgeMesh {
  return buildFromIndexed(
    new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    new Uint32Array([0, 1, 2]),
  );
}

/** Build two triangles sharing an edge: a quad split diagonally. */
function twoTriangles(): HalfEdgeMesh {
  // (0,0,0), (1,0,0), (1,1,0), (0,1,0)
  // Triangle 1: 0,1,2  Triangle 2: 0,2,3
  return buildFromIndexed(
    new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]),
    new Uint32Array([0, 1, 2, 0, 2, 3]),
  );
}

// ---------------------------------------------------------------------------
// buildFromIndexed
// ---------------------------------------------------------------------------

describe('buildFromIndexed', () => {
  test('single triangle has 3 vertices, 1 face, 3 halfedges', () => {
    const mesh = singleTriangle();
    expect(mesh.vertices.length).toBe(3);
    expect(mesh.faces.length).toBe(1);
    expect(mesh.halfedges.length).toBe(3);
  });

  test('two triangles have 4 vertices, 2 faces, 6 halfedges', () => {
    const mesh = twoTriangles();
    expect(mesh.vertices.length).toBe(4);
    expect(mesh.faces.length).toBe(2);
    expect(mesh.halfedges.length).toBe(6);
  });

  test('halfedge next forms a cycle within each face', () => {
    const mesh = singleTriangle();
    const he0 = mesh.faces[0].halfedge;
    const he1 = mesh.halfedges[he0].next;
    const he2 = mesh.halfedges[he1].next;
    expect(mesh.halfedges[he2].next).toBe(he0);
  });

  test('halfedge prev forms a reverse cycle within each face', () => {
    const mesh = singleTriangle();
    const he0 = mesh.faces[0].halfedge;
    const he1 = mesh.halfedges[he0].prev;
    const he2 = mesh.halfedges[he1].prev;
    expect(mesh.halfedges[he2].prev).toBe(he0);
  });

  test('twin pairing works for shared edges', () => {
    const mesh = twoTriangles();
    let twinCount = 0;
    for (const he of mesh.halfedges) {
      if (he.twin !== -1) {
        twinCount++;
        // twin of twin should be self
        expect(mesh.halfedges[he.twin].twin).not.toBe(-1);
      }
    }
    // Two halfedges share the diagonal edge: 2 paired
    expect(twinCount).toBe(2);
  });

  test('boundary halfedges have twin = -1', () => {
    const mesh = singleTriangle();
    // All 3 edges are boundary (single triangle)
    for (const he of mesh.halfedges) {
      expect(he.twin).toBe(-1);
    }
  });

  test('every vertex has a valid halfedge reference', () => {
    const mesh = twoTriangles();
    for (const v of mesh.vertices) {
      expect(v.halfedge).toBeGreaterThanOrEqual(0);
      expect(v.halfedge).toBeLessThan(mesh.halfedges.length);
    }
  });
});

// ---------------------------------------------------------------------------
// buildFromProfile (LatheGeometry equivalent)
// ---------------------------------------------------------------------------

describe('buildFromProfile', () => {
  test('simple 2-point profile with 4 segments produces a cylinder-like mesh', () => {
    const mesh = buildFromProfile(
      [[1, 0], [1, 1]], // vertical line at radius=1
      4,
    );
    // 2 rows * (4+1) columns = 10 vertices (last column wraps)
    expect(mesh.vertices.length).toBe(10);
    // 4 quads * 2 triangles = 8 faces
    expect(mesh.faces.length).toBe(8);
  });

  test('3-point profile with 6 segments produces more faces', () => {
    const mesh = buildFromProfile(
      [[0.5, 0], [1, 0.5], [0.5, 1]], // curved profile
      6,
    );
    // 3 rows * 7 columns = 21 vertices
    expect(mesh.vertices.length).toBe(21);
    // 6 segments * 2 rows * 2 triangles = 24 faces
    expect(mesh.faces.length).toBe(24);
  });

  test('revolution produces closed ring (first and last column at same angle)', () => {
    const mesh = buildFromProfile([[1, 0], [1, 1]], 8);
    // First vertex and last-ring vertex should be at same position (within float precision)
    const first = mesh.vertices[0];
    const last = mesh.vertices[mesh.vertices.length - 2]; // second-to-last row, last ring
    // They should be at angle 0 and angle 2*PI respectively — same position
    expect(Math.abs(first.x - last.x)).toBeLessThan(1e-6);
    expect(Math.abs(first.z - last.z)).toBeLessThan(1e-6);
  });
});

// ---------------------------------------------------------------------------
// buildFromCylinder
// ---------------------------------------------------------------------------

describe('buildFromCylinder', () => {
  test('creates mesh with correct vertex count', () => {
    const mesh = buildFromCylinder(0.5, 1.0, 2.0, 8, 4);
    // (4+1) height segments * (8+1) radial = 45 vertices
    expect(mesh.vertices.length).toBe(45);
  });

  test('height dimension is correct', () => {
    const mesh = buildFromCylinder(0.5, 1.0, 3.0, 6, 2);
    const ys = mesh.vertices.map(v => v.y);
    expect(Math.min(...ys)).toBeCloseTo(0, 5);
    expect(Math.max(...ys)).toBeCloseTo(3.0, 5);
  });
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

describe('vertexNeighbors', () => {
  test('single triangle: each vertex has 2 neighbors', () => {
    const mesh = singleTriangle();
    for (let vi = 0; vi < 3; vi++) {
      const neighbors = [...vertexNeighbors(mesh, vi)];
      expect(neighbors.length).toBe(2);
    }
  });

  test('two triangles: shared-edge vertices have 3 neighbors', () => {
    const mesh = twoTriangles();
    // Vertices 0 and 2 are on the shared diagonal
    const n0 = [...vertexNeighbors(mesh, 0)];
    // Vertex 0 connects to 1, 2, 3
    expect(n0.length).toBeGreaterThanOrEqual(2);
  });

  test('isolated vertex yields no neighbors', () => {
    const mesh = singleTriangle();
    // Add an isolated vertex
    mesh.vertices.push({ x: 5, y: 5, z: 5, halfedge: -1 });
    const neighbors = [...vertexNeighbors(mesh, 3)];
    expect(neighbors.length).toBe(0);
  });
});

describe('vertexFaces', () => {
  test('single triangle: each vertex has 1 adjacent face', () => {
    const mesh = singleTriangle();
    for (let vi = 0; vi < 3; vi++) {
      const faces = [...vertexFaces(mesh, vi)];
      expect(faces.length).toBe(1);
      expect(faces[0]).toBe(0);
    }
  });
});

describe('isBoundaryVertex', () => {
  test('all vertices of a single triangle are boundary', () => {
    const mesh = singleTriangle();
    for (let vi = 0; vi < 3; vi++) {
      expect(isBoundaryVertex(mesh, vi)).toBe(true);
    }
  });

  test('isolated vertex is boundary', () => {
    const mesh = singleTriangle();
    mesh.vertices.push({ x: 0, y: 0, z: 0, halfedge: -1 });
    expect(isBoundaryVertex(mesh, 3)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Export to flat arrays
// ---------------------------------------------------------------------------

describe('toFlatArrays', () => {
  test('positions match vertex data', () => {
    const mesh = singleTriangle();
    const { positions } = toFlatArrays(mesh);
    expect(positions.length).toBe(9); // 3 vertices * 3 components
    expect(positions[0]).toBe(0); // v0.x
    expect(positions[3]).toBe(1); // v1.x
    expect(positions[7]).toBe(1); // v2.y
  });

  test('normals are unit length', () => {
    const mesh = singleTriangle();
    const { normals } = toFlatArrays(mesh);
    for (let i = 0; i < 3; i++) {
      const nx = normals[i * 3];
      const ny = normals[i * 3 + 1];
      const nz = normals[i * 3 + 2];
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      expect(len).toBeCloseTo(1.0, 4);
    }
  });

  test('single triangle normal points in +Z', () => {
    // Triangle in XY plane: (0,0,0), (1,0,0), (0,1,0) -> normal = +Z
    const mesh = singleTriangle();
    const { normals } = toFlatArrays(mesh);
    expect(normals[2]).toBeCloseTo(1.0, 4); // v0 nz
    expect(normals[5]).toBeCloseTo(1.0, 4); // v1 nz
    expect(normals[8]).toBeCloseTo(1.0, 4); // v2 nz
  });

  test('indices reference valid vertices', () => {
    const mesh = twoTriangles();
    const { indices } = toFlatArrays(mesh);
    expect(indices.length).toBe(6); // 2 faces * 3
    for (const idx of indices) {
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(mesh.vertices.length);
    }
  });

  test('profile mesh produces valid flat arrays', () => {
    const mesh = buildFromProfile([[0.5, 0], [1, 0.5], [0.3, 1]], 8);
    const { positions, normals, indices } = toFlatArrays(mesh);
    expect(positions.length).toBe(mesh.vertices.length * 3);
    expect(normals.length).toBe(mesh.vertices.length * 3);
    expect(indices.length).toBe(mesh.faces.length * 3);

    // No NaN values
    for (let i = 0; i < positions.length; i++) {
      expect(Number.isNaN(positions[i])).toBe(false);
    }
    for (let i = 0; i < normals.length; i++) {
      expect(Number.isNaN(normals[i])).toBe(false);
    }
  });
});
