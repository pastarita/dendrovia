/**
 * IndexedDB Cache (Fallback)
 *
 * Lightweight IndexedDB wrapper for persistent caching when OPFS
 * is unavailable. Uses the raw IndexedDB API (no external deps)
 * to keep the bundle small.
 *
 * Same interface as OPFSCache for seamless fallback.
 */

import type { CacheEntry, CacheStats } from './OPFSCache.js';

const DB_NAME = 'dendrovia-cache';
const STORE_NAME = 'assets';
const DB_VERSION = 1;

interface IDBEntry {
  path: string;
  data: string | ArrayBuffer;
  cachedAt: string;
  hash?: string;
  size: number;
}

export class IDBCache {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'path' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async ensureInit(): Promise<void> {
    if (!this.db) await this.init();
  }

  private tx(mode: IDBTransactionMode): IDBObjectStore {
    const tx = this.db!.transaction(STORE_NAME, mode);
    return tx.objectStore(STORE_NAME);
  }

  private request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Write data to IndexedDB cache
   */
  async write(path: string, data: string | ArrayBuffer, hash?: string): Promise<void> {
    await this.ensureInit();

    const size = typeof data === 'string' ? new Blob([data]).size : data.byteLength;
    const entry: IDBEntry = {
      path,
      data,
      cachedAt: new Date().toISOString(),
      hash,
      size,
    };

    await this.request(this.tx('readwrite').put(entry));
  }

  /**
   * Read string data from IndexedDB cache
   */
  async read(path: string): Promise<string | null> {
    await this.ensureInit();

    const entry = await this.request<IDBEntry | undefined>(this.tx('readonly').get(path));
    if (!entry) return null;

    if (typeof entry.data === 'string') return entry.data;
    return new TextDecoder().decode(entry.data);
  }

  /**
   * Read binary data from IndexedDB cache
   */
  async readBinary(path: string): Promise<ArrayBuffer | null> {
    await this.ensureInit();

    const entry = await this.request<IDBEntry | undefined>(this.tx('readonly').get(path));
    if (!entry) return null;

    if (entry.data instanceof ArrayBuffer) return entry.data;
    return new TextEncoder().encode(entry.data as string).buffer;
  }

  /**
   * Check if a path exists in cache
   */
  async exists(path: string): Promise<boolean> {
    await this.ensureInit();

    const count = await this.request(this.tx('readonly').count(IDBKeyRange.only(path)));
    return count > 0;
  }

  /**
   * Get metadata for a cached entry
   */
  async getMeta(path: string): Promise<Omit<CacheEntry, 'data'> | null> {
    await this.ensureInit();

    const entry = await this.request<IDBEntry | undefined>(this.tx('readonly').get(path));
    if (!entry) return null;

    return {
      cachedAt: entry.cachedAt,
      hash: entry.hash,
      size: entry.size,
    };
  }

  /**
   * Check if a cached entry matches the expected hash
   */
  async isValid(path: string, expectedHash: string): Promise<boolean> {
    const meta = await this.getMeta(path);
    if (!meta) return false;
    return meta.hash === expectedHash;
  }

  /**
   * Delete a cached entry
   */
  async delete(path: string): Promise<void> {
    await this.ensureInit();
    await this.request(this.tx('readwrite').delete(path));
  }

  /**
   * List all cached entry paths
   */
  async list(): Promise<string[]> {
    await this.ensureInit();
    return this.request(this.tx('readonly').getAllKeys() as IDBRequest<string[]>);
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<CacheStats> {
    await this.ensureInit();

    const entries = await this.request<IDBEntry[]>(this.tx('readonly').getAll());

    let totalBytes = 0;
    let oldestEntry: string | null = null;
    let oldestTime = Infinity;

    for (const entry of entries) {
      totalBytes += entry.size;
      const time = new Date(entry.cachedAt).getTime();
      if (time < oldestTime) {
        oldestTime = time;
        oldestEntry = entry.cachedAt;
      }
    }

    return {
      entryCount: entries.length,
      totalBytes,
      oldestEntry,
    };
  }

  /**
   * Clear all cached entries
   */
  async clear(): Promise<void> {
    await this.ensureInit();
    await this.request(this.tx('readwrite').clear());
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db?.close();
    this.db = null;
  }
}
