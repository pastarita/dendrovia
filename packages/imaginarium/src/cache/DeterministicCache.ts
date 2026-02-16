/**
 * Deterministic file-backed cache.
 * Ensures same input -> same output across runs.
 */

import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { hashObject, hashString } from '../utils/hash';

interface CacheEntry<T> {
  inputHash: string;
  timestamp: number;
  version: string;
  data: T;
}

const CACHE_VERSION = '1.0.0';

export class DeterministicCache {
  private cacheDir: string;
  private memoryCache = new Map<string, CacheEntry<unknown>>();

  constructor(baseDir: string) {
    this.cacheDir = join(baseDir, '.cache');
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private keyFor(input: unknown): string {
    if (typeof input === 'string') return hashString(input);
    return hashObject(input);
  }

  private filePath(key: string): string {
    return join(this.cacheDir, `${key}.json`);
  }

  async get<T>(input: unknown): Promise<T | null> {
    const key = this.keyFor(input);

    // Check memory first
    if (this.memoryCache.has(key)) {
      return (this.memoryCache.get(key) as CacheEntry<T>).data;
    }

    // Check disk
    const path = this.filePath(key);
    if (existsSync(path)) {
      try {
        const raw = await Bun.file(path).text();
        const entry = JSON.parse(raw) as CacheEntry<T>;
        if (entry.version === CACHE_VERSION) {
          this.memoryCache.set(key, entry);
          return entry.data;
        }
      } catch {
        // Corrupted cache entry — ignore
      }
    }

    return null;
  }

  async set<T>(input: unknown, data: T): Promise<void> {
    const key = this.keyFor(input);
    const entry: CacheEntry<T> = {
      inputHash: key,
      timestamp: Date.now(),
      version: CACHE_VERSION,
      data,
    };

    this.memoryCache.set(key, entry);
    await Bun.write(this.filePath(key), JSON.stringify(entry, null, 2));
  }

  has(input: unknown): boolean {
    const key = this.keyFor(input);
    if (this.memoryCache.has(key)) return true;
    return existsSync(this.filePath(key));
  }

  invalidate(input: unknown): void {
    const key = this.keyFor(input);
    this.memoryCache.delete(key);
    const path = this.filePath(key);
    if (existsSync(path)) {
      rmSync(path);
    }
  }

  clear(): void {
    this.memoryCache.clear();
    if (existsSync(this.cacheDir)) {
      rmSync(this.cacheDir, { recursive: true });
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }
}
