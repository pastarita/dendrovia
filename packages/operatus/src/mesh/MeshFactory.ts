/**
 * MeshFactory — Runtime mesh generation with tiered cache integration.
 *
 * Generates mushroom meshes on-demand in the browser using IMAGINARIUM's
 * pure-math pipeline, then caches the binary result in OPERATUS's
 * tiered cache (OPFS + IndexedDB). Eliminates pre-baked mesh files.
 *
 * Key behaviors:
 * - Cache key format: mesh/v{version}/{specimenId}-{part}
 * - In-flight deduplication: concurrent requests for the same specimen
 *   share a single generation promise
 * - Batch yielding: generateBatch yields to the main thread every N
 *   specimens to avoid janking the UI
 * - Pipeline versioning: bumping MESH_PIPELINE_VERSION invalidates cache
 */

import type { FungalSpecimen } from '@dendrovia/shared';
import type { FlatMeshData } from '@dendrovia/imaginarium/mesh-runtime';
import {
  applyPipelineToCylinder,
  applyPipelineToProfile,
  generateMeshData,
  genusPipeline,
  STEM_PIPELINE,
} from '@dendrovia/imaginarium/mesh-runtime';
import type { CacheManager } from '../cache/CacheManager';
import { decodeMesh, encodeMesh } from './serialization';

/** Bump this when the mesh pipeline changes to invalidate all cached meshes. */
export const MESH_PIPELINE_VERSION = 1;

export interface MeshResult {
  cap: FlatMeshData;
  stem: FlatMeshData;
  fromCache: boolean;
}

export interface MeshFactoryStats {
  generated: number;
  cacheHits: number;
  cacheMisses: number;
  totalTimeMs: number;
}

export interface BatchOpts {
  /** Yield to main thread every N specimens (default: 5) */
  yieldEvery?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

export class MeshFactory {
  private cache: CacheManager;
  private version: number;
  private inflight = new Map<string, Promise<MeshResult>>();
  private stats: MeshFactoryStats = {
    generated: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalTimeMs: 0,
  };

  constructor(cache: CacheManager, pipelineVersion?: number) {
    this.cache = cache;
    this.version = pipelineVersion ?? MESH_PIPELINE_VERSION;
  }

  /**
   * Generate or retrieve cached mesh for a specimen.
   * Concurrent calls for the same specimen share a single generation promise.
   */
  async getMesh(specimen: FungalSpecimen): Promise<MeshResult> {
    const id = specimen.id;

    // In-flight deduplication
    const existing = this.inflight.get(id);
    if (existing) return existing;

    const promise = this.generateOrRetrieve(specimen);
    this.inflight.set(id, promise);

    try {
      return await promise;
    } finally {
      this.inflight.delete(id);
    }
  }

  /**
   * Batch generate meshes, yielding to main thread between specimens.
   */
  async generateBatch(specimens: FungalSpecimen[], opts?: BatchOpts): Promise<MeshResult[]> {
    const yieldEvery = opts?.yieldEvery ?? 5;
    const signal = opts?.signal;
    const results: MeshResult[] = [];

    for (let i = 0; i < specimens.length; i++) {
      if (signal?.aborted) break;

      results.push(await this.getMesh(specimens[i]!));

      // Yield to main thread periodically
      if ((i + 1) % yieldEvery === 0 && i + 1 < specimens.length) {
        await yieldToMain();
      }
    }

    return results;
  }

  /**
   * Warm cache for visible specimens using requestIdleCallback.
   */
  warmVisible(specimens: FungalSpecimen[]): void {
    let idx = 0;

    const warmNext = () => {
      if (idx >= specimens.length) return;

      const specimen = specimens[idx++]!;
      this.getMesh(specimen).then(() => {
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => warmNext());
        } else {
          setTimeout(warmNext, 0);
        }
      });
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => warmNext());
    } else {
      setTimeout(warmNext, 0);
    }
  }

  /**
   * Invalidate all cached meshes (e.g., after pipeline version bump).
   * Returns the number of entries deleted.
   */
  async invalidateAll(): Promise<number> {
    const entries = await this.cache.listEntries();
    const meshPrefix = `mesh/v${this.version}/`;
    const meshEntries = entries.filter((e) => e.path.startsWith(meshPrefix));

    let deleted = 0;
    for (const entry of meshEntries) {
      await this.cache.delete(entry.path);
      deleted++;
    }

    return deleted;
  }

  /** Get generation stats. */
  getStats(): MeshFactoryStats {
    return { ...this.stats };
  }

  // ── Private ────────────────────────────────────────────────────

  private cacheKey(specimenId: string, part: 'cap' | 'stem'): string {
    return `mesh/v${this.version}/${specimenId}-${part}`;
  }

  private async generateOrRetrieve(specimen: FungalSpecimen): Promise<MeshResult> {
    const startTime = performance.now();
    const capKey = this.cacheKey(specimen.id, 'cap');
    const stemKey = this.cacheKey(specimen.id, 'stem');

    // Try cache
    const [cachedCap, cachedStem] = await Promise.all([
      this.cache.getBinary(capKey),
      this.cache.getBinary(stemKey),
    ]);

    if (cachedCap && cachedStem) {
      const cap = decodeMesh(cachedCap.data, this.version);
      const stem = decodeMesh(cachedStem.data, this.version);

      if (cap && stem) {
        this.stats.cacheHits++;
        this.stats.totalTimeMs += performance.now() - startTime;
        return { cap, stem, fromCache: true };
      }
      // Decode failed (version mismatch or corruption) — regenerate
    }

    // Cache miss — generate
    this.stats.cacheMisses++;

    // Cast: shared FungalSpecimen uses `string` for taxonomy fields,
    // IMAGINARIUM's local type uses union types — structurally compatible.
    const meshData = generateMeshData(specimen as any);
    const capPipeline = genusPipeline(specimen.taxonomy.genus);
    const cap = applyPipelineToProfile(meshData.cap, capPipeline);
    const stem = applyPipelineToCylinder(meshData.stem, STEM_PIPELINE);

    // Cache the results
    const capBuffer = encodeMesh(cap, this.version);
    const stemBuffer = encodeMesh(stem, this.version);

    await Promise.all([
      this.cache.setBinary(capKey, capBuffer),
      this.cache.setBinary(stemKey, stemBuffer),
    ]);

    this.stats.generated++;
    this.stats.totalTimeMs += performance.now() - startTime;

    return { cap, stem, fromCache: false };
  }
}

/** Yield to the main thread via setTimeout(0). */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
