/**
 * ARCHITECTUS Runtime Bridge
 *
 * Connects ARCHITECTUS renderer state to the dendrite runtime store,
 * enabling live observation of scene, camera, GPU, performance, and
 * instance subsystems through the dendrite visualization surface.
 *
 * Simpler than OPERATUS bridge — reads directly from useRendererStore
 * (same package). No attach() needed.
 *
 * Update strategy:
 *   - Polling (default 5s): calls all collectors, batch-writes
 *   - Zustand subscription: subscribes to fps for immediate perf updates
 */

import type { StoreApi } from 'zustand';
import type { RuntimeStoreState } from '../../../../lib/dendrite/store/runtime-store';
import type { RuntimeNodeState } from '../../../../lib/dendrite/types';
import { useRendererStore } from '../store/useRendererStore';
import {
  collectAssetBridge,
  collectDendriteWorld,
  collectCameraRig,
  collectPerformanceMonitor,
  collectGPUDetection,
  collectPostProcessing,
  collectLighting,
  collectInstances,
  collectSystems,
} from './collectors';
import type { RendererSnapshot } from './collectors';
import { qualityActions, cameraActions } from './actions';

export interface ArchitectusBridgeConfig {
  pollIntervalMs?: number;
}

export class ArchitectusRuntimeBridge {
  private config: Required<ArchitectusBridgeConfig>;
  private store: StoreApi<RuntimeStoreState> | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private unsubscribers: Array<() => void> = [];

  constructor(config?: ArchitectusBridgeConfig) {
    this.config = {
      pollIntervalMs: config?.pollIntervalMs ?? 5_000,
    };
  }

  /**
   * Start polling and Zustand subscription.
   */
  start(runtimeStore: StoreApi<RuntimeStoreState>): void {
    this.store = runtimeStore;

    // Register actions
    this.registerActions();

    // Initial collection
    this.collect();

    // Start polling
    this.pollInterval = setInterval(() => {
      this.collect();
    }, this.config.pollIntervalMs);

    // Subscribe to FPS changes for immediate perf updates
    const unsub = useRendererStore.subscribe(
      (state) => state.fps,
      (fps) => {
        if (!this.store) return;
        const state = this.getSnapshot();
        const perfState = collectPerformanceMonitor(state);
        this.store.getState().updateNode(perfState.nodeId, perfState);
      },
    );
    this.unsubscribers.push(unsub);
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
    this.store = null;
  }

  /**
   * Force an immediate collection cycle.
   */
  collect(): void {
    if (!this.store) return;

    const { updateNode } = this.store.getState();
    const state = this.getSnapshot();

    // Collect all section nodes
    const sections: RuntimeNodeState[] = [
      collectAssetBridge(state),
      collectDendriteWorld(state),
      collectCameraRig(state),
      collectPerformanceMonitor(state),
      collectGPUDetection(state),
      collectPostProcessing(state),
      collectLighting(),
      ...collectInstances(state),
      ...collectSystems(),
    ];

    // Batch update section nodes
    for (const s of sections) {
      updateNode(s.nodeId, s);
    }

    // Aggregate phase health
    const phaseMap: Record<string, string[]> = {
      'arch-load': ['arch-asset-bridge'],
      'arch-render': ['arch-dendrite-world', 'arch-camera', 'arch-lighting', 'arch-postfx', 'arch-perf', 'arch-gpu'],
      'arch-instances': ['arch-branch-inst', 'arch-node-inst', 'arch-mushroom-inst'],
      'arch-systems': ['arch-lsystem', 'arch-turtle', 'arch-segment-mapper'],
    };

    const priority: Record<string, number> = { error: 0, degraded: 1, idle: 2, healthy: 3 };

    for (const [phaseId, childIds] of Object.entries(phaseMap)) {
      const childStates = childIds
        .map(id => sections.find(s => s.nodeId === id))
        .filter((s): s is RuntimeNodeState => s !== undefined);

      let worst: RuntimeNodeState['health'] = 'healthy';
      for (const child of childStates) {
        if (priority[child.health] < priority[worst]) {
          worst = child.health;
        }
      }

      updateNode(phaseId, { health: worst, metrics: [], actions: [], lastUpdated: Date.now() });
    }

    // Root node
    const allPhaseIds = Object.keys(phaseMap);
    const phaseNodes = allPhaseIds
      .map(id => this.store!.getState().nodes.get(id))
      .filter((s): s is RuntimeNodeState => s !== undefined);

    let rootHealth: RuntimeNodeState['health'] = 'healthy';
    for (const p of phaseNodes) {
      if (priority[p.health] < priority[rootHealth]) {
        rootHealth = p.health;
      }
    }
    updateNode('arch-root', { health: rootHealth, metrics: [], actions: [], lastUpdated: Date.now() });
  }

  private getSnapshot(): RendererSnapshot {
    const s = useRendererStore.getState();
    return {
      sceneReady: s.sceneReady,
      loading: s.loading,
      loadingProgress: s.loadingProgress,
      fps: s.fps,
      drawCalls: s.drawCalls,
      triangles: s.triangles,
      cameraMode: s.cameraMode,
      qualityTier: s.qualityTier,
      gpuBackend: s.gpuBackend,
      quality: {
        postProcessing: s.quality.postProcessing,
        bloom: s.quality.bloom,
      },
      generatedAssets: s.generatedAssets,
    };
  }

  private registerActions(): void {
    if (!this.store) return;
    const { registerActions } = this.store.getState();
    const rs = useRendererStore.getState();

    registerActions('arch-gpu', qualityActions(rs.setQualityTier, rs.qualityTier));
    registerActions('arch-camera', cameraActions(rs.setCameraMode, rs.cameraMode));
  }
}
