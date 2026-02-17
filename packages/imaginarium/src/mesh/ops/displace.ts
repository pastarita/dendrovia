/**
 * Vertex displacement operations — push vertices along their normals
 * using noise fields, scalar functions, or constant inflation.
 *
 * Grasshopper equivalents: Kangaroo Pressure goal, Weaverbird mesh
 * thicken, custom GhPython normal displacement scripts.
 */

import type { HalfEdgeMesh } from '../HalfEdgeMesh';
import type { MeshOp } from '../pipeline';

// ---------------------------------------------------------------------------
// Vertex normal computation (area-weighted)
// ---------------------------------------------------------------------------

function computeVertexNormals(mesh: HalfEdgeMesh): [number, number, number][] {
  const normals: [number, number, number][] = mesh.vertices.map(() => [0, 0, 0]);

  for (const face of mesh.faces) {
    const he0 = face.halfedge;
    const he1 = mesh.halfedges[he0]!.next;
    const _he2 = mesh.halfedges[he1]!.next;

    // Get 3 vertex indices from the face loop
    const vis: number[] = [];
    let he = he0;
    for (let i = 0; i < 3; i++) {
      vis.push(mesh.halfedges[he]!.vertex);
      he = mesh.halfedges[he]!.next;
    }
    // vis[0], vis[1], vis[2] — but we need the "from" of he0 as well
    // The face vertices in order: prev(he0).vertex, he0.vertex, he1.vertex
    const v0 = mesh.halfedges[mesh.halfedges[he0]!.prev]!.vertex;
    const v1 = mesh.halfedges[he0]!.vertex;
    const v2 = mesh.halfedges[he1]!.vertex;

    const ax = mesh.vertices[v1]!.x - mesh.vertices[v0]!.x;
    const ay = mesh.vertices[v1]!.y - mesh.vertices[v0]!.y;
    const az = mesh.vertices[v1]!.z - mesh.vertices[v0]!.z;
    const bx = mesh.vertices[v2]!.x - mesh.vertices[v0]!.x;
    const by = mesh.vertices[v2]!.y - mesh.vertices[v0]!.y;
    const bz = mesh.vertices[v2]!.z - mesh.vertices[v0]!.z;

    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;

    for (const vi of [v0, v1, v2]) {
      normals[vi]![0] += nx;
      normals[vi]![1] += ny;
      normals[vi]![2] += nz;
    }
  }

  // Normalize
  for (const n of normals) {
    const len = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
    if (len > 0) {
      n[0] /= len;
      n[1] /= len;
      n[2] /= len;
    }
  }

  return normals;
}

// ---------------------------------------------------------------------------
// Displacement operations
// ---------------------------------------------------------------------------

/**
 * Displace all vertices along their normals by a constant amount.
 * Positive = outward (inflation), negative = inward (deflation).
 *
 *   const op = displaceNormal(0.05); // inflate by 0.05 units
 */
export function displaceNormal(amount: number): MeshOp {
  return (mesh: HalfEdgeMesh) => {
    const normals = computeVertexNormals(mesh);
    const newVertices = mesh.vertices.map((v, i) => ({
      ...v,
      x: v.x + normals[i]![0] * amount,
      y: v.y + normals[i]![1] * amount,
      z: v.z + normals[i]![2] * amount,
    }));
    return {
      vertices: newVertices,
      halfedges: mesh.halfedges.map((he) => ({ ...he })),
      faces: mesh.faces.map((f) => ({ ...f })),
    };
  };
}

/**
 * Displace vertices along normals using a scalar function of position.
 * The function receives (x, y, z) and returns a displacement magnitude.
 *
 *   // Sinusoidal displacement
 *   const op = displaceByFunction((x, y, z) => 0.1 * Math.sin(y * 10));
 */
export function displaceByFunction(fn: (x: number, y: number, z: number) => number): MeshOp {
  return (mesh: HalfEdgeMesh) => {
    const normals = computeVertexNormals(mesh);
    const newVertices = mesh.vertices.map((v, i) => {
      const amount = fn(v.x, v.y, v.z);
      return {
        ...v,
        x: v.x + normals[i]![0] * amount,
        y: v.y + normals[i]![1] * amount,
        z: v.z + normals[i]![2] * amount,
      };
    });
    return {
      vertices: newVertices,
      halfedges: mesh.halfedges.map((he) => ({ ...he })),
      faces: mesh.faces.map((f) => ({ ...f })),
    };
  };
}

/**
 * Displace vertices using a per-vertex scalar field (e.g., from
 * reaction-diffusion simulation or noise sampling).
 *
 *   const field = new Float32Array(mesh.vertices.length);
 *   // ... populate field ...
 *   const op = displaceByField(field, 0.1);
 */
export function displaceByField(field: ArrayLike<number>, scale: number = 1.0): MeshOp {
  return (mesh: HalfEdgeMesh) => {
    const normals = computeVertexNormals(mesh);
    const newVertices = mesh.vertices.map((v, i) => {
      const amount = (field[i] ?? 0) * scale;
      return {
        ...v,
        x: v.x + normals[i]![0] * amount,
        y: v.y + normals[i]![1] * amount,
        z: v.z + normals[i]![2] * amount,
      };
    });
    return {
      vertices: newVertices,
      halfedges: mesh.halfedges.map((he) => ({ ...he })),
      faces: mesh.faces.map((f) => ({ ...f })),
    };
  };
}

/**
 * Simple 3D noise displacement using a hash-based pseudo-noise.
 * For production use, integrate with IMAGINARIUM's NoiseGenerator.
 *
 *   const op = displaceByNoise(0.05, 8.0); // amplitude 0.05, frequency 8
 */
export function displaceByNoise(amplitude: number, frequency: number = 4.0): MeshOp {
  // Simple hash-based noise (deterministic, no dependencies)
  function hash(x: number, y: number, z: number): number {
    let h = x * 374761393 + y * 668265263 + z * 1274126177;
    h = (h ^ (h >> 13)) * 1103515245;
    return ((h ^ (h >> 16)) & 0x7fffffff) / 0x7fffffff;
  }

  function noise3d(x: number, y: number, z: number): number {
    const ix = Math.floor(x),
      iy = Math.floor(y),
      iz = Math.floor(z);
    const fx = x - ix,
      fy = y - iy,
      fz = z - iz;
    // Smoothstep
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const sz = fz * fz * (3 - 2 * fz);
    // Trilinear interpolation of 8 corners
    const c000 = hash(ix, iy, iz);
    const c100 = hash(ix + 1, iy, iz);
    const c010 = hash(ix, iy + 1, iz);
    const c110 = hash(ix + 1, iy + 1, iz);
    const c001 = hash(ix, iy, iz + 1);
    const c101 = hash(ix + 1, iy, iz + 1);
    const c011 = hash(ix, iy + 1, iz + 1);
    const c111 = hash(ix + 1, iy + 1, iz + 1);

    const x0 = c000 + sx * (c100 - c000);
    const x1 = c010 + sx * (c110 - c010);
    const x2 = c001 + sx * (c101 - c001);
    const x3 = c011 + sx * (c111 - c011);
    const y0 = x0 + sy * (x1 - x0);
    const y1 = x2 + sy * (x3 - x2);
    return (y0 + sz * (y1 - y0)) * 2 - 1; // range [-1, 1]
  }

  return displaceByFunction((x, y, z) => amplitude * noise3d(x * frequency, y * frequency, z * frequency));
}
