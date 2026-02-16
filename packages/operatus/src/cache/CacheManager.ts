/**
 * Tiered Cache Manager
 *
 * Orchestrates a four-level cache hierarchy:
 *   1. Memory (Map) — instant, volatile
 *   2. OPFS — fast, persistent, browser-native FS
 *   3. IndexedDB — medium, persistent, universal fallback
 *   4. Network — slow, always-available origin
 *
 * On read, entries are promoted up the hierarchy (cache warming).
 * On write, entries populate all available tiers.
 *
 * Feature-detects OPFS and transparently falls back to IDB-only.
 */

import { OPFSCache, isOPFSSupported } from './OPFSCache.js';
import { IDBCache } from './IDBCache.js';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { CacheUpdatedEvent } from '@dendrovia/shared';
import type { CacheStats } from './OPFSCache.js';

export type CacheTier = 'memory' | 'opfs' | 'idb' | 'network';

export interface CacheResult<T = string> {
  data: T;
  /** Which tier served the data */
  source: CacheTier;
}

export interface StorageQuota {
  usage: number;
  quota: number;
  percentUsed: number;
}

export interface CacheEntryInfo {
  path: string;
  size: number;
  hash?: string;
  cachedAt: string;
  tiers: CacheTier[];
}

export class CacheManager {
  private memory = new Map<string, string>();
  private opfs: OPFSCache | null = null;
  private idb: IDBCache;
  private opfsAvailable = false;
  private initialized = false;

  constructor() {
    this.idb = new IDBCache();
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    // Feature-detect OPFS
    if (isOPFSSupported()) {
      try {
        this.opfs = new OPFSCache();
        await this.opfs.init();
        this.opfsAvailable = true;
      } catch {
        // OPFS init failed (e.g., non-secure context), fall back to IDB only
        this.opfs = null;
        this.opfsAvailable = false;
      }
    }

    await this.idb.init();
    this.initialized = true;
  }

  private async ensureInit(): Promise<void> {
    if (!this.initialized) await this.init();
  }

  /**
   * Get data from the cache hierarchy.
   * Checks tiers in order: memory → OPFS → IDB.
   * Promotes to faster tiers on cache hit.
   */
  async get(path: string): Promise<CacheResult | null> {
    await this.ensureInit();

    // Tier 1: Memory
    if (this.memory.has(path)) {
      return { data: this.memory.get(path)!, source: 'memory' };
    }

    // Tier 2: OPFS
    if (this.opfsAvailable && this.opfs) {
      const opfsData = await this.opfs.read(path);
      if (opfsData !== null) {
        // Promote to memory
        this.memory.set(path, opfsData);
        return { data: opfsData, source: 'opfs' };
      }
    }

    // Tier 3: IndexedDB
    const idbData = await this.idb.read(path);
    if (idbData !== null) {
      // Promote to memory and OPFS
      this.memory.set(path, idbData);
      if (this.opfsAvailable && this.opfs) {
        await this.opfs.write(path, idbData).catch(() => {});
      }
      return { data: idbData, source: 'idb' };
    }

    return null;
  }

  /**
   * Get binary data from cache.
   */
  async getBinary(path: string): Promise<(CacheResult<ArrayBuffer>) | null> {
    await this.ensureInit();

    // OPFS first (binary native)
    if (this.opfsAvailable && this.opfs) {
      const data = await this.opfs.readBinary(path);
      if (data !== null) {
        return { data, source: 'opfs' };
      }
    }

    // IDB fallback
    const data = await this.idb.readBinary(path);
    if (data !== null) {
      return { data, source: 'idb' };
    }

    return null;
  }

  /**
   * Store data in all available cache tiers.
   */
  async set(path: string, data: string, hash?: string): Promise<void> {
    await this.ensureInit();

    // Populate all tiers
    this.memory.set(path, data);

    const writes: Promise<void>[] = [
      this.idb.write(path, data, hash),
    ];

    if (this.opfsAvailable && this.opfs) {
      writes.push(this.opfs.write(path, data, hash));
    }

    await Promise.all(writes);

    this.emitCacheUpdated({ path, action: 'set', size: data.length });
  }

  /**
   * Store binary data in persistent tiers (not memory).
   */
  async setBinary(path: string, data: ArrayBuffer, hash?: string): Promise<void> {
    await this.ensureInit();

    const writes: Promise<void>[] = [
      this.idb.write(path, data, hash),
    ];

    if (this.opfsAvailable && this.opfs) {
      writes.push(this.opfs.write(path, data, hash));
    }

    await Promise.all(writes);

    this.emitCacheUpdated({ path, action: 'set', size: data.byteLength });
  }

