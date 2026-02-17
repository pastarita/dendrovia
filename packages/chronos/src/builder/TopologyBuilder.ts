/**
 * TopologyBuilder — Assembles all CHRONOS data into final output artifacts
 *
 * Produces the JSON files consumed by downstream pillars:
 *   - topology.json   (CodeTopology — files, tree, summary counts; no commits/hotspots)
 *   - commits.json    (full commit history with classification, version envelope)
 *   - complexity.json  (per-function complexity breakdown)
 *   - hotspots.json   (risk-ranked hotspots + temporal couplings)
 *   - contributors.json (NPC profiles)
 *
 * All output files include a `meta` provenance block.
 * Arrays are sorted deterministically to minimize git diff churn.
 * Files >100 KB are written as compact JSON unless --pretty is passed.
 */

import { join } from 'path';
import { validateTopology } from '@dendrovia/shared/schemas';
import type {
  CodeTopology,
  ParsedFile,
  ParsedCommit,
  Hotspot,
  FileTreeNode,
  RepositoryMetadata,
  LanguageDistribution,
  ContributorSummary,
  TemporalCoupling,
} from '@dendrovia/shared';
import type { FunctionComplexity } from '../analyzer/ComplexityAnalyzer.js';
import type { ContributorProfile } from '@dendrovia/shared';

export interface TopologyInput {
  files: ParsedFile[];
  commits: ParsedCommit[];
  tree: FileTreeNode;
  hotspots: Hotspot[];
  temporalCouplings: TemporalCoupling[];
  /** Function complexities keyed by file path */
  functionsByFile: Map<string, FunctionComplexity[]>;
  contributors: ContributorProfile[];
  repository: string;
  repositoryMetadata?: RepositoryMetadata;
  headHash?: string;
}

export interface ProvenanceMeta {
  pipelineVersion: string;
  headHash: string;
  analyzedAt: string;
  repoPath: string;
}

export interface EnrichedTopology extends Omit<CodeTopology, 'repository'> {
  version: string;
  analyzedAt: string;
  meta: ProvenanceMeta;
  repository: string | RepositoryMetadata;
}

export interface CommitsEnvelope {
  version: string;
  meta: ProvenanceMeta;
  analyzedAt: string;
  commits: ParsedCommit[];
}

export interface TopologyOutput {
  topology: EnrichedTopology;
  commits: CommitsEnvelope;
  complexity: {
    version: string;
    meta: ProvenanceMeta;
    files: Array<{
      path: string;
      cyclomatic: number;
      loc: number;
      functions: FunctionComplexity[];
    }>;
  };
  hotspots: {
    version: string;
    meta: ProvenanceMeta;
    hotspots: Hotspot[];
    temporalCouplings: TemporalCoupling[];
  };
  contributors: {
    version: string;
    meta: ProvenanceMeta;
    contributors: ContributorProfile[];
  };
}

const VERSION = '1.0.0';

/** Threshold in bytes — above this, output is written as compact JSON */
const COMPACT_THRESHOLD = 100 * 1024;

/**
 * Build language distribution from parsed files.
 */
export function buildLanguageDistribution(files: ParsedFile[]): LanguageDistribution[] {
  const langMap = new Map<string, { fileCount: number; locTotal: number }>();

  for (const file of files) {
    const lang = file.language || 'unknown';
    const entry = langMap.get(lang) || { fileCount: 0, locTotal: 0 };
    entry.fileCount++;
    entry.locTotal += file.loc;
    langMap.set(lang, entry);
  }

  const totalFiles = files.length || 1;
  const distribution: LanguageDistribution[] = [];

  for (const [language, stats] of langMap) {
    distribution.push({
      language,
      fileCount: stats.fileCount,
      locTotal: stats.locTotal,
      percentage: Math.round((stats.fileCount / totalFiles) * 1000) / 10,
    });
  }

  distribution.sort((a, b) => b.fileCount - a.fileCount);
  return distribution;
}

/**
 * Build contributor summary from contributor profiles.
 */
export function buildContributorSummary(contributors: ContributorProfile[]): ContributorSummary {
  const archetypeDistribution: Record<string, number> = {};

  for (const c of contributors) {
    archetypeDistribution[c.archetype] = (archetypeDistribution[c.archetype] || 0) + 1;
  }

  return {
    totalContributors: contributors.length,
    topContributor: contributors[0]?.name ?? 'unknown',
    archetypeDistribution,
  };
}

