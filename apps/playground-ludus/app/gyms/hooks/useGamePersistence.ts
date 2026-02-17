'use client';

import type { Character } from '@dendrovia/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Matches the SaveSlot shape from @dendrovia/operatus */
interface SaveSlot {
  key: string;
  timestamp: number;
  version: number;
}

export interface PersistenceState {
  hydrated: boolean;
  saves: SaveSlot[];
  savedCharacter: Character | null;
  saveGame: (player: Character) => Promise<void>;
  loadCharacter: () => Character | null;
  exportJSON: () => Promise<string | null>;
  importJSON: (json: string) => Promise<void>;
}

const DEFAULT_NAME = 'Explorer';

/**
 * Lazy-loaded reference to OPERATUS persistence module.
 * Deferred to avoid IndexedDB access during SSR.
 */
async function getOperatus() {
  const mod = await import('@dendrovia/operatus');
  return mod;
}

export function useGamePersistence(): PersistenceState {
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [savedCharacter, setSavedCharacter] = useState<Character | null>(null);
  const operatusRef = useRef<Awaited<ReturnType<typeof getOperatus>> | null>(null);

  const refreshSaves = useCallback(async () => {
    if (!operatusRef.current) return;
    try {
      const slots = await operatusRef.current.listSaveSlots();
      setSaves(slots);
    } catch {
      // IndexedDB unavailable
    }
  }, []);

  const refreshCharacter = useCallback(() => {
    if (!operatusRef.current) return;
    const { character } = operatusRef.current.useGameStore.getState();
    if (character.name !== DEFAULT_NAME || character.level !== 1 || character.experience !== 0) {
      setSavedCharacter(character);
    } else {
      setSavedCharacter(null);
    }
  }, []);

  // Initialize OPERATUS lazily in the browser
  useEffect(() => {
    let cancelled = false;

    getOperatus().then(async (mod) => {
      if (cancelled) return;
      operatusRef.current = mod;
      await mod.waitForHydration();
      if (cancelled) return;
      setHydrated(true);
      refreshCharacter();
      refreshSaves();

      // Subscribe to store changes so savedCharacter stays reactive
      mod.useGameStore.subscribe(() => {
        if (!cancelled) refreshCharacter();
      });
    });

    return () => {
      cancelled = true;
    };
  }, [refreshSaves, refreshCharacter]);

  const saveGame = useCallback(
    async (player: Character) => {
      const mod = operatusRef.current;
      if (!mod) return;
      mod.useGameStore.getState().setCharacter({
        id: player.id,
        name: player.name,
        class: player.class,
        level: player.level,
        experience: player.experience,
        stats: { ...player.stats },
        spells: [...player.spells],
        statusEffects: [],
        cooldowns: {},
      });
      // Allow persist middleware to flush to IndexedDB
      await new Promise<void>((r) => setTimeout(r, 250));
      await refreshSaves();
    },
    [refreshSaves],
  );

  const loadCharacter = useCallback((): Character | null => {
    const mod = operatusRef.current;
    if (!mod) return null;
    const { character } = mod.useGameStore.getState();
    if (character.name === DEFAULT_NAME && character.level === 1 && character.experience === 0) {
      return null;
    }
    return character;
  }, []);

  const exportJSON = useCallback(async (): Promise<string | null> => {
    const mod = operatusRef.current;
    if (!mod) return null;
    try {
      return await mod.exportSave('dendrovia-save');
    } catch {
      return null;
    }
  }, []);

  const importJSON = useCallback(async (json: string) => {
    const mod = operatusRef.current;
    if (!mod) return;
    await mod.importSave(json);
    // Zustand persist only hydrates on mount, so reload to pick up the import
    window.location.reload();
  }, []);

  return {
    hydrated,
    saves,
    savedCharacter,
    saveGame,
    loadCharacter,
    exportJSON,
    importJSON,
  };
}
