/**
 * OPERATUS Runtime Bridge
 *
 * Connects OPERATUS subsystems to the dendrite runtime store,
 * enabling live observation of cache, loader, persistence, sync,
 * and perf subsystems through the dendrite visualization surface.
 *
 * Hybrid update strategy:
 *   - Polling (default 5s): calls all collectors, batch-writes
 *   - Event-driven: subscribes to CACHE_UPDATED, SAVE_COMPLETED,
 *     ASSETS_LOADED for immediate point updates
 */

import type { StoreApi } from 'zustand';
import type { RuntimeStoreState } from '../../../../lib/dendrite/store/runtime-store.js';
import type { CacheManager } from '../cache/CacheManager.js';
import type { AssetLoader } from '../loader/AssetLoader.js';
import type { CDNLoader } from '../loader/CDNLoader.js';
import type { AutoSave } from '../persistence/AutoSave.js';
import type { CrossTabSync } from '../sync/CrossTabSync.js';
import {
  collectCacheManager,
  collectOPFS,
  collectIDB,
  collectAssetLoader,
  collectCDNLoader,
  collectAutoSave,
  collectGameStore,
  collectCrossTabSync,
  collectPerfMonitor,
  aggregatePhaseHealth,
} from './collectors.js';
import {
  cacheManagerActions,
  autoSaveActions,
  gameStoreActions,
  perfMonitorActions,
} from './actions.js';

export interface BridgeConfig {
  pollIntervalMs?: number;
}

export interface BridgeContext {
  cache: CacheManager;
  assetLoader: AssetLoader;
  cdnLoader: CDNLoader | null;
  autoSave: AutoSave;
  crossTabSync: CrossTabSync;
  perfMonitor: { getCacheMetrics: () => { hits: number; misses: number; hitRate: number }; reset: () => void };
  gameStore: {
    getState: () => { character: { stats: { health: number }; level: number }; visitedNodes: Set<string>; playtimeMs: number };
    reset: () => void;
  };
  eventBus?: {
    on: (event: string, handler: (...args: any[]) => void) => () => void;
  };
  gameEvents?: Record<string, string>;
}

export class OperatusRuntimeBridge {
  private config: Required<BridgeConfig>;
  private ctx: BridgeContext | null = null;
  private store: StoreApi<RuntimeStoreState> | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private unsubscribers: Array<() => void> = [];

  constructor(config?: BridgeConfig) {
    this.config = {
      pollIntervalMs: config?.pollIntervalMs ?? 5_000,
    };
  }

  /**
   * Attach subsystem references. Must be called before start().
   */
  attach(ctx: BridgeContext): void {
    this.ctx = ctx;
  }

  /**
   * Start polling and event subscription.
   */
  start(runtimeStore: StoreApi<RuntimeStoreState>): void {
    if (!this.ctx) {
      throw new Error('Bridge not attached. Call attach(ctx) first.');
    }
    this.store = runtimeStore;
    this.store.getState().setConnected(true);

    // Register actions
    this.registerActions();

    // Initial collection
    this.collect();

    // Start polling
    this.pollInterval = setInterval(() => {
      this.collect();
    }, this.config.pollIntervalMs);

    // Event-driven updates
    this.setupEventSubscriptions();
  }

  /**
   * Stop polling and clean up.
   */
  stop(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];

