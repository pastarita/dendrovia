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
  extractRepositoryMetadata,
  type GitParserOptions,
  type RawCommit,
} from './parser/GitParser.js';

export {
  parseFiles,
  parseFile,
  buildStubFile,
  createProject,
  detectLanguage,
  canParse,
  type ASTParseResult,
} from './parser/ASTParser.js';

export { parseGoFile } from './parser/GoParser.js';

// Classifiers
export {
  classifyCommit,
  commitFlags,
  type CommitType,
  type ClassifiedCommit,
} from './classifier/CommitClassifier.js';

// Analyzers
export {
  analyzeFileComplexity,
  analyzeFunctionComplexities,
  type ComplexityResult,
  type DifficultyTier,
  type FunctionComplexity,
} from './analyzer/ComplexityAnalyzer.js';

export {
  detectHotspots,
  type HotspotAnalysis,
  type TemporalCoupling,
} from './analyzer/HotspotDetector.js';

// Builders
export {
  buildFileTree,
  countFiles,
  countDirectories,
} from './builder/TreeBuilder.js';

export {
  buildTopology,
  writeOutputFiles,
  buildLanguageDistribution,
  buildContributorSummary,
  type TopologyInput,
  type TopologyOutput,
} from './builder/TopologyBuilder.js';

export {
  profileContributors,
  type ContributorProfile,
  type ContributorFacets,
  type Archetype,
  type TimeArchetype,
} from './builder/ContributorProfiler.js';

// Pipeline (reusable entry point)
export {
  runPipeline,
  type PipelineOptions,
  type PipelineResult,
} from './pipeline.js';

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
} from './resolver/index.js';

// Enrichment (optional DeepWiki layer — additive, never required)
export { fetchDeepWikiEnrichment } from './enrichment/DeepWikiFetcher.js';
export { enrichTopology } from './enrichment/TopologyEnricher.js';
