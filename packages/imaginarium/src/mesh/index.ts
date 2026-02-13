/**
 * Mesh system — half-edge data structure, composable pipeline, and operations.
 *
 * Architecture inspired by Nervous System (Floraform/Hyphae), the Grasshopper
 * ecosystem (Kangaroo/Weaverbird), and demoscene procedural techniques.
 */

// Data structure
export type {
  HEVertex, HEHalfEdge, HEFace, HalfEdgeMesh, FlatMeshData,
} from './HalfEdgeMesh.js';
export {
  buildFromIndexed, buildFromProfile, buildFromCylinder,
  vertexNeighbors, vertexFaces, faceVertices, halfedgeFrom,
  isBoundaryVertex, meshStats, toFlatArrays,
} from './HalfEdgeMesh.js';

// Pipeline
export type { MeshOp, AsyncMeshOp, PipelineStep } from './pipeline.js';
export { pipe, pipeAsync, when, repeat, MeshPipeline } from './pipeline.js';

// Operations
export {
  subdivide, loopSubdivideOnce,
  smooth, taubinSmooth, laplacianSmoothOnce,
  displaceNormal, displaceByFunction, displaceByField, displaceByNoise,
} from './ops/index.js';
