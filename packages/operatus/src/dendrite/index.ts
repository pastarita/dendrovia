/**
 * OPERATUS Dendrite Integration — Barrel Export
 *
 * Provides runtime bridge, collectors, actions, and health derivation
 * for live observation of OPERATUS subsystems through the dendrite surface.
 */

export { OperatusRuntimeBridge } from './bridge.js';
export type { BridgeConfig, BridgeContext } from './bridge.js';
export { deriveHealth } from './health.js';
export type { HealthCondition } from './health.js';
export {
  collectCacheManager,
  collectOPFS,
  collectIDB,
  collectAssetLoader,
  collectCDNLoader,
  collectAutoSave,
  collectGameStore,
  collectCrossTabSync,
  collectPerfMonitor,
  collectManifest,
  collectStatePersistence,
  collectStateAdapter,
  collectMultiplayerClient,
  collectServiceWorker,
  collectGenerate,
  aggregatePhaseHealth,
} from './collectors.js';
export {
  cacheManagerActions,
  autoSaveActions,
  gameStoreActions,
  perfMonitorActions,
} from './actions.js';
