import { describe, test, expect, afterEach } from 'bun:test';
import { join } from 'path';
import { mkdirSync, rmSync, existsSync } from 'fs';
import type { CodeTopology, ParsedFile, FileTreeNode, SegmentMood } from '@dendrovia/shared';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import { deriveStoryArc } from '../../src/storyarc/StoryArcDeriver';
import { distillSegments, MOOD_STRATEGIES } from '../../src/pipeline/SegmentPipeline';
import { generateMockTopology } from '../../src/pipeline/MockTopology';
import { DeterministicCache } from '../../src/cache/DeterministicCache';
import { hashObject } from '../../src/utils/hash';
import { IMAGINARIUM_SCHEMA_VERSION } from '../../src/pipeline/types';
import type { GlobalGenerationContext } from '../../src/pipeline/types';

const TEST_OUTPUT = join(import.meta.dir, '.test-segment-pipeline');

function buildRichTopology(): CodeTopology {
  const files: ParsedFile[] = [];
  const rootChildren: FileTreeNode[] = [];

  const dirs = [
    { name: 'core', fileCount: 8, complexityBase: 12 },
    { name: 'api', fileCount: 6, complexityBase: 8 },
    { name: 'utils', fileCount: 5, complexityBase: 3 },
    { name: 'tests', fileCount: 4, complexityBase: 2 },
    { name: 'config', fileCount: 3, complexityBase: 1 },
  ];

  for (const dir of dirs) {
    const dirFiles: FileTreeNode[] = [];

    for (let i = 0; i < dir.fileCount; i++) {
      const path = `${dir.name}/file-${i}.ts`;
      const file: ParsedFile = {
        path,
        hash: `hash-${dir.name}-${i}`,
        language: 'typescript',
        complexity: dir.complexityBase + i,
        loc: 50 + i * 30,
        lastModified: new Date(),
        author: 'dev',
      };
      files.push(file);
      dirFiles.push({ name: `file-${i}.ts`, path, type: 'file', metadata: file });
    }

    rootChildren.push({
      name: dir.name,
      path: dir.name,
      type: 'directory',
      children: dirFiles,
    });
  }

  return {
    files,
    commits: [],
    tree: { name: 'root', path: '.', type: 'directory', children: rootChildren },
    hotspots: files
      .filter(f => f.complexity > 10)
      .map(f => ({
        path: f.path,
        churnRate: f.complexity * 2,
        complexity: f.complexity,
        riskScore: f.complexity * 3,
      })),
  };
}

