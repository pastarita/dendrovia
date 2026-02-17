/**
 * Mesh system — half-edge data structure, composable pipeline, and operations.
 *
 * Architecture inspired by Nervous System (Floraform/Hyphae), the Grasshopper
 * ecosystem (Kangaroo/Weaverbird), and demoscene procedural techniques.
 */

// Adapters (bridge existing MeshGenerator types ↔ HalfEdgeMesh pipeline)
export {
  applyPipelineToCylinder,
  applyPipelineToProfile,
  cylinderToHalfEdge,
  fallbackMeshFromCylinder,
  fallbackMeshFromProfile,
  profileToHalfEdge,
  specimenToHalfEdge,
} from './adapters';
// Mesh asset generation (orchestrator for the distillation pipeline)
export type { MeshGenerationResult, MeshGenerationStats } from './generateMeshAssets';
export { generateMeshAssets } from './generateMeshAssets';
// Genus pipelines (per-genus MeshOp definitions for the distillation pipeline)
export { DEFAULT_PIPELINE, genusPipeline, STEM_PIPELINE } from './genusPipelines';
// Data structure
export type { FlatMeshData, HalfEdgeMesh, HEFace, HEHalfEdge, HEVertex } from './HalfEdgeMesh';
export {
  buildFromCylinder,
  buildFromIndexed,
  buildFromProfile,
  faceVertices,
  halfedgeFrom,
  isBoundaryVertex,
  meshStats,
  toFlatArrays,
  vertexFaces,
  vertexNeighbors,
} from './HalfEdgeMesh';
// Operations
export {
  displaceByField,
  displaceByFunction,
  displaceByNoise,
  displaceNormal,
  laplacianSmoothOnce,
  loopSubdivideOnce,
  smooth,
  subdivide,
  taubinSmooth,
} from './ops/index';
// Pipeline
export type { AsyncMeshOp, MeshOp, PipelineStep } from './pipeline';
export { MeshPipeline, pipe, pipeAsync, repeat, when } from './pipeline';
// Serialization (OPERATUS-compatible versioned persistence)
export type { SerializeOptions } from './serialize';
export { deserializeToFlat, deserializeToHalfEdge, deserializeWithFallback, serialize } from './serialize';
