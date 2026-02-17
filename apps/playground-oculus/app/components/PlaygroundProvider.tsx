'use client';

/**
 * PlaygroundProvider — Wraps OCULUS components with a mock EventBus
 * and pre-populated store data for playground demos.
 */

import type { OculusConfig } from '@dendrovia/oculus';
import { OculusProvider, useOculusStore } from '@dendrovia/oculus';
import { EventBus } from '@dendrovia/shared';
import { type ReactNode, useEffect, useMemo } from 'react';
import { MOCK_HOTSPOTS, MOCK_QUESTS, MOCK_TOPOLOGY } from './mock-data';

export interface PlaygroundProviderProps {
  children: ReactNode;
  config?: Partial<OculusConfig>;
  /** Populate store with mock data on mount (default: true) */
  seedData?: boolean;
}

export function PlaygroundProvider({ children, config, seedData = true }: PlaygroundProviderProps) {
  const eventBus = useMemo(() => new EventBus(true), []);

  useEffect(() => {
    if (!seedData) return;
    const s = useOculusStore.getState();
    s.setQuests(MOCK_QUESTS);
    s.setActiveQuest(MOCK_QUESTS[0] ?? null);
    s.setTopology(MOCK_TOPOLOGY);
    s.setHotspots(MOCK_HOTSPOTS);
    s.setPlayerPosition([5, 2, -3]);
    s.addVisitedNode('src/index.ts');
    s.addVisitedNode('src/components/App.tsx');
  }, [seedData]);

  return (
    <OculusProvider eventBus={eventBus} config={config}>
      {children}
    </OculusProvider>
  );
}
