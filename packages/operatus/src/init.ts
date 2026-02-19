/**
 * OPERATUS Initialization Pipeline
 *
 * Single entry point that orchestrates the full infrastructure startup:
 *
 *   1. Initialize tiered cache (OPFS + IDB)
 *   2. Load asset manifest
 *   3. Load critical assets (shaders, topology)
 *   4. Hydrate game state from IndexedDB
 *   5. Start cross-tab sync + leader election
 *   6. Start auto-save (leader tabs only)
 *   7. Load visible assets
 *   8. Emit ASSETS_LOADED
 *   9. Queue background asset loading
 *
 * Usage:
 * ```ts
 * import { initializeOperatus } from '@dendrovia/operatus';
 *
 * const ctx = await initializeOperatus({
 *   onProgress: (p) => updateLoadingBar(p.percent),
 * });
 *
 * // Access loaded state
 * const topology = ctx.assetLoader.getLoaded('topology.json');
 * ```
 */

import { getEventBus, GameEvents } from '@dendrovia/shared';
import { createLogger } from '@dendrovia/shared/logger';
import { CacheManager } from './cache/CacheManager';

const log = createLogger('OPERATUS', 'init');
import { AssetLoader } from './loader/AssetLoader';
import { CDNLoader, type CDNConfig } from './loader/CDNLoader';
import { useSaveStateStore, waitForHydration } from './persistence/SaveStateStore';
import { validateManifestStructure, type ManifestHealthReport } from './manifest/ManifestHealth';
import { MeshFactory } from './mesh/MeshFactory';
import { AutoSave, type AutoSaveConfig } from './persistence/AutoSave';
import { CrossTabSync, type CrossTabConfig, type TabRole } from './sync/CrossTabSync';
import type { LoadProgress } from './loader/AssetLoader';

export interface OperatusConfig {
  /** Base path for generated assets (default: '/generated') */
  assetBasePath?: string;
  /** Path to manifest.json (default: '/generated/manifest.json') */
  manifestPath?: string;
  /** CDN configuration for HD assets (null = disabled) */
  cdn?: Partial<CDNConfig> | null;
  /** Auto-save configuration */
  autoSave?: Partial<AutoSaveConfig>;
  /** Cross-tab sync configuration */
  crossTab?: Partial<CrossTabConfig>;
  /** Loading progress callback */
  onProgress?: (progress: LoadProgress) => void;
  /** Called when tab role changes (leader/follower) */
  onRoleChange?: (role: TabRole) => void;
  /** Skip cross-tab sync (default: false) */
  skipSync?: boolean;
  /** Skip auto-save (default: false) */
  skipAutoSave?: boolean;
  /** Skip mesh factory initialization (default: false) */
  skipMeshFactory?: boolean;
}

export interface OperatusContext {
  /** Tiered cache manager */
  cache: CacheManager;
  /** Manifest-driven asset loader */
  assetLoader: AssetLoader;
  /** CDN loader for HD assets (null if disabled) */
  cdnLoader: CDNLoader | null;
  /** Auto-save controller */
  autoSave: AutoSave;
  /** Cross-tab sync controller */
  crossTabSync: CrossTabSync;
  /** This tab's role */
  tabRole: TabRole;
  /** Runtime mesh generator with cache integration (null if skipped) */
  meshFactory: MeshFactory | null;
  /** Tear down all infrastructure */
  destroy: () => void;
}

/**
 * Initialize the OPERATUS infrastructure.
 *
 * This is the primary entry point for consumers.
 * Returns a context object with access to all subsystems.
 */
