/**
 * PhaseAssigner — assigns StoryPhase to each segment based on tension score.
 *
 * Tension = avgComplexity * max(hotspotCount, 1) * max(encounterDensity, 0.1)
 *
 * Sorted by tension:
 *   - Lowest  → prologue
 *   - Highest → climax
 *   - Between → distributed across rising / falling / epilogue
 *
 * Single-segment fallback: always gets climax.
 */

import type { StoryPhase, SegmentMetrics } from '@dendrovia/shared';

export interface PhaseAssignment {
  index: number;
  phase: StoryPhase;
  tension: number;
}

export function computeTension(metrics: SegmentMetrics): number {
  return metrics.avgComplexity
    * Math.max(metrics.hotspotCount, 1)
    * Math.max(metrics.encounterDensity, 0.1);
}

export function assignPhases(
  segmentMetrics: SegmentMetrics[],
): PhaseAssignment[] {
  const count = segmentMetrics.length;

  if (count === 0) return [];

  // Single segment → climax
  if (count === 1) {
    return [{
      index: 0,
      phase: 'climax',
      tension: computeTension(segmentMetrics[0]),
    }];
  }

  // Compute tensions and sort by ascending tension
  const indexed = segmentMetrics.map((m, i) => ({
    index: i,
    tension: computeTension(m),
  }));
  indexed.sort((a, b) => a.tension - b.tension);

  // Assign phases based on position in tension-sorted order
  const assignments: PhaseAssignment[] = new Array(count);

  // Lowest tension → prologue
  assignments[indexed[0].index] = {
    index: indexed[0].index,
    phase: 'prologue',
    tension: indexed[0].tension,
  };

  // Highest tension → climax
  assignments[indexed[count - 1].index] = {
    index: indexed[count - 1].index,
    phase: 'climax',
    tension: indexed[count - 1].tension,
  };

  if (count === 2) return assignments;

  // Distribute remaining segments
  const remaining = indexed.slice(1, -1);
  const midpoint = Math.floor(remaining.length / 2);

  for (let i = 0; i < remaining.length; i++) {
    const entry = remaining[i];
    let phase: StoryPhase;

    if (i < midpoint) {
      phase = 'rising';
    } else if (i === remaining.length - 1 && remaining.length >= 3) {
      phase = 'epilogue';
    } else {
      phase = 'falling';
    }

    assignments[entry.index] = {
      index: entry.index,
      phase,
      tension: entry.tension,
    };
  }

  return assignments;
}
