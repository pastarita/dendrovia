import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { join } from 'path';
import { existsSync, rmSync } from 'fs';
import { distill } from '../src/pipeline/DistillationPipeline';
import { generateMockTopology } from '../src/pipeline/MockTopology';
import { validateGLSL } from '../src/utils/glsl';

const TEST_OUTPUT_DIR = join(import.meta.dir, '.test-output');
const MOCK_TOPOLOGY_PATH = join(TEST_OUTPUT_DIR, 'mock-topology.json');

describe('Full Pipeline Integration', () => {
  beforeAll(async () => {
    // Create mock topology file
    if (!existsSync(TEST_OUTPUT_DIR)) {
      const { mkdirSync } = await import('fs');
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
    const topology = generateMockTopology(100, ['typescript', 'javascript', 'json'], 42);
    await Bun.write(MOCK_TOPOLOGY_PATH, JSON.stringify(topology, null, 2));
  });

  afterAll(() => {
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  test('produces all expected artifacts', async () => {
    const result = await distill(MOCK_TOPOLOGY_PATH, TEST_OUTPUT_DIR);

    // Palettes
    expect(result.palettes.length).toBeGreaterThanOrEqual(1);
    for (const p of result.palettes) {
      expect(existsSync(join(TEST_OUTPUT_DIR, p.path))).toBe(true);
      expect(p.palette.primary).toMatch(/^#[0-9a-f]{6}$/);
    }

    // Shaders
    expect(result.shaders.length).toBeGreaterThanOrEqual(1);
    expect(result.shaders.length).toBeLessThanOrEqual(5);
    for (const s of result.shaders) {
      expect(existsSync(join(TEST_OUTPUT_DIR, s.path))).toBe(true);
      expect(s.shader.glsl.length).toBeGreaterThan(100);
    }

    // Noise
    expect(existsSync(join(TEST_OUTPUT_DIR, result.noise.path))).toBe(true);

    // L-System
    expect(existsSync(join(TEST_OUTPUT_DIR, result.lsystem.path))).toBe(true);

    // Manifest
    expect(existsSync(join(TEST_OUTPUT_DIR, 'manifest.json'))).toBe(true);
  });

  test('generates exactly 5 shader variants', async () => {
    const result = await distill(MOCK_TOPOLOGY_PATH, TEST_OUTPUT_DIR);
    expect(result.shaders).toHaveLength(5);
  });

  test('all shaders pass GLSL validation', async () => {
    const result = await distill(MOCK_TOPOLOGY_PATH, TEST_OUTPUT_DIR);

    for (const s of result.shaders) {
      const validation = validateGLSL(s.shader.glsl);
      if (!validation.valid) {
        console.log(`Shader ${s.id} validation errors:`, validation.errors);
      }
      expect(validation.valid).toBe(true);
    }
  });

  test('manifest has correct structure', async () => {
    const result = await distill(MOCK_TOPOLOGY_PATH, TEST_OUTPUT_DIR);
    const manifestRaw = await Bun.file(join(TEST_OUTPUT_DIR, 'manifest.json')).text();
    const manifest = JSON.parse(manifestRaw);

    expect(manifest.version).toBe('1.0.0');
    expect(manifest.checksum).toBeTruthy();
    expect(Object.keys(manifest.shaders).length).toBe(result.shaders.length);
    expect(Object.keys(manifest.palettes).length).toBe(result.palettes.length);
  });

  test('completes in <5 seconds for 100-file topology', async () => {
    const start = performance.now();
    await distill(MOCK_TOPOLOGY_PATH, TEST_OUTPUT_DIR);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });

  test('is deterministic (same input -> byte-identical output)', async () => {
    const output1 = join(TEST_OUTPUT_DIR, 'run1');
    const output2 = join(TEST_OUTPUT_DIR, 'run2');

    const result1 = await distill(MOCK_TOPOLOGY_PATH, output1);
    const result2 = await distill(MOCK_TOPOLOGY_PATH, output2);

    // Compare palettes
    for (let i = 0; i < result1.palettes.length; i++) {
      expect(result1.palettes[i].palette).toEqual(result2.palettes[i].palette);
    }

    // Compare shader sources
    for (let i = 0; i < result1.shaders.length; i++) {
      expect(result1.shaders[i].shader.glsl).toBe(result2.shaders[i].shader.glsl);
    }

    // Compare noise config
    expect(result1.noise.config).toEqual(result2.noise.config);

    // Compare L-system rules
    expect(result1.lsystem.rule).toEqual(result2.lsystem.rule);

    // Clean up
    rmSync(output1, { recursive: true });
    rmSync(output2, { recursive: true });
  });
});

describe('Pipeline error handling', () => {
  test('handles missing topology gracefully', async () => {
    const output = join(TEST_OUTPUT_DIR, 'missing-topology');
    const result = await distill('/nonexistent/topology.json', output);

    expect(result.palettes.length).toBeGreaterThanOrEqual(1);
    expect(result.shaders.length).toBeGreaterThanOrEqual(1);

    rmSync(output, { recursive: true });
  });
});
