import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { DeterministicCache } from '../src/cache/DeterministicCache';
import { join } from 'path';
import { rmSync, existsSync } from 'fs';

const TEST_CACHE_DIR = join(import.meta.dir, '.test-cache');

describe('DeterministicCache', () => {
  let cache: DeterministicCache;

  beforeEach(() => {
    cache = new DeterministicCache(TEST_CACHE_DIR);
  });

  afterEach(() => {
    if (existsSync(TEST_CACHE_DIR)) {
      rmSync(TEST_CACHE_DIR, { recursive: true });
    }
  });

  test('returns null for cache miss', async () => {
    const result = await cache.get('nonexistent');
    expect(result).toBeNull();
  });

  test('set and get round-trip', async () => {
    const data = { color: '#ff0000', mood: 'warm' };
    await cache.set('test-key', data);
    const result = await cache.get<typeof data>('test-key');
    expect(result).toEqual(data);
  });

  test('has returns true after set', async () => {
    await cache.set('exists', { value: 42 });
    expect(cache.has('exists')).toBe(true);
  });

  test('has returns false for missing', () => {
    expect(cache.has('missing')).toBe(false);
  });

  test('invalidate removes entry', async () => {
    await cache.set('to-delete', { value: 1 });
    expect(cache.has('to-delete')).toBe(true);
    cache.invalidate('to-delete');
    expect(cache.has('to-delete')).toBe(false);
    const result = await cache.get('to-delete');
    expect(result).toBeNull();
  });

  test('clear removes all entries', async () => {
    await cache.set('a', 1);
    await cache.set('b', 2);
    cache.clear();
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBeNull();
  });

  test('persists across instances', async () => {
    await cache.set('persistent', { saved: true });

    // New instance, same directory
    const cache2 = new DeterministicCache(TEST_CACHE_DIR);
    const result = await cache2.get<{ saved: boolean }>('persistent');
    expect(result).toEqual({ saved: true });
  });

  test('same input always produces same hash key', async () => {
    const input = { topology: 'test', seed: 42 };
    await cache.set(input, 'result1');

    const sameInput = { topology: 'test', seed: 42 };
    const result = await cache.get(sameInput);
    expect(result).toBe('result1');
  });
});
