/**
 * ContributorProfiler — Builds NPC profiles from git contributor data
 *
 * Classifies developers into RPG archetypes based on their commit patterns.
 */

import type { ParsedCommit } from '@dendrovia/shared';
import { classifyCommit, type CommitType } from '../classifier/CommitClassifier.js';

export type Archetype =
  | 'guardian'    // >50% chore/ci/build — the infrastructure tank
  | 'healer'     // >50% fix commits — the bug fixer
  | 'striker'    // >50% feat commits — the feature builder
  | 'sage'       // >40% docs/test — the knowledge keeper
  | 'ranger'     // high file diversity — the wide-ranging explorer
  | 'artificer'  // >40% perf/build — the optimizer
  | 'berserker'  // high breaking change ratio — the disruptor
  | 'adventurer'; // no dominant pattern — the generalist

export type TimeArchetype = 'dawn' | 'daylight' | 'twilight' | 'midnight';

export interface ContributorProfile {
  name: string;
  email: string;
  archetype: Archetype;
  timeArchetype: TimeArchetype;
  /** Character class for the shared Character interface */
  characterClass: 'tank' | 'healer' | 'dps';
  commitCount: number;
  firstCommit: Date;
  lastCommit: Date;
  /** Total files touched across all commits (unique) */
  filesOwned: number;
  /** Hour of day with most commits (0-23) */
  peakHour: number;
  /** Commit type distribution */
  typeDistribution: Partial<Record<CommitType, number>>;
  /** Personality facets (0-100) */
  facets: ContributorFacets;
}

export interface ContributorFacets {
  energy: number;       // commit frequency
  discipline: number;   // conventional commit adherence
  creativity: number;   // feature ratio
  protectiveness: number; // fix/test ratio
  breadth: number;      // file diversity
  collaboration: number; // co-authorship / merge frequency
}

/**
 * Build contributor profiles from commit history.
 */
export function profileContributors(commits: ParsedCommit[]): ContributorProfile[] {
  // Group commits by author
  const byAuthor = new Map<string, ParsedCommit[]>();

  for (const commit of commits) {
    const key = commit.author;
    if (!byAuthor.has(key)) byAuthor.set(key, []);
    byAuthor.get(key)!.push(commit);
  }

  const profiles: ContributorProfile[] = [];

  for (const [name, authorCommits] of byAuthor) {
    profiles.push(buildProfile(name, authorCommits, commits));
  }

  // Sort by commit count descending
  profiles.sort((a, b) => b.commitCount - a.commitCount);
  return profiles;
}

function buildProfile(
  name: string,
  authorCommits: ParsedCommit[],
  allCommits: ParsedCommit[],
): ContributorProfile {
  // Classify each commit
  const typeCounts: Partial<Record<CommitType, number>> = {};
  const hourCounts = new Array(24).fill(0);
  const filesSet = new Set<string>();

  let conventionalCount = 0;

  for (const commit of authorCommits) {
    const classified = classifyCommit(commit.message);
    typeCounts[classified.type] = (typeCounts[classified.type] || 0) + 1;

    if (classified.confidence === 'high') conventionalCount++;

    const hour = commit.date.getHours();
    hourCounts[hour]++;

    for (const file of commit.filesChanged) {
      filesSet.add(file);
    }
  }

  const total = authorCommits.length;
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Determine archetype
  const archetype = determineArchetype(typeCounts, total, filesSet.size, allCommits.length);

  // Map archetype to character class
  const characterClass = archetypeToClass(archetype);

  // Determine time archetype
  const timeArchetype = determineTimeArchetype(peakHour);

  // Compute facets
  const facets = computeFacets(typeCounts, total, conventionalCount, filesSet.size, authorCommits, allCommits);

  // Find email from first commit (approximate — git log gives author name, not email in ParsedCommit)
  const sortedByDate = [...authorCommits].sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    name,
    email: '',
    archetype,
    timeArchetype,
    characterClass,
    commitCount: total,
    firstCommit: sortedByDate[0].date,
    lastCommit: sortedByDate[sortedByDate.length - 1].date,
    filesOwned: filesSet.size,
    peakHour,
    typeDistribution: typeCounts,
    facets,
  };
}

function determineArchetype(
  types: Partial<Record<CommitType, number>>,
  total: number,
  fileCount: number,
  totalCommitsInRepo: number,
): Archetype {
  const ratio = (type: CommitType) => (types[type] || 0) / total;
  const multiRatio = (...tt: CommitType[]) => tt.reduce((s, t) => s + ratio(t), 0);

  if (ratio('breaking-change') > 0.15) return 'berserker';
  if (multiRatio('chore', 'style') > 0.5) return 'guardian';
  if (ratio('bug-fix') > 0.5) return 'healer';
  if (ratio('feature') > 0.5) return 'striker';
  if (multiRatio('docs', 'test') > 0.4) return 'sage';
  if (multiRatio('performance', 'chore') > 0.4) return 'artificer';

  // Ranger: high file diversity relative to commit count
  const fileDiversity = fileCount / Math.max(total, 1);
  if (fileDiversity > 5) return 'ranger';

  return 'adventurer';
}

function archetypeToClass(archetype: Archetype): 'tank' | 'healer' | 'dps' {
  switch (archetype) {
    case 'guardian':
    case 'artificer':
      return 'tank';
    case 'healer':
    case 'sage':
      return 'healer';
    case 'striker':
    case 'ranger':
    case 'berserker':
    case 'adventurer':
      return 'dps';
  }
}

function determineTimeArchetype(peakHour: number): TimeArchetype {
  if (peakHour >= 5 && peakHour < 9) return 'dawn';
  if (peakHour >= 9 && peakHour < 17) return 'daylight';
  if (peakHour >= 17 && peakHour < 21) return 'twilight';
  return 'midnight';
}

function computeFacets(
  types: Partial<Record<CommitType, number>>,
  total: number,
  conventionalCount: number,
  fileCount: number,
  authorCommits: ParsedCommit[],
  allCommits: ParsedCommit[],
): ContributorFacets {
  const ratio = (type: CommitType) => (types[type] || 0) / Math.max(total, 1);

  // Energy: commit frequency relative to repo average
  const avgCommitsPerAuthor = allCommits.length / new Set(allCommits.map(c => c.author)).size;
  const energy = Math.min(100, Math.round((total / avgCommitsPerAuthor) * 50));

  // Discipline: conventional commit adherence
  const discipline = Math.round((conventionalCount / Math.max(total, 1)) * 100);

  // Creativity: feature ratio
  const creativity = Math.round(ratio('feature') * 100);

  // Protectiveness: fix + test ratio
  const protectiveness = Math.round((ratio('bug-fix') + ratio('test')) * 100);

  // Breadth: file diversity (normalized to 0-100)
  const breadth = Math.min(100, Math.round((fileCount / Math.max(total, 1)) * 20));

  // Collaboration: merge ratio (proxy for teamwork)
  const mergeCount = authorCommits.filter(c => c.isMerge).length;
  const collaboration = Math.min(100, Math.round((mergeCount / Math.max(total, 1)) * 200));

  return { energy, discipline, creativity, protectiveness, breadth, collaboration };
}
