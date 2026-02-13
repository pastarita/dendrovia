import { describe, test, expect } from 'bun:test';
import { detectHotspots, type HotspotAnalysis } from '../src/analyzer/HotspotDetector';
import type { ParsedFile, ParsedCommit, Hotspot } from '@dendrovia/shared';

// ---------------------------------------------------------------------------
// Helpers: build minimal test data
// ---------------------------------------------------------------------------
function makeFile(
  path: string,
  complexity: number,
  loc: number = 100,
): ParsedFile {
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

function makeCommit(
  hash: string,
  filesChanged: string[],
  opts: Partial<ParsedCommit> = {},
): ParsedCommit {
  return {
    hash,
    message: 'some commit',
    author: 'dev',
    date: new Date('2025-06-01'),
    filesChanged,
    insertions: 10,
    deletions: 5,
    isBugFix: false,
    isFeature: false,
    isMerge: false,
    ...opts,
  };
}

// ---------------------------------------------------------------------------
// Basic hotspot detection
// ---------------------------------------------------------------------------
describe('detectHotspots — risk score calculation', () => {
  test('file with zero churn has risk score 0', () => {
    const files = [makeFile('src/index.ts', 50)];
    const commits: ParsedCommit[] = []; // no commits

    const result = detectHotspots(files, commits);
    const hs = result.hotspots.find(h => h.path === 'src/index.ts');
    expect(hs).toBeDefined();
    expect(hs!.riskScore).toBe(0);
  });

  test('file with zero complexity has risk score 0', () => {
    const files = [makeFile('src/config.ts', 0)];
    const commits = [
      makeCommit('a1', ['src/config.ts']),
      makeCommit('a2', ['src/config.ts']),
      makeCommit('a3', ['src/config.ts']),
    ];

    const result = detectHotspots(files, commits);
    // complexity 0 => complexityNorm 0 => risk 0
    const hs = result.hotspots.find(h => h.path === 'src/config.ts');
    expect(hs).toBeDefined();
    expect(hs!.riskScore).toBe(0);
  });

  test('high churn + high complexity = high risk score', () => {
    const files = [
      makeFile('src/safe.ts', 1),
      makeFile('src/danger.ts', 50),
    ];
    const commits = [
      // danger.ts is touched in every commit; safe.ts rarely
      ...Array.from({ length: 20 }, (_, i) =>
        makeCommit(`d${i}`, ['src/danger.ts']),
      ),
      makeCommit('s1', ['src/safe.ts']),
    ];

    const result = detectHotspots(files, commits);
    const danger = result.hotspots.find(h => h.path === 'src/danger.ts')!;
    const safe = result.hotspots.find(h => h.path === 'src/safe.ts')!;

    expect(danger.riskScore).toBeGreaterThan(safe.riskScore);
    expect(danger.churnRate).toBe(20);
    expect(danger.complexity).toBe(50);
  });

  test('risk score is between 0 and 1', () => {
    const files = [
      makeFile('a.ts', 10),
      makeFile('b.ts', 30),
      makeFile('c.ts', 80),
    ];
    const commits = [
      makeCommit('c1', ['a.ts', 'b.ts']),
      makeCommit('c2', ['b.ts', 'c.ts']),
      makeCommit('c3', ['c.ts']),
      makeCommit('c4', ['a.ts', 'c.ts']),
    ];

    const result = detectHotspots(files, commits);
    for (const hs of result.hotspots) {
      expect(hs.riskScore).toBeGreaterThanOrEqual(0);
      expect(hs.riskScore).toBeLessThanOrEqual(1);
    }
  });

  test('hotspots are sorted by riskScore descending', () => {
    const files = [
      makeFile('low.ts', 5),
      makeFile('mid.ts', 25),
      makeFile('high.ts', 80),
    ];
    const commits = [
      ...Array.from({ length: 15 }, (_, i) =>
        makeCommit(`h${i}`, ['high.ts']),
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        makeCommit(`m${i}`, ['mid.ts']),
      ),
      makeCommit('l1', ['low.ts']),
    ];

    const result = detectHotspots(files, commits);
    for (let i = 1; i < result.hotspots.length; i++) {
      expect(result.hotspots[i - 1].riskScore).toBeGreaterThanOrEqual(
        result.hotspots[i].riskScore,
      );
    }
  });

  test('riskScore is rounded to 3 decimal places', () => {
    const files = [makeFile('a.ts', 10)];
    const commits = [
      makeCommit('c1', ['a.ts']),
      makeCommit('c2', ['a.ts']),
    ];

    const result = detectHotspots(files, commits);
    const hs = result.hotspots.find(h => h.path === 'a.ts')!;
    const decimals = hs.riskScore.toString().split('.')[1];
    expect(!decimals || decimals.length <= 3).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Top-N filtering
// ---------------------------------------------------------------------------
describe('detectHotspots — topN filtering', () => {
  test('default topN is 50', () => {
    const files = Array.from({ length: 100 }, (_, i) =>
      makeFile(`file${i}.ts`, i + 1),
    );
    const commits = files.map((f, i) =>
      makeCommit(`c${i}`, [f.path]),
    );

    const result = detectHotspots(files, commits);
    expect(result.hotspots.length).toBeLessThanOrEqual(50);
  });

  test('respects custom topN', () => {
    const files = Array.from({ length: 20 }, (_, i) =>
      makeFile(`file${i}.ts`, i + 1),
    );
    const commits = files.map((f, i) =>
      makeCommit(`c${i}`, [f.path]),
    );

    const result = detectHotspots(files, commits, { topN: 5 });
    expect(result.hotspots.length).toBeLessThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// Temporal coupling detection
// ---------------------------------------------------------------------------
describe('detectHotspots — temporal coupling', () => {
  test('detects files that frequently co-change', () => {
    const files = [
      makeFile('model.ts', 10),
      makeFile('view.ts', 10),
    ];
    // 6 commits where both files change together
    const commits = Array.from({ length: 6 }, (_, i) =>
      makeCommit(`c${i}`, ['model.ts', 'view.ts']),
    );

    const result = detectHotspots(files, commits, { minCouplingCount: 5 });
    expect(result.temporalCouplings.length).toBeGreaterThanOrEqual(1);

    const coupling = result.temporalCouplings[0];
    expect(
      (coupling.fileA === 'model.ts' && coupling.fileB === 'view.ts') ||
      (coupling.fileA === 'view.ts' && coupling.fileB === 'model.ts'),
    ).toBe(true);
    expect(coupling.coChangeCount).toBe(6);
    expect(coupling.strength).toBeGreaterThan(0);
  });

  test('does not report couplings below minCouplingCount', () => {
    const files = [
      makeFile('a.ts', 10),
      makeFile('b.ts', 10),
    ];
    // Only 3 co-changes
    const commits = Array.from({ length: 3 }, (_, i) =>
      makeCommit(`c${i}`, ['a.ts', 'b.ts']),
    );

    const result = detectHotspots(files, commits, { minCouplingCount: 5 });
    expect(result.temporalCouplings.length).toBe(0);
  });

  test('skips commits with >50 files (mass commits)', () => {
    const files = [
      makeFile('a.ts', 10),
      makeFile('b.ts', 10),
    ];
    // One commit with 51 files
    const massFiles = Array.from({ length: 51 }, (_, i) => `file${i}.ts`);
    massFiles.push('a.ts', 'b.ts');
    const commits = Array.from({ length: 6 }, (_, i) =>
      makeCommit(`c${i}`, massFiles),
    );

    const result = detectHotspots(files, commits, { minCouplingCount: 1 });
    // All commits had >50 files, so coupling detection skips them
    expect(result.temporalCouplings.length).toBe(0);
  });

  test('skips single-file commits for coupling', () => {
    const files = [makeFile('a.ts', 10)];
    const commits = Array.from({ length: 10 }, (_, i) =>
      makeCommit(`c${i}`, ['a.ts']),
    );

    const result = detectHotspots(files, commits, { minCouplingCount: 1 });
    expect(result.temporalCouplings.length).toBe(0);
  });

  test('coupling strength is normalized', () => {
    const files = [
      makeFile('a.ts', 10),
      makeFile('b.ts', 10),
    ];
    const commits = [
      // 5 co-changes
      ...Array.from({ length: 5 }, (_, i) =>
        makeCommit(`co${i}`, ['a.ts', 'b.ts']),
      ),
      // 5 additional solo changes to a.ts
      ...Array.from({ length: 5 }, (_, i) =>
        makeCommit(`solo${i}`, ['a.ts']),
      ),
    ];

    const result = detectHotspots(files, commits, { minCouplingCount: 5 });
    expect(result.temporalCouplings.length).toBeGreaterThanOrEqual(1);
    const coupling = result.temporalCouplings[0];
    // strength = coChanges / max(changesA, changesB) = 5 / max(10, 5) = 0.5
    expect(coupling.strength).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe('detectHotspots — edge cases', () => {
  test('empty files and commits produces empty results', () => {
    const result = detectHotspots([], []);
    expect(result.hotspots.length).toBe(0);
    expect(result.temporalCouplings.length).toBe(0);
  });

  test('single file, no commits', () => {
    const files = [makeFile('solo.ts', 20)];
    const result = detectHotspots(files, []);
    expect(result.hotspots.length).toBe(1);
    expect(result.hotspots[0].churnRate).toBe(0);
    expect(result.hotspots[0].riskScore).toBe(0);
  });

  test('commit references file not in parsed files list', () => {
    const files = [makeFile('known.ts', 10)];
    const commits = [makeCommit('c1', ['known.ts', 'unknown.ts'])];

    const result = detectHotspots(files, commits);
    // unknown.ts appears in hotspots from churn map
    const unknown = result.hotspots.find(h => h.path === 'unknown.ts');
    expect(unknown).toBeDefined();
    expect(unknown!.complexity).toBe(0);
  });

  test('files appearing in churn map but not in parsed files get complexity 0', () => {
    const files: ParsedFile[] = [];
    const commits = [makeCommit('c1', ['orphan.ts'])];

    const result = detectHotspots(files, commits);
    const orphan = result.hotspots.find(h => h.path === 'orphan.ts');
    expect(orphan).toBeDefined();
    expect(orphan!.complexity).toBe(0);
    expect(orphan!.riskScore).toBe(0);
  });
});