    if (this.store) {
      this.store.getState().setConnected(false);
    }
    this.store = null;
  }

  /**
   * Force an immediate collection cycle.
   */
  async collect(): Promise<void> {
    if (!this.ctx || !this.store) return;

    const { updateNode } = this.store.getState();
    const ctx = this.ctx;

    // Collect all section nodes
    const cacheState = await collectCacheManager(ctx.cache);
    const opfsState = collectOPFS(ctx.cache);
    const idbState = collectIDB(ctx.cache);
    const loaderState = collectAssetLoader(ctx.assetLoader);
    const cdnState = collectCDNLoader(ctx.cdnLoader);
    const autoSaveState = collectAutoSave(ctx.autoSave);
    const gameState = collectGameStore(ctx.gameStore.getState);
    const syncState = collectCrossTabSync(ctx.crossTabSync);
    const perfState = collectPerfMonitor(ctx.perfMonitor);

    // Batch update section nodes
    const sections = [cacheState, opfsState, idbState, loaderState, cdnState, autoSaveState, gameState, syncState, perfState];
    for (const s of sections) {
      updateNode(s.nodeId, s);
    }

    // Aggregate phase health
    const phaseMap: Record<string, string[]> = {
      'op-cache': ['op-cache-mgr', 'op-idb', 'op-opfs'],
      'op-loader': ['op-asset-loader', 'op-cdn-loader'],
      'op-manifest': ['op-manifest-gen', 'op-generate'],
      'op-persist': ['op-state-persist', 'op-autosave', 'op-game-store', 'op-state-adapter'],
      'op-sync': ['op-cross-tab', 'op-multiplayer', 'op-sw'],
      'op-perf': ['op-perf-monitor'],
    };

    for (const [phaseId, childIds] of Object.entries(phaseMap)) {
      const childStates = childIds
        .map(id => sections.find(s => s.nodeId === id))
        .filter((s): s is NonNullable<typeof s> => s !== undefined);

      const health = childStates.length > 0
        ? aggregatePhaseHealth(childStates)
        : 'idle';

      updateNode(phaseId, { health, metrics: [], actions: [], lastUpdated: Date.now() });
    }

    // Root node
    const allPhaseHealths = Object.keys(phaseMap).map(id =>
      this.store!.getState().nodes.get(id)
    ).filter((s): s is NonNullable<typeof s> => s !== undefined);
    const rootHealth = allPhaseHealths.length > 0
      ? aggregatePhaseHealth(allPhaseHealths)
      : 'idle';
    updateNode('op-root', { health: rootHealth, metrics: [], actions: [], lastUpdated: Date.now() });
  }

  private registerActions(): void {
    if (!this.ctx || !this.store) return;
    const { registerActions } = this.store.getState();

    registerActions('op-cache-mgr', cacheManagerActions(this.ctx.cache));
    registerActions('op-autosave', autoSaveActions(this.ctx.autoSave));
    registerActions('op-game-store', gameStoreActions(this.ctx.gameStore.reset));
    registerActions('op-perf-monitor', perfMonitorActions(this.ctx.perfMonitor.reset));
  }

  private setupEventSubscriptions(): void {
    if (!this.ctx?.eventBus || !this.ctx?.gameEvents || !this.store) return;

    const { pushEvent, updateNode } = this.store.getState();
    const bus = this.ctx.eventBus;
    const events = this.ctx.gameEvents;

    if (events.CACHE_UPDATED) {
      const unsub = bus.on(events.CACHE_UPDATED, () => {
        pushEvent('op-cache-mgr', {
          event: 'CACHE_UPDATED',
          timestamp: Date.now(),
        });
        updateNode('op-cache-mgr', { statusText: 'Cache updated' });
        setTimeout(() => updateNode('op-cache-mgr', { statusText: undefined }), 3000);
      });
      this.unsubscribers.push(unsub);
    }

    if (events.SAVE_COMPLETED) {
      const unsub = bus.on(events.SAVE_COMPLETED, () => {
        pushEvent('op-autosave', {
          event: 'SAVE_COMPLETED',
          timestamp: Date.now(),
        });
        updateNode('op-autosave', { statusText: 'Save completed' });
        setTimeout(() => updateNode('op-autosave', { statusText: undefined }), 3000);
      });
      this.unsubscribers.push(unsub);
    }

    if (events.ASSETS_LOADED) {
      const unsub = bus.on(events.ASSETS_LOADED, () => {
        pushEvent('op-asset-loader', {
          event: 'ASSETS_LOADED',
          timestamp: Date.now(),
        });
        updateNode('op-asset-loader', { statusText: 'Assets loaded' });
        setTimeout(() => updateNode('op-asset-loader', { statusText: undefined }), 3000);
      });
      this.unsubscribers.push(unsub);
    }
  }
}
