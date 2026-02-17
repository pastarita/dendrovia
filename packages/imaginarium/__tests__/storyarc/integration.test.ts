import { describe, expect, test } from 'bun:test';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { CodeTopology, FileTreeNode, ParsedFile } from '@dendrovia/shared';
import { generateMockTopology } from '../../src/pipeline/MockTopology';
import { distillSegments } from '../../src/pipeline/SegmentPipeline';
import { deriveStoryArc } from '../../src/storyarc/StoryArcDeriver';

const TEST_OUTPUT = join(import.meta.dir, '..', '..', 'generated', '__test-segments__');

function buildRichTopology(): CodeTopology {
  // Build a topology with 5 distinct top-level dirs and varying metrics
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
      .filter((f) => f.complexity > 10)
      .map((f) => ({
        path: f.path,
        churnRate: f.complexity * 2,
        complexity: f.complexity,
        riskScore: f.complexity * 3,
      })),
  };
}

describe('Story Arc Integration', () => {
  // Clean up test output before and after
  function cleanup() {
    if (existsSync(TEST_OUTPUT)) {
      rmSync(TEST_OUTPUT, { recursive: true });
    }
  }

  test('full pipeline: topology → story arc → segment dirs with distinct palettes', async () => {
    cleanup();
    mkdirSync(TEST_OUTPUT, { recursive: true });

    try {
      const topology = buildRichTopology();

      // 1. Derive story arc
      const storyArc = deriveStoryArc(topology);
      expect(storyArc.segments.length).toBeGreaterThanOrEqual(3);

      // 2. Distill segments
      const segmentAssets = await distillSegments(topology, storyArc, TEST_OUTPUT);
      expect(segmentAssets.length).toBe(storyArc.segments.length);

      // 3. Verify segment directories were created
      for (const segment of storyArc.segments) {
        const segDir = join(TEST_OUTPUT, 'segments', segment.id);
        expect(existsSync(segDir)).toBe(true);
        expect(existsSync(join(segDir, 'palette.json'))).toBe(true);
        expect(existsSync(join(segDir, 'noise.json'))).toBe(true);
        expect(existsSync(join(segDir, 'lsystem.json'))).toBe(true);
        expect(existsSync(join(segDir, 'shader.glsl'))).toBe(true);
      }

      // 4. Verify distinct palettes (at least some segments should differ)
      const palettes = segmentAssets.map((a) => a.palette.primary);
      const uniquePalettes = new Set(palettes);
      // With different moods driving overrides, we should get variety
      if (storyArc.segments.length >= 3) {
        expect(uniquePalettes.size).toBeGreaterThanOrEqual(2);
      }

      // 5. Each segment asset has required fields
      for (const assets of segmentAssets) {
        expect(assets.segmentId).toBeTruthy();
        expect(assets.palette.primary).toMatch(/^#[0-9a-f]{6}$/);
        expect(assets.noise.type).toBeTruthy();
        expect(assets.lsystem.axiom).toBe('F');
        expect(assets.shader.glsl.length).toBeGreaterThan(0);
      }
    } finally {
      cleanup();
    }
  });

  test('determinism: two runs produce identical segment assets', async () => {
    cleanup();
    const output1 = join(TEST_OUTPUT, 'run1');
    const output2 = join(TEST_OUTPUT, 'run2');
    mkdirSync(output1, { recursive: true });
    mkdirSync(output2, { recursive: true });

    try {
      const topology = buildRichTopology();

      const arc1 = deriveStoryArc(topology);
      const arc2 = deriveStoryArc(topology);

      const assets1 = await distillSegments(topology, arc1, output1);
      const assets2 = await distillSegments(topology, arc2, output2);

      expect(assets1.length).toBe(assets2.length);

      for (let i = 0; i < assets1.length; i++) {
        expect(assets1[i].segmentId).toBe(assets2[i].segmentId);
        expect(assets1[i].palette).toEqual(assets2[i].palette);
        expect(assets1[i].noise).toEqual(assets2[i].noise);
        expect(assets1[i].lsystem).toEqual(assets2[i].lsystem);
      }
    } finally {
      cleanup();
    }
  });

  test('works with generateMockTopology', async () => {
    cleanup();
    mkdirSync(TEST_OUTPUT, { recursive: true });

    try {
      const topology = generateMockTopology(50);
      const arc = deriveStoryArc(topology);
      const assets = await distillSegments(topology, arc, TEST_OUTPUT);

      expect(arc.segments.length).toBeGreaterThan(0);
      expect(assets.length).toBe(arc.segments.length);
    } finally {
      cleanup();
    }
  });

  test('completes within 10 seconds', async () => {
    cleanup();
    mkdirSync(TEST_OUTPUT, { recursive: true });

    try {
      const start = performance.now();
      const topology = generateMockTopology(100);
      const arc = deriveStoryArc(topology);
      await distillSegments(topology, arc, TEST_OUTPUT);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10000);
    } finally {
      cleanup();
    }
  });
});
