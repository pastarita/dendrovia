import { describe, expect, test } from 'bun:test';
import type { CodeTopology, ParsedFile } from '@dendrovia/shared';
import { buildCoChurnMap, buildFileContext, buildTaxonomy, classifyGenus } from '../../src/mycology/GenusMapper';
import type { FungalGenus } from '../../src/mycology/types';
import { generateMockTopology } from '../../src/pipeline/MockTopology';

function makeFile(overrides: Partial<ParsedFile> = {}): ParsedFile {
  return {
    path: 'src/utils/helper.ts',
    hash: 'abc123',
    language: 'typescript',
    complexity: 5,
    loc: 100,
    lastModified: new Date('2025-01-01'),
    author: 'dev',
    ...overrides,
  };
}

function makeTopology(files: ParsedFile[], hotspotPaths: string[] = []): CodeTopology {
  return {
    files,
    commits: [
      {
        hash: 'c1',
        message: 'init',
        author: 'dev',
        date: new Date('2025-01-01'),
        filesChanged: files.map((f) => f.path),
        insertions: 100,
        deletions: 0,
        isBugFix: false,
        isFeature: true,
        isMerge: false,
      },
    ],
    tree: { name: 'root', path: '', type: 'directory', children: [] },
    hotspots: hotspotPaths.map((p) => ({ path: p, churnRate: 10, complexity: 10, riskScore: 0.5 })),
  };
}

describe('Genus classification', () => {
  test('entry point files map to Amanita', () => {
    const file = makeFile({ path: 'src/index.ts', complexity: 20, loc: 300 });
    const topology = makeTopology([file]);
    const coChurnMap = buildCoChurnMap(topology);
    const ctx = buildFileContext(file, topology, coChurnMap);
    const genus = classifyGenus(file, ctx);
    expect(genus).toBe('Amanita');
  });

  test('config files map to Russula', () => {
    const file = makeFile({ path: 'config/settings.json', language: 'json', complexity: 1, loc: 20 });
    const topology = makeTopology([file]);
    const coChurnMap = buildCoChurnMap(topology);
    const ctx = buildFileContext(file, topology, coChurnMap);
    const genus = classifyGenus(file, ctx);
    expect(genus).toBe('Russula');
  });

  test('small helpers map to Mycena', () => {
    const file = makeFile({ path: 'src/utils/helper.ts', complexity: 2, loc: 25 });
    const topology = makeTopology([file]);
    const coChurnMap = buildCoChurnMap(topology);
    const ctx = buildFileContext(file, topology, coChurnMap);
    const genus = classifyGenus(file, ctx);
    expect(genus).toBe('Mycena');
  });

  test('database modules map to Boletus', () => {
    const file = makeFile({ path: 'src/db/repository.ts', complexity: 8, loc: 200 });
    const topology = makeTopology([file]);
    const coChurnMap = buildCoChurnMap(topology);
    const ctx = buildFileContext(file, topology, coChurnMap);
    const genus = classifyGenus(file, ctx);
    expect(genus).toBe('Boletus');
  });

  test('event modules map to Cantharellus', () => {
    const file = makeFile({ path: 'src/events/emitter.ts', complexity: 6, loc: 80 });
    const topology = makeTopology([file]);
    const coChurnMap = buildCoChurnMap(topology);
    const ctx = buildFileContext(file, topology, coChurnMap);
    const genus = classifyGenus(file, ctx);
    expect(genus).toBe('Cantharellus');
  });

  test('middleware modules map to Trametes', () => {
    const file = makeFile({ path: 'src/middleware/auth.ts', complexity: 7, loc: 150 });
    const topology = makeTopology([file]);
    const coChurnMap = buildCoChurnMap(topology);
    const ctx = buildFileContext(file, topology, coChurnMap);
    const genus = classifyGenus(file, ctx);
    expect(genus).toBe('Trametes');
  });

  test('debug modules map to Psilocybe', () => {
    const file = makeFile({ path: 'src/debug/devtools.ts', complexity: 4, loc: 60 });
    const topology = makeTopology([file]);
    const coChurnMap = buildCoChurnMap(topology);
    const ctx = buildFileContext(file, topology, coChurnMap);
    const genus = classifyGenus(file, ctx);
    expect(genus).toBe('Psilocybe');
  });

  test('logging modules map to Pleurotus', () => {
    const file = makeFile({ path: 'src/logger/telemetry.ts', complexity: 5, loc: 100 });
    const topology = makeTopology([file]);
    const coChurnMap = buildCoChurnMap(topology);
    const ctx = buildFileContext(file, topology, coChurnMap);
    const genus = classifyGenus(file, ctx);
    expect(genus).toBe('Pleurotus');
  });

  test('deprecated modules map to Xylaria', () => {
    const file = makeFile({ path: 'src/deprecated/oldModule.ts', complexity: 3, loc: 40 });
    const topology = makeTopology([file]);
    const coChurnMap = buildCoChurnMap(topology);
    const ctx = buildFileContext(file, topology, coChurnMap);
    const genus = classifyGenus(file, ctx);
    expect(genus).toBe('Xylaria');
  });

  test('every file in mock topology gets exactly one genus', () => {
    const topology = generateMockTopology(50, ['typescript', 'javascript'], 42);
    const coChurnMap = buildCoChurnMap(topology);
    const genera = new Set<FungalGenus>();

    for (const file of topology.files) {
      const ctx = buildFileContext(file, topology, coChurnMap);
      const genus = classifyGenus(file, ctx);
      expect(genus).toBeTruthy();
      genera.add(genus);
    }

    // Should have diversity (at least 2 different genera)
    expect(genera.size).toBeGreaterThanOrEqual(2);
  });
});