export async function initializeOperatus(
  config: OperatusConfig = {},
): Promise<OperatusContext> {
  const {
    assetBasePath = '/generated',
    manifestPath = '/generated/manifest.json',
    cdn = null,
    autoSave: autoSaveConfig = {},
    crossTab: crossTabConfig = {},
    onProgress,
    onRoleChange,
    skipSync = false,
    skipAutoSave = false,
    skipMeshFactory = false,
  } = config;

  const eventBus = getEventBus();

  // ── Step 1: Initialize cache ───────────────────────────────────

  const cache = new CacheManager();
  await cache.init();

  // Request persistent storage (non-blocking)
  cache.requestPersistentStorage().catch(() => {});

  // ── Step 2: Initialize asset loader ────────────────────────────

  const assetLoader = new AssetLoader(assetBasePath);
  await assetLoader.init();

  if (onProgress) {
    assetLoader.setProgressCallback(onProgress);
  }

  // ── Step 3: Load manifest + critical assets ────────────────────

  let manifestHealthReport: ManifestHealthReport | null = null;
  try {
    const manifest = await assetLoader.loadManifest(manifestPath);
    // Purge stale cached assets that don't match new manifest
    await assetLoader.invalidateStale();
    // Validate manifest structure
    manifestHealthReport = validateManifestStructure(manifest);
    if (manifestHealthReport.stalenessDays > 7) {
      log.warn({ stalenessDays: manifestHealthReport.stalenessDays }, 'Manifest is stale — consider regenerating');
    }
    if (!manifestHealthReport.valid) {
      log.warn({ errors: manifestHealthReport.errors }, 'Manifest validation errors');
    }
  } catch (err) {
    // Manifest not available (e.g., first run, dev mode)
    // Continue without manifest — individual assets can still be loaded
    log.warn({ error: err instanceof Error ? err.message : String(err) }, 'Manifest unavailable — continuing without it');
  }

  // ── Step 4: Hydrate game state ─────────────────────────────────

  // The Zustand persist middleware auto-hydrates on store creation.
  // We wait for it to complete, but guard against infinite hang
  // if IndexedDB is corrupted or unavailable.
  const HYDRATION_TIMEOUT_MS = 5_000;
  try {
    await Promise.race([
      waitForHydration(),
      new Promise<void>((_, reject) =>
        setTimeout(
          () => reject(new Error('Hydration timeout')),
          HYDRATION_TIMEOUT_MS,
        ),
      ),
    ]);
  } catch {
    log.warn({ timeoutMs: HYDRATION_TIMEOUT_MS }, 'State hydration timed out — proceeding with defaults');
  }

  // ── Step 5: Cross-tab sync + leader election ───────────────────

  const crossTabSync = new CrossTabSync(crossTabConfig);
  let tabRole: TabRole = 'solo';

  if (!skipSync) {
    if (onRoleChange) {
      crossTabSync.setRoleChangeCallback(onRoleChange);
    }
    tabRole = await crossTabSync.start();
  }

  // ── Step 6: Auto-save (leader tabs only) ───────────────────────

  const autoSave = new AutoSave(autoSaveConfig);

  if (!skipAutoSave && crossTabSync.isLeader) {
    autoSave.start();

    // If an emergency save exists, clear it (IndexedDB save is authoritative)
    if (autoSave.hasEmergencySave()) {
      autoSave.clearEmergencySave();
    }
  }

  // If role changes later, toggle auto-save accordingly
  if (!skipAutoSave && !skipSync) {
    crossTabSync.setRoleChangeCallback((role) => {
      onRoleChange?.(role);

      if (role === 'leader' || role === 'solo') {
        autoSave.start();
      } else {
        autoSave.stop();
      }
    });
  }

  // ── Step 7: Load all assets by priority ────────────────────────

  try {
    await assetLoader.loadAll();
  } catch (err) {
    // Asset loading partially failed — game can still start
    // with whatever loaded successfully
    log.warn({ error: err instanceof Error ? err.message : String(err) }, 'Asset loading partially failed — continuing with available assets');
    await eventBus.emit(GameEvents.ASSETS_LOADED, {
      assetCount: 0,
      manifest: null,
      partial: true,
    });
  }

  // ── Step 7.5: Initialize mesh factory ───────────────────────────

  let meshFactory: MeshFactory | null = null;
  if (!skipMeshFactory) {
    meshFactory = new MeshFactory(cache);
    assetLoader.setMeshFactory(meshFactory);
  }

  // ── Step 8: Initialize CDN loader (optional) ───────────────────

  let cdnLoader: CDNLoader | null = null;
  if (cdn !== null) {
    cdnLoader = new CDNLoader(cache, cdn);
  }

  // ── Step 9: Inbound lifecycle listeners ────────────────────────

  // GAME_STARTED → confirm asset readiness to other pillars
  const unsubGameStarted = eventBus.on(GameEvents.GAME_STARTED, async () => {
    const stats = await cache.stats();
    eventBus.emit(GameEvents.ASSETS_LOADED, {
      assetCount: stats.memory + stats.persistent.entryCount,
      manifest: null,
      partial: false,
    }).catch(() => {});
  });

  // LEVEL_LOADED → preload zone-specific assets
  const unsubLevelLoaded = eventBus.on(GameEvents.LEVEL_LOADED, async (data: any) => {
    const paths: string[] = data?.assetPaths ?? [];
    if (paths.length > 0) {
      try {
        await assetLoader.preload(paths);
      } catch {
        // Non-critical — game can proceed without optional zone assets
      }
    }
  });

  // ── Step 10: Return context ──────────────────────────────────────

  const destroy = () => {
    autoSave.stop();
    crossTabSync.stop();
    unsubGameStarted();
    unsubLevelLoaded();
  };

  return {
    cache,
    assetLoader,
    cdnLoader,
    meshFactory,
    autoSave,
    crossTabSync,
    tabRole,
    destroy,
  };
}
