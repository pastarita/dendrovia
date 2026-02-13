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
