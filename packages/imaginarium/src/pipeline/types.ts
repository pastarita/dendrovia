/**
 * Pipeline generation context types.
 *
 * Formalizes how data flows through the distillation pipeline:
 * - GlobalGenerationContext: build-time, whole-topology scope
 * - SegmentGenerationContext: per-segment, inherits global + segment-local data
 * - VersionedArtifact: wrapper for versioned JSON artifacts written to disk
 */

import type { CodeTopology, StorySegment } from '@dendrovia/shared';
import type { DeterministicCache } from '../cache/DeterministicCache';
import type { PaletteOverrides } from '../distillation/ColorExtractor';
import type { NoiseOverrides } from '../distillation/NoiseGenerator';
import type { LSystemOverrides } from '../distillation/LSystemCompiler';

/** Schema version for all IMAGINARIUM artifacts. Bump to invalidate caches. */
export const IMAGINARIUM_SCHEMA_VERSION = '0.2.0';

/** Global generation context — build-time, whole-topology scope */
export interface GlobalGenerationContext {
  topology: CodeTopology;
  topologyHash: string;
  outputDir: string;
  cache: DeterministicCache;
  schemaVersion: string;
}

/** Mood-driven visual strategy (promoted from private in SegmentPipeline) */
export interface MoodStrategy {
  palette: PaletteOverrides;
  noise: NoiseOverrides;
  lsystem: LSystemOverrides;
}

/** Per-segment generation context — inherits global + segment-local data */
export interface SegmentGenerationContext {
  global: GlobalGenerationContext;
  segment: StorySegment;
  subTopology: CodeTopology;
  strategy: MoodStrategy;
  segmentOutputDir: string;
}

/** Wrapper for versioned JSON artifacts written to disk */
export interface VersionedArtifact<T> {
  schemaVersion: string;
  generatedAt: string;
  data: T;
}