describe('Full taxonomy', () => {
  test('buildTaxonomy produces complete hierarchy', () => {
    const file = makeFile({ path: 'src/index.ts', complexity: 18, loc: 400 });
    const topology = makeTopology([file]);
    const coChurnMap = buildCoChurnMap(topology);
    const ctx = buildFileContext(file, topology, coChurnMap);
    const taxonomy = buildTaxonomy(file, ctx);

    expect(taxonomy.division).toBeTruthy();
    expect(taxonomy.class).toBeTruthy();
    expect(taxonomy.order).toBeTruthy();
    expect(taxonomy.family).toBeTruthy();
    expect(taxonomy.genus).toBeTruthy();
    expect(taxonomy.species).toBeTruthy();
    expect(taxonomy.species.length).toBeGreaterThan(3);
  });

  test('taxonomy is deterministic', () => {
    const file = makeFile({ path: 'src/utils/format.ts' });
    const topology = makeTopology([file]);
    const coChurnMap = buildCoChurnMap(topology);
    const ctx = buildFileContext(file, topology, coChurnMap);

    const t1 = buildTaxonomy(file, ctx);
    const t2 = buildTaxonomy(file, ctx);
    expect(t1).toEqual(t2);
  });

  test('different files get different species epithets', () => {
    const file1 = makeFile({ path: 'src/a.ts' });
    const file2 = makeFile({ path: 'src/b.ts' });
    const topology = makeTopology([file1, file2]);
    const coChurnMap = buildCoChurnMap(topology);

    const t1 = buildTaxonomy(file1, buildFileContext(file1, topology, coChurnMap));
    const t2 = buildTaxonomy(file2, buildFileContext(file2, topology, coChurnMap));
    // Different paths should produce different species names
    // (extremely unlikely collision given hash space)
    expect(t1.species !== t2.species || t1.genus !== t2.genus).toBe(true);
  });
});

describe('Co-churn map', () => {
  test('files changed together are connected', () => {
    const files = [makeFile({ path: 'a.ts' }), makeFile({ path: 'b.ts' }), makeFile({ path: 'c.ts' })];
    const topology: CodeTopology = {
      files,
      commits: [
        {
          hash: 'c1',
          message: 'feat',
          author: 'dev',
          date: new Date(),
          filesChanged: ['a.ts', 'b.ts'],
          insertions: 10,
          deletions: 0,
          isBugFix: false,
          isFeature: true,
          isMerge: false,
        },
      ],
      tree: { name: 'root', path: '', type: 'directory' },
      hotspots: [],
    };

    const map = buildCoChurnMap(topology);
    expect(map.get('a.ts')?.has('b.ts')).toBe(true);
    expect(map.get('b.ts')?.has('a.ts')).toBe(true);
    expect(map.has('c.ts')).toBe(false); // c was never co-changed
  });
});
