import { describe, expect, test } from 'bun:test';
import type { CodeTopology, ParsedFile } from '@dendrovia/shared';
import { buildCoChurnMap, buildFileContext, classifyGenus } from '../../src/mycology/GenusMapper';
import { generateMorphology } from '../../src/mycology/MorphologyGenerator';
import type { FungalGenus, MushroomMorphology, SizeClass } from '../../src/mycology/types';
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

function getMorphology(file: ParsedFile, topology?: CodeTopology, genus?: FungalGenus): MushroomMorphology {
  const topo = topology ?? makeTopology([file]);
  const coChurnMap = buildCoChurnMap(topo);
  const ctx = buildFileContext(file, topo, coChurnMap);
  const g = genus ?? classifyGenus(file, ctx);
  return generateMorphology(file, ctx, g);
}

describe('Cap shape derivation', () => {
  test('Cantharellus always gets infundibuliform cap', () => {
    const file = makeFile({ path: 'src/events/emitter.ts' });
    const m = getMorphology(file, undefined, 'Cantharellus');
    expect(m.capShape).toBe('infundibuliform');
  });

  test('Mycena always gets campanulate cap', () => {
    const file = makeFile({ path: 'src/utils/tiny.ts', loc: 20 });
    const m = getMorphology(file, undefined, 'Mycena');
    expect(m.capShape).toBe('campanulate');
  });

  test('high complexity gets umbonate cap', () => {
    const file = makeFile({ complexity: 20 });
    const m = getMorphology(file, undefined, 'Agaricus');
    expect(m.capShape).toBe('umbonate');
  });
});

describe('Gill attachment', () => {
  test('isolated files get free gills', () => {
    const file = makeFile({ path: 'src/lonely.ts' });
    const topology = makeTopology([file]);
    const m = getMorphology(file, topology);
    expect(m.gillAttachment).toBe('free');
  });
});

describe('Stem form', () => {
  test('height scales with LOC', () => {
    const small = getMorphology(makeFile({ loc: 10 }));
    const large = getMorphology(makeFile({ loc: 1000 }));
    expect(large.stem.height).toBeGreaterThan(small.stem.height);
  });

  test('height is bounded 0-1', () => {
    const m1 = getMorphology(makeFile({ loc: 1 }));
    const m2 = getMorphology(makeFile({ loc: 100000 }));
    expect(m1.stem.height).toBeGreaterThanOrEqual(0.1);
    expect(m2.stem.height).toBeLessThanOrEqual(1.0);
  });

  test('thickness is bounded 0-1', () => {
    const m = getMorphology(makeFile());
    expect(m.stem.thickness).toBeGreaterThanOrEqual(0.1);
    expect(m.stem.thickness).toBeLessThanOrEqual(1.0);
  });
});

describe('Spore print color', () => {
  test('TypeScript -> white', () => {
    const m = getMorphology(makeFile({ language: 'typescript' }));
    expect(m.sporePrintColor).toBe('white');
  });

  test('JavaScript -> brown', () => {
    const m = getMorphology(makeFile({ language: 'javascript' }));
    expect(m.sporePrintColor).toBe('brown');
  });

  test('Rust -> black', () => {
    const m = getMorphology(makeFile({ language: 'rust' }));
    expect(m.sporePrintColor).toBe('black');
  });

  test('Python -> purple', () => {
    const m = getMorphology(makeFile({ language: 'python' }));
    expect(m.sporePrintColor).toBe('purple');
  });

  test('Ruby -> pink', () => {
    const m = getMorphology(makeFile({ language: 'ruby' }));
    expect(m.sporePrintColor).toBe('pink');
  });

  test('Go -> cream', () => {
    const m = getMorphology(makeFile({ language: 'go' }));
    expect(m.sporePrintColor).toBe('cream');
  });

  test('unknown language -> ochre', () => {
    const m = getMorphology(makeFile({ language: 'brainfuck' }));
    expect(m.sporePrintColor).toBe('ochre');
  });
});

