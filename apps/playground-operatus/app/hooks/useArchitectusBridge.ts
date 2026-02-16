'use client';

import { useEffect, useRef } from 'react';
import type { StoreApi } from 'zustand';
import type { RuntimeStoreState } from '../../../../lib/dendrite/store/runtime-store';

/**
 * React hook wrapping the ArchitectusRuntimeBridge lifecycle.
 *
 * Dynamic imports `@dendrovia/architectus/dendrite` (SSR-safe).
 * Creates bridge, starts on mount, stops on cleanup.
 */
export function useArchitectusBridge(
  runtimeStore: StoreApi<RuntimeStoreState>,
): void {
  const bridgeRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const dendriteMod = await import('@dendrovia/architectus/dendrite');

        if (cancelled) return;

        const bridge = new dendriteMod.ArchitectusRuntimeBridge({ pollIntervalMs: 5_000 });
        bridge.start(runtimeStore);
        bridgeRef.current = bridge;
      } catch (err) {
        console.warn('[useArchitectusBridge] Failed to initialize:', err);
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
  }, [runtimeStore]);
}
