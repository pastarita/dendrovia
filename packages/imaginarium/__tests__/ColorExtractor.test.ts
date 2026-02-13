import { describe, test, expect } from 'bun:test';
import { extractPalette, extractFilePalette } from '../src/distillation/ColorExtractor';
import { generateMockTopology } from '../src/pipeline/MockTopology';
import type { ParsedFile } from '@dendrovia/shared';

const HEX_PATTERN = /^#[0-9a-f]{6}$/;

describe('extractPalette', () => {
  test('produces valid hex colors for all fields', () => {
    const topology = generateMockTopology(50);
    const palette = extractPalette(topology);

    expect(palette.primary).toMatch(HEX_PATTERN);
    expect(palette.secondary).toMatch(HEX_PATTERN);
    expect(palette.accent).toMatch(HEX_PATTERN);
    expect(palette.background).toMatch(HEX_PATTERN);
    expect(palette.glow).toMatch(HEX_PATTERN);
  });

  test('mood is valid', () => {
    const topology = generateMockTopology(50);
    const palette = extractPalette(topology);
    expect(['warm', 'cool', 'neutral']).toContain(palette.mood);
  });

  test('is deterministic (same input -> same output)', () => {
    const topology = generateMockTopology(50, ['typescript', 'javascript'], 42);
    const palette1 = extractPalette(topology);
    const palette2 = extractPalette(topology);
    expect(palette1).toEqual(palette2);
  });

  test('different languages produce different palettes', () => {
    const tsTopology = generateMockTopology(20, ['typescript'], 42);
    const rustTopology = generateMockTopology(20, ['rust'], 42);

    const tsPalette = extractPalette(tsTopology);
    const rustPalette = extractPalette(rustTopology);

    expect(tsPalette.primary).not.toBe(rustPalette.primary);
  });

  test('handles empty topology', () => {
    const topology = generateMockTopology(0);
    const palette = extractPalette(topology);
    expect(palette.primary).toMatch(HEX_PATTERN);
  });
});

describe('extractFilePalette', () => {
  test('produces valid palette for a single file', () => {
    const file: ParsedFile = {
      path: 'src/index.ts',
      hash: 'abc123',
      language: 'typescript',
      complexity: 8,
      loc: 100,
      lastModified: new Date(),
      author: 'dev',
    };

    const palette = extractFilePalette(file);
    expect(palette.primary).toMatch(HEX_PATTERN);
    expect(palette.secondary).toMatch(HEX_PATTERN);
    expect(palette.accent).toMatch(HEX_PATTERN);
    expect(['warm', 'cool', 'neutral']).toContain(palette.mood);
  });

  test('is deterministic', () => {
    const file: ParsedFile = {
      path: 'src/index.ts',
      hash: 'abc123',
      language: 'python',
      complexity: 5,
      loc: 50,
      lastModified: new Date('2024-01-01'),
      author: 'dev',
    };

    const p1 = extractFilePalette(file);
    const p2 = extractFilePalette(file);
    expect(p1).toEqual(p2);
  });
});
