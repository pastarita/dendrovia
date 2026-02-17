'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { ExperienceGainedEvent, LevelUpEvent, LootDroppedEvent } from '@dendrovia/shared';

export interface ProgressionSummary {
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  newSpells: string[];
  lootItems: Array<{ itemId: string; name: string }>;
  statChanges: Record<string, number>;
}

export function useProgressionEvents() {
  const [summary, setSummary] = useState<ProgressionSummary | null>(null);

  useEffect(() => {
    const bus = getEventBus();
    const unsubs: Array<() => void> = [];
    let pending: Partial<ProgressionSummary> = {};

    unsubs.push(
      bus.on<ExperienceGainedEvent>(GameEvents.EXPERIENCE_GAINED, (event) => {
        pending = { ...pending, xpGained: event.amount };
        flush();
      }),
    );

    unsubs.push(
      bus.on<LevelUpEvent>(GameEvents.LEVEL_UP, (event) => {
        pending = {
          ...pending,
          leveledUp: true,
          newLevel: event.newLevel,
          statChanges: event.statChanges,
        };
        flush();
      }),
    );

    unsubs.push(
      bus.on<LootDroppedEvent>(GameEvents.LOOT_DROPPED, (event) => {
        pending = { ...pending, lootItems: event.items };
        flush();
      }),
    );

    function flush() {
      // Build summary from whatever we've accumulated
      setSummary({
        xpGained: pending.xpGained ?? 0,
        leveledUp: pending.leveledUp ?? false,
        newLevel: pending.newLevel ?? 0,
        newSpells: pending.newSpells ?? [],
        lootItems: pending.lootItems ?? [],
        statChanges: pending.statChanges ?? {},
      });
    }

    return () => {
      for (const u of unsubs) u();
    };
  }, []);

  const clearSummary = useCallback(() => {
    setSummary(null);
  }, []);

  return { summary, clearSummary };
}
