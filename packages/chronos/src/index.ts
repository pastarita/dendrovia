/**
 * CHRONOS — The Archaeologist
 *
 * Git history + AST parsing → game-ready topology data.
 * First step in the Dendrovia pipeline (no upstream dependencies).
 */

// Parsers
export {
  parseGitHistory,
  extractRawCommits,
  listFilesAtHead,
  getHeadHash,
  getFileChurnCounts,
  getFileAuthors,
  extractRepositoryMetadata,
  type GitParserOptions,
  type RawCommit,
} from './parser/GitParser';

export {
  parseFiles,
  parseFile,
  buildStubFile,
  createProject,
  detectLanguage,
  canParse,
  type ASTParseResult,
} from './parser/ASTParser';

export { parseGoFile } from './parser/GoParser';

// Classifiers
export {
  classifyCommit,
  type CommitType,
  type ClassifiedCommit,
} from './classifier/CommitClassifier';

// Analyzers
export {
  analyzeFileComplexity,
  analyzeFunctionComplexities,
  type ComplexityResult,
  type DifficultyTier,
  type FunctionComplexity,
} from './analyzer/ComplexityAnalyzer';

export {
  detectHotspots,
  type HotspotAnalysis,
  type TemporalCoupling,
} from './analyzer/HotspotDetector';

// Builders
export {
  buildFileTree,
  countFiles,
  countDirectories,
} from './builder/TreeBuilder';

export {
  buildTopology,
  writeOutputFiles,
  buildLanguageDistribution,
  buildContributorSummary,
  type TopologyInput,
  type TopologyOutput,
} from './builder/TopologyBuilder';

export { profileContributors } from './builder/ContributorProfiler';
export type { ContributorProfile, ContributorFacets, Archetype, TimeArchetype } from '@dendrovia/shared';

// Pipeline (reusable entry point)
export {
  runPipeline,
  type PipelineOptions,
  type PipelineResult,
} from './pipeline';

// Resolver (GitHub URL → local clone)
export {
  resolveRepo,
  loadRegistry,
  saveRegistry,
  upsertRegistryEntry,
  getChronosHome,
  getReposDir,
  getGeneratedDir,
  getOutputDirForRepo,
  type ResolvedRepo,
  type Registry,
  type RegistryEntry,
} from './resolver/index';

// Enrichment (optional DeepWiki layer — additive, never required)
export { fetchDeepWikiEnrichment } from './enrichment/DeepWikiFetcher';
export { enrichTopology } from './enrichment/TopologyEnricher';
