import { describe, test, expect } from 'bun:test';
import {
  buildTopology,
  stripTreeMetadata,
  type TopologyInput,
  type TopologyOutput,
} from '../src/builder/TopologyBuilder';
import type { ParsedFile, ParsedCommit, FileTreeNode, Hotspot } from '@dendrovia/shared';
import type { FunctionComplexity } from '../src/analyzer/ComplexityAnalyzer';
import type { TemporalCoupling } from '../src/analyzer/HotspotDetector';
import type { ContributorProfile } from '../src/builder/ContributorProfiler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeFile(path: string, complexity: number = 5, loc: number = 100): ParsedFile {
  return {
    path,
    hash: 'abc123',
    language: 'typescript',
    complexity,
    loc,
    lastModified: new Date('2025-01-01'),
    author: 'dev',
  };
}

function makeCommit(hash: string, filesChanged: string[]): ParsedCommit {
  return {
    hash,
    message: 'feat: some change',
    author: 'dev',
    date: new Date('2025-06-01'),
    filesChanged,
    insertions: 10,
    deletions: 5,
    isMerge: false,
    type: 'feature',
  };
}

function makeTree(): FileTreeNode {
  return {
    name: 'root',
    path: '',
    type: 'directory',
    children: [
      { name: 'src', path: 'src', type: 'directory', children: [
        { name: 'index.ts', path: 'src/index.ts', type: 'file', metadata: makeFile('src/index.ts') },
      ]},
    ],
  };
}

function makeHotspot(path: string, riskScore: number): Hotspot {
  return { path, churnRate: 10, complexity: 20, riskScore };
}

function makeCoupling(): TemporalCoupling {
  return {
    fileA: 'a.ts',
    fileB: 'b.ts',
    coChangeCount: 8,
    strength: 0.75,
  };
}

function makeFunctionComplexity(name: string): FunctionComplexity {
  return {
    name,
    startLine: 1,
    endLine: 10,
    complexity: {
      cyclomatic: 3,
      cognitive: 2,
      loc: 10,
      difficulty: 'trivial',
    },
  };
}

function makeContributor(name: string): ContributorProfile {
  return {
    name,
    email: '',
    archetype: 'adventurer',
    timeArchetype: 'daylight',
    characterClass: 'dps',
    commitCount: 10,
    firstCommit: new Date('2024-01-01'),
    lastCommit: new Date('2025-01-01'),
    uniqueFilesTouched: 5,
    peakHour: 14,
    topCommitType: 'feature',
    typeDistribution: { feature: 5, 'bug-fix': 3, chore: 2 },
    facets: {
      energy: 50,
      discipline: 80,
      creativity: 60,
      protectiveness: 40,
      breadth: 30,
      collaboration: 20,
    },
  };
}

