import { describe, expect, test } from 'bun:test';
import type { CodeTopology, FileTreeNode, Hotspot, ParsedFile } from '@dendrovia/shared';
import { sliceSegments } from '../../src/storyarc/SegmentSlicer';

function buildTopologyWithDirs(dirNames: string[], filesPerDir: number, _seed = 42): CodeTopology {
  const files: ParsedFile[] = [];
  const hotspots: Hotspot[] = [];
  let fileIdx = 0;

  for (const dir of dirNames) {
    for (let i = 0; i < filesPerDir; i++) {
      const path = `${dir}/file-${fileIdx}.ts`;
      const complexity = 5 + (fileIdx % 15);
      files.push({
        path,
        hash: `hash-${fileIdx}`,
        language: 'typescript',
        complexity,
        loc: 50 + fileIdx * 10,
        lastModified: new Date(),
        author: 'dev',
      });
      if (fileIdx % 5 === 0) {
        hotspots.push({ path, churnRate: 10, complexity, riskScore: complexity * 2 });
      }
      fileIdx++;
    }
  }

  // Build tree
  const rootChildren: FileTreeNode[] = dirNames.map((dir) => ({
    name: dir,
    path: dir,
    type: 'directory' as const,
    children: files
      .filter((f) => f.path.startsWith(`${dir}/`))
      .map((f) => ({
        name: f.path.split('/').pop()!,
        path: f.path,
        type: 'file' as const,
        metadata: f,
      })),
  }));

  return {
    files,
    commits: [],
    tree: { name: 'root', path: '.', type: 'directory', children: rootChildren },
    hotspots,
  };
}

describe('SegmentSlicer', () => {
  test('produces one segment per top-level directory', () => {
    const topology = buildTopologyWithDirs(['src', 'lib', 'tests', 'config'], 5);
    const segments = sliceSegments(topology);

    expect(segments.length).toBe(4);
    for (const seg of segments) {
      expect(seg.filePaths.length).toBeGreaterThan(0);
    }
  });

  test('root-level files form their own segment', () => {
    const topology = buildTopologyWithDirs(['src', 'lib'], 5);
    // Add root-level files
    const rootFile: ParsedFile = {
      path: 'README.md',
      hash: 'root-hash',
      language: 'markdown',
      complexity: 1,
      loc: 20,
      lastModified: new Date(),
      author: 'dev',
    };
    topology.files.push(rootFile);
    topology.tree.children!.push({
      name: 'README.md',
      path: 'README.md',
      type: 'file',
      metadata: rootFile,
    });
    // Add 2 more root files so they don't get merged (>= 3)
    for (let i = 0; i < 2; i++) {
      const f: ParsedFile = {
        path: `root-file-${i}.ts`,
        hash: `root-${i}`,
        language: 'typescript',
        complexity: 2,
        loc: 10,
        lastModified: new Date(),
        author: 'dev',
      };
      topology.files.push(f);
      topology.tree.children!.push({
        name: f.path,
        path: f.path,
        type: 'file',
        metadata: f,
      });
    }

    const segments = sliceSegments(topology);
    const rootSegment = segments.find((s) => s.filePaths.some((p) => p === 'README.md'));
    expect(rootSegment).toBeDefined();
  });

  test('merges segments with fewer than 3 files into neighbors', () => {
    // Create 3 dirs: 2 with 5 files each, 1 with just 1 file
    const topology = buildTopologyWithDirs(['src', 'lib'], 5);
    const tinyFile: ParsedFile = {
      path: 'tiny/only.ts',
      hash: 'tiny-hash',
      language: 'typescript',
      complexity: 3,
      loc: 10,
      lastModified: new Date(),
      author: 'dev',
    };
    topology.files.push(tinyFile);
    topology.tree.children!.push({
      name: 'tiny',
      path: 'tiny',
      type: 'directory',
      children: [
        {
          name: 'only.ts',
          path: 'tiny/only.ts',
          type: 'file',
          metadata: tinyFile,
        },
      ],
    });

    const segments = sliceSegments(topology);
    // The tiny segment should be merged into a neighbor
    expect(segments.length).toBe(2);
    // Total files should be preserved
    const totalFiles = segments.reduce((sum, s) => sum + s.filePaths.length, 0);
    expect(totalFiles).toBe(topology.files.length);
  });

  test('caps segments at 10', () => {
    // Create 15 directories
    const dirs = Array.from({ length: 15 }, (_, i) => `dir-${i}`);
    const topology = buildTopologyWithDirs(dirs, 5);
    const segments = sliceSegments(topology);

    expect(segments.length).toBeLessThanOrEqual(10);
  });

  test('fallback: empty tree produces a single segment', () => {
    const topology: CodeTopology = {
      files: [
        {
          path: 'a.ts',
          hash: 'h',
          language: 'typescript',
          complexity: 5,
          loc: 50,
          lastModified: new Date(),
          author: 'dev',
        },
      ],
      commits: [],
      tree: { name: 'root', path: '.', type: 'directory', children: [] },
      hotspots: [],
    };
    const segments = sliceSegments(topology);
    expect(segments.length).toBe(1);
    expect(segments[0].label).toBe('all');
  });

  test('deep files are collected from nested directories', () => {
    const deepFile: ParsedFile = {
      path: 'src/deep/nested/file.ts',
      hash: 'deep-hash',
      language: 'typescript',
      complexity: 5,
      loc: 50,
      lastModified: new Date(),
      author: 'dev',
    };

    const topology: CodeTopology = {
      files: [
        deepFile,
        ...Array.from({ length: 4 }, (_, i) => ({
          path: `src/file-${i}.ts`,
          hash: `src-${i}`,
          language: 'typescript' as string,
          complexity: 5,
          loc: 50,
          lastModified: new Date(),
          author: 'dev',
        })),
      ],
      commits: [],
      tree: {
        name: 'root',
        path: '.',
        type: 'directory' as const,
        children: [
          {
            name: 'src',
            path: 'src',
            type: 'directory' as const,
            children: [
              {
                name: 'deep',
                path: 'src/deep',
                type: 'directory' as const,
                children: [
                  {
                    name: 'nested',
                    path: 'src/deep/nested',
                    type: 'directory' as const,
                    children: [
                      {
                        name: 'file.ts',
                        path: 'src/deep/nested/file.ts',
                        type: 'file' as const,
                        metadata: deepFile,
                      },
                    ],
                  },
                ],
              },
              ...Array.from({ length: 4 }, (_, i) => ({
                name: `file-${i}.ts`,
                path: `src/file-${i}.ts`,
                type: 'file' as const,
              })),
            ],
          },
        ],
      },
      hotspots: [],
    };

    const segments = sliceSegments(topology);
    const allPaths = segments.flatMap((s) => s.filePaths);
    expect(allPaths).toContain('src/deep/nested/file.ts');
  });

  test('metrics are computed correctly', () => {
    const topology = buildTopologyWithDirs(['src'], 10);
    const segments = sliceSegments(topology);

    expect(segments[0].metrics.fileCount).toBe(10);
    expect(segments[0].metrics.totalLoc).toBeGreaterThan(0);
    expect(segments[0].metrics.avgComplexity).toBeGreaterThan(0);
    expect(segments[0].metrics.dominantLanguage).toBe('typescript');
  });
});
