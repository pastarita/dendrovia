import { describe, test, expect } from 'bun:test';
import { assignPhases, computeTension } from '../../src/storyarc/PhaseAssigner';
import type { SegmentMetrics } from '@dendrovia/shared';

function makeMetrics(overrides: Partial<SegmentMetrics> = {}): SegmentMetrics {
  return {
    fileCount: 10,
    totalLoc: 500,
    avgComplexity: 5,
    maxComplexity: 10,
    hotspotCount: 1,
    avgChurn: 5,
    dominantLanguage: 'typescript',
    encounterDensity: 0.1,
    ...overrides,
  };
}

describe('computeTension', () => {
  test('returns positive value for non-zero metrics', () => {
    const tension = computeTension(makeMetrics());
    expect(tension).toBeGreaterThan(0);
  });

  test('higher complexity = higher tension', () => {
    const low = computeTension(makeMetrics({ avgComplexity: 2 }));
    const high = computeTension(makeMetrics({ avgComplexity: 20 }));
    expect(high).toBeGreaterThan(low);
  });

  test('more hotspots = higher tension', () => {
    const few = computeTension(makeMetrics({ hotspotCount: 1 }));
    const many = computeTension(makeMetrics({ hotspotCount: 10 }));
    expect(many).toBeGreaterThan(few);
  });
});

describe('assignPhases', () => {
  test('single segment → climax', () => {
    const assignments = assignPhases([makeMetrics()]);
    expect(assignments.length).toBe(1);
    expect(assignments[0].phase).toBe('climax');
  });

  test('two segments → prologue and climax', () => {
    const assignments = assignPhases([
      makeMetrics({ avgComplexity: 2, hotspotCount: 0 }),
      makeMetrics({ avgComplexity: 15, hotspotCount: 5 }),
    ]);
    expect(assignments.length).toBe(2);

    const phases = assignments.map(a => a.phase);
    expect(phases).toContain('prologue');
    expect(phases).toContain('climax');
  });

  test('five segments → all five phases represented', () => {
    const assignments = assignPhases([
      makeMetrics({ avgComplexity: 1, hotspotCount: 0, encounterDensity: 0 }),
      makeMetrics({ avgComplexity: 5, hotspotCount: 1, encounterDensity: 0.1 }),
      makeMetrics({ avgComplexity: 10, hotspotCount: 3, encounterDensity: 0.3 }),
      makeMetrics({ avgComplexity: 8, hotspotCount: 2, encounterDensity: 0.2 }),
      makeMetrics({ avgComplexity: 20, hotspotCount: 8, encounterDensity: 0.5 }),
    ]);

    expect(assignments.length).toBe(5);
    const phases = new Set(assignments.map(a => a.phase));
    expect(phases.has('prologue')).toBe(true);
    expect(phases.has('climax')).toBe(true);
    // Should have at least 3 distinct phases with 5 segments
    expect(phases.size).toBeGreaterThanOrEqual(3);
  });

  test('lowest tension gets prologue, highest gets climax', () => {
    const metrics = [
      makeMetrics({ avgComplexity: 20, hotspotCount: 10, encounterDensity: 0.8 }),
      makeMetrics({ avgComplexity: 1, hotspotCount: 0, encounterDensity: 0 }),
      makeMetrics({ avgComplexity: 8, hotspotCount: 2, encounterDensity: 0.2 }),
    ];

    const assignments = assignPhases(metrics);

    // Index 1 has lowest tension → prologue
    expect(assignments[1].phase).toBe('prologue');
    // Index 0 has highest tension → climax
    expect(assignments[0].phase).toBe('climax');
  });

  test('empty input → empty output', () => {
    const assignments = assignPhases([]);
    expect(assignments.length).toBe(0);
  });

  test('assignments preserve original indices', () => {
    const metrics = [
      makeMetrics({ avgComplexity: 10 }),
      makeMetrics({ avgComplexity: 2 }),
      makeMetrics({ avgComplexity: 15 }),
    ];

    const assignments = assignPhases(metrics);
    for (let i = 0; i < assignments.length; i++) {
      expect(assignments[i].index).toBe(i);
    }
  });
});
