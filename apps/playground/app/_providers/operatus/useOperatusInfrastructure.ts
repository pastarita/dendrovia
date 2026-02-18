'use client';

import { useState, useEffect, useRef } from 'react';

type OperatusMod = typeof import('@dendrovia/operatus');
type SharedMod = typeof import('@dendrovia/shared');

export interface OperatusInfrastructure {
  ready: boolean;
  cacheManager: InstanceType<OperatusMod['CacheManager']> | null;
  assetLoader: InstanceType<OperatusMod['AssetLoader']> | null;
  eventBus: ReturnType<SharedMod['getEventBus']> | null;
  gameEvents: typeof import('@dendrovia/shared')['GameEvents'] | null;
  error: string | null;
}

/**
 * Lazy-init hook for OPERATUS infrastructure.
 * Dynamic imports avoid SSR crashes from browser-only APIs.
 * Does NOT call initializeOperatus() (no manifest at /generated/).
 * Initializes subsystems individually.
 */
export function useOperatusInfrastructure(): OperatusInfrastructure {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<InstanceType<OperatusMod['CacheManager']> | null>(null);
  const loaderRef = useRef<InstanceType<OperatusMod['AssetLoader']> | null>(null);
  const busRef = useRef<ReturnType<SharedMod['getEventBus']> | null>(null);
  const eventsRef = useRef<typeof import('@dendrovia/shared')['GameEvents'] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const [operatus, shared] = await Promise.all([
          import('@dendrovia/operatus'),
          import('@dendrovia/shared'),
        ]);

        if (cancelled) return;

        // Initialize cache manager
        const cache = new operatus.CacheManager();
        await cache.init();
        cacheRef.current = cache;

        // Initialize asset loader (creates its own CacheManager internally)
        const loader = new operatus.AssetLoader();
        loaderRef.current = loader;

        // Get event bus singleton
        busRef.current = shared.getEventBus();
        eventsRef.current = shared.GameEvents;

        // Wait for Zustand hydration
        await operatus.waitForHydration();

        if (cancelled) return;
        setReady(true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  return {
    ready,
    cacheManager: cacheRef.current,
    assetLoader: loaderRef.current,
    eventBus: busRef.current,
    gameEvents: eventsRef.current,
    error,
  };
}
