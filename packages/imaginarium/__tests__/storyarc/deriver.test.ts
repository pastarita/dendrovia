import { describe, test, expect } from 'bun:test';
import { deriveStoryArc } from '../../src/storyarc/StoryArcDeriver';
import { generateMockTopology } from '../../src/pipeline/MockTopology';
import type { CodeTopology, FileTreeNode, ParsedFile } from '@dendrovia/shared';

function buildMultiDirTopology(dirCount: number, filesPerDir: number): CodeTopology {
  const files: ParsedFile[] = [];
  const rootChildren: FileTreeNode[] = [];

  for (let d = 0; d < dirCount; d++) {
    const dirName = `module-${d}`;
    const dirFiles: FileTreeNode[] = [];

    for (let f = 0; f < filesPerDir; f++) {
      const path = `${dirName}/file-${f}.ts`;
      const file: ParsedFile = {
        path,
        hash: `hash-${d}-${f}`,
        language: 'typescript',
        complexity: 3 + d * 2 + f,
        loc: 50 + f * 20,
        lastModified: new Date(),
        author: 'dev',
      };
      files.push(file);
      dirFiles.push({ name: `file-${f}.ts`, path, type: 'file', metadata: file });
    }

    rootChildren.push({
      name: dirName,
      path: dirName,
      type: 'directory',
      children: dirFiles,
    });
  }

  return {
    files,
    commits: [],
    tree: { name: 'root', path: '.', type: 'directory', children: rootChildren },
    hotspots: files
      .filter((_, i) => i % 7 === 0)
      .map(f => ({ path: f.path, churnRate: 10, complexity: f.complexity, riskScore: f.complexity * 2 })),
  };
}

describe('StoryArcDeriver', () => {
  test('deterministic: same input → same output (excluding derivedAt)', () => {
    const topology = buildMultiDirTopology(5, 5);
    const arc1 = deriveStoryArc(topology);
    const arc2 = deriveStoryArc(topology);

    expect(arc1.seed).toBe(arc2.seed);
    expect(arc1.segments.length).toBe(arc2.segments.length);
    expect(arc1.topologyHash).toBe(arc2.topologyHash);

    for (let i = 0; i < arc1.segments.length; i++) {
      expect(arc1.segments[i].id).toBe(arc2.segments[i].id);
      expect(arc1.segments[i].phase).toBe(arc2.segments[i].phase);
      expect(arc1.segments[i].mood).toBe(arc2.segments[i].mood);
      expect(arc1.segments[i].filePaths).toEqual(arc2.segments[i].filePaths);
    }
  });

  test('no orphan files: every file appears in exactly one segment', () => {
    const topology = buildMultiDirTopology(5, 5);
    const arc = deriveStoryArc(topology);

    const allSegmentPaths = arc.segments.flatMap(s => s.filePaths);
    const segPathSet = new Set(allSegmentPaths);

    // No duplicates
    expect(segPathSet.size).toBe(allSegmentPaths.length);

    // Every topology file is covered
    for (const file of topology.files) {
      expect(segPathSet.has(file.path)).toBe(true);
    }
  });

  test('version and required fields are present', () => {
    const topology = buildMultiDirTopology(3, 5);
    const arc = deriveStoryArc(topology);

    expect(arc.version).toBe('1.0.0');
    expect(arc.seed).toBeTruthy();
    expect(arc.segments.length).toBeGreaterThan(0);
    expect(arc.totalFiles).toBe(topology.files.length);
    expect(arc.derivedAt).toBeTruthy();
    expect(arc.topologyHash).toBeTruthy();
  });

  test('each segment has required fields', () => {
    const topology = buildMultiDirTopology(4, 5);
    const arc = deriveStoryArc(topology);

    for (const seg of arc.segments) {
      expect(seg.id).toBeTruthy();
      expect(seg.label).toBeTruthy();
      expect(['prologue', 'rising', 'climax', 'falling', 'epilogue']).toContain(seg.phase);
      expect(['serene', 'tense', 'chaotic', 'triumphant', 'mysterious']).toContain(seg.mood);
      expect(seg.filePaths.length).toBeGreaterThan(0);
      expect(seg.treePath).toBeTruthy();
      expect(typeof seg.ordinal).toBe('number');
      expect(seg.metrics.fileCount).toBeGreaterThan(0);
    }
  });

  test('fallback: topology with no directories produces single climax segment', () => {
    const file: ParsedFile = {
      path: 'lone.ts',
      hash: 'h',
      language: 'typescript',
      complexity: 5,
      loc: 50,
      lastModified: new Date(),
      author: 'dev',
    };

    const topology: CodeTopology = {
      files: [file],
      commits: [],
      tree: {
        name: 'root', path: '.', type: 'directory',
        children: [{ name: 'lone.ts', path: 'lone.ts', type: 'file', metadata: file }],
      },
      hotspots: [],
    };

    const arc = deriveStoryArc(topology);
    expect(arc.segments.length).toBe(1);
  });

  test('works with generateMockTopology', () => {
    const topology = generateMockTopology(50);
    const arc = deriveStoryArc(topology);

    expect(arc.segments.length).toBeGreaterThan(0);
    expect(arc.totalFiles).toBe(50);
  });
});
