/**
 * Collectors — Per-node metric extraction
 *
 * Pure async functions that read a subsystem and return RuntimeNodeState.
 * Each collector maps to a specific node ID in the operatus fixture.
 */

import type { RuntimeNodeState, RuntimeHealth } from '../../../../lib/dendrite/types.js';
import type { CacheManager } from '../cache/CacheManager.js';
import type { AssetLoader } from '../loader/AssetLoader.js';
import type { CDNLoader } from '../loader/CDNLoader.js';
import type { AutoSave } from '../persistence/AutoSave.js';
import type { CrossTabSync } from '../sync/CrossTabSync.js';
import { deriveHealth } from './health.js';

// Re-export for convenience
export type { RuntimeNodeState };

function now(): number {
  return Date.now();
}

export async function collectCacheManager(cache: CacheManager): Promise<RuntimeNodeState> {
  const stats = cache.stats();
  const quota = await cache.getStorageQuota().catch(() => null);
  const storagePercent = quota && quota.quota > 0
    ? Math.round((quota.usage / quota.quota) * 100)
    : null;

  return {
    nodeId: 'op-cache-mgr',
    health: deriveHealth([
      { check: () => stats.memoryEntries > 0 || stats.persistentEntries > 0, result: 'healthy' },
    ]),
    metrics: [
      { key: 'memory', value: stats.memoryEntries, unit: 'entries' },
      { key: 'persistent', value: stats.persistentEntries, unit: 'entries' },
      { key: 'opfs', value: cache.isOPFSActive ? 'active' : 'off' },
      ...(storagePercent !== null ? [{ key: 'storage', value: storagePercent, unit: '%' }] : []),
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectOPFS(cache: CacheManager): RuntimeNodeState {
  return {
    nodeId: 'op-opfs',
    health: cache.isOPFSActive ? 'healthy' : 'idle',
    metrics: [
      { key: 'status', value: cache.isOPFSActive ? 'active' : 'unavailable' },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectIDB(cache: CacheManager): RuntimeNodeState {
  const stats = cache.stats();
  return {
    nodeId: 'op-idb',
    health: 'healthy',
    metrics: [
      { key: 'entries', value: stats.persistentEntries },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectAssetLoader(loader: AssetLoader): RuntimeNodeState {
  return {
    nodeId: 'op-asset-loader',
    health: deriveHealth([
      { check: () => loader.manifestLoaded, result: 'healthy' },
    ]),
    metrics: [
      { key: 'loaded', value: loader.loadedCount, unit: 'assets' },
      { key: 'manifest', value: loader.manifestLoaded ? 'yes' : 'no' },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectCDNLoader(cdnLoader: CDNLoader | null): RuntimeNodeState {
  return {
    nodeId: 'op-cdn-loader',
    health: cdnLoader ? 'healthy' : 'idle',
    metrics: [
      { key: 'enabled', value: cdnLoader ? 'yes' : 'no' },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectAutoSave(autoSave: AutoSave): RuntimeNodeState {
  return {
    nodeId: 'op-autosave',
    health: deriveHealth([
      { check: () => autoSave.isRunning, result: 'healthy' },
    ]),
    metrics: [
      { key: 'running', value: autoSave.isRunning },
      { key: 'lastSave', value: autoSave.lastSaveTimestamp > 0
        ? `${Math.round((Date.now() - autoSave.lastSaveTimestamp) / 1000)}s ago`
        : 'never' },
      { key: 'emergency', value: autoSave.hasEmergencySave() ? 'exists' : 'none' },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectGameStore(
  getState: () => { character: { stats: { health: number }; level: number }; visitedNodes: Set<string>; playtimeMs: number }
): RuntimeNodeState {
  const state = getState();
  return {
    nodeId: 'op-game-store',
    health: 'healthy',
    metrics: [
      { key: 'level', value: state.character.level },
      { key: 'health', value: state.character.stats.health, unit: 'hp' },
      { key: 'visited', value: state.visitedNodes.size, unit: 'nodes' },
      { key: 'playtime', value: Math.round(state.playtimeMs / 1000), unit: 's' },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectCrossTabSync(sync: CrossTabSync): RuntimeNodeState {
  const status = sync.getStatus();
  return {
    nodeId: 'op-cross-tab',
    health: deriveHealth([
      { check: () => status.role === 'leader', result: 'healthy' },
      { check: () => status.role === 'follower', result: 'healthy' },
      { check: () => status.role === 'solo', result: 'degraded' },
    ]),
    metrics: [
      { key: 'role', value: status.role },
      { key: 'tabId', value: status.tabId.slice(0, 8) },
      { key: 'channel', value: status.channelAvailable ? 'yes' : 'no' },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

export function collectPerfMonitor(
  perf: { getCacheMetrics: () => { hits: number; misses: number; hitRate: number } }
): RuntimeNodeState {
  const metrics = perf.getCacheMetrics();
  return {
    nodeId: 'op-perf-monitor',
    health: 'healthy',
    metrics: [
      { key: 'hitRate', value: Math.round(metrics.hitRate * 100), unit: '%' },
      { key: 'hits', value: metrics.hits },
      { key: 'misses', value: metrics.misses },
    ],
    actions: [],
    lastUpdated: now(),
  };
}

/**
 * Aggregate phase health from child node states.
 * Worst-child health wins.
 */
export function aggregatePhaseHealth(
  childStates: RuntimeNodeState[]
): RuntimeHealth {
  const priority: Record<RuntimeHealth, number> = {
    error: 0,
    degraded: 1,
    idle: 2,
    healthy: 3,
  };

  let worst: RuntimeHealth = 'healthy';
  for (const child of childStates) {
    if (priority[child.health] < priority[worst]) {
      worst = child.health;
    }
  }
  return worst;
}
