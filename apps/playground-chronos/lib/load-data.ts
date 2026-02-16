import { readFile } from 'fs/promises';
import { join } from 'path';
import type {
  CodeTopology,
  ParsedCommit,
  Hotspot,
  TemporalCoupling,
  RepositoryMetadata,
  LanguageDistribution,
  ContributorSummary,
} from '@dendrovia/shared';
// Inline types from @dendrovia/chronos to avoid turbopack .js extension
// resolution issues (chronos uses .js imports that turbopack can't alias)
interface FunctionComplexity {
  name: string;
  startLine: number;
  endLine: number;
  complexity: {
    cyclomatic: number;
    cognitive: number;
    loc: number;
    difficulty: string;
  };
}

interface ContributorProfile {
  name: string;
  email: string;
  archetype: string;
  timeArchetype: string;
  characterClass: string;
  commitCount: number;
  firstCommit: string;
  lastCommit: string;
  uniqueFilesTouched: number;
  peakHour: number;
  typeDistribution: Record<string, number>;
  facets: Record<string, number>;
}

const GENERATED_DIR = join(process.cwd(), '../../packages/chronos/generated');

async function readJSON<T>(filename: string): Promise<T | null> {
  try {
    const raw = await readFile(join(GENERATED_DIR, filename), 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export interface TopologyData {
  topology: {
    version: string;
    analyzedAt: string;
    repository: string | RepositoryMetadata;
    files: Array<{
      path: string;
      hash: string;
      language: string;
      complexity: number;
      loc: number;
      lastModified: string;
      author: string;
    }>;
    commits: Array<ParsedCommit & { date: string }>;
    tree: any;
    hotspots: Hotspot[];
    languageDistribution?: LanguageDistribution[];
    contributorSummary?: ContributorSummary;
    temporalCouplings?: TemporalCoupling[];
  } | null;
  commits: Array<ParsedCommit & { date: string }> | null;
  complexity: {
    version: string;
    files: Array<{
      path: string;
      cyclomatic: number;
      loc: number;
      functions: FunctionComplexity[];
    }>;
  } | null;
  hotspots: {
    version: string;
    hotspots: Hotspot[];
    temporalCouplings: TemporalCoupling[];
  } | null;
  contributors: {
    version: string;
    contributors: ContributorProfile[];
  } | null;
}

export async function loadTopologyData(): Promise<TopologyData> {
  const [topology, commits, complexity, hotspots, contributors] = await Promise.all([
    readJSON<TopologyData['topology']>('topology.json'),
    readJSON<TopologyData['commits']>('commits.json'),
    readJSON<TopologyData['complexity']>('complexity.json'),
    readJSON<TopologyData['hotspots']>('hotspots.json'),
    readJSON<TopologyData['contributors']>('contributors.json'),
  ]);

  return { topology, commits, complexity, hotspots, contributors };
}
