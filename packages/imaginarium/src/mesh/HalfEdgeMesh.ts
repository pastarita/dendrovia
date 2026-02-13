/**
 * HalfEdgeMesh — topology-aware mesh data structure for procedural operations.
 *
 * Every edge stores two directed "half-edges" enabling O(1) adjacency queries:
 * vertex neighbors, face neighbors, boundary detection, edge traversal.
 *
 * Design: array-of-structs with integer indices (no object references).
 * This keeps the structure serializable and cache-friendly.
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export interface HEVertex {
  x: number;
  y: number;
  z: number;
  halfedge: number; // index of one outgoing halfedge (-1 if isolated)
}

export interface HEHalfEdge {
  vertex: number;   // vertex this halfedge points TO
  face: number;     // face to the left (-1 if boundary)
  next: number;     // next halfedge in the face loop (CCW)
  prev: number;     // previous halfedge in the face loop
  twin: number;     // opposite halfedge (-1 if boundary)
}

export interface HEFace {
  halfedge: number; // one halfedge on this face's boundary
}

export interface HalfEdgeMesh {
  vertices: HEVertex[];
  halfedges: HEHalfEdge[];
  faces: HEFace[];
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

/**
 * Build a HalfEdgeMesh from indexed triangle data.
 *
 * @param positions Flat [x,y,z, x,y,z, ...] vertex positions
 * @param indices   Triangle indices (every 3 = one face)
 */
export function buildFromIndexed(
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
): HalfEdgeMesh {
  const vertexCount = positions.length / 3;
  const faceCount = indices.length / 3;

  // Vertices
  const vertices: HEVertex[] = [];
  for (let i = 0; i < vertexCount; i++) {
    vertices.push({
      x: positions[i * 3],
      y: positions[i * 3 + 1],
      z: positions[i * 3 + 2],
      halfedge: -1,
    });
  }

  // Faces + halfedges
  const faces: HEFace[] = [];
  const halfedges: HEHalfEdge[] = [];

  // Map from "v0:v1" -> halfedge index for twin pairing
  const edgeMap = new Map<string, number>();

  for (let fi = 0; fi < faceCount; fi++) {
    const i0 = indices[fi * 3];
    const i1 = indices[fi * 3 + 1];
    const i2 = indices[fi * 3 + 2];
    const vis = [i0, i1, i2];

    const baseHE = halfedges.length;
    faces.push({ halfedge: baseHE });

    // Create 3 halfedges for this triangle
    for (let e = 0; e < 3; e++) {
      halfedges.push({
        vertex: vis[(e + 1) % 3], // points TO next vertex
        face: fi,
        next: baseHE + (e + 1) % 3,
        prev: baseHE + (e + 2) % 3,
        twin: -1,
      });
    }

    // Set vertex -> halfedge references
    for (let e = 0; e < 3; e++) {
      const heIdx = baseHE + e;
      const fromV = vis[e];
      if (vertices[fromV].halfedge === -1) {
        vertices[fromV].halfedge = heIdx;
      }
    }

    // Twin pairing
    for (let e = 0; e < 3; e++) {
      const from = vis[e];
      const to = vis[(e + 1) % 3];
      const heIdx = baseHE + e;
      const key = `${from}:${to}`;
      const twinKey = `${to}:${from}`;

      if (edgeMap.has(twinKey)) {
        const twinIdx = edgeMap.get(twinKey)!;
        halfedges[heIdx].twin = twinIdx;
        halfedges[twinIdx].twin = heIdx;
        edgeMap.delete(twinKey);
      } else {
        edgeMap.set(key, heIdx);
      }
    }
  }

  return { vertices, halfedges, faces };
}

/**
 * Build from a LatheGeometry-style profile: revolve 2D points around Y axis.
 *
 * @param profile  Array of [radius, height] pairs (profile curve)
 * @param segments Number of radial segments (e.g., 16, 32)
 */
