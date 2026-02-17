import { describe, expect, test } from 'bun:test';
import type { SegmentMetrics } from '@dendrovia/shared';
import { mapMood } from '../../src/storyarc/MoodMapper';

function makeMetrics(overrides: Partial<SegmentMetrics> = {}): SegmentMetrics {
  return {
    fileCount: 10,
    totalLoc: 500,
    avgComplexity: 5,
    maxComplexity: 10,
    hotspotCount: 0,
    avgChurn: 0,
    dominantLanguage: 'typescript',
    encounterDensity: 0,
    ...overrides,
  };
}

describe('MoodMapper', () => {
  test('serene: low complexity, no hotspots', () => {
    const mood = mapMood(
      makeMetrics({
        avgComplexity: 3,
        hotspotCount: 0,
        encounterDensity: 0,
        avgChurn: 0,
      }),
    );
    expect(mood).toBe('serene');
  });

  test('tense: moderate complexity or some hotspots', () => {
    const mood = mapMood(
      makeMetrics({
        avgComplexity: 7,
        hotspotCount: 2,
        encounterDensity: 0.2,
        avgChurn: 8,
      }),
    );
    expect(mood).toBe('tense');
  });

  test('chaotic: high complexity + many hotspots + high encounter density', () => {
    const mood = mapMood(
      makeMetrics({
        avgComplexity: 15,
        hotspotCount: 5,
        encounterDensity: 0.5,
        avgChurn: 20,
      }),
    );
    expect(mood).toBe('chaotic');
  });

  test('triumphant: high complexity but stable (low churn, few hotspots)', () => {
    const mood = mapMood(
      makeMetrics({
        avgComplexity: 14,
        hotspotCount: 0,
        encounterDensity: 0,
        avgChurn: 2,
      }),
    );
    expect(mood).toBe('triumphant');
  });

  test('mysterious: high complexity + low encounter density', () => {
    const mood = mapMood(
      makeMetrics({
        avgComplexity: 10,
        hotspotCount: 1,
        encounterDensity: 0.05,
        avgChurn: 3,
      }),
    );
    expect(mood).toBe('mysterious');
  });

  test('all 5 moods are reachable', () => {
    const moods = new Set<string>();
    // serene
    moods.add(mapMood(makeMetrics({ avgComplexity: 2, hotspotCount: 0, encounterDensity: 0, avgChurn: 0 })));
    // tense
    moods.add(mapMood(makeMetrics({ avgComplexity: 7, hotspotCount: 2, encounterDensity: 0.2 })));
    // chaotic
    moods.add(mapMood(makeMetrics({ avgComplexity: 15, hotspotCount: 5, encounterDensity: 0.5 })));
    // triumphant
    moods.add(mapMood(makeMetrics({ avgComplexity: 14, hotspotCount: 0, encounterDensity: 0, avgChurn: 2 })));
    // mysterious
    moods.add(mapMood(makeMetrics({ avgComplexity: 10, hotspotCount: 1, encounterDensity: 0.05, avgChurn: 3 })));

    expect(moods.size).toBe(5);
    expect(moods.has('serene')).toBe(true);
    expect(moods.has('tense')).toBe(true);
    expect(moods.has('chaotic')).toBe(true);
    expect(moods.has('triumphant')).toBe(true);
    expect(moods.has('mysterious')).toBe(true);
  });
});
