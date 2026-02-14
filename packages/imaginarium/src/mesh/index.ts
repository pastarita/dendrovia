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

// Serialization (OPERATUS-compatible versioned persistence)
export type { SerializeOptions } from './serialize.js';
export {
  serialize, deserializeToHalfEdge, deserializeToFlat, deserializeWithFallback,
} from './serialize.js';

// Adapters (bridge existing MeshGenerator types ↔ HalfEdgeMesh pipeline)
export {
  profileToHalfEdge, cylinderToHalfEdge, specimenToHalfEdge,
  fallbackMeshFromProfile, fallbackMeshFromCylinder,
  applyPipelineToProfile, applyPipelineToCylinder,
} from './adapters.js';
