/**
 * CDN Loader — Optional HD Asset Streaming
 *
 * Streams on-demand assets (textures, complex shaders, audio) from a
 * configurable CDN. Integrates with CacheManager for OPFS/IDB caching.
 *
 * This is for the "HD Pack" — assets that are NOT required for initial
 * gameplay but enhance visual fidelity. The steering heuristic:
 *
 *   "If an asset is >100KB and not critical for initial gameplay,
 *    it should be lazy-loaded or marked optional."
 *
 * All fetched assets are cached locally so repeat loads are instant.
 */

import type { CacheManager } from '../cache/CacheManager';

export interface CDNConfig {
  /** CDN base URL (no trailing slash) */
  baseUrl: string;
  /** Max concurrent downloads (default: 3) */
  concurrency?: number;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Retry failed downloads (default: 2) */
  retries?: number;
}

export interface DownloadProgress {
  path: string;
  loaded: number;
  total: number;
  percent: number;
}

type ProgressCallback = (progress: DownloadProgress) => void;

const DEFAULT_CONFIG: Required<CDNConfig> = {
  baseUrl: 'https://cdn.dendrovia.dev',
  concurrency: 3,
  timeout: 30_000,
  retries: 2,
};

export class CDNLoader {
  private config: Required<CDNConfig>;
  private cache: CacheManager;
  private activeDownloads = 0;
  private queue: Array<() => Promise<void>> = [];

  constructor(cache: CacheManager, config: Partial<CDNConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = cache;
  }

  /** Set a global progress callback for all downloads. */
  setProgressCallback(cb: ProgressCallback): void {
    this.onProgress = cb;
  }

  /**
   * Load an optional asset as a string (shader, JSON, SVG, etc.).
   * Returns from cache if available; fetches from CDN otherwise.
   */
  async loadText(path: string, hash?: string): Promise<string> {
    // Check cache (with hash validation if provided)
    if (hash) {
      const valid = await this.cache.isValid(path, hash);
      if (valid) {
        const cached = await this.cache.get(path);
        if (cached) return cached.data;
      }
    } else {
      const cached = await this.cache.get(path);
      if (cached) return cached.data;
    }

    // Fetch from CDN
    const data = await this.fetchWithRetry(path);
    const text = await data.text();

    // Cache for next time
    await this.cache.set(path, text, hash);

    return text;
  }

  /**
   * Load an optional asset as a Blob (textures, audio, binary).
   * Returns from cache if available; fetches from CDN otherwise.
   */
  async loadBlob(path: string, hash?: string): Promise<Blob> {
    // Check binary cache
    if (hash) {
      const valid = await this.cache.isValid(path, hash);
      if (valid) {
        const cached = await this.cache.getBinary(path);
        if (cached) return new Blob([cached.data]);
      }
    } else {
      const cached = await this.cache.getBinary(path);
      if (cached) return new Blob([cached.data]);
    }

    // Fetch from CDN
    const response = await this.fetchWithRetry(path);
    const blob = await response.blob();

    // Cache the binary data
    const buffer = await blob.arrayBuffer();
    await this.cache.setBinary(path, buffer, hash);

    return blob;
  }

  /**
   * Load a texture and return an object URL suitable for Three.js loaders.
   *
   * Usage with Three.js:
   * ```ts
   * const url = await cdnLoader.loadTextureURL('textures/bark-detail.webp');
   * const texture = new THREE.TextureLoader().load(url);
   * ```
   *
   * IMPORTANT: Call `URL.revokeObjectURL(url)` when the texture is no longer
   * needed to free memory.
   */
  async loadTextureURL(path: string, hash?: string): Promise<string> {
    const blob = await this.loadBlob(path, hash);
    return URL.createObjectURL(blob);
  }

  /**
   * Load an audio asset and return an object URL.
   */
  async loadAudioURL(path: string, hash?: string): Promise<string> {
    const blob = await this.loadBlob(path, hash);
    return URL.createObjectURL(blob);
  }

  /**
   * Prefetch a list of assets in the background with concurrency control.
   * Assets are cached but not returned — use loadText/loadBlob to access later.
   */
  async prefetch(paths: string[]): Promise<void> {
    const tasks = paths.map((path) => () => this.loadBlob(path).then(() => {}));

    await Promise.all(tasks.map((task) => this.enqueue(task)));
  }

  /**
   * Check if an asset is already cached (no network request).
   */
  async isCached(path: string): Promise<boolean> {
    return this.cache.has(path);
  }

  // ── Internal ────────────────────────────────────────────────────

  /**
   * Fetch with retry and timeout.
   */
  private async fetchWithRetry(path: string): Promise<Response> {
    const url = `${this.config.baseUrl}/${path}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`CDN fetch failed: ${response.status} ${response.statusText}`);
        }

        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < this.config.retries) {
          // Exponential backoff: 1s, 2s, 4s...
          const delay = 1000 * 2 ** attempt;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError ?? new Error(`Failed to fetch ${path} after ${this.config.retries} retries`);
  }

  /**
   * Enqueue a download with concurrency limiting.
   */
  private enqueue(task: () => Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const run = async () => {
        this.activeDownloads++;
        try {
          await task();
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          this.activeDownloads--;
          this.dequeue();
        }
      };

      if (this.activeDownloads < this.config.concurrency) {
        run();
      } else {
        this.queue.push(() => run());
      }
    });
  }

  private dequeue(): void {
    if (this.queue.length > 0 && this.activeDownloads < this.config.concurrency) {
      const next = this.queue.shift()!;
      next();
    }
  }
}
