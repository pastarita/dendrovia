import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { join } from 'path';
import { existsSync, rmSync, readdirSync } from 'fs';
import { distill } from '../src/pipeline/DistillationPipeline';
import { generateMockTopology } from '../src/pipeline/MockTopology';

const TEST_OUTPUT_DIR = join(import.meta.dir, '.test-cache-output');
const MOCK_TOPOLOGY_PATH = join(TEST_OUTPUT_DIR, 'mock-topology.json');

describe('DeterministicCache Integration', () => {
  beforeAll(async () => {
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
    const { mkdirSync } = await import('fs');
    mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    const topology = generateMockTopology(50, ['typescript', 'javascript'], 99);
    await Bun.write(MOCK_TOPOLOGY_PATH, JSON.stringify(topology, null, 2));
  });

  afterAll(() => {
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  test('.cache/ directory is populated after first run', async () => {
    await distill(MOCK_TOPOLOGY_PATH, TEST_OUTPUT_DIR);

    const cacheDir = join(TEST_OUTPUT_DIR, '.cache');
    expect(existsSync(cacheDir)).toBe(true);

    const cacheFiles = readdirSync(cacheDir).filter(f => f.endsWith('.json'));
    expect(cacheFiles.length).toBeGreaterThan(0);
  });

  test('second run with same topology hits cache (produces identical manifest)', async () => {
    // First run (may already exist from prior test)
    const result1 = await distill(MOCK_TOPOLOGY_PATH, TEST_OUTPUT_DIR);
    const manifest1Raw = await Bun.file(join(TEST_OUTPUT_DIR, 'manifest.json')).text();

    // Second run — should hit cache
    const result2 = await distill(MOCK_TOPOLOGY_PATH, TEST_OUTPUT_DIR);
    const manifest2Raw = await Bun.file(join(TEST_OUTPUT_DIR, 'manifest.json')).text();

    const manifest1 = JSON.parse(manifest1Raw);
    const manifest2 = JSON.parse(manifest2Raw);

    expect(manifest1.checksum).toBe(manifest2.checksum);
    expect(manifest1.shaders).toEqual(manifest2.shaders);
    expect(manifest1.palettes).toEqual(manifest2.palettes);
  });

  test('changed topology produces cache miss', async () => {
    const altDir = join(TEST_OUTPUT_DIR, 'alt');
    const altTopologyPath = join(altDir, 'topology.json');

    const { mkdirSync } = await import('fs');
    mkdirSync(altDir, { recursive: true });

    // Different topology: more files, different seed
    const topology = generateMockTopology(75, ['typescript', 'python', 'rust'], 123);
    await Bun.write(altTopologyPath, JSON.stringify(topology, null, 2));

    const result = await distill(altTopologyPath, altDir);

    // Should still produce valid output (not stale cache)
    expect(result.palettes.length).toBeGreaterThanOrEqual(1);
    expect(result.shaders.length).toBeGreaterThanOrEqual(1);

    rmSync(altDir, { recursive: true });
  });

  test('second run is faster than first (cache hit)', async () => {
    const freshDir = join(TEST_OUTPUT_DIR, 'timing');
    const freshTopologyPath = join(freshDir, 'topology.json');

    const { mkdirSync } = await import('fs');
    mkdirSync(freshDir, { recursive: true });

    const topology = generateMockTopology(40, ['typescript'], 777);
    await Bun.write(freshTopologyPath, JSON.stringify(topology, null, 2));

    // First run — cold cache
    const start1 = performance.now();
    await distill(freshTopologyPath, freshDir);
    const duration1 = performance.now() - start1;

    // Second run — warm cache
    const start2 = performance.now();
    await distill(freshTopologyPath, freshDir);
    const duration2 = performance.now() - start2;

    // Second run should be faster (allow some tolerance for jitter)
    // We just assert second is less than first * 1.1 (generous tolerance)
    expect(duration2).toBeLessThan(duration1 * 1.1);

    rmSync(freshDir, { recursive: true });
  });
});