  /**
   * Check if a path exists in any tier.
   */
  async has(path: string): Promise<boolean> {
    await this.ensureInit();

    if (this.memory.has(path)) return true;

    if (this.opfsAvailable && this.opfs) {
      if (await this.opfs.exists(path)) return true;
    }

    return this.idb.exists(path);
  }

  /**
   * Check if a cached entry is valid against an expected hash.
   * Returns false if not cached or hash mismatch.
   */
  async isValid(path: string, expectedHash: string): Promise<boolean> {
    await this.ensureInit();

    // Check OPFS meta first (faster)
    if (this.opfsAvailable && this.opfs) {
      const valid = await this.opfs.isValid(path, expectedHash);
      if (valid) return true;
    }

    return this.idb.isValid(path, expectedHash);
  }

  /**
   * Delete an entry from all tiers.
   */
  async delete(path: string): Promise<void> {
    await this.ensureInit();

    this.memory.delete(path);

    const deletes: Promise<void>[] = [this.idb.delete(path)];

    if (this.opfsAvailable && this.opfs) {
      deletes.push(this.opfs.delete(path));
    }

    await Promise.all(deletes);

    this.emitCacheUpdated({ path, action: 'delete' });
  }

  /**
   * Clear all cache tiers.
   */
  async clear(): Promise<void> {
    await this.ensureInit();

    this.memory.clear();

    const clears: Promise<void>[] = [this.idb.clear()];

    if (this.opfsAvailable && this.opfs) {
      clears.push(this.opfs.clear());
    }

    await Promise.all(clears);

    this.emitCacheUpdated({ path: '*', action: 'clear' });
  }

  /**
   * Get combined cache statistics.
   */
  async stats(): Promise<{ memory: number; persistent: CacheStats; opfsAvailable: boolean }> {
    await this.ensureInit();

    const persistentStats = this.opfsAvailable && this.opfs
      ? await this.opfs.stats()
      : await this.idb.stats();

    return {
      memory: this.memory.size,
      persistent: persistentStats,
      opfsAvailable: this.opfsAvailable,
    };
  }

  /**
   * Query storage quota via the StorageManager API.
   * Returns null if StorageManager is unavailable.
   */
  async getStorageQuota(): Promise<StorageQuota | null> {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
      return null;
    }

    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;

    return {
      usage,
      quota,
      percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
    };
  }

  /**
   * Request persistent storage (prevents browser eviction).
   * Returns true if granted.
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
      return false;
    }

    return navigator.storage.persist();
  }

  /**
   * Evict entries older than the given age (in milliseconds).
   * Useful for managing storage quota on mobile.
   */
  async evictOlderThan(maxAgeMs: number): Promise<number> {
    await this.ensureInit();

    const cutoff = Date.now() - maxAgeMs;
    let evicted = 0;

    // Get all entries from IDB (source of truth for listing)
    const paths = await this.idb.list();

    for (const path of paths) {
      const meta = await this.idb.getMeta(path);
      if (meta && new Date(meta.cachedAt).getTime() < cutoff) {
        await this.delete(path);
        evicted++;
      }
    }

    return evicted;
  }

  /**
   * List all cached entries with tier presence info.
   * Uses IDB as source of truth for the entry list.
   */
  async listEntries(): Promise<CacheEntryInfo[]> {
    await this.ensureInit();

    const paths = await this.idb.list();
    const entries: CacheEntryInfo[] = [];

    for (const path of paths) {
      const meta = await this.idb.getMeta(path);
      if (!meta) continue;

      const tiers: CacheTier[] = [];
      if (this.memory.has(path)) tiers.push('memory');
      if (this.opfsAvailable && this.opfs && await this.opfs.exists(path)) tiers.push('opfs');
      tiers.push('idb'); // present by definition (listed from IDB)

      entries.push({
        path,
        size: meta.size,
        hash: meta.hash,
        cachedAt: meta.cachedAt,
        tiers,
      });
    }

    return entries;
  }

  /** Whether OPFS is being used (vs IDB-only fallback) */
  get isOPFSActive(): boolean {
    return this.opfsAvailable;
  }

  // ── Private ─────────────────────────────────────────────────────

  /** Fire-and-forget CACHE_UPDATED event (non-blocking). */
  private emitCacheUpdated(data: CacheUpdatedEvent): void {
    getEventBus().emit(GameEvents.CACHE_UPDATED, data).catch(() => {});
  }
}
