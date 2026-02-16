/**
 * Laplacian smoothing — moves each vertex toward the centroid of its neighbors.
 *
 * The Grasshopper equivalent is Kangaroo's TangentialSmooth goal and
 * Weaverbird's Laplacian smoothing component.
 *
 * Boundary vertices are optionally pinned to prevent mesh shrinkage.
 */

import type { HalfEdgeMesh } from '../HalfEdgeMesh';
import { vertexNeighbors, isBoundaryVertex } from '../HalfEdgeMesh';
import type { MeshOp } from '../pipeline';

/**
 * Perform one iteration of Laplacian smoothing.
 *
 * @param factor  Blend factor: 0 = no change, 1 = move fully to centroid
 * @param pinBoundary  If true, boundary vertices are not moved
 */
export function laplacianSmoothOnce(
  mesh: HalfEdgeMesh,
  factor: number = 0.5,
  pinBoundary: boolean = true,
): HalfEdgeMesh {
  const newVertices = mesh.vertices.map((v, vi) => {
    if (pinBoundary && isBoundaryVertex(mesh, vi)) {
      return { ...v };
    }

    const neighbors: number[] = [];
    for (const ni of vertexNeighbors(mesh, vi)) {
      neighbors.push(ni);
    }

    if (neighbors.length === 0) return { ...v };

    // Compute centroid of neighbors
    let cx = 0, cy = 0, cz = 0;
    for (const ni of neighbors) {
      cx += mesh.vertices[ni]!.x;
      cy += mesh.vertices[ni]!.y;
      cz += mesh.vertices[ni]!.z;
    }
    cx /= neighbors.length;
    cy /= neighbors.length;
    cz /= neighbors.length;

    return {
      ...v,
      x: v.x + (cx - v.x) * factor,
      y: v.y + (cy - v.y) * factor,
      z: v.z + (cz - v.z) * factor,
    };
  });

  return {
    vertices: newVertices,
    halfedges: mesh.halfedges.map(he => ({ ...he })),
    faces: mesh.faces.map(f => ({ ...f })),
  };
}

/**
 * Create a MeshOp that performs N iterations of Laplacian smoothing.
 *
 *   const op = smooth(10, 0.3); // 10 iterations, factor 0.3
 */
export function smooth(iterations: number, factor: number = 0.5): MeshOp {
  return (mesh: HalfEdgeMesh) => {
    let current = mesh;
    for (let i = 0; i < iterations; i++) {
      current = laplacianSmoothOnce(current, factor);
    }
    return current;
  };
}

/**
 * Taubin smoothing — alternates positive and negative Laplacian steps
 * to smooth without shrinkage. The Grasshopper equivalent is
 * Weaverbird's "Taubin Smoothing" component.
 *
 * @param iterations  Number of iteration pairs
 * @param lambda      Positive smoothing factor (e.g., 0.5)
 * @param mu          Negative smoothing factor (e.g., -0.53), |mu| > lambda
 */
export function taubinSmooth(
  iterations: number,
  lambda: number = 0.5,
  mu: number = -0.53,
): MeshOp {
  return (mesh: HalfEdgeMesh) => {
    let current = mesh;
    for (let i = 0; i < iterations; i++) {
      current = laplacianSmoothOnce(current, lambda);
      current = laplacianSmoothOnce(current, mu);
    }
    return current;
  };
}
