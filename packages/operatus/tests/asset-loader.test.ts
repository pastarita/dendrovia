/**
 * AssetLoader Tests
 *
 * Tests manifest-driven asset loading, priority scheduling,
 * and cache integration. Uses the real CacheManager
 * (which falls back to IDB in Bun).
 */

import './setup.js';
import { describe, test, expect, beforeEach } from 'bun:test';
import { AssetLoader, AssetPriority, type AssetDescriptor } from '../src/loader/AssetLoader.js';

describe('AssetLoader — construction', () => {
  test('creates with default basePath', () => {
    const loader = new AssetLoader();
    expect(loader).toBeDefined();
  });

  test('creates with custom basePath', () => {
    const loader = new AssetLoader('/custom/path');
    expect(loader).toBeDefined();
  });
});

describe('AssetLoader — init', () => {
  test('init sets up cache without throwing', async () => {
    const loader = new AssetLoader();
    await loader.init();
  });
});

describe('AssetLoader — getLoaded', () => {
  test('getLoaded returns null for unloaded assets', async () => {
    const loader = new AssetLoader();
    await loader.init();
    expect(loader.getLoaded('nonexistent.glsl')).toBeNull();
  });
});

describe('AssetLoader — progress callback', () => {
  test('setProgressCallback stores callback', async () => {
    const loader = new AssetLoader();
    await loader.init();

    const events: any[] = [];
    loader.setProgressCallback((p) => events.push(p));
    // Callback set — will fire during loadAll/loadGroup
    expect(events).toHaveLength(0);
  });
});

describe('AssetLoader — getAssetDescriptors', () => {
  test('throws when manifest not loaded', async () => {
    const loader = new AssetLoader();
    await loader.init();

    expect(() => loader.getAssetDescriptors()).toThrow('Manifest not loaded');
  });
});

describe('AssetLoader — loadAsset with cache', () => {
  test('loadAsset populates loadedAssets map', async () => {
    const loader = new AssetLoader();
    await loader.init();

    // Pre-populate the cache so loadAsset doesn't hit network
    await loader.cacheManager.set('test-shader.glsl', 'void main() {}');

    const descriptor: AssetDescriptor = {
      path: 'test-shader.glsl',
      priority: AssetPriority.CRITICAL,
      type: 'shader',
    };

    const result = await loader.loadAsset(descriptor);
    expect(result).toBe('void main() {}');
    expect(loader.getLoaded('test-shader.glsl')).toBe('void main() {}');
  });

  test('loadAsset returns cached result on second call', async () => {
    const loader = new AssetLoader();
    await loader.init();

    await loader.cacheManager.set('cached.json', '{"v":1}');

    const descriptor: AssetDescriptor = {
      path: 'cached.json',
      priority: AssetPriority.VISIBLE,
      type: 'json',
    };

    const result1 = await loader.loadAsset(descriptor);
    const result2 = await loader.loadAsset(descriptor);
    expect(result1).toBe(result2);
  });

  test('loadAsset with hash validates cache', async () => {
    const loader = new AssetLoader();
    await loader.init();

    await loader.cacheManager.set('hashed.json', '{"v":2}', 'correct-hash');

    const descriptor: AssetDescriptor = {
      path: 'hashed.json',
      hash: 'correct-hash',
      priority: AssetPriority.VISIBLE,
      type: 'json',
    };

    const result = await loader.loadAsset(descriptor);
    expect(result).toBe('{"v":2}');
  });
});

describe('AssetLoader — convenience loaders', () => {
  test('loadShader loads from cache', async () => {
    const loader = new AssetLoader();
    await loader.init();

    await loader.cacheManager.set('dendrite.glsl', 'uniform float time;');
    const shader = await loader.loadShader('dendrite.glsl');
    expect(shader).toBe('uniform float time;');
  });

  test('loadTopology parses JSON', async () => {
    const loader = new AssetLoader();
    await loader.init();

    const topology = {
      version: '1.0',
      files: [{ path: '/src/main.ts', name: 'main.ts', type: 'file' }],
      commits: [],
      tree: { name: 'root', path: '/', type: 'directory' },
    };
    await loader.cacheManager.set('topology.json', JSON.stringify(topology));

    const result = await loader.loadTopology('topology.json');
    expect(result.version).toBe('1.0');
  });

  test('loadPalette parses JSON', async () => {
    const loader = new AssetLoader();
    await loader.init();

    const palette = {
      primary: '#1a1a2e',
      secondary: '#16213e',
      accent: '#0f3460',
      background: '#0a0a1a',
      glow: '#e94560',
      mood: 'cool',
    };
    await loader.cacheManager.set('palette.json', JSON.stringify(palette));

    const result = await loader.loadPalette('palette.json');
    expect(result.primary).toBe('#1a1a2e');
    expect(result.mood).toBe('cool');
  });

  test('loadMesh validates version', async () => {
    const loader = new AssetLoader();
    await loader.init();

    // Valid mesh
    const mesh = { version: 1, id: 'mesh-1', vertices: [], normals: [], indices: [] };
    await loader.cacheManager.set('good.mesh.json', JSON.stringify(mesh));
    const result = await loader.loadMesh('good.mesh.json');
    expect(result).not.toBeNull();
    expect(result!.version).toBe(1);

    // Invalid version
    const badMesh = { version: 2, id: 'bad' };
    await loader.cacheManager.set('bad.mesh.json', JSON.stringify(badMesh));
    const badResult = await loader.loadMesh('bad.mesh.json');
    expect(badResult).toBeNull();
  });

  test('loadMesh returns null on parse failure', async () => {
    const loader = new AssetLoader();
    await loader.init();

    // loadMesh for a path that doesn't exist in cache and can't be fetched
    const result = await loader.loadMesh('nonexistent-mesh.json');
    expect(result).toBeNull();
  });
});

describe('AssetLoader — preload', () => {
  test('preload loads multiple paths from cache', async () => {
    const loader = new AssetLoader();
    await loader.init();

    await loader.cacheManager.set('a.glsl', 'shader a');
    await loader.cacheManager.set('b.glsl', 'shader b');

    await loader.preload(['a.glsl', 'b.glsl']);

    expect(loader.getLoaded('a.glsl')).toBe('shader a');
    expect(loader.getLoaded('b.glsl')).toBe('shader b');
  });
});

describe('AssetLoader — cacheManager accessor', () => {
  test('cacheManager provides underlying cache', async () => {
    const loader = new AssetLoader();
    await loader.init();

    expect(loader.cacheManager).toBeDefined();
    await loader.cacheManager.set('direct.txt', 'via accessor');
    expect(await loader.cacheManager.has('direct.txt')).toBe(true);
  });
});

describe('AssetPriority enum', () => {
  test('priority values are ordered', () => {
    expect(AssetPriority.CRITICAL).toBe(0);
    expect(AssetPriority.VISIBLE).toBe(1);
    expect(AssetPriority.BACKGROUND).toBe(2);
    expect(AssetPriority.OPTIONAL).toBe(3);
  });
});