describe('SegmentPipeline', () => {
  afterEach(() => {
    getEventBus().clear();
    if (existsSync(TEST_OUTPUT)) {
      rmSync(TEST_OUTPUT, { recursive: true });
    }
  });

  describe('MOOD_STRATEGIES', () => {
    const allMoods: SegmentMood[] = ['serene', 'tense', 'chaotic', 'triumphant', 'mysterious'];

    test('has strategies for all 5 moods', () => {
      for (const mood of allMoods) {
        expect(MOOD_STRATEGIES[mood]).toBeDefined();
        expect(MOOD_STRATEGIES[mood].palette).toBeDefined();
        expect(MOOD_STRATEGIES[mood].noise).toBeDefined();
        expect(MOOD_STRATEGIES[mood].lsystem).toBeDefined();
      }
    });

    test('each mood produces distinct palette characteristics', async () => {
      mkdirSync(TEST_OUTPUT, { recursive: true });

      const topology = buildRichTopology();
      const arc = deriveStoryArc(topology);
      const assets = await distillSegments(topology, arc, TEST_OUTPUT);

      // Group assets by mood
      const assetsByMood = new Map<string, typeof assets>();
      for (const segment of arc.segments) {
        const segAssets = assets.filter(a => a.segmentId === segment.id);
        const existing = assetsByMood.get(segment.mood) ?? [];
        assetsByMood.set(segment.mood, [...existing, ...segAssets]);
      }

      // Verify we got at least 2 different moods
      expect(assetsByMood.size).toBeGreaterThanOrEqual(2);

      // Check that different moods produce different noise types
      const noiseTypesByMood = new Map<string, Set<string>>();
      for (const [mood, moodAssets] of assetsByMood) {
        const types = new Set(moodAssets.map(a => a.noise.type));
        noiseTypesByMood.set(mood, types);
      }

      // Different moods should use different noise types (per MOOD_STRATEGIES)
      const allNoiseTypes = [...noiseTypesByMood.values()].flatMap(s => [...s]);
      const uniqueNoiseTypes = new Set(allNoiseTypes);
      expect(uniqueNoiseTypes.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SEGMENT_DISTILLED events', () => {
    test('emits once per segment with correct segmentId', async () => {
      mkdirSync(TEST_OUTPUT, { recursive: true });

      const topology = buildRichTopology();
      const arc = deriveStoryArc(topology);

      const eventBus = getEventBus();
      const emittedIds: string[] = [];

      eventBus.on(GameEvents.SEGMENT_DISTILLED, (data: { segmentId: string }) => {
        emittedIds.push(data.segmentId);
      });

      const assets = await distillSegments(topology, arc, TEST_OUTPUT);

      // One event per segment
      expect(emittedIds.length).toBe(arc.segments.length);

      // IDs match the arc's segment IDs
      const expectedIds = arc.segments.map(s => s.id);
      expect(emittedIds).toEqual(expectedIds);

      // Assets match too
      expect(assets.length).toBe(arc.segments.length);
    });
  });

  describe('empty segment fallback', () => {
    test('falls back to topology.files.slice(0, 3) when no files match', async () => {
      mkdirSync(TEST_OUTPUT, { recursive: true });

      const topology = generateMockTopology(20);
      const arc = deriveStoryArc(topology);

      // Mutate a segment so its filePaths match nothing
      if (arc.segments.length > 0) {
        arc.segments[0].filePaths = ['nonexistent/file.ts', 'also/missing.ts'];
      }

      // Should not throw — falls back gracefully
      const assets = await distillSegments(topology, arc, TEST_OUTPUT);

      // The segment with bad paths still produces assets (via fallback)
      expect(assets.length).toBe(arc.segments.length);
      if (assets.length > 0) {
        expect(assets[0].palette).toBeDefined();
        expect(assets[0].shader.glsl.length).toBeGreaterThan(0);
      }
    });
  });

  describe('GlobalGenerationContext passthrough', () => {
    test('passing ctx does not break existing behavior', async () => {
      mkdirSync(TEST_OUTPUT, { recursive: true });

      const topology = buildRichTopology();
      const arc = deriveStoryArc(topology);

      // Run without ctx
      const output1 = join(TEST_OUTPUT, 'no-ctx');
      mkdirSync(output1, { recursive: true });
      const assets1 = await distillSegments(topology, arc, output1);

      // Run with ctx
      const output2 = join(TEST_OUTPUT, 'with-ctx');
      mkdirSync(output2, { recursive: true });

      const cache = new DeterministicCache(output2);
      const topologyHash = hashObject({
        files: topology.files.map(f => ({ path: f.path, hash: f.hash })),
        hotspots: (topology.hotspots ?? []).map(h => h.path),
      });

      const ctx: GlobalGenerationContext = {
        topology,
        topologyHash,
        outputDir: output2,
        cache,
        schemaVersion: IMAGINARIUM_SCHEMA_VERSION,
      };

      const assets2 = await distillSegments(topology, arc, output2, ctx);

      // Same number of results
      expect(assets2.length).toBe(assets1.length);

      // Same segment IDs
      expect(assets2.map(a => a.segmentId)).toEqual(assets1.map(a => a.segmentId));

      // Same palettes (deterministic)
      for (let i = 0; i < assets1.length; i++) {
        expect(assets2[i].palette).toEqual(assets1[i].palette);
        expect(assets2[i].noise).toEqual(assets1[i].noise);
        expect(assets2[i].lsystem).toEqual(assets1[i].lsystem);
      }
    });
  });
});
