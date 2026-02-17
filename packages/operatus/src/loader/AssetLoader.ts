/**
 * Asset Loader
 *
 * Manifest-driven asset loading with priority-based scheduling
 * and tiered cache integration.
 *
 * Loading priorities:
 *   0 = CRITICAL  — blocks rendering (core shaders, topology)
 *   1 = VISIBLE   — needed for loading screen completion
 *   2 = BACKGROUND — loaded during idle time
 *   3 = OPTIONAL  — on-demand (HD textures, audio)
 *
 * Integrates with CacheManager for transparent caching.
 * Emits GameEvents.ASSETS_LOADED when critical assets are ready.
 */

import type {
  AssetManifest,
  ProceduralPalette,
  CodeTopology,
  FungalSpecimen,
  SerializedMeshData,
} from '@dendrovia/shared';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import { validateManifest } from '@dendrovia/shared/schemas';
import { CacheManager } from '../cache/CacheManager';
import type { MeshFactory } from '../mesh/MeshFactory';

export enum AssetPriority {
  CRITICAL = 0,
  VISIBLE = 1,
  BACKGROUND = 2,
  OPTIONAL = 3,
}

export interface AssetDescriptor {
  path: string;
  hash?: string;
  priority: AssetPriority;
  type: 'shader' | 'palette' | 'topology' | 'texture' | 'json' | 'mesh';
  /** Size in bytes (from manifest, for progress tracking) */
  size?: number;
}

export interface LoadProgress {
  loaded: number;
  total: number;
  /** 0-1 */
  percent: number;
  currentAsset: string;
  phase: 'critical' | 'visible' | 'background' | 'complete';
}

type ProgressCallback = (progress: LoadProgress) => void;

export class AssetLoader {
  private cache: CacheManager;
  private manifest: AssetManifest | null = null;
  private basePath: string;
  private loadedAssets = new Map<string, string>();
  private onProgress: ProgressCallback | null = null;
  private meshFactory: MeshFactory | null = null;

  constructor(basePath = '/generated') {
    this.cache = new CacheManager();
    this.basePath = basePath;
  }

  /**
   * Initialize the loader: set up cache and load manifest.
   */
  async init(): Promise<void> {
    await this.cache.init();
  }

  /**
   * Set a progress callback for loading updates.
   */
  setProgressCallback(cb: ProgressCallback): void {
    this.onProgress = cb;
  }

  /**
   * Set the MeshFactory for runtime mesh generation fallback.
   * When set, loadMesh() will generate meshes on-demand if
   * pre-baked files are unavailable.
   */
  setMeshFactory(factory: MeshFactory): void {
    this.meshFactory = factory;
  }

  /**
   * Load and parse the asset manifest.
   * The manifest drives all subsequent asset loading.
   */
  async loadManifest(manifestPath = '/generated/manifest.json'): Promise<AssetManifest> {
    // Check cache first
    const cached = await this.cache.get('manifest.json');
    if (cached) {
      try {
        this.manifest = validateManifest(JSON.parse(cached.data)) as AssetManifest;
        return this.manifest;
      } catch {
        // Corrupted or invalid cache entry, fetch fresh
      }
    }

    const response = await fetch(manifestPath);
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    this.manifest = validateManifest(JSON.parse(text)) as AssetManifest;

    // Cache the manifest
    await this.cache.set('manifest.json', text, this.manifest.checksum);

    return this.manifest;
  }

  /**
   * Build asset descriptors from the manifest.
   */
  getAssetDescriptors(): AssetDescriptor[] {
    if (!this.manifest) {
      throw new Error('Manifest not loaded. Call loadManifest() first.');
    }

    const descriptors: AssetDescriptor[] = [];

    // Topology is critical
    if (this.manifest.topology) {
      descriptors.push({
        path: this.manifest.topology,
        priority: AssetPriority.CRITICAL,
        type: 'topology',
      });
    }

    // Shaders — critical tier
    for (const [id, filePath] of Object.entries(this.manifest.shaders ?? {})) {
      descriptors.push({
        path: filePath,
        priority: AssetPriority.CRITICAL,
        type: 'shader',
      });
    }

    // Palettes — visible tier
    for (const [id, filePath] of Object.entries(this.manifest.palettes ?? {})) {
      descriptors.push({
        path: filePath,
        priority: AssetPriority.VISIBLE,
        type: 'palette',
      });
    }

    // Meshes — visible tier
    for (const [id, entry] of Object.entries(this.manifest.meshes ?? {})) {
      descriptors.push({
        path: entry.path,
        hash: entry.hash,
        priority: AssetPriority.VISIBLE,
        type: 'mesh',
        size: entry.size,
      });
    }

    return descriptors;
  }

