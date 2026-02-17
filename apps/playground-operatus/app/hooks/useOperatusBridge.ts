'use client';

import { useEffect, useRef } from 'react';
import type { StoreApi } from 'zustand';
import type { RuntimeStoreState } from '../../../../lib/dendrite/store/runtime-store';
import type { OperatusInfrastructure } from './useOperatusInfrastructure';

/**
 * React hook wrapping the OperatusRuntimeBridge lifecycle.
 *
 * Dynamic imports `@dendrovia/operatus/dendrite` (SSR-safe).
 * Creates bridge, attaches subsystem references, starts on mount, stops on cleanup.
 */
export function useOperatusBridge(runtimeStore: StoreApi<RuntimeStoreState>, infra: OperatusInfrastructure): void {
  const bridgeRef = useRef<any>(null);

  useEffect(() => {
    if (!infra.ready || !infra.cacheManager || !infra.assetLoader) return;

    let cancelled = false;

    async function setup() {
      try {
        const dendriteMod = await import('@dendrovia/operatus/dendrite');
        const operatus = await import('@dendrovia/operatus');

        if (cancelled) return;

        const bridge = new dendriteMod.OperatusRuntimeBridge({ pollIntervalMs: 5_000 });

        // Build context from infrastructure
        const perf = operatus.getPerfMonitor(true);
        const autoSave = new operatus.AutoSave();
        const crossTabSync = new operatus.CrossTabSync();
        const gameStoreRef = operatus.useGameStore;

        bridge.attach({
          cache: infra.cacheManager!,
          assetLoader: infra.assetLoader!,
          cdnLoader: null,
          autoSave,
          crossTabSync,
          perfMonitor: {
            getCacheMetrics: () => perf.getCacheMetrics(),
            reset: () => perf.reset(),
          },
          gameStore: {
            getState: () => gameStoreRef.getState() as any,
            reset: () => gameStoreRef.getState().reset(),
          },
          eventBus: infra.eventBus
            ? { on: (event: string, handler: (...args: any[]) => void) => infra.eventBus!.on(event, handler) }
            : undefined,
          gameEvents: infra.gameEvents ? (infra.gameEvents as unknown as Record<string, string>) : undefined,
        });

        bridge.start(runtimeStore);
        bridgeRef.current = bridge;
      } catch (err) {
        console.warn('[useOperatusBridge] Failed to initialize:', err);
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (bridgeRef.current) {
        bridgeRef.current.stop();
        bridgeRef.current = null;
      }
    };
  }, [infra.ready, infra.cacheManager, infra.assetLoader, runtimeStore, infra.eventBus, infra.gameEvents]);
}
