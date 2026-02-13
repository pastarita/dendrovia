/**
 * HotspotDetector — Identifies high-risk code areas
 *
 * risk = log_normalized(churn) × linear_normalized(complexity)
 *
 * High churn + high complexity = danger zone (boss locations)
 * High churn + low complexity  = actively maintained (safe zone)
 * Low churn  + high complexity = dormant threat (sleeping dragon)
 */

import type { Hotspot, ParsedFile, ParsedCommit } from '@dendrovia/shared';

export interface TemporalCoupling {
  fileA: string;
  fileB: string;
  coChangeCount: number;
  strength: number; // coChanges / max(changesA, changesB)
}

export interface HotspotAnalysis {
  hotspots: Hotspot[];
  temporalCouplings: TemporalCoupling[];
}

/**
 * Detect hotspots from parsed files and commit history.
 */
export function detectHotspots(
  files: ParsedFile[],
  commits: ParsedCommit[],
  opts: { minCouplingCount?: number; topN?: number } = {},
): HotspotAnalysis {
  const minCoupling = opts.minCouplingCount ?? 5;
  const topN = opts.topN ?? 50;

  // Build churn map: file path → commit count
  const churnMap = buildChurnMap(commits);

  // Build complexity map from parsed files
  const complexityMap = new Map<string, number>();
  for (const file of files) {
    complexityMap.set(file.path, file.complexity);
  }

  // Calculate hotspots
  const allPaths = new Set([...churnMap.keys(), ...complexityMap.keys()]);
  const maxChurn = Math.max(...churnMap.values(), 1);
  const complexities = [...complexityMap.values()].filter(v => v > 0);
  const maxComplexity = Math.max(...complexities, 1);
  const minComplexity = Math.min(...complexities, 0);

  const hotspots: Hotspot[] = [];

  for (const path of allPaths) {
    const churn = churnMap.get(path) || 0;
    const complexity = complexityMap.get(path) || 0;

    // Log-normalized churn (handles power-law distribution)
    const churnNorm = churn > 0
      ? Math.log(churn + 1) / Math.log(maxChurn + 1)
      : 0;

    // Linear-normalized complexity
    const range = maxComplexity - minComplexity;
    const complexityNorm = range > 0
      ? (complexity - minComplexity) / range
      : 0;

    const riskScore = churnNorm * complexityNorm;

    hotspots.push({
      path,
      churnRate: churn,
      complexity,
      riskScore: Math.round(riskScore * 1000) / 1000,
    });
  }

  // Sort by risk descending, take top N
  hotspots.sort((a, b) => b.riskScore - a.riskScore);
  const topHotspots = hotspots.slice(0, topN);

  // Temporal coupling analysis
  const temporalCouplings = detectTemporalCouplings(commits, churnMap, minCoupling);

  return { hotspots: topHotspots, temporalCouplings };
}

/**
 * Build churn map from commit history.
 */
function buildChurnMap(commits: ParsedCommit[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const commit of commits) {
    for (const file of commit.filesChanged) {
      map.set(file, (map.get(file) || 0) + 1);
    }
  }
  return map;
}

/**
 * Detect files that frequently change together (temporal coupling).
 * These map to connected regions in the game world.
 */
function detectTemporalCouplings(
  commits: ParsedCommit[],
  churnMap: Map<string, number>,
  minCount: number,
): TemporalCoupling[] {
  // Count co-occurrences: "fileA\0fileB" → count
  const coOccurrences = new Map<string, number>();

  for (const commit of commits) {
    const files = commit.filesChanged;
    if (files.length < 2 || files.length > 50) continue; // Skip trivial or massive commits

    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        // Canonical key (sorted)
        const key = files[i] < files[j]
          ? `${files[i]}\0${files[j]}`
          : `${files[j]}\0${files[i]}`;
        coOccurrences.set(key, (coOccurrences.get(key) || 0) + 1);
      }
    }
  }

  const couplings: TemporalCoupling[] = [];

  for (const [key, count] of coOccurrences) {
    if (count < minCount) continue;

    const [fileA, fileB] = key.split('\0');
    const changesA = churnMap.get(fileA) || 1;
    const changesB = churnMap.get(fileB) || 1;
    const strength = count / Math.max(changesA, changesB);

    couplings.push({ fileA, fileB, coChangeCount: count, strength });
  }

  couplings.sort((a, b) => b.strength - a.strength);
  return couplings.slice(0, 100); // Top 100 couplings
}
