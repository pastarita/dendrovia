/**
 * World Magnitude — Grades codebases by size, activity, and complexity.
 *
 * Consumed by the World Launcher (dendrovia-quest) to assign tier badges
 * and sort worlds by magnitude.
 */

export type MagnitudeTier = 'hamlet' | 'village' | 'town' | 'city' | 'metropolis';

export interface MagnitudeResult {
  score: number;
  tier: MagnitudeTier;
  /** Heraldic-style symbol: "+" | "*" | "**" | "***" | "****" */
  symbol: string;
}

/**
 * Compute the magnitude of a world based on its analysis stats.
 *
 * Score formula:
 *   min(ceil(files/1000), 5) + min(ceil(commits/50), 5) + min(langs, 4) + min(ceil(hotspots/20), 3)
 *
 * Thresholds:
 *   hamlet(0-4), village(5-8), town(9-12), city(13-16), metropolis(17+)
 */
export function computeWorldMagnitude(stats: {
  fileCount: number;
  commitCount: number;
  languageCount: number;
  hotspotCount: number;
}): MagnitudeResult {
  const score =
    Math.min(Math.ceil(stats.fileCount / 1000), 5) +
    Math.min(Math.ceil(stats.commitCount / 50), 5) +
    Math.min(stats.languageCount, 4) +
    Math.min(Math.ceil(stats.hotspotCount / 20), 3);

  let tier: MagnitudeTier;
  let symbol: string;

  if (score <= 4) {
    tier = 'hamlet';
    symbol = '+';
  } else if (score <= 8) {
    tier = 'village';
    symbol = '*';
  } else if (score <= 12) {
    tier = 'town';
    symbol = '**';
  } else if (score <= 16) {
    tier = 'city';
    symbol = '***';
  } else {
    tier = 'metropolis';
    symbol = '****';
  }

  return { score, tier, symbol };
}
