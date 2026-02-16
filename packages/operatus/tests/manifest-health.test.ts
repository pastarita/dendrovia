import { describe, it, expect } from 'bun:test';
import { validateManifestStructure } from '../src/manifest/ManifestHealth.js';
import type { AssetManifest } from '@dendrovia/shared';

function makeManifest(overrides: Partial<AssetManifest> = {}): AssetManifest {
  return {
    version: '2026-02-15',
    shaders: { dendrite: 'shaders/dendrite.glsl' },
    palettes: { biome: 'palettes/biome.json' },
    topology: 'topology.json',
    checksum: 'abc123',
    ...overrides,
  };
}

describe('validateManifestStructure', () => {
  it('should validate a well-formed manifest', () => {
    const report = validateManifestStructure(makeManifest());
    expect(report.valid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.entryCount).toBe(3); // 1 shader + 1 palette + 1 topology
    expect(report.checksumValid).toBe(true);
    expect(report.generatedAt).toBe('2026-02-15');
  });

  it('should detect missing version', () => {
    const report = validateManifestStructure(makeManifest({ version: '' }));
    expect(report.valid).toBe(false);
    expect(report.errors).toContain('Missing version field');
  });

  it('should detect missing checksum', () => {
    const report = validateManifestStructure(makeManifest({ checksum: '' }));
    expect(report.valid).toBe(false);
    expect(report.checksumValid).toBe(false);
    expect(report.errors).toContain('Missing or empty checksum');
  });

  it('should detect missing topology', () => {
    const report = validateManifestStructure(makeManifest({ topology: '' }));
    expect(report.valid).toBe(false);
    expect(report.errors).toContain('Missing topology path');
  });

  it('should detect empty manifest', () => {
    const report = validateManifestStructure(makeManifest({
      shaders: {},
      palettes: {},
      topology: '',
    }));
    expect(report.valid).toBe(false);
    expect(report.errors).toContain('Manifest contains no asset entries');
  });

  it('should count mesh entries', () => {
    const report = validateManifestStructure(makeManifest({
      meshes: {
        fungus: { path: 'meshes/fungus.json', hash: 'h1', size: 1024 },
      },
    }));
    expect(report.valid).toBe(true);
    expect(report.entryCount).toBe(4); // 1 shader + 1 palette + 1 topology + 1 mesh
  });

  it('should detect mesh entries with missing paths', () => {
    const report = validateManifestStructure(makeManifest({
      meshes: {
        broken: { path: '', hash: 'h1', size: 0 },
      },
    }));
    expect(report.valid).toBe(false);
    expect(report.errors).toContain("Mesh entry 'broken' missing path");
  });

  it('should calculate staleness from date version', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const dateStr = oldDate.toISOString().slice(0, 10);

    const report = validateManifestStructure(makeManifest({ version: dateStr }));
    expect(report.stalenessDays).toBeGreaterThanOrEqual(9);
    expect(report.stalenessDays).toBeLessThanOrEqual(11);
  });

  it('should handle semver version gracefully', () => {
    const report = validateManifestStructure(makeManifest({ version: '1.0.0' }));
    expect(report.valid).toBe(true);
    expect(report.generatedAt).toBe('1.0.0');
    expect(report.stalenessDays).toBe(0);
  });
});
