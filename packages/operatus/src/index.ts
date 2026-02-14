/**
 * OPERATUS - The Infrastructure
 *
 * Asset loading, tiered caching, state persistence, cross-tab sync,
 * CDN streaming, performance monitoring, and multiplayer for the
 * Dendrovia pipeline.
 */

// ── Initialization ───────────────────────────────────────────────
export { initializeOperatus } from './init.js';
export type { OperatusConfig, OperatusContext } from './init.js';

// ── Cache layer ──────────────────────────────────────────────────
export {
  OPFSCache,
  isOPFSSupported,
  IDBCache,
  CacheManager,
} from './cache/index.js';
export type {
  CacheEntry,
  CacheStats,
  CacheTier,
  CacheResult,
  StorageQuota,
} from './cache/index.js';

// ── Asset loaders ────────────────────────────────────────────────
export {
  AssetLoader,
  AssetPriority,
  CDNLoader,
} from './loader/index.js';
export type {
  AssetDescriptor,
  LoadProgress,
  CDNConfig,
  DownloadProgress,
} from './loader/index.js';

// ── State persistence ────────────────────────────────────────────
export {
  createDendroviaStorage,
  registerMigration,
  listSaveSlots,
  deleteSaveSlot,
  exportSave,
  importSave,
  SAVE_VERSION,
  useGameStore,
  waitForHydration,
  getGameSaveSnapshot,
  AutoSave,
  StateAdapter,
} from './persistence/index.js';
export type {
  PersistenceConfig,
  MigrationFn,
  SaveSlot,
  GameStoreState,
  AutoSaveConfig,
  StateAdapterConfig,
} from './persistence/index.js';

// ── Cross-tab sync ───────────────────────────────────────────────
export { CrossTabSync } from './sync/index.js';
export type {
  CrossTabConfig,
  TabRole,
  TabStatus,
} from './sync/index.js';

// ── Performance monitoring ───────────────────────────────────────
export { PerfMonitor, getPerfMonitor } from './perf/index.js';
export type {
  PerfMetric,
  CacheMetrics,
  LoadingReport,
} from './perf/index.js';

// ── Service Worker registration ──────────────────────────────────
export { registerServiceWorker, invalidateSWCache, precacheURLs } from './sw/index.js';
export type {
  SWRegistrationConfig,
  SWController,
} from './sw/index.js';

// ── Manifest generation ──────────────────────────────────────────
// ManifestGenerator uses Node APIs (crypto, fs) — import via subpath:
//   import { ManifestGenerator } from '@dendrovia/operatus/manifest';
export type {
  ManifestEntry,
  ManifestGeneratorConfig,
} from './manifest/index.js';

// ── Multiplayer (stretch goal) ───────────────────────────────────
export { MultiplayerClient } from './multiplayer/index.js';
export type {
  MultiplayerConfig,
  PlayerPresence,
  ConnectionState,
  MultiplayerMessage,
} from './multiplayer/index.js';
