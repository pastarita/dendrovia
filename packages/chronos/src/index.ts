/**
 * CHRONOS — The Archaeologist
 *
 * Git history + AST parsing → game-ready topology data.
 * First step in the Dendrovia pipeline (no upstream dependencies).
 */

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
export {
  type Archetype,
  type ContributorFacets,
  type ContributorProfile,
  profileContributors,
  type TimeArchetype,
} from './builder/ContributorProfiler.js';
export {
  buildContributorSummary,
  buildLanguageDistribution,
  buildTopology,
  type TopologyInput,
  type TopologyOutput,
  writeOutputFiles,
} from './builder/TopologyBuilder.js';
// Builders
export {
  buildFileTree,
  countDirectories,
  countFiles,
} from './builder/TreeBuilder.js';
// Classifiers
export {
  type ClassifiedCommit,
  type CommitType,
  classifyCommit,
  commitFlags,
} from './classifier/CommitClassifier.js';
// Enrichment (optional DeepWiki layer — additive, never required)
export { fetchDeepWikiEnrichment } from './enrichment/DeepWikiFetcher.js';
export { enrichTopology } from './enrichment/TopologyEnricher.js';
export {
  type ASTParseResult,
  buildStubFile,
  canParse,
  createProject,
  detectLanguage,
  parseFile,
  parseFiles,
} from './parser/ASTParser.js';
// Parsers
export {
  extractRawCommits,
  extractRepositoryMetadata,
  type GitParserOptions,
  getFileChurnCounts,
  getHeadHash,
  listFilesAtHead,
  parseGitHistory,
  type RawCommit,
} from './parser/GitParser.js';
export { parseGoFile } from './parser/GoParser.js';
// Pipeline (reusable entry point)
export {
  type PipelineOptions,
  type PipelineResult,
  runPipeline,
} from './pipeline.js';
// Resolver (GitHub URL → local clone)
export {
  getChronosHome,
  getGeneratedDir,
  getOutputDirForRepo,
  getReposDir,
  loadRegistry,
  type Registry,
  type RegistryEntry,
  type ResolvedRepo,
  resolveRepo,
  saveRegistry,
  upsertRegistryEntry,
} from './resolver/index.js';
