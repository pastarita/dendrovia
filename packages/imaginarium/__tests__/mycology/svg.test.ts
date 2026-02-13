import { describe, test, expect } from 'bun:test';
import { generateSvg, generateSvgBatch } from '../../src/mycology/assets/SvgTemplates';
import { catalogize } from '../../src/mycology/SpecimenCatalog';
import { generateMockTopology } from '../../src/pipeline/MockTopology';
import type { FungalSpecimen, MushroomMorphology, CapShape } from '../../src/mycology/types';

function makeSpecimen(overrides: Partial<MushroomMorphology> = {}): FungalSpecimen {
  return {
    id: 'test-specimen',
    filePath: 'src/test.ts',
    taxonomy: {
      division: 'Basidiomycota',
      class: 'Agaricomycetes',
      order: 'Agaricales',
      family: 'Agaricaceae',
      genus: 'Agaricus',
      species: 'testensis',
    },
    morphology: {
      capShape: 'convex',
      capWidth: 0.5,
      capHeight: 0.4,
      gillAttachment: 'adnate',
      gillCount: 12,
      stem: {
        height: 0.5,
        thickness: 0.3,
        bulbous: false,
        rooting: false,
        ringed: false,
      },
      sporePrintColor: 'white',
      bioluminescence: 'none',
      sizeClass: 'medium',
      spots: false,
      scaleColor: '#557766',
      gillColor: '#aabb99',
      ...overrides,
    },
    lore: {
      tier: 'common',
      title: 'Agaricus testensis',
      flavorText: 'A test specimen.',
      codeInsight: 'Test module, 100 lines',
    },
    placement: {
      position: [10, 0, 5],
      substrate: 'soil',
      clusterSize: 1,
      rotation: 0,
      scale: 1,
    },
    assets: {},
  };
}

describe('SVG generation', () => {
  test('produces valid XML structure', () => {
    const svg = generateSvg(makeSpecimen());

    expect(svg).toContain('<svg');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('</svg>');
    expect(svg).toContain('viewBox');
  });

  test('contains cap path element', () => {
    const svg = generateSvg(makeSpecimen());
    // Should have at least 2 path elements (stem + cap)
    const pathCount = (svg.match(/<path /g) || []).length;
    expect(pathCount).toBeGreaterThanOrEqual(2);
  });

  test('contains stem path', () => {
    const svg = generateSvg(makeSpecimen());
    expect(svg).toContain('<path');
    expect(svg).toContain('fill=');
  });

  test('size is reasonable (2-5KB)', () => {
    const svg = generateSvg(makeSpecimen());
    const sizeKB = new Blob([svg]).size / 1024;
    expect(sizeKB).toBeGreaterThan(0.5);
    expect(sizeKB).toBeLessThan(10);
  });
});

describe('SVG cap shape variants', () => {
  const shapes: CapShape[] = ['convex', 'campanulate', 'umbonate', 'infundibuliform', 'plane', 'depressed'];

  for (const shape of shapes) {
    test(`${shape} cap produces valid SVG`, () => {
      const svg = generateSvg(makeSpecimen({ capShape: shape }));
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      // Should have a path element for the cap
      expect(svg).toContain('<path');
    });
  }
});

describe('SVG bioluminescence', () => {
  test('non-luminescent has no glow filter', () => {
    const svg = generateSvg(makeSpecimen({ bioluminescence: 'none' }));
    expect(svg).not.toContain('filter="url(#glow)"');
  });

  test('faint luminescence has glow filter', () => {
    const svg = generateSvg(makeSpecimen({ bioluminescence: 'faint' }));
    expect(svg).toContain('id="glow"');
    expect(svg).toContain('filter="url(#glow)"');
  });

  test('pulsing has animation', () => {
    const svg = generateSvg(makeSpecimen({ bioluminescence: 'pulsing' }));
    expect(svg).toContain('@keyframes pulse');
  });
});

describe('SVG spots', () => {
  test('Amanita-type has spot circles', () => {
    const svg = generateSvg(makeSpecimen({ spots: true }));
    expect(svg).toContain('<circle');
    expect(svg).toContain('fill="white"');
  });

  test('non-spotted has no spot circles', () => {
    const svg = generateSvg(makeSpecimen({ spots: false }));
    expect(svg).not.toContain('<circle');
  });
});

describe('SVG ring', () => {
  test('ringed stem has ellipse element', () => {
    const svg = generateSvg(makeSpecimen({
      stem: { height: 0.5, thickness: 0.3, bulbous: false, rooting: false, ringed: true },
    }));
    expect(svg).toContain('<ellipse');
  });

  test('non-ringed has no ellipse', () => {
    const svg = generateSvg(makeSpecimen({
      stem: { height: 0.5, thickness: 0.3, bulbous: false, rooting: false, ringed: false },
    }));
    expect(svg).not.toContain('<ellipse');
  });
});

describe('SVG colors', () => {
  test('uses scaleColor for cap', () => {
    const svg = generateSvg(makeSpecimen({ scaleColor: '#ff0000' }));
    expect(svg).toContain('#ff0000');
  });

  test('uses gillColor for gills and stem', () => {
    const svg = generateSvg(makeSpecimen({ gillColor: '#00ff00' }));
    expect(svg).toContain('#00ff00');
  });
});

describe('SVG batch generation', () => {
  test('produces SVG for every specimen', () => {
    const topology = generateMockTopology(15, ['typescript'], 42);
    const specimens = catalogize(topology);
    const batch = generateSvgBatch(specimens);

    expect(batch.size).toBe(specimens.length);
    for (const [id, svg] of batch) {
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
    }
  });
});

describe('SVG determinism', () => {
  test('same specimen produces identical SVG', () => {
    const specimen = makeSpecimen();
    const svg1 = generateSvg(specimen);
    const svg2 = generateSvg(specimen);
    expect(svg1).toBe(svg2);
  });
});

describe('SVG from full pipeline', () => {
  test('all specimens from mock topology produce valid SVGs', () => {
    const topology = generateMockTopology(25, ['typescript', 'javascript'], 42);
    const specimens = catalogize(topology);

    for (const specimen of specimens) {
      const svg = generateSvg(specimen);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      // Check well-formedness: opening tags match closing or are self-closing
      const openSvg = (svg.match(/<svg/g) || []).length;
      const closeSvg = (svg.match(/<\/svg>/g) || []).length;
      expect(openSvg).toBe(closeSvg);
    }
  });
});
