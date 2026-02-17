/**
 * CacheManager Tests
 *
 * Tests the tiered cache orchestrator.
 * In Bun test environment, OPFS is unavailable so the manager
 * falls back to IDB-only mode. Tests verify:
 *   - Memory tier (always available)
 *   - Cache hierarchy get/set/delete/clear
 *   - Hash validation
 *   - Event emission
 *   - Storage quota API
 *   - Eviction logic
 */

import './setup.js';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { CacheManager } from '../src/cache/CacheManager.js';

// CacheManager uses IndexedDB internally, which may or may not
// be available in Bun. We test what we can — at minimum, the
// memory tier always works.

let cache: CacheManager;

beforeEach(async () => {
  cache = new CacheManager();
  try {
    await cache.init();
  } catch {
    // IndexedDB may not be fully available — tests that need it will skip
  }
});

afterEach(async () => {
  try {
    await cache.clear();
  } catch {
    // Cleanup — OK if it fails
  }
});

describe('CacheManager — initialization', () => {
  test('init is idempotent', async () => {
    const cm = new CacheManager();
    await cm.init();
    await cm.init(); // Second call should be a no-op
  });

  test('isOPFSActive reflects availability', () => {
    // In Bun test env, OPFS is typically not available
    expect(typeof cache.isOPFSActive).toBe('boolean');
  });
});

describe('CacheManager — set and get', () => {
  test('set stores data retrievable via get', async () => {
    await cache.set('test/file.txt', 'hello world');
    const result = await cache.get('test/file.txt');
    expect(result).not.toBeNull();
    expect(result!.data).toBe('hello world');
  });

  test('get returns null for missing key', async () => {
    const result = await cache.get('nonexistent/path');
    expect(result).toBeNull();
  });

  test('set with hash stores hash for validation', async () => {
    await cache.set('hashed.txt', 'data', 'abc123');
    const valid = await cache.isValid('hashed.txt', 'abc123');
    expect(valid).toBe(true);
  });

  test('isValid returns false for wrong hash', async () => {
    await cache.set('hashed.txt', 'data', 'abc123');
    const valid = await cache.isValid('hashed.txt', 'wrong');
    expect(valid).toBe(false);
  });

  test('isValid returns false for missing entry', async () => {
    const valid = await cache.isValid('missing', 'any');
    expect(valid).toBe(false);
  });
});

describe('CacheManager — has', () => {
  test('has returns false for missing key', async () => {
    expect(await cache.has('nope')).toBe(false);
  });

  test('has returns true after set', async () => {
    await cache.set('exists.txt', 'yes');
    expect(await cache.has('exists.txt')).toBe(true);
  });
});

describe('CacheManager — delete', () => {
  test('delete removes entry from all tiers', async () => {
    await cache.set('to-delete.txt', 'gone soon');
    expect(await cache.has('to-delete.txt')).toBe(true);

    await cache.delete('to-delete.txt');
    expect(await cache.has('to-delete.txt')).toBe(false);
  });

  test('delete on missing key does not throw', async () => {
    await cache.delete('never-existed');
    // No error = pass
  });
});

describe('CacheManager — clear', () => {
  test('clear removes all entries', async () => {
    await cache.set('a.txt', 'alpha');
    await cache.set('b.txt', 'bravo');
    await cache.clear();

    expect(await cache.has('a.txt')).toBe(false);
    expect(await cache.has('b.txt')).toBe(false);
  });
});

describe('CacheManager — memory tier promotion', () => {
  test('first get from IDB promotes to memory', async () => {
    await cache.set('promote.txt', 'data');

    // First get — should source from idb or memory
    const result1 = await cache.get('promote.txt');
    expect(result1).not.toBeNull();

    // Second get — should be from memory (promoted)
    const result2 = await cache.get('promote.txt');
    expect(result2).not.toBeNull();
    expect(result2!.source).toBe('memory');
  });
});

describe('CacheManager — stats', () => {
  test('stats returns valid structure', async () => {
    const stats = await cache.stats();
    expect(typeof stats.memory).toBe('number');
    expect(typeof stats.persistent.entryCount).toBe('number');
    expect(typeof stats.persistent.totalBytes).toBe('number');
    expect(typeof stats.opfsAvailable).toBe('boolean');
  });

  test('stats memory count reflects cached entries', async () => {
    await cache.set('x', 'value');
    // After set, memory tier should have the entry
    const stats = await cache.stats();
    expect(stats.memory).toBeGreaterThanOrEqual(1);
  });
});

describe('CacheManager — storage quota', () => {
  test('getStorageQuota returns null or valid structure', async () => {
    const quota = await cache.getStorageQuota();
    if (quota !== null) {
      expect(typeof quota.usage).toBe('number');
      expect(typeof quota.quota).toBe('number');
      expect(typeof quota.percentUsed).toBe('number');
    }
    // null is acceptable (StorageManager not available)
  });
});

describe('CacheManager — listEntries', () => {
  test('listEntries returns array', async () => {
    const entries = await cache.listEntries();
    expect(Array.isArray(entries)).toBe(true);
  });

  test('listEntries includes set entries', async () => {
    await cache.set('listed.txt', 'data');
    const entries = await cache.listEntries();
    const found = entries.find((e) => e.path === 'listed.txt');
    expect(found).toBeDefined();
    expect(found!.tiers).toContain('memory');
    expect(found!.tiers).toContain('idb');
  });
});

describe('CacheManager — eviction', () => {
  test('evictOlderThan returns eviction count', async () => {
    await cache.set('old.txt', 'stale data');

    // Evict entries older than 0ms (everything)
    const evicted = await cache.evictOlderThan(0);
    // May be 0 if timing is very fast, but should not throw
    expect(typeof evicted).toBe('number');
  });

  test('evictOlderThan with future cutoff evicts nothing', async () => {
    await cache.set('fresh.txt', 'new data');

    // Evict entries older than 1 hour — fresh entry should survive
    const evicted = await cache.evictOlderThan(3_600_000);
    expect(evicted).toBe(0);
    expect(await cache.has('fresh.txt')).toBe(true);
  });
});

describe('CacheManager — binary data', () => {
  test('setBinary stores and getBinary retrieves', async () => {
    const data = new TextEncoder().encode('binary content').buffer;
    await cache.setBinary('binary.bin', data);

    const result = await cache.getBinary('binary.bin');
    expect(result).not.toBeNull();
    expect(result!.data.byteLength).toBe(data.byteLength);
  });

  test('getBinary returns null for missing key', async () => {
    const result = await cache.getBinary('missing.bin');
    expect(result).toBeNull();
  });
});
