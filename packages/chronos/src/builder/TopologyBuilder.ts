/**
 * TopologyBuilder — Assembles all CHRONOS data into final output artifacts
 *
 * Produces the JSON files consumed by downstream pillars:
 *   - topology.json   (CodeTopology — files, commits, tree, hotspots)
 *   - commits.json    (full commit history with classification)
 *   - complexity.json  (per-function complexity breakdown)
 *   - hotspots.json   (risk-ranked hotspots + temporal couplings)
 *   - contributors.json (NPC profiles)
 */

import { join } from 'node:path';
import type {
  CodeTopology,
  ContributorSummary,
  FileTreeNode,
  Hotspot,
  LanguageDistribution,
  ParsedCommit,
  ParsedFile,
  RepositoryMetadata,
  TemporalCoupling,
} from '@dendrovia/shared';
import type { FunctionComplexity } from '../analyzer/ComplexityAnalyzer.js';
import type { ContributorProfile } from './ContributorProfiler.js';

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

export interface EnrichedTopology extends Omit<CodeTopology, 'repository'> {
  version: string;
  analyzedAt: string;
  repository: string | RepositoryMetadata;
}

export interface TopologyOutput {
  topology: EnrichedTopology;
  commits: ParsedCommit[];
  complexity: {
    version: string;
    files: Array<{
      path: string;
      cyclomatic: number;
      loc: number;
      functions: FunctionComplexity[];
    }>;
  };
  hotspots: {
    version: string;
    hotspots: Hotspot[];
    temporalCouplings: TemporalCoupling[];
  };
  contributors: {
    version: string;
    contributors: ContributorProfile[];
  };
}

const VERSION = '1.0.0';

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
 * Assemble all parsed data into the final output structures.
 */
export function buildTopology(input: TopologyInput): TopologyOutput {
  const analyzedAt = new Date().toISOString();
  const languageDistribution = buildLanguageDistribution(input.files);
  const contributorSummary = buildContributorSummary(input.contributors);

  // Main topology (for OCULUS + IMAGINARIUM)
  const topology = {
    version: VERSION,
    analyzedAt,
    repository: input.repositoryMetadata ?? input.repository,
    files: input.files,
    commits: input.commits,
    tree: input.tree,
    hotspots: input.hotspots,
    languageDistribution,
    contributorSummary,
    temporalCouplings: input.temporalCouplings,
  };

  // Commits (for LUDUS quest generation)
  const commits = input.commits;

  // Per-file complexity breakdown (for IMAGINARIUM color intensity)
  const complexity = {
    version: VERSION,
    files: input.files
      .filter((f) => f.complexity > 0)
      .map((f) => ({
        path: f.path,
        cyclomatic: f.complexity,
        loc: f.loc,
        functions: input.functionsByFile.get(f.path) || [],
      })),
  };

  // Hotspots (for IMAGINARIUM + LUDUS boss placement)
  const hotspots = {
    version: VERSION,
    hotspots: input.hotspots,
    temporalCouplings: input.temporalCouplings,
  };

  // Contributors (for LUDUS NPC generation)
  const contributors = {
    version: VERSION,
    contributors: input.contributors,
  };

  return { topology, commits, complexity, hotspots, contributors };
}

/**
 * Write all output files to the generated/ directory.
 */
export async function writeOutputFiles(output: TopologyOutput, outputDir: string): Promise<string[]> {
  const written: string[] = [];

  const files: [string, unknown][] = [
    ['topology.json', output.topology],
    ['commits.json', output.commits],
    ['complexity.json', output.complexity],
    ['hotspots.json', output.hotspots],
    ['contributors.json', output.contributors],
  ];

  for (const [filename, data] of files) {
    const path = join(outputDir, filename);
    await Bun.write(path, JSON.stringify(data, null, 2));
    written.push(path);
  }

  return written;
}