export function buildFromProfile(
  profile: [number, number][],
  segments: number,
): HalfEdgeMesh {
  const rows = profile.length;
  const positions: number[] = [];
  const indices: number[] = [];

  // Generate vertices by revolving profile
  for (let s = 0; s <= segments; s++) {
    const theta = (s / segments) * Math.PI * 2;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    for (let r = 0; r < rows; r++) {
      const [radius, height] = profile[r];
      positions.push(radius * cosT, height, radius * sinT);
    }
  }

  // Generate triangle indices (connect adjacent rings)
  for (let s = 0; s < segments; s++) {
    for (let r = 0; r < rows - 1; r++) {
      const a = s * rows + r;
      const b = s * rows + r + 1;
      const c = (s + 1) * rows + r + 1;
      const d = (s + 1) * rows + r;

      // Two triangles per quad
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  return buildFromIndexed(new Float32Array(positions), new Uint32Array(indices));
}

/**
 * Build from a cylinder: top/bottom radius, height, segments.
 */
export function buildFromCylinder(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  radialSegments: number,
  heightSegments: number = 1,
): HalfEdgeMesh {
  const profile: [number, number][] = [];
  for (let h = 0; h <= heightSegments; h++) {
    const t = h / heightSegments;
    const radius = radiusBottom + (radiusTop - radiusBottom) * t;
    profile.push([radius, t * height]);
  }
  return buildFromProfile(profile, radialSegments);
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Iterate vertex indices of vertices adjacent to the given vertex. */
export function* vertexNeighbors(mesh: HalfEdgeMesh, vi: number): Generator<number> {
  const startHE = mesh.vertices[vi].halfedge;
  if (startHE === -1) return;

  const seen = new Set<number>();

  // Traverse CW around vertex via twin.next
  let he = startHE;
  do {
    const target = mesh.halfedges[he].vertex;
    if (!seen.has(target)) {
      seen.add(target);
      yield target;
    }
    const twin = mesh.halfedges[he].twin;
    if (twin === -1) break; // hit boundary going CW
    he = mesh.halfedges[twin].next;
  } while (he !== startHE);

  // If we hit a boundary, also traverse CCW from start to find remaining neighbors
  if (mesh.halfedges[he].twin === -1 || he === startHE) {
    // Go CCW: follow prev.twin from startHE
    he = startHE;
    while (true) {
      const prev = mesh.halfedges[he].prev;
      const fromV = mesh.halfedges[mesh.halfedges[prev].prev].vertex;
      if (!seen.has(fromV)) {
        // The "from" vertex of the previous halfedge is a neighbor
      }
      const prevTwin = mesh.halfedges[prev].twin;
      if (prevTwin === -1) {
        // prev goes from some vertex to vi; that vertex is a neighbor
        const source = halfedgeFrom(mesh, prev);
        if (!seen.has(source)) {
          seen.add(source);
          yield source;
        }
        break;
      }
      he = prevTwin;
      const target = mesh.halfedges[he].vertex;
      if (!seen.has(target)) {
        seen.add(target);
        yield target;
      }
      if (he === startHE) break;
    }
  }
}

/** Iterate face indices of faces adjacent to the given vertex. */
export function* vertexFaces(mesh: HalfEdgeMesh, vi: number): Generator<number> {
  const startHE = mesh.vertices[vi].halfedge;
  if (startHE === -1) return;

  let he = startHE;
  do {
    const face = mesh.halfedges[he].face;
    if (face !== -1) yield face;
    const twin = mesh.halfedges[he].twin;
    if (twin === -1) break;
    he = mesh.halfedges[twin].next;
  } while (he !== startHE);
}

/** Get the three vertex indices of a triangle face. */
export function faceVertices(mesh: HalfEdgeMesh, fi: number): [number, number, number] {
  const he0 = mesh.faces[fi].halfedge;
  const he1 = mesh.halfedges[he0].next;
  const he2 = mesh.halfedges[he1].next;

  // The "from" vertex of each halfedge
  return [
    mesh.halfedges[mesh.halfedges[he0].prev].vertex === mesh.halfedges[he0].vertex
      ? mesh.halfedges[he2].vertex
      : mesh.halfedges[mesh.halfedges[he0].prev].vertex,
    mesh.halfedges[he0].vertex,
    mesh.halfedges[he1].vertex,
  ];
}

/** Get vertex index that a halfedge originates FROM. */
export function halfedgeFrom(mesh: HalfEdgeMesh, heIdx: number): number {
  return mesh.halfedges[mesh.halfedges[heIdx].prev].vertex;
}

/** Check if a vertex is on the boundary (has a boundary halfedge). */
export function isBoundaryVertex(mesh: HalfEdgeMesh, vi: number): boolean {
  const startHE = mesh.vertices[vi].halfedge;
  if (startHE === -1) return true;

  let he = startHE;
  do {
    if (mesh.halfedges[he].twin === -1) return true;
    he = mesh.halfedges[mesh.halfedges[he].twin].next;
  } while (he !== startHE);
  return false;
}

/** Count vertices, faces, edges, boundary edges. */
export function meshStats(mesh: HalfEdgeMesh): {
  vertices: number;
  faces: number;
  edges: number;
  boundaryEdges: number;
} {
  let edges = 0;
  let boundaryEdges = 0;
  for (const he of mesh.halfedges) {
    if (he.twin === -1 || he.twin > mesh.halfedges.indexOf(he)) {
      edges++;
    }
    if (he.twin === -1) boundaryEdges++;
  }
  return {
    vertices: mesh.vertices.length,
    faces: mesh.faces.length,
    edges,
    boundaryEdges,
  };
}

// ---------------------------------------------------------------------------
// Export to flat arrays (Three.js BufferGeometry compatible)
// ---------------------------------------------------------------------------

export interface FlatMeshData {
  positions: Float32Array;  // 3 floats per vertex
  normals: Float32Array;    // 3 floats per vertex
  indices: Uint32Array;     // 3 indices per face
}

/** Convert HalfEdgeMesh to flat typed arrays for GPU upload. */
export function toFlatArrays(mesh: HalfEdgeMesh): FlatMeshData {
  const vCount = mesh.vertices.length;
  const positions = new Float32Array(vCount * 3);
  const normals = new Float32Array(vCount * 3);

  // Copy positions
  for (let i = 0; i < vCount; i++) {
    positions[i * 3] = mesh.vertices[i].x;
    positions[i * 3 + 1] = mesh.vertices[i].y;
    positions[i * 3 + 2] = mesh.vertices[i].z;
  }

  // Compute per-vertex normals (area-weighted face normal accumulation)
  for (const face of mesh.faces) {
    const he0 = face.halfedge;
    const he1 = mesh.halfedges[he0].next;
    const he2 = mesh.halfedges[he1].next;

    const v0 = halfedgeFrom(mesh, he0);
    const v1 = mesh.halfedges[he0].vertex;
    const v2 = mesh.halfedges[he1].vertex;

    // Cross product for face normal (not normalized = area-weighted)
    const ax = mesh.vertices[v1].x - mesh.vertices[v0].x;
    const ay = mesh.vertices[v1].y - mesh.vertices[v0].y;
    const az = mesh.vertices[v1].z - mesh.vertices[v0].z;
    const bx = mesh.vertices[v2].x - mesh.vertices[v0].x;
    const by = mesh.vertices[v2].y - mesh.vertices[v0].y;
    const bz = mesh.vertices[v2].z - mesh.vertices[v0].z;

    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;

    for (const vi of [v0, v1, v2]) {
      normals[vi * 3] += nx;
      normals[vi * 3 + 1] += ny;
      normals[vi * 3 + 2] += nz;
    }
  }

  // Normalize
  for (let i = 0; i < vCount; i++) {
    const nx = normals[i * 3];
    const ny = normals[i * 3 + 1];
    const nz = normals[i * 3 + 2];
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 0) {
      normals[i * 3] /= len;
      normals[i * 3 + 1] /= len;
      normals[i * 3 + 2] /= len;
    }
  }

  // Build index buffer
  const indices = new Uint32Array(mesh.faces.length * 3);
  for (let fi = 0; fi < mesh.faces.length; fi++) {
    const he0 = mesh.faces[fi].halfedge;
    const he1 = mesh.halfedges[he0].next;
    const he2 = mesh.halfedges[he1].next;

    indices[fi * 3] = halfedgeFrom(mesh, he0);
    indices[fi * 3 + 1] = mesh.halfedges[he0].vertex;
    indices[fi * 3 + 2] = mesh.halfedges[he1].vertex;
  }

  return { positions, normals, indices };
}
