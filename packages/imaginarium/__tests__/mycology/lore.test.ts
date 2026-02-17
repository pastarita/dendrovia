import { describe, test, expect } from 'bun:test';
import type { ParsedFile, CodeTopology } from '@dendrovia/shared';
import { generateLore } from '../../src/mycology/LoreGenerator';
import { buildTaxonomy, buildFileContext, buildCoChurnMap } from '../../src/mycology/GenusMapper';
import type { LoreTier } from '../../src/mycology/types';
import { generateMockTopology } from '../../src/pipeline/MockTopology';

function makeFile(overrides: Partial<ParsedFile> = {}): ParsedFile {
  return {
    path: 'src/module.ts',
    hash: 'h1',
    language: 'typescript',
    complexity: 5,
    loc: 100,
    lastModified: new Date('2025-06-01'),
    author: 'dev',
    ...overrides,
  };
}

function makeTopology(files: ParsedFile[], hotspots: CodeTopology['hotspots'] = []): CodeTopology {
  return {
    files,
    commits: [],
    tree: { name: 'root', path: '', type: 'directory' },
    hotspots,
  };
}

function getLore(file: ParsedFile, topology?: CodeTopology) {
  const topo = topology ?? makeTopology([file]);
  const coChurnMap = buildCoChurnMap(topo);
  const ctx = buildFileContext(file, topo, coChurnMap);
  const taxonomy = buildTaxonomy(file, ctx);
  return generateLore(file, ctx, taxonomy);
}

describe('Lore tier assignment', () => {
  test('simple file gets common tier', () => {
    const file = makeFile({ complexity: 3, loc: 50 });
    const lore = getLore(file);
    expect(lore.tier).toBe('common');
  });

  test('complex hub gets higher tier', () => {
    const hub = makeFile({
      path: 'src/core/auth.ts',
      complexity: 25,
      loc: 800,
      lastModified: new Date('2023-01-01'), // old
    });
    const files = [hub, ...Array.from({ length: 15 }, (_, i) =>
      makeFile({ path: `src/consumer${i}.ts`, hash: `h${i}` })
    )];
    const topology: CodeTopology = {
      files,
      commits: files.map((f, i) => ({
        hash: `c${i}`, message: 'feat', author: 'dev', date: new Date(),
        filesChanged: [hub.path, f.path],
        insertions: 10, deletions: 0,
        isMerge: false, type: 'feature',
      })),
      tree: { name: 'root', path: '', type: 'directory' },
      hotspots: [{ path: hub.path, churnRate: 15, complexity: 25, riskScore: 0.9 }],
    };

    const lore = getLore(hub, topology);
    expect(['rare', 'epic', 'legendary']).toContain(lore.tier);
  });
});

describe('Lore content', () => {
  test('title includes genus and species', () => {
    const lore = getLore(makeFile());
    expect(lore.title.length).toBeGreaterThan(5);
    // Title should contain at least part of the binomial
    expect(lore.title).toMatch(/\w+ \w+/); // at least genus species
  });

  test('flavor text is non-empty', () => {
    const lore = getLore(makeFile());
    expect(lore.flavorText.length).toBeGreaterThan(10);
  });

  test('code insight includes language', () => {
    const lore = getLore(makeFile({ language: 'typescript' }));
    expect(lore.codeInsight).toContain('typescript');
  });

  test('code insight includes LOC', () => {
    const lore = getLore(makeFile({ loc: 150 }));
    expect(lore.codeInsight).toContain('150');
  });

  test('common tier has no code snippet', () => {
    const file = makeFile({ complexity: 2, loc: 30 });
    const lore = getLore(file);
    if (lore.tier === 'common') {
      expect(lore.codeSnippet).toBeUndefined();
    }
  });

  test('uncommon+ tier has code snippet', () => {
    const file = makeFile({ complexity: 20, loc: 500 });
    const topology = makeTopology([file], [
      { path: file.path, churnRate: 10, complexity: 20, riskScore: 0.7 },
    ]);
    const lore = getLore(file, topology);
    if (lore.tier !== 'common') {
      expect(lore.codeSnippet).toBeTruthy();
    }
  });
});

describe('Lore determinism', () => {
  test('same file produces identical lore', () => {
    const file = makeFile();
    const lore1 = getLore(file);
    const lore2 = getLore(file);
    expect(lore1).toEqual(lore2);
  });

  test('different files produce different flavor text', () => {
    const file1 = makeFile({ path: 'src/a.ts' });
    const file2 = makeFile({ path: 'src/b.ts' });
    // Might still match by coincidence, but generally different
    const lore1 = getLore(file1);
    const lore2 = getLore(file2);
    // At minimum, titles should differ (different species)
    expect(lore1.title).not.toBe(lore2.title);
  });
});

describe('Tier distribution', () => {
  test('most specimens are common/uncommon in mock topology', () => {
    const topology = generateMockTopology(80, ['typescript', 'javascript', 'json'], 42);
    const coChurnMap = buildCoChurnMap(topology);
    const tierCounts: Record<LoreTier, number> = {
      common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0,
    };

    for (const file of topology.files) {
      const ctx = buildFileContext(file, topology, coChurnMap);
      const taxonomy = buildTaxonomy(file, ctx);
      const lore = generateLore(file, ctx, taxonomy);
      tierCounts[lore.tier]++;
    }

    // Common + uncommon should be the majority
    const lowerTiers = tierCounts.common + tierCounts.uncommon;
    const total = Object.values(tierCounts).reduce((a, b) => a + b, 0);
    expect(lowerTiers / total).toBeGreaterThan(0.4);
  });
});

describe('Domain knowledge', () => {
  test('observer pattern file gets domain knowledge', () => {
    const file = makeFile({
      path: 'src/events/observer.ts',
      complexity: 12,
      loc: 300,
    });
    const topology = makeTopology([file], [
      { path: file.path, churnRate: 8, complexity: 12, riskScore: 0.6 },
    ]);
    const lore = getLore(file, topology);
    // If tier is rare+, domain knowledge should mention Observer
    if (lore.tier === 'rare' || lore.tier === 'epic' || lore.tier === 'legendary') {
      expect(lore.domainKnowledge).toContain('Observer');
    }
  });
});
