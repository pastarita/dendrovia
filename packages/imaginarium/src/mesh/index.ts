/**
 * Mesh system — half-edge data structure, composable pipeline, and operations.
 *
 * Architecture inspired by Nervous System (Floraform/Hyphae), the Grasshopper
 * ecosystem (Kangaroo/Weaverbird), and demoscene procedural techniques.
 */

// Data structure
export type {
  HEVertex, HEHalfEdge, HEFace, HalfEdgeMesh, FlatMeshData,
} from './HalfEdgeMesh';
export {
  buildFromIndexed, buildFromProfile, buildFromCylinder,
  vertexNeighbors, vertexFaces, faceVertices, halfedgeFrom,
  isBoundaryVertex, meshStats, toFlatArrays,
} from './HalfEdgeMesh';

// Pipeline
export type { MeshOp, AsyncMeshOp, PipelineStep } from './pipeline';
export { pipe, pipeAsync, when, repeat, MeshPipeline } from './pipeline';

// Operations
export {
  subdivide, loopSubdivideOnce,
  smooth, taubinSmooth, laplacianSmoothOnce,
  displaceNormal, displaceByFunction, displaceByField, displaceByNoise,
} from './ops/index';

// Serialization (OPERATUS-compatible versioned persistence)
export type { SerializeOptions } from './serialize';
export {
  serialize, deserializeToHalfEdge, deserializeToFlat, deserializeWithFallback,
} from './serialize';

// Adapters (bridge existing MeshGenerator types ↔ HalfEdgeMesh pipeline)
export {
  profileToHalfEdge, cylinderToHalfEdge, specimenToHalfEdge,
  fallbackMeshFromProfile, fallbackMeshFromCylinder,
  applyPipelineToProfile, applyPipelineToCylinder,
} from './adapters';

// Genus pipelines (per-genus MeshOp definitions for the distillation pipeline)
export { genusPipeline, DEFAULT_PIPELINE, STEM_PIPELINE } from './genusPipelines';

// Mesh asset generation (orchestrator for the distillation pipeline)
export type { MeshGenerationResult, MeshGenerationStats } from './generateMeshAssets';
export { generateMeshAssets } from './generateMeshAssets';