  /**
   * Load a single asset, using cache when valid.
   */
  async loadAsset(descriptor: AssetDescriptor): Promise<string> {
    const { path, hash } = descriptor;

    // Check if already loaded in this session
    if (this.loadedAssets.has(path)) {
      return this.loadedAssets.get(path)!;
    }

    // Check cache with hash validation
    if (hash) {
      const valid = await this.cache.isValid(path, hash);
      if (valid) {
        const cached = await this.cache.get(path);
        if (cached) {
          this.loadedAssets.set(path, cached.data);
          return cached.data;
        }
      }
    } else {
      // No hash — just check if cached
      const cached = await this.cache.get(path);
      if (cached) {
        this.loadedAssets.set(path, cached.data);
        return cached.data;
      }
    }

    // Fetch from network
    const url = path.startsWith('http') ? path : `${this.basePath}/${path}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load asset ${path}: ${response.status}`);
    }

    const data = await response.text();

    // Cache for next time
    await this.cache.set(path, data, hash);

    this.loadedAssets.set(path, data);
    return data;
  }

  /**
   * Load all assets by priority.
   * Critical assets are loaded first and block until complete.
   * Background assets are loaded during idle time.
   */
  async loadAll(descriptors?: AssetDescriptor[]): Promise<void> {
    const assets = descriptors ?? this.getAssetDescriptors();

    // Group by priority
    const groups = new Map<AssetPriority, AssetDescriptor[]>();
    for (const asset of assets) {
      const group = groups.get(asset.priority) ?? [];
      group.push(asset);
      groups.set(asset.priority, group);
    }

    const total = assets.length;
    let loaded = 0;

    // Phase 1: Critical (parallel, blocks)
    const critical = groups.get(AssetPriority.CRITICAL) ?? [];
    await this.loadGroup(critical, total, loaded, 'critical');
    loaded += critical.length;

    // Phase 2: Visible (parallel, blocks)
    const visible = groups.get(AssetPriority.VISIBLE) ?? [];
    await this.loadGroup(visible, total, loaded, 'visible');
    loaded += visible.length;

    // Emit ASSETS_LOADED — game can start rendering
    const eventBus = getEventBus();
    await eventBus.emit(GameEvents.ASSETS_LOADED, {
      assetCount: loaded,
      manifest: this.manifest,
    });

    // Phase 3: Background (use requestIdleCallback if available)
    const background = groups.get(AssetPriority.BACKGROUND) ?? [];
    if (background.length > 0) {
      this.loadInBackground(background, total, loaded);
    }
  }

  /**
   * Load a group of assets in parallel with progress reporting.
   */
  private async loadGroup(
    assets: AssetDescriptor[],
    total: number,
    startOffset: number,
    phase: LoadProgress['phase'],
  ): Promise<void> {
    let groupLoaded = 0;

    await Promise.all(
      assets.map(async (asset) => {
        await this.loadAsset(asset);
        groupLoaded++;

        if (this.onProgress) {
          this.onProgress({
            loaded: startOffset + groupLoaded,
            total,
            percent: (startOffset + groupLoaded) / total,
            currentAsset: asset.path,
            phase,
          });
        }
      }),
    );
  }

  /**
   * Load assets during idle time using requestIdleCallback.
   */
  private loadInBackground(
    assets: AssetDescriptor[],
    total: number,
    startOffset: number,
  ): void {
    let idx = 0;

    const loadNext = () => {
      if (idx >= assets.length) {
        if (this.onProgress) {
          this.onProgress({
            loaded: total,
            total,
            percent: 1,
            currentAsset: '',
            phase: 'complete',
          });
        }
        return;
      }

      const asset = assets[idx++]!;
      this.loadAsset(asset).then(() => {
        if (this.onProgress) {
          this.onProgress({
            loaded: startOffset + idx,
            total,
            percent: (startOffset + idx) / total,
            currentAsset: asset.path,
            phase: 'background',
          });
        }

        // Schedule next load during idle
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => loadNext());
        } else {
          setTimeout(loadNext, 0);
        }
      });
    };

    // Kick off background loading
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => loadNext());
    } else {
      setTimeout(loadNext, 0);
    }
  }

  // ── Typed convenience loaders ──────────────────────────────────

  /**
   * Load a GLSL shader by path.
   */
  async loadShader(path: string): Promise<string> {
    return this.loadAsset({
      path,
      priority: AssetPriority.CRITICAL,
      type: 'shader',
    });
  }

  /**
   * Load and parse the code topology.
   */
  async loadTopology(path?: string): Promise<CodeTopology> {
    const topologyPath = path ?? this.manifest?.topology ?? 'topology.json';
    const raw = await this.loadAsset({
      path: topologyPath,
      priority: AssetPriority.CRITICAL,
      type: 'topology',
    });
    return JSON.parse(raw) as CodeTopology;
  }

  /**
   * Load and parse a procedural palette.
   */
  async loadPalette(path: string): Promise<ProceduralPalette> {
    const raw = await this.loadAsset({
      path,
      priority: AssetPriority.VISIBLE,
      type: 'palette',
    });
    return JSON.parse(raw) as ProceduralPalette;
  }

  /**
   * Load and validate a serialized mesh asset.
   * If pre-baked mesh is unavailable and a MeshFactory + specimen are
   * provided, generates the mesh at runtime instead.
   * Returns null on failure (fallback-friendly).
   */
  async loadMesh(path: string, specimen?: FungalSpecimen): Promise<SerializedMeshData | null> {
    try {
      const raw = await this.loadAsset({
        path,
        priority: AssetPriority.VISIBLE,
        type: 'mesh',
      });
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1) return null;
      return parsed as SerializedMeshData;
    } catch {
      // Pre-baked mesh unavailable — try runtime generation
      if (this.meshFactory && specimen) {
        try {
          const result = await this.meshFactory.getMesh(specimen);
          return {
            version: 1,
            format: 'indexed',
            positions: Array.from(result.cap.positions),
            normals: Array.from(result.cap.normals),
            indices: Array.from(result.cap.indices),
            vertexCount: result.cap.positions.length / 3,
            faceCount: result.cap.indices.length / 3,
          };
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  // ── Cache management ──────────────────────────────────────────

  /**
   * Invalidate all cached assets that don't match the current manifest.
   * Call this after loading a new manifest to purge stale entries.
   */
  async invalidateStale(): Promise<number> {
    if (!this.manifest) return 0;

    const descriptors = this.getAssetDescriptors();
    const validPaths = new Set(descriptors.map(d => d.path));

    // Find all cached paths that aren't in the current manifest
    // We'll use IDB list as the source of truth
    const cachedPaths = await this.cache.stats();
    let purged = 0;

    // Check each descriptor for hash mismatch
    for (const desc of descriptors) {
      if (desc.hash) {
        const valid = await this.cache.isValid(desc.path, desc.hash);
        if (!valid && await this.cache.has(desc.path)) {
          await this.cache.delete(desc.path);
          purged++;
        }
      }
    }

    return purged;
  }

  /**
   * Get a loaded asset from the in-memory map.
   * Returns null if not yet loaded.
   */
  getLoaded(path: string): string | null {
    return this.loadedAssets.get(path) ?? null;
  }

  /**
   * Preload specific paths (bypassing manifest).
   */
  async preload(paths: string[]): Promise<void> {
    await Promise.all(
      paths.map((path) =>
        this.loadAsset({
          path,
          priority: AssetPriority.CRITICAL,
          type: 'json',
        }),
      ),
    );
  }

  /** Access the underlying cache manager */
  get cacheManager(): CacheManager {
    return this.cache;
  }

  /** Number of assets loaded in this session */
  get loadedCount(): number {
    return this.loadedAssets.size;
  }

  /** Whether a manifest has been loaded */
  get manifestLoaded(): boolean {
    return this.manifest !== null;
  }
}
