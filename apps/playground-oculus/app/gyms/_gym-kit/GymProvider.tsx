'use client';

/**
 * GymProvider — Wraps EventBus creation + OculusProvider + store seeding.
 *
 * Each gym page creates its own isolated EventBus. GymProvider handles
 * the boilerplate of wiring it into OculusProvider and seeding the
 * Zustand store with mock data.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { EventBus } from '@dendrovia/shared';
import { OculusProvider, useOculusStore } from '@dendrovia/oculus';
import { MOCK_QUESTS, MOCK_TOPOLOGY, MOCK_HOTSPOTS } from '../../components/mock-data';

interface GymProviderProps {
  /** Custom store seed function. If omitted, seeds with standard mock data. */
  seed?: () => void;
  children: (eventBus: EventBus) => ReactNode;
}

const GymEventBusContext = createContext<EventBus | null>(null);

/** Access the gym's EventBus from any descendant component. */
export function useGymEventBus(): EventBus {
  const ctx = useContext(GymEventBusContext);
  if (!ctx) throw new Error('useGymEventBus must be used within <GymProvider>');
  return ctx;
}

const DEFAULT_SEED = () => {
  const s = useOculusStore.getState();
  s.setQuests(MOCK_QUESTS);
  s.setActiveQuest(MOCK_QUESTS[0] ?? null);
  s.setTopology(MOCK_TOPOLOGY);
  s.setHotspots(MOCK_HOTSPOTS);
  s.setHealth(100, 120);
  s.setMana(50, 60);
  s.setPlayerPosition([5, 2, -3]);
};

export function GymProvider({ seed, children }: GymProviderProps) {
  const eventBus = useMemo(() => new EventBus(true), []);

  // Seed store data once on mount
  useMemo(() => {
    (seed ?? DEFAULT_SEED)();
  }, [seed]);

  return (
    <GymEventBusContext.Provider value={eventBus}>
      <OculusProvider eventBus={eventBus}>
        {children(eventBus)}
      </OculusProvider>
    </GymEventBusContext.Provider>
  );
}
