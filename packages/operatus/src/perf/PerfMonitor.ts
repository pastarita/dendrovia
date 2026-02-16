/**
 * Performance Monitor
 *
 * Lightweight instrumentation for OPERATUS operations:
 *   - Asset loading times via performance.mark()/measure()
 *   - Cache hit/miss ratios
 *   - Storage usage tracking
 *   - Per-asset timing breakdown
 *
 * No-ops gracefully when Performance API is unavailable.
 * Zero external dependencies.
 */

export interface PerfMetric {
  name: string;
  startTime: number;
  duration: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
}

export interface LoadingReport {
  /** Total time from init start to ASSETS_LOADED */
  totalLoadTime: number;
  /** Cache hit/miss breakdown */
  cache: CacheMetrics;
  /** Per-asset timing */
  assets: PerfMetric[];
  /** Storage usage in bytes */
  storageUsage: number | null;
  /** OPFS available */
  opfsAvailable: boolean;
  /** Number of assets loaded */
  assetCount: number;
  /** Manifest health report (null if no manifest loaded) */
  manifestHealth: import('../manifest/ManifestHealth.js').ManifestHealthReport | null;
}

const hasPerformance = typeof performance !== 'undefined' && typeof performance.mark === 'function';

export class PerfMonitor {
  private cacheHits = 0;
  private cacheMisses = 0;
  private assetTimings: PerfMetric[] = [];
  private marks = new Map<string, number>();
  private enabled: boolean;

  constructor(enabled = true) {
    this.enabled = enabled && hasPerformance;
  }

  // ── Marks & Measures ───────────────────────────────────────────

  /**
   * Mark the start of an operation.
   */
  mark(label: string): void {
    if (!this.enabled) return;

    const markName = `operatus:${label}`;
    performance.mark(markName);
    this.marks.set(label, performance.now());
  }

  /**
   * Mark the end of an operation and record the duration.
   * Returns the duration in milliseconds.
   */
  measure(label: string): number {
    if (!this.enabled) return 0;

    const startMark = `operatus:${label}`;
    const endMark = `operatus:${label}:end`;

    performance.mark(endMark);

    try {
      const measure = performance.measure(`operatus:${label}:duration`, startMark, endMark);
      const duration = measure.duration;

      this.assetTimings.push({
        name: label,
        startTime: measure.startTime,
        duration,
      });

      return duration;
    } catch {
      // Marks not found — fall back to manual timing
      const start = this.marks.get(label);
      if (start !== undefined) {
        const duration = performance.now() - start;
        this.assetTimings.push({
          name: label,
          startTime: start,
          duration,
        });
        return duration;
      }
      return 0;
    }
  }

  // ── Cache Tracking ─────────────────────────────────────────────

  /** Record a cache hit */
  cacheHit(): void {
    this.cacheHits++;
  }

  /** Record a cache miss */
  cacheMiss(): void {
    this.cacheMisses++;
  }

  /** Get cache hit/miss metrics */
  getCacheMetrics(): CacheMetrics {
    const total = this.cacheHits + this.cacheMisses;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
    };
  }

  // ── Asset Timing ───────────────────────────────────────────────

  /**
   * Time an async operation and record it.
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.mark(label);
    try {
      const result = await fn();
      this.measure(label);
      return result;
    } catch (err) {
      this.measure(label);
      throw err;
    }
  }

  /**
   * Get all recorded asset timings, sorted by duration (slowest first).
   */
  getAssetTimings(): PerfMetric[] {
    return [...this.assetTimings].sort((a, b) => b.duration - a.duration);
  }

  // ── Storage Metrics ────────────────────────────────────────────

  /**
   * Query current storage usage via StorageManager API.
   */
  async getStorageUsage(): Promise<number | null> {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
      return null;
    }

    const estimate = await navigator.storage.estimate();
    return estimate.usage ?? null;
  }

  // ── Reporting ──────────────────────────────────────────────────

  /**
   * Generate a complete loading performance report.
   */
  async generateReport(
    opfsAvailable: boolean,
    manifestHealth?: import('../manifest/ManifestHealth.js').ManifestHealthReport | null,
  ): Promise<LoadingReport> {
    const timings = this.getAssetTimings();
    const initTiming = timings.find((t) => t.name === 'init');

    return {
      totalLoadTime: initTiming?.duration ?? 0,
      cache: this.getCacheMetrics(),
      assets: timings,
      storageUsage: await this.getStorageUsage(),
      opfsAvailable,
      assetCount: timings.filter((t) => t.name.startsWith('asset:')).length,
      manifestHealth: manifestHealth ?? null,
    };
  }

  /**
   * Log a human-readable performance summary to console.
   */
  async logReport(opfsAvailable: boolean): Promise<void> {
    const report = await this.generateReport(opfsAvailable);

    console.group('[OPERATUS] Performance Report');
    console.log(`Total load time: ${report.totalLoadTime.toFixed(1)}ms`);
    console.log(`Cache: ${report.cache.hits} hits / ${report.cache.misses} misses (${(report.cache.hitRate * 100).toFixed(1)}% hit rate)`);
    console.log(`OPFS: ${report.opfsAvailable ? 'active' : 'fallback to IDB'}`);

    if (report.storageUsage !== null) {
      const kb = (report.storageUsage / 1024).toFixed(1);
      console.log(`Storage: ${kb} KB used`);
    }

    if (report.assets.length > 0) {
      console.group('Asset timing (slowest first)');
      for (const asset of report.assets.slice(0, 10)) {
        console.log(`${asset.name}: ${asset.duration.toFixed(1)}ms`);
      }
      if (report.assets.length > 10) {
        console.log(`... and ${report.assets.length - 10} more`);
      }
      console.groupEnd();
    }

    console.groupEnd();
  }

  // ── Reset ──────────────────────────────────────────────────────

  /** Clear all recorded metrics. */
  reset(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.assetTimings = [];
    this.marks.clear();

    if (this.enabled) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

/** Global singleton */
let globalMonitor: PerfMonitor | null = null;

export function getPerfMonitor(enabled = true): PerfMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerfMonitor(enabled);
  }
  return globalMonitor;
}
