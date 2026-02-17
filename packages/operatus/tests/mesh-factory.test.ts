/**
 * MeshFactory Tests
 *
 * Tests runtime mesh generation, binary serialization round-trips,
 * cache integration, in-flight deduplication, and pipeline versioning.
 */

import './setup.js';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import type { FungalSpecimen } from '@dendrovia/shared';
import { CacheManager } from '../src/cache/CacheManager.js';
import { MeshFactory, MESH_PIPELINE_VERSION } from '../src/mesh/MeshFactory.js';
import { decodeMesh, encodeMesh } from '../src/mesh/serialization.js';

// ---------------------------------------------------------------------------
// Mock specimen
// ---------------------------------------------------------------------------

function mockSpecimen(id = 'test-001'): FungalSpecimen {
  return {
    id,
    filePath: 'src/example.ts',
    taxonomy: {
      division: 'Basidiomycota',
      class: 'Agaricomycetes',
      order: 'Agaricales',
      family: 'Amanitaceae',
      genus: 'Amanita',
      species: 'muscaria',
    },
    morphology: {
      capShape: 'convex',
      capWidth: 0.5,
      capHeight: 0.3,
      gillAttachment: 'free',
      gillCount: 24,
      stem: {
        height: 0.6,
        thickness: 0.3,
        bulbous: true,
        rooting: false,
        ringed: true,
      },
      sporePrintColor: '#FFFFFF',
      bioluminescence: 'none',
      sizeClass: 'medium',
      spots: true,
      scaleColor: '#CC0000',
      gillColor: '#F0E0C0',
    },
    lore: {
      tier: 'common',
      title: 'Test Mushroom',
      flavorText: 'A test specimen.',
      codeInsight: 'Tests are important.',
    },
    placement: {
      position: [0, 0, 0],
      substrate: 'soil',
      clusterSize: 1,
      rotation: 0,
      scale: 1,
    },
    assets: {},
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let cache: CacheManager;
let factory: MeshFactory;

beforeEach(async () => {
  cache = new CacheManager();
  try {
    await cache.init();
  } catch {
    // IDB may not be fully available
  }
  factory = new MeshFactory(cache);
});

afterEach(async () => {
  try {
    await cache.clear();
  } catch {
    // Cleanup
  }
});

describe('MeshFactory — generation', () => {
  test('generates valid FlatMeshData for a specimen', async () => {
    const specimen = mockSpecimen();
    const result = await factory.getMesh(specimen);

    expect(result.fromCache).toBe(false);
    expect(result.cap).toBeDefined();
    expect(result.stem).toBeDefined();

    // Cap should have positions, normals, indices
    expect(result.cap.positions).toBeInstanceOf(Float32Array);
    expect(result.cap.normals).toBeInstanceOf(Float32Array);
    expect(result.cap.indices).toBeInstanceOf(Uint32Array);
    expect(result.cap.positions.length).toBeGreaterThan(0);
    expect(result.cap.positions.length % 3).toBe(0);
    expect(result.cap.normals.length).toBe(result.cap.positions.length);
    expect(result.cap.indices.length % 3).toBe(0);

    // Stem should also have valid data
    expect(result.stem.positions).toBeInstanceOf(Float32Array);
    expect(result.stem.normals).toBeInstanceOf(Float32Array);
    expect(result.stem.indices).toBeInstanceOf(Uint32Array);
    expect(result.stem.positions.length).toBeGreaterThan(0);
  });

  test('stats track generation', async () => {
    await factory.getMesh(mockSpecimen());
    const stats = factory.getStats();

    expect(stats.generated).toBe(1);
    expect(stats.cacheMisses).toBe(1);
    expect(stats.totalTimeMs).toBeGreaterThan(0);
  });
});

describe('MeshFactory — serialization round-trip', () => {
  test('encodeMesh/decodeMesh round-trips correctly', async () => {
    const specimen = mockSpecimen();
    const result = await factory.getMesh(specimen);

    // Encode
    const capBuffer = encodeMesh(result.cap, MESH_PIPELINE_VERSION);
    expect(capBuffer).toBeInstanceOf(ArrayBuffer);
    expect(capBuffer.byteLength).toBeGreaterThan(16); // header + data

    // Decode
    const decoded = decodeMesh(capBuffer, MESH_PIPELINE_VERSION);
    expect(decoded).not.toBeNull();

    // Verify positions match
    expect(decoded!.positions.length).toBe(result.cap.positions.length);
    for (let i = 0; i < result.cap.positions.length; i++) {
      expect(decoded!.positions[i]).toBeCloseTo(result.cap.positions[i]!, 5);
    }

    // Verify normals match
    expect(decoded!.normals.length).toBe(result.cap.normals.length);
    for (let i = 0; i < result.cap.normals.length; i++) {
      expect(decoded!.normals[i]).toBeCloseTo(result.cap.normals[i]!, 5);
    }

    // Verify indices match
    expect(decoded!.indices.length).toBe(result.cap.indices.length);
    for (let i = 0; i < result.cap.indices.length; i++) {
      expect(decoded!.indices[i]).toBe(result.cap.indices[i]);
    }
  });

  test('decodeMesh returns null on magic mismatch', () => {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    view.setUint32(0, 0xdeadbeef, true); // wrong magic
    expect(decodeMesh(buffer, MESH_PIPELINE_VERSION)).toBeNull();
  });

  test('decodeMesh returns null on version mismatch', () => {
    const specimen = mockSpecimen();
    // Create a valid buffer with version 1
    const flat = {
      positions: new Float32Array([0, 0, 0]),
      normals: new Float32Array([0, 1, 0]),
      indices: new Uint32Array([0, 0, 0]),
    };
    const buffer = encodeMesh(flat, 1);
    // Decode expecting version 99
    expect(decodeMesh(buffer, 99)).toBeNull();
  });

  test('decodeMesh returns null on truncated buffer', () => {
    expect(decodeMesh(new ArrayBuffer(4), MESH_PIPELINE_VERSION)).toBeNull();
  });
});

describe('MeshFactory — cache', () => {
  test('second call returns fromCache: true', async () => {
    const specimen = mockSpecimen();

    const first = await factory.getMesh(specimen);
    expect(first.fromCache).toBe(false);

    const second = await factory.getMesh(specimen);
    expect(second.fromCache).toBe(true);

    const stats = factory.getStats();
    expect(stats.cacheHits).toBe(1);
    expect(stats.cacheMisses).toBe(1);
  });

  test('different specimens get different cache entries', async () => {
    const s1 = mockSpecimen('specimen-a');
    const s2 = mockSpecimen('specimen-b');

    await factory.getMesh(s1);
    await factory.getMesh(s2);

    const stats = factory.getStats();
    expect(stats.generated).toBe(2);
    expect(stats.cacheMisses).toBe(2);
  });
});

describe('MeshFactory — in-flight deduplication', () => {
  test('concurrent getMesh calls for same specimen share one generation', async () => {
    const specimen = mockSpecimen();

    // Fire both concurrently
    const [r1, r2] = await Promise.all([
      factory.getMesh(specimen),
      factory.getMesh(specimen),
    ]);

    // Both should succeed
    expect(r1.cap.positions.length).toBeGreaterThan(0);
    expect(r2.cap.positions.length).toBeGreaterThan(0);

    // Only one generation should have occurred
    const stats = factory.getStats();
    expect(stats.generated).toBe(1);
    expect(stats.cacheMisses).toBe(1);
  });
});

describe('MeshFactory — pipeline versioning', () => {
  test('version mismatch triggers regeneration', async () => {
    const specimen = mockSpecimen();

    // Generate with version 1
    const v1Factory = new MeshFactory(cache, 1);
    const r1 = await v1Factory.getMesh(specimen);
    expect(r1.fromCache).toBe(false);

    // Same version → cache hit
    const v1FactoryAgain = new MeshFactory(cache, 1);
    const r2 = await v1FactoryAgain.getMesh(specimen);
    expect(r2.fromCache).toBe(true);

    // Different version → cache miss (key doesn't match)
    const v2Factory = new MeshFactory(cache, 2);
    const r3 = await v2Factory.getMesh(specimen);
    expect(r3.fromCache).toBe(false);
  });
});

describe('MeshFactory — batch', () => {
  test('generateBatch processes all specimens', async () => {
    const specimens = [
      mockSpecimen('batch-1'),
      mockSpecimen('batch-2'),
      mockSpecimen('batch-3'),
    ];

    const results = await factory.generateBatch(specimens, { yieldEvery: 2 });
    expect(results.length).toBe(3);

    for (const r of results) {
      expect(r.cap.positions.length).toBeGreaterThan(0);
      expect(r.stem.positions.length).toBeGreaterThan(0);
    }
  });

  test('generateBatch respects AbortSignal', async () => {
    const controller = new AbortController();
    const specimens = [
      mockSpecimen('abort-1'),
      mockSpecimen('abort-2'),
      mockSpecimen('abort-3'),
    ];

    // Abort after first specimen
    controller.abort();

    const results = await factory.generateBatch(specimens, {
      signal: controller.signal,
    });
    expect(results.length).toBe(0);
  });
});
