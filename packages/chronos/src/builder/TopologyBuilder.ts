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

import { join } from 'path';
import type { CodeTopology, ParsedFile, ParsedCommit, Hotspot, FileTreeNode } from '@dendrovia/shared';
import type { FunctionComplexity } from '../analyzer/ComplexityAnalyzer.js';
import type { TemporalCoupling } from '../analyzer/HotspotDetector.js';
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
}

export interface TopologyOutput {
  topology: CodeTopology & { version: string; analyzedAt: string; repository: string };
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
 * Assemble all parsed data into the final output structures.
 */
export function buildTopology(input: TopologyInput): TopologyOutput {
  const analyzedAt = new Date().toISOString();

  // Main topology (for OCULUS + IMAGINARIUM)
  const topology = {
    version: VERSION,
    analyzedAt,
    repository: input.repository,
    files: input.files,
    commits: input.commits,
    tree: input.tree,
    hotspots: input.hotspots,
  };

  // Commits (for LUDUS quest generation)
  const commits = input.commits;

  // Per-file complexity breakdown (for IMAGINARIUM color intensity)
  const complexity = {
    version: VERSION,
    files: input.files
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
export async function writeOutputFiles(
  output: TopologyOutput,
  outputDir: string,
): Promise<string[]> {
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
