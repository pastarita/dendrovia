import { describe, expect, test } from 'bun:test';
import type { CodeTopology, ParsedFile } from '@dendrovia/shared';
import { catalogize } from '../../src/mycology/SpecimenCatalog';
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

describe('Specimen catalogization', () => {
  test('produces one specimen per valid file', () => {
    const topology = generateMockTopology(20, ['typescript'], 42);
    const specimens = catalogize(topology);

    // Should have specimens (some files may be filtered as trivial)
    expect(specimens.length).toBeGreaterThan(0);
    expect(specimens.length).toBeLessThanOrEqual(topology.files.length);
  });

  test('filters trivial files', () => {
    const files: ParsedFile[] = [
      makeFile({ path: 'src/module.ts', loc: 100 }),
      makeFile({ path: '.gitignore', hash: 'h2', loc: 5 }),
      makeFile({ path: 'src/tiny.ts', hash: 'h3', loc: 1 }), // below MIN_LOC
    ];
    const topology: CodeTopology = {
      files,
      commits: [],
      tree: { name: 'root', path: '', type: 'directory' },
      hotspots: [],
    };

    const specimens = catalogize(topology);

    const paths = specimens.map((s) => s.filePath);
    expect(paths).toContain('src/module.ts');
    expect(paths).not.toContain('.gitignore');
    expect(paths).not.toContain('src/tiny.ts');
  });

  test('every specimen has complete structure', () => {
    const topology = generateMockTopology(30, ['typescript', 'javascript'], 99);
    const specimens = catalogize(topology);

    for (const s of specimens) {
      // ID
      expect(s.id).toBeTruthy();
      expect(s.id.length).toBeGreaterThan(10);

      // File path
      expect(s.filePath).toBeTruthy();

      // Taxonomy
      expect(s.taxonomy.division).toBeTruthy();
      expect(s.taxonomy.class).toBeTruthy();
      expect(s.taxonomy.order).toBeTruthy();
      expect(s.taxonomy.family).toBeTruthy();
      expect(s.taxonomy.genus).toBeTruthy();
      expect(s.taxonomy.species).toBeTruthy();

      // Morphology
      expect(s.morphology.capShape).toBeTruthy();
      expect(s.morphology.scaleColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(s.morphology.gillColor).toMatch(/^#[0-9a-f]{6}$/);

      // Lore
      expect(s.lore.tier).toBeTruthy();
      expect(s.lore.title).toBeTruthy();
      expect(s.lore.flavorText.length).toBeGreaterThan(0);
      expect(s.lore.codeInsight.length).toBeGreaterThan(0);

      // Placement
      expect(s.placement.position).toHaveLength(3);
      expect(s.placement.substrate).toBeTruthy();
      expect(s.placement.clusterSize).toBeGreaterThanOrEqual(1);
      expect(typeof s.placement.rotation).toBe('number');
      expect(typeof s.placement.scale).toBe('number');
      expect(s.placement.scale).toBeGreaterThan(0);
    }
  });

  test('specimens have unique IDs', () => {
    const topology = generateMockTopology(50, ['typescript', 'javascript'], 42);
    const specimens = catalogize(topology);
    const ids = specimens.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

describe('Placement hints', () => {
  test('positions are spread across space', () => {
    const topology = generateMockTopology(20, ['typescript'], 42);
    const specimens = catalogize(topology);

    // Check that not all positions are identical
    const positions = specimens.map((s) => s.placement.position);
    const uniqueX = new Set(positions.map((p) => Math.round(p[0])));
    expect(uniqueX.size).toBeGreaterThan(1);
  });

  test('Mycena specimens have cluster sizes > 1', () => {
    // Create a file that should map to Mycena (tiny helper)
    const files = Array.from({ length: 10 }, (_, i) =>
      makeFile({
        path: `src/utils/helper${i}.ts`,
        hash: `h${i}`,
        complexity: 2,
        loc: 20,
      }),
    );
    const topology: CodeTopology = {
      files,
      commits: [],
      tree: { name: 'root', path: '', type: 'directory' },
      hotspots: [],
    };

    const specimens = catalogize(topology);
    const mycenaSpecimens = specimens.filter((s) => s.taxonomy.genus === 'Mycena');

    for (const s of mycenaSpecimens) {
      expect(s.placement.clusterSize).toBeGreaterThan(1);
    }
  });

  test('Tuber specimens have subterranean substrate', () => {
    const files = [
      makeFile({
        path: 'src/internal/_private.ts',
        hash: 'hpriv',
        complexity: 3,
        loc: 50,
      }),
    ];
    const topology: CodeTopology = {
      files,
      commits: [],
      tree: { name: 'root', path: '', type: 'directory' },
      hotspots: [],
    };

    const specimens = catalogize(topology);
    const tuberSpecimens = specimens.filter((s) => s.taxonomy.genus === 'Tuber');

    for (const s of tuberSpecimens) {
      expect(s.placement.substrate).toBe('subterranean');
    }
  });
});

describe('Determinism', () => {
  test('same topology produces identical catalog', () => {
    const topology = generateMockTopology(30, ['typescript', 'javascript'], 42);
    const catalog1 = catalogize(topology);
    const catalog2 = catalogize(topology);

    expect(catalog1.length).toBe(catalog2.length);

    for (let i = 0; i < catalog1.length; i++) {
      expect(catalog1[i].id).toBe(catalog2[i].id);
      expect(catalog1[i].taxonomy).toEqual(catalog2[i].taxonomy);
      expect(catalog1[i].morphology).toEqual(catalog2[i].morphology);
      expect(catalog1[i].lore).toEqual(catalog2[i].lore);
      expect(catalog1[i].placement).toEqual(catalog2[i].placement);
    }
  });

  test('different seeds produce different catalogs', () => {
    const topology1 = generateMockTopology(20, ['typescript'], 1);
    const topology2 = generateMockTopology(20, ['typescript'], 2);
    const catalog1 = catalogize(topology1);
    const catalog2 = catalogize(topology2);

    // At least some specimens should differ
    const ids1 = new Set(catalog1.map((s) => s.id));
    const ids2 = new Set(catalog2.map((s) => s.id));
    const overlap = [...ids1].filter((id) => ids2.has(id));
    expect(overlap.length).toBeLessThan(catalog1.length);
  });
});
