/**
 * OPERATUS - The Infrastructure
 *
 * Asset loading, tiered caching, state persistence, cross-tab sync,
 * CDN streaming, performance monitoring, and multiplayer for the
 * Dendrovia pipeline.
 */

export type {
  CacheEntry,
  CacheEntryInfo,
  CacheResult,
  CacheStats,
  CacheTier,
  StorageQuota,
} from './cache/index';
// ── Cache layer ──────────────────────────────────────────────────
export {
  CacheManager,
  IDBCache,
  isOPFSSupported,
  OPFSCache,
} from './cache/index';
export type { OperatusConfig, OperatusContext } from './init';
// ── Initialization ───────────────────────────────────────────────
export { initializeOperatus } from './init';
export type {
  AssetDescriptor,
  CDNConfig,
  DownloadProgress,
  LoadProgress,
} from './loader/index';
// ── Asset loaders ────────────────────────────────────────────────
export {
  AssetLoader,
  AssetPriority,
  CDNLoader,
} from './loader/index';
// ── Manifest generation ──────────────────────────────────────────
// ManifestGenerator uses Node APIs (crypto, fs) — import via subpath:
//   import { ManifestGenerator } from '@dendrovia/operatus/manifest';
export type {
  ManifestEntry,
  ManifestGeneratorConfig,
} from './manifest/index';
export type {
  ConnectionState,
  MultiplayerConfig,
  MultiplayerMessage,
  PlayerPresence,
} from './multiplayer/index';
// ── Multiplayer (stretch goal) ───────────────────────────────────
export { MultiplayerClient } from './multiplayer/index';
export type {
  CacheMetrics,
  LoadingReport,
  PerfMetric,
} from './perf/index';

// ── Performance monitoring ───────────────────────────────────────
export { getPerfMonitor, PerfMonitor } from './perf/index';
export type {
  AutoSaveConfig,
  GameStoreState,
  MigrationFn,
  PersistenceConfig,
  SaveSlot,
  StateAdapterConfig,
} from './persistence/index';
// ── State persistence ────────────────────────────────────────────
export {
  AutoSave,
  createDendroviaStorage,
  deleteSaveSlot,
  exportSave,
  getGameSaveSnapshot,
  importSave,
  listSaveSlots,
  registerMigration,
  SAVE_VERSION,
  StateAdapter,
  useGameStore,
  waitForHydration,
} from './persistence/index';
export type {
  SWController,
  SWRegistrationConfig,
} from './sw/index';
// ── Service Worker registration ──────────────────────────────────
export { invalidateSWCache, precacheURLs, registerServiceWorker } from './sw/index';
export type {
  CrossTabConfig,
  TabRole,
  TabStatus,
} from './sync/index';
// ── Cross-tab sync ───────────────────────────────────────────────
export { CrossTabSync } from './sync/index';
