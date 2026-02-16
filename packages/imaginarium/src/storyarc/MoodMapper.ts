/**
 * MoodMapper — pure function mapping SegmentMetrics to SegmentMood.
 *
 * Mood determines the visual treatment of a segment:
 *   serene     → low complexity, no hotspots
 *   tense      → moderate complexity, some hotspots
 *   chaotic    → high complexity, many hotspots
 *   triumphant → high complexity, stable (low churn)
 *   mysterious → cool/dark, high complexity, low encounter density
 */

import type { SegmentMetrics, SegmentMood } from '@dendrovia/shared';

export function mapMood(metrics: SegmentMetrics): SegmentMood {
  const { avgComplexity, hotspotCount, encounterDensity, avgChurn } = metrics;

  // High complexity + many hotspots → chaotic
  if (avgComplexity > 12 && hotspotCount >= 3 && encounterDensity > 0.3) {
    return 'chaotic';
  }

  // High complexity but stable (low churn) → triumphant
  if (avgComplexity > 10 && avgChurn < 5 && hotspotCount <= 1) {
    return 'triumphant';
  }

  // High complexity + low encounter density → mysterious
  if (avgComplexity > 8 && encounterDensity <= 0.1) {
    return 'mysterious';
  }

  // Moderate complexity or some hotspots → tense
  if (avgComplexity > 5 || hotspotCount >= 2) {
    return 'tense';
  }

  // Low complexity, no hotspots → serene
  return 'serene';
}