describe('Bioluminescence', () => {
  test('no hotspot -> none', () => {
    const m = getMorphology(makeFile());
    expect(m.bioluminescence).toBe('none');
  });

  test('high churn hotspot -> pulsing', () => {
    const file = makeFile({ path: 'src/hot.ts' });
    const topology = makeTopology([file], [{ path: 'src/hot.ts', churnRate: 20, complexity: 10, riskScore: 0.9 }]);
    const m = getMorphology(file, topology);
    expect(m.bioluminescence).toBe('pulsing');
  });

  test('moderate churn -> bright', () => {
    const file = makeFile({ path: 'src/warm.ts' });
    const topology = makeTopology([file], [{ path: 'src/warm.ts', churnRate: 10, complexity: 5, riskScore: 0.5 }]);
    const m = getMorphology(file, topology);
    expect(m.bioluminescence).toBe('bright');
  });

  test('low churn -> faint', () => {
    const file = makeFile({ path: 'src/cool.ts' });
    const topology = makeTopology([file], [{ path: 'src/cool.ts', churnRate: 5, complexity: 3, riskScore: 0.3 }]);
    const m = getMorphology(file, topology);
    expect(m.bioluminescence).toBe('faint');
  });
});

describe('Size class', () => {
  const cases: [number, SizeClass][] = [
    [10, 'tiny'],
    [50, 'small'],
    [200, 'medium'],
    [1000, 'large'],
    [3000, 'massive'],
  ];

  for (const [loc, expected] of cases) {
    test(`${loc} LOC -> ${expected}`, () => {
      const m = getMorphology(makeFile({ loc }));
      expect(m.sizeClass).toBe(expected);
    });
  }
});

describe('Color output', () => {
  test('scaleColor is valid hex', () => {
    const m = getMorphology(makeFile());
    expect(m.scaleColor).toMatch(/^#[0-9a-f]{6}$/);
  });

  test('gillColor is valid hex', () => {
    const m = getMorphology(makeFile());
    expect(m.gillColor).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('Spots', () => {
  test('Amanita has spots', () => {
    const m = getMorphology(makeFile(), undefined, 'Amanita');
    expect(m.spots).toBe(true);
  });

  test('Agaricus has no spots', () => {
    const m = getMorphology(makeFile(), undefined, 'Agaricus');
    expect(m.spots).toBe(false);
  });
});

describe('Morphology with mock topology', () => {
  test('all generated morphologies have valid ranges', () => {
    const topology = generateMockTopology(30, ['typescript', 'javascript'], 99);
    const coChurnMap = buildCoChurnMap(topology);

    for (const file of topology.files) {
      const ctx = buildFileContext(file, topology, coChurnMap);
      const genus = classifyGenus(file, ctx);
      const m = generateMorphology(file, ctx, genus);

      expect(m.capWidth).toBeGreaterThanOrEqual(0);
      expect(m.capWidth).toBeLessThanOrEqual(1);
      expect(m.capHeight).toBeGreaterThanOrEqual(0);
      expect(m.capHeight).toBeLessThanOrEqual(1);
      expect(m.gillCount).toBeGreaterThanOrEqual(4);
      expect(m.gillCount).toBeLessThanOrEqual(24);
      expect(m.stem.height).toBeGreaterThanOrEqual(0.1);
      expect(m.stem.height).toBeLessThanOrEqual(1.0);
      expect(m.stem.thickness).toBeGreaterThanOrEqual(0.1);
      expect(m.stem.thickness).toBeLessThanOrEqual(1.0);
      expect(m.scaleColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(m.gillColor).toMatch(/^#[0-9a-f]{6}$/);
      expect(Number.isNaN(m.capWidth)).toBe(false);
      expect(Number.isNaN(m.capHeight)).toBe(false);
      expect(Number.isNaN(m.stem.height)).toBe(false);
      expect(Number.isNaN(m.stem.thickness)).toBe(false);
    }
  });
});
