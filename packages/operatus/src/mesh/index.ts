/**
 * Runtime mesh generation — L3 strategy.
 *
 * Generates mushroom meshes on-demand in the browser,
 * caches binary results in the OPERATUS tiered cache.
 */

export type { BatchOpts, MeshFactoryStats, MeshResult } from './MeshFactory';
export { MeshFactory, MESH_PIPELINE_VERSION } from './MeshFactory';
export { decodeMesh, encodeMesh } from './serialization';
