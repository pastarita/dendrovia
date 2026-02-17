/**
 * OPERATUS Dendrite Integration — Barrel Export
 *
 * Provides runtime bridge, collectors, actions, and health derivation
 * for live observation of OPERATUS subsystems through the dendrite surface.
 */

export {
  autoSaveActions,
  cacheManagerActions,
  gameStoreActions,
  perfMonitorActions,
} from './actions.js';
export type { BridgeConfig, BridgeContext } from './bridge.js';
export { OperatusRuntimeBridge } from './bridge.js';
export {
  aggregatePhaseHealth,
  collectAssetLoader,
  collectAutoSave,
  collectCacheManager,
  collectCDNLoader,
  collectCrossTabSync,
  collectGameStore,
  collectIDB,
  collectManifest,
  collectOPFS,
  collectPerfMonitor,
} from './collectors.js';
export type { HealthCondition } from './health.js';
export { deriveHealth } from './health.js';
