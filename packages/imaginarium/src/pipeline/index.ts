/**
 * Pipeline barrel — build-time orchestration exports.
 *
 * Use `@dendrovia/imaginarium/build` subpath to access these
 * without pulling in the entire imaginarium package.
 */

export { distill, type PipelineResult } from './DistillationPipeline';
export { distillSegments, MOOD_STRATEGIES } from './SegmentPipeline';
export { generateManifest, generateChunkedManifest, type ManifestInput, type ChunkedManifestInput } from './ManifestGenerator';
export { readTopology } from './TopologyReader';
export { generateMockTopology } from './MockTopology';
export { chunkTopology } from './TopologyChunker';
export { precomputePlacements } from './SegmentPlacementPrecomputer';
export type { GlobalGenerationContext, SegmentGenerationContext, MoodStrategy, VersionedArtifact } from './types';
export { IMAGINARIUM_SCHEMA_VERSION } from './types';