/**
 * Recursively strip `metadata` from tree nodes to avoid duplicating ParsedFile data.
 * Keeps only: name, path, type, children.
 */
export function stripTreeMetadata(node: FileTreeNode): FileTreeNode {
  const stripped: FileTreeNode = {
    name: node.name,
    path: node.path,
    type: node.type,
  };
  if (node.children) {
    stripped.children = node.children.map(stripTreeMetadata);
  }
  return stripped;
}

/**
 * Assemble all parsed data into the final output structures.
 *
 * topology.json is "slim" — it contains files + tree + summary counts,
 * but NOT the full commits/hotspots/temporalCouplings arrays (those live
 * in their own files). Tree nodes have metadata stripped.
 */
export function buildTopology(input: TopologyInput): TopologyOutput {
  const analyzedAt = new Date().toISOString();
  const languageDistribution = buildLanguageDistribution(input.files);
  const contributorSummary = buildContributorSummary(input.contributors);

  const meta: ProvenanceMeta = {
    pipelineVersion: VERSION,
    headHash: input.headHash ?? '',
    analyzedAt,
    repoPath: input.repository,
  };

  // Sort files by path for deterministic output
  const sortedFiles = [...input.files].sort((a, b) => a.path.localeCompare(b.path));

  // Sort commits by date descending
  const sortedCommits = [...input.commits].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Sort hotspots by path
  const sortedHotspots = [...input.hotspots].sort((a, b) => a.path.localeCompare(b.path));

  // Sort contributors by commitCount descending
  const sortedContributors = [...input.contributors].sort((a, b) => b.commitCount - a.commitCount);

  // Main topology — slim (no commits, hotspots, or temporalCouplings)
  const topology: EnrichedTopology = {
    version: VERSION,
    analyzedAt,
    meta,
    repository: input.repositoryMetadata ?? input.repository,
    files: sortedFiles,
    tree: stripTreeMetadata(input.tree),
    languageDistribution,
    contributorSummary,
    commitCount: input.commits.length,
    hotspotCount: input.hotspots.length,
  };

  // Commits envelope (for LUDUS quest generation)
  const commits: CommitsEnvelope = {
    version: VERSION,
    meta,
    analyzedAt,
    commits: sortedCommits,
  };

  // Per-file complexity breakdown (for IMAGINARIUM color intensity)
  const complexity = {
    version: VERSION,
    meta,
    files: sortedFiles
      .filter(f => f.complexity > 0)
      .map(f => ({
        path: f.path,
        cyclomatic: f.complexity,
        loc: f.loc,
        functions: input.functionsByFile.get(f.path) || [],
      })),
  };

  // Hotspots (for IMAGINARIUM + LUDUS boss placement)
  const hotspots = {
    version: VERSION,
    meta,
    hotspots: sortedHotspots,
    temporalCouplings: input.temporalCouplings,
  };

  // Contributors (for LUDUS NPC generation)
  const contributors = {
    version: VERSION,
    meta,
    contributors: sortedContributors,
  };

  return { topology, commits, complexity, hotspots, contributors };
}

/**
 * Serialize data to JSON, using compact format for large payloads.
 */
function serializeJSON(data: unknown, forcePretty: boolean): string {
  if (forcePretty) {
    return JSON.stringify(data, null, 2);
  }
  const pretty = JSON.stringify(data, null, 2);
  if (pretty.length > COMPACT_THRESHOLD) {
    return JSON.stringify(data);
  }
  return pretty;
}

export interface WriteOptions {
  /** Force pretty-printing regardless of file size */
  pretty?: boolean;
}

/**
 * Write all output files to the generated/ directory.
 */
export async function writeOutputFiles(
  output: TopologyOutput,
  outputDir: string,
  options: WriteOptions = {},
): Promise<string[]> {
  const written: string[] = [];
  const forcePretty = options.pretty ?? false;

  // Validate topology against the contract before writing
  validateTopology(output.topology);

  const files: [string, unknown][] = [
    ['topology.json', output.topology],
    ['commits.json', output.commits],
    ['complexity.json', output.complexity],
    ['hotspots.json', output.hotspots],
    ['contributors.json', output.contributors],
  ];

  for (const [filename, data] of files) {
    const path = join(outputDir, filename);
    await Bun.write(path, serializeJSON(data, forcePretty));
    written.push(path);
  }

  return written;
}