function makeInput(overrides: Partial<TopologyInput> = {}): TopologyInput {
  const files = [makeFile('src/index.ts'), makeFile('src/utils.ts', 15, 200)];
  const commits = [makeCommit('a1', ['src/index.ts']), makeCommit('a2', ['src/utils.ts'])];
  const functionsByFile = new Map<string, FunctionComplexity[]>();
  functionsByFile.set('src/index.ts', [makeFunctionComplexity('main')]);
  functionsByFile.set('src/utils.ts', [makeFunctionComplexity('helper')]);

  return {
    files,
    commits,
    tree: makeTree(),
    hotspots: [makeHotspot('src/index.ts', 0.8), makeHotspot('src/utils.ts', 0.3)],
    temporalCouplings: [makeCoupling()],
    functionsByFile,
    contributors: [makeContributor('Alice')],
    repository: 'test-repo',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildTopology
// ---------------------------------------------------------------------------
describe('buildTopology — structure', () => {
  test('returns all required top-level keys', () => {
    const output = buildTopology(makeInput());
    expect(output.topology).toBeDefined();
    expect(output.commits).toBeDefined();
    expect(output.complexity).toBeDefined();
    expect(output.hotspots).toBeDefined();
    expect(output.contributors).toBeDefined();
  });

  test('topology contains version, analyzedAt, repository, meta', () => {
    const output = buildTopology(makeInput());
    expect(output.topology.version).toBe('1.0.0');
    expect(output.topology.analyzedAt).toBeDefined();
    expect(output.topology.repository).toBe('test-repo');
    expect(output.topology.meta).toBeDefined();
    expect(output.topology.meta.pipelineVersion).toBe('1.0.0');
    expect(output.topology.meta.repoPath).toBe('test-repo');
  });

  test('analyzedAt is a valid ISO date string', () => {
    const output = buildTopology(makeInput());
    const date = new Date(output.topology.analyzedAt);
    expect(date.getTime()).not.toBeNaN();
  });

  test('topology is slim — no commits, hotspots, or temporalCouplings', () => {
    const output = buildTopology(makeInput());
    expect(output.topology.commits).toBeUndefined();
    expect(output.topology.hotspots).toBeUndefined();
    expect(output.topology.temporalCouplings).toBeUndefined();
  });

  test('topology has commitCount and hotspotCount summary fields', () => {
    const input = makeInput();
    const output = buildTopology(input);
    expect(output.topology.commitCount).toBe(2);
    expect(output.topology.hotspotCount).toBe(2);
  });

  test('topology includes files and tree', () => {
    const input = makeInput();
    const output = buildTopology(input);
    expect(output.topology.files.length).toBe(input.files.length);
    expect(output.topology.tree).toBeDefined();
  });

  test('commits output is a versioned envelope', () => {
    const input = makeInput();
    const output = buildTopology(input);
    expect(output.commits.version).toBe('1.0.0');
    expect(output.commits.analyzedAt).toBeDefined();
    expect(output.commits.meta).toBeDefined();
    expect(output.commits.commits.length).toBe(input.commits.length);
  });
});

describe('buildTopology — deterministic sorting', () => {
  test('files are sorted by path', () => {
    const input = makeInput({
      files: [makeFile('z.ts'), makeFile('a.ts'), makeFile('m.ts')],
    });
    const output = buildTopology(input);
    const paths = output.topology.files.map(f => f.path);
    expect(paths).toEqual(['a.ts', 'm.ts', 'z.ts']);
  });

  test('hotspots are sorted by path', () => {
    const input = makeInput({
      hotspots: [makeHotspot('z.ts', 0.5), makeHotspot('a.ts', 0.8)],
    });
    const output = buildTopology(input);
    const paths = output.hotspots.hotspots.map(h => h.path);
    expect(paths).toEqual(['a.ts', 'z.ts']);
  });

  test('contributors are sorted by commitCount descending', () => {
    const c1 = makeContributor('Low');
    c1.commitCount = 3;
    const c2 = makeContributor('High');
    c2.commitCount = 50;
    const input = makeInput({ contributors: [c1, c2] });
    const output = buildTopology(input);
    expect(output.contributors.contributors[0].name).toBe('High');
    expect(output.contributors.contributors[1].name).toBe('Low');
  });
});

describe('buildTopology — tree metadata stripping', () => {
  test('tree nodes have no metadata field', () => {
    const tree: FileTreeNode = {
      name: 'root',
      path: '',
      type: 'directory',
      children: [
        { name: 'file.ts', path: 'file.ts', type: 'file', metadata: makeFile('file.ts') },
      ],
    };
    const input = makeInput({ tree });
    const output = buildTopology(input);
    expect((output.topology.tree.children![0] as any).metadata).toBeUndefined();
  });
});

describe('stripTreeMetadata', () => {
  test('removes metadata from leaf nodes', () => {
    const node: FileTreeNode = {
      name: 'file.ts',
      path: 'file.ts',
      type: 'file',
      metadata: makeFile('file.ts'),
    };
    const stripped = stripTreeMetadata(node);
    expect(stripped.name).toBe('file.ts');
    expect(stripped.metadata).toBeUndefined();
  });

  test('recurses through children', () => {
    const tree: FileTreeNode = {
      name: 'root',
      path: '',
      type: 'directory',
      children: [
        {
          name: 'src',
          path: 'src',
          type: 'directory',
          children: [
            { name: 'a.ts', path: 'src/a.ts', type: 'file', metadata: makeFile('src/a.ts') },
          ],
        },
      ],
    };
    const stripped = stripTreeMetadata(tree);
    expect((stripped.children![0].children![0] as any).metadata).toBeUndefined();
    expect(stripped.children![0].children![0].name).toBe('a.ts');
  });
});

describe('buildTopology — complexity output', () => {
  test('complexity has version and meta fields', () => {
    const output = buildTopology(makeInput());
    expect(output.complexity.version).toBe('1.0.0');
    expect(output.complexity.meta).toBeDefined();
  });

  test('filters out files with zero complexity', () => {
    const input = makeInput({
      files: [makeFile('zero.ts', 0), makeFile('nonzero.ts', 5)],
    });
    const output = buildTopology(input);
    const paths = output.complexity.files.map(f => f.path);
    expect(paths).not.toContain('zero.ts');
    expect(paths).toContain('nonzero.ts');
  });

  test('includes function breakdown per file', () => {
    const input = makeInput();
    const output = buildTopology(input);
    const indexEntry = output.complexity.files.find(f => f.path === 'src/index.ts');
    expect(indexEntry).toBeDefined();
    expect(indexEntry!.functions.length).toBe(1);
    expect(indexEntry!.functions[0].name).toBe('main');
  });

  test('files without function entries get empty array', () => {
    const input = makeInput({
      files: [makeFile('orphan.ts', 3)],
      functionsByFile: new Map(),
    });
    const output = buildTopology(input);
    const orphan = output.complexity.files.find(f => f.path === 'orphan.ts');
    expect(orphan).toBeDefined();
    expect(orphan!.functions).toEqual([]);
  });
});

describe('buildTopology — hotspots output', () => {
  test('hotspots output has version and meta', () => {
    const output = buildTopology(makeInput());
    expect(output.hotspots.version).toBe('1.0.0');
    expect(output.hotspots.meta).toBeDefined();
  });

  test('includes hotspot list', () => {
    const input = makeInput();
    const output = buildTopology(input);
    expect(output.hotspots.hotspots.length).toBe(2);
  });

  test('includes temporal couplings', () => {
    const input = makeInput();
    const output = buildTopology(input);
    expect(output.hotspots.temporalCouplings.length).toBe(1);
    expect(output.hotspots.temporalCouplings[0].fileA).toBe('a.ts');
  });
});

describe('buildTopology — contributors output', () => {
  test('contributors output has version and meta', () => {
    const output = buildTopology(makeInput());
    expect(output.contributors.version).toBe('1.0.0');
    expect(output.contributors.meta).toBeDefined();
  });

  test('includes contributor profiles', () => {
    const output = buildTopology(makeInput());
    expect(output.contributors.contributors.length).toBe(1);
    expect(output.contributors.contributors[0].name).toBe('Alice');
  });
});

describe('buildTopology — edge cases', () => {
  test('empty input produces valid structure', () => {
    const input = makeInput({
      files: [],
      commits: [],
      tree: { name: 'root', path: '', type: 'directory', children: [] },
      hotspots: [],
      temporalCouplings: [],
      functionsByFile: new Map(),
      contributors: [],
    });

    const output = buildTopology(input);
    expect(output.topology.files).toEqual([]);
    expect(output.commits.commits).toEqual([]);
    expect(output.complexity.files).toEqual([]);
    expect(output.hotspots.hotspots).toEqual([]);
    expect(output.contributors.contributors).toEqual([]);
    expect(output.topology.commitCount).toBe(0);
    expect(output.topology.hotspotCount).toBe(0);
  });
});

describe('buildTopology — provenance meta', () => {
  test('all output sections have meta block', () => {
    const input = makeInput({ headHash: 'abc123def456' });
    const output = buildTopology(input);
    for (const section of [output.topology, output.commits, output.complexity, output.hotspots, output.contributors]) {
      expect(section.meta).toBeDefined();
      expect(section.meta.pipelineVersion).toBe('1.0.0');
      expect(section.meta.headHash).toBe('abc123def456');
      expect(section.meta.analyzedAt).toBeDefined();
      expect(section.meta.repoPath).toBe('test-repo');
    }
  });
});
