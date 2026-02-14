'use client';

/**
 * PlaygroundProvider — Wraps OCULUS components with a mock EventBus
 * and pre-populated store data for playground demos.
 */

import { useMemo, useEffect, type ReactNode } from 'react';
import { EventBus } from '@dendrovia/shared';
import { OculusProvider, useOculusStore } from '@dendrovia/oculus';
import type { OculusConfig } from '@dendrovia/oculus';
import { MOCK_QUESTS, MOCK_TOPOLOGY, MOCK_HOTSPOTS } from './mock-data';

export interface PlaygroundProviderProps {
  children: ReactNode;
  config?: Partial<OculusConfig>;
  /** Populate store with mock data on mount (default: true) */
  seedData?: boolean;
}

export function PlaygroundProvider({
  children,
  config,
  seedData = true,
}: PlaygroundProviderProps) {
  const eventBus = useMemo(() => new EventBus(true), []);

  useEffect(() => {
    if (!seedData) return;
    const s = useOculusStore.getState();
    s.setQuests(MOCK_QUESTS);
    s.setActiveQuest(MOCK_QUESTS[0]);
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
