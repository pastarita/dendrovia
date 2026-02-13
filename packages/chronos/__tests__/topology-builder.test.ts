import { describe, test, expect } from 'bun:test';
import {
  buildTopology,
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
    isBugFix: false,
    isFeature: true,
    isMerge: false,
  };
}

function makeTree(): FileTreeNode {
  return {
    name: 'root',
    path: '',
    type: 'directory',
    children: [
      { name: 'src', path: 'src', type: 'directory', children: [
        { name: 'index.ts', path: 'src/index.ts', type: 'file' },
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
    filesOwned: 5,
    peakHour: 14,
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

  test('topology contains version, analyzedAt, repository', () => {
    const output = buildTopology(makeInput());
    expect(output.topology.version).toBe('1.0.0');
    expect(output.topology.analyzedAt).toBeDefined();
    expect(output.topology.repository).toBe('test-repo');
  });

  test('analyzedAt is a valid ISO date string', () => {
    const output = buildTopology(makeInput());
    const date = new Date(output.topology.analyzedAt);
    expect(date.getTime()).not.toBeNaN();
  });

  test('topology includes files, commits, tree, hotspots', () => {
    const input = makeInput();
    const output = buildTopology(input);
    expect(output.topology.files).toEqual(input.files);
    expect(output.topology.commits).toEqual(input.commits);
    expect(output.topology.tree).toEqual(input.tree);
    expect(output.topology.hotspots).toEqual(input.hotspots);
  });

  test('commits output is the raw commits array', () => {
    const input = makeInput();
    const output = buildTopology(input);
    expect(output.commits).toBe(input.commits);
  });
});

describe('buildTopology — complexity output', () => {
  test('complexity has version field', () => {
    const output = buildTopology(makeInput());
    expect(output.complexity.version).toBe('1.0.0');
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
  test('hotspots output has version', () => {
    const output = buildTopology(makeInput());
    expect(output.hotspots.version).toBe('1.0.0');
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
  test('contributors output has version', () => {
    const output = buildTopology(makeInput());
    expect(output.contributors.version).toBe('1.0.0');
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
    expect(output.commits).toEqual([]);
    expect(output.complexity.files).toEqual([]);
    expect(output.hotspots.hotspots).toEqual([]);
    expect(output.contributors.contributors).toEqual([]);
  });
});
