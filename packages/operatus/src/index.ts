/**
 * OPERATUS - The Infrastructure
 *
 * Asset loading, tiered caching, state persistence, cross-tab sync,
 * CDN streaming, performance monitoring, and multiplayer for the
 * Dendrovia pipeline.
 */

// ── Initialization ───────────────────────────────────────────────
export { initializeOperatus } from './init';
export type { OperatusConfig, OperatusContext } from './init';

// ── Cache layer ──────────────────────────────────────────────────
export {
  OPFSCache,
  isOPFSSupported,
  IDBCache,
  CacheManager,
} from './cache/index';
export type {
  CacheEntry,
  CacheStats,
  CacheTier,
  CacheResult,
  StorageQuota,
  CacheEntryInfo,
} from './cache/index';

// ── Asset loaders ────────────────────────────────────────────────
export {
  AssetLoader,
  AssetPriority,
  CDNLoader,
} from './loader/index';
export type {
  AssetDescriptor,
  LoadProgress,
  CDNConfig,
  DownloadProgress,
} from './loader/index';

// ── Runtime mesh generation ────────────────────────────────────
export type { BatchOpts, MeshFactoryStats, MeshResult } from './mesh/index';
export { MeshFactory, MESH_PIPELINE_VERSION } from './mesh/index';

// ── State persistence ────────────────────────────────────────────
export {
  createDendroviaStorage,
  registerMigration,
  listSaveSlots,
  deleteSaveSlot,
  exportSave,
  importSave,
  SAVE_VERSION,
  useSaveStateStore,
  waitForHydration,
  getSaveStateSnapshot,
  AutoSave,
  StateAdapter,
} from './persistence/index';
export type {
  PersistenceConfig,
  MigrationFn,
  SaveSlot,
  SaveStateStoreState,
  AutoSaveConfig,
  StateAdapterConfig,
} from './persistence/index';

// ── Cross-tab sync ───────────────────────────────────────────────
export { CrossTabSync } from './sync/index';
export type {
  CrossTabConfig,
  TabRole,
  TabStatus,
} from './sync/index';

// ── Performance monitoring ───────────────────────────────────────
export { PerfMonitor, getPerfMonitor } from './perf/index';
export type {
  PerfMetric,
  CacheMetrics,
  LoadingReport,
} from './perf/index';

// ── Service Worker registration ──────────────────────────────────
export { registerServiceWorker, invalidateSWCache, precacheURLs } from './sw/index';
export type {
  SWRegistrationConfig,
  SWController,
} from './sw/index';

// ── Manifest generation ──────────────────────────────────────────
// ManifestGenerator uses Node APIs (crypto, fs) — import via subpath:
//   import { ManifestGenerator } from '@dendrovia/operatus/manifest';
export type {
  ManifestEntry,
  ManifestGeneratorConfig,
} from './manifest/index';

// ── Multiplayer (stretch goal) ───────────────────────────────────
export { MultiplayerClient } from './multiplayer/index';
export type {
  MultiplayerConfig,
  PlayerPresence,
  ConnectionState,
  MultiplayerMessage,
} from './multiplayer/index';
