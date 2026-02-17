/**
 * mesh-runtime — browser-safe subset of the IMAGINARIUM mesh system.
 *
 * Re-exports everything needed for runtime mesh generation EXCEPT
 * `generateMeshAssets` (which depends on node:fs / node:path) and
 * `hashString` (which depends on Bun.CryptoHasher).
 *
 * Consumers:
 *   import { generateMeshData, genusPipeline, applyPipelineToProfile } from '@dendrovia/imaginarium/mesh-runtime';
 */

// Adapters (ProfileGeometry / CylinderGeometry → FlatMeshData with pipeline)
export {
  applyPipelineToCylinder,
  applyPipelineToProfile,
  fallbackMeshFromCylinder,
  fallbackMeshFromProfile,
} from '../mesh/adapters';

// Genus pipelines (per-genus MeshOp definitions)
export { DEFAULT_PIPELINE, genusPipeline, STEM_PIPELINE } from '../mesh/genusPipelines';

// Data structure — types + core builders
export type { FlatMeshData, HalfEdgeMesh } from '../mesh/HalfEdgeMesh';
export { buildFromCylinder, buildFromProfile, toFlatArrays } from '../mesh/HalfEdgeMesh';

// Operations
export { displaceByNoise, displaceNormal, smooth, subdivide } from '../mesh/ops/index';

// Pipeline combinators
export type { MeshOp } from '../mesh/pipeline';
export { pipe } from '../mesh/pipeline';

// Serialization (JSON-based, OPERATUS-compatible)
export { deserializeToFlat, serialize } from '../mesh/serialize';

// MeshGenerator — pure math, browser-safe
export type {
  CylinderGeometry,
  InstanceData,
  LODConfig,
  MushroomMeshData,
  ProfileGeometry,
} from '../mycology/assets/MeshGenerator';
export { generateMeshData } from '../mycology/assets/MeshGenerator';
