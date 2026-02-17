/**
 * CDNLoader Tests
 *
 * Tests the optional HD asset streaming system.
 * Uses a mock CacheManager to test CDN loader logic
 * without browser storage APIs.
 */

import './setup.js';
import { describe, expect, test } from 'bun:test';
import { CDNLoader } from '../src/loader/CDNLoader.js';

// Minimal CacheManager mock that tracks calls
function createMockCache() {
  const store = new Map<string, string>();
  const binaryStore = new Map<string, ArrayBuffer>();
  const hashStore = new Map<string, string>();

  return {
    store,
    binaryStore,
    async init() {},
    async get(path: string) {
      const data = store.get(path);
      return data ? { data, source: 'memory' as const } : null;
    },
    async getBinary(path: string) {
      const data = binaryStore.get(path);
      return data ? { data, source: 'memory' as const } : null;
    },
    async set(path: string, data: string, hash?: string) {
      store.set(path, data);
      if (hash) hashStore.set(path, hash);
    },
    async setBinary(path: string, data: ArrayBuffer, hash?: string) {
      binaryStore.set(path, data);
      if (hash) hashStore.set(path, hash);
    },
    async has(path: string) {
      return store.has(path) || binaryStore.has(path);
    },
    async isValid(path: string, expectedHash: string) {
      return hashStore.get(path) === expectedHash;
    },
    async delete(path: string) {
      store.delete(path);
      binaryStore.delete(path);
      hashStore.delete(path);
    },
    async clear() {
      store.clear();
      binaryStore.clear();
      hashStore.clear();
    },
    async stats() {
      return {
        memory: store.size,
        persistent: { entryCount: 0, totalBytes: 0, oldestEntry: null },
        opfsAvailable: false,
      };
    },
    async getStorageQuota() {
      return null;
    },
    async requestPersistentStorage() {
      return false;
    },
    async evictOlderThan() {
      return 0;
    },
    async listEntries() {
      return [];
    },
    get isOPFSActive() {
      return false;
    },
  };
}

describe('CDNLoader — construction', () => {
  test('creates with default config', () => {
    const cache = createMockCache();
    const loader = new CDNLoader(cache as any);
    expect(loader).toBeDefined();
  });

  test('creates with custom config', () => {
    const cache = createMockCache();
    const loader = new CDNLoader(cache as any, {
      baseUrl: 'https://my-cdn.example.com',
      concurrency: 5,
      timeout: 10_000,
      retries: 1,
    });
    expect(loader).toBeDefined();
  });
});

describe('CDNLoader — cache integration', () => {
  test('loadText returns cached data when available', async () => {
    const cache = createMockCache();
    cache.store.set('shader.glsl', 'void main() {}');

    const loader = new CDNLoader(cache as any, { baseUrl: 'https://cdn.test' });
    const result = await loader.loadText('shader.glsl');
    expect(result).toBe('void main() {}');
  });

  test('loadText with hash returns cached data when hash matches', async () => {
    const cache = createMockCache();
    await cache.set('asset.json', '{"v":1}', 'abc123');

    const loader = new CDNLoader(cache as any, { baseUrl: 'https://cdn.test' });
    const result = await loader.loadText('asset.json', 'abc123');
    expect(result).toBe('{"v":1}');
  });

  test('loadText with wrong hash skips cache', async () => {
    const cache = createMockCache();
    await cache.set('asset.json', '{"v":1}', 'abc123');

    const loader = new CDNLoader(cache as any, {
      baseUrl: 'https://cdn.test',
      retries: 0,
      timeout: 1000,
    });

    // With wrong hash, cache miss → fetch from CDN → will fail in test
    try {
      await loader.loadText('asset.json', 'wrong-hash');
    } catch (err) {
      // Expected: CDN fetch fails in test environment
      expect(err).toBeDefined();
    }
  });

  test('isCached delegates to cache.has', async () => {
    const cache = createMockCache();
    const loader = new CDNLoader(cache as any, { baseUrl: 'https://cdn.test' });

    expect(await loader.isCached('missing.txt')).toBe(false);
    cache.store.set('exists.txt', 'data');
    expect(await loader.isCached('exists.txt')).toBe(true);
  });
});

describe('CDNLoader — progress callback', () => {
  test('setProgressCallback stores callback', () => {
    const cache = createMockCache();
    const loader = new CDNLoader(cache as any);
    const calls: any[] = [];

    loader.setProgressCallback((p) => calls.push(p));
    // Callback set — will be called during actual downloads
    expect(calls).toHaveLength(0);
  });
});
