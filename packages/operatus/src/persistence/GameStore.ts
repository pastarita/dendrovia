/**
 * Game Store — Concrete Zustand Store for Dendrovia
 *
 * Uses `createDendroviaStorage` for IndexedDB persistence with
 * compression, versioning, and corruption detection.
 *
 * This is the canonical game state store. All pillars interact
 * with game state through this store or the EventBus.
 *
 * Features:
 *   - Zustand persist middleware with IndexedDB backend
 *   - Deep merge on rehydration (preserves nested defaults)
 *   - Set<string> serialization for visitedNodes
 *   - Hydration tracking (_hasHydrated flag)
 *   - partialize excludes transient state and actions
 */

import { create } from 'zustand';
import { persist, type StorageValue } from 'zustand/middleware';
import type { Character, Quest, GameSaveState } from '@dendrovia/shared';
import { createDendroviaStorage, SAVE_VERSION } from './StatePersistence.js';

// ── State Shape ──────────────────────────────────────────────────

export interface GameStoreState {
  // Persisted state (matches GameSaveState)
  player: Character;
  quests: Quest[];
  visitedNodes: Set<string>;
  unlockedKnowledge: string[];
  worldPosition: [number, number, number];

  // Transient state (NOT persisted)
  _hasHydrated: boolean;
  isMenuOpen: boolean;
  currentAnimation: string | null;
  cameraMode: 'falcon' | 'player';

  // Actions (NOT persisted)
  setPlayer: (player: Partial<Character>) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  spendMana: (amount: number) => boolean;
  gainExperience: (amount: number) => void;
  addQuest: (quest: Quest) => void;
  updateQuestStatus: (questId: string, status: Quest['status']) => void;
  visitNode: (nodeId: string) => void;
  unlockKnowledge: (knowledgeId: string) => void;
  setWorldPosition: (pos: [number, number, number]) => void;
  setCameraMode: (mode: 'falcon' | 'player') => void;
  setMenuOpen: (open: boolean) => void;
  reset: () => void;
}

// ── Default State ────────────────────────────────────────────────

const DEFAULT_PLAYER: Character = {
  id: 'player-1',
  name: 'Explorer',
  class: 'dps',
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  level: 1,
  experience: 0,
};

const INITIAL_STATE = {
  player: DEFAULT_PLAYER,
  quests: [] as Quest[],
  visitedNodes: new Set<string>(),
  unlockedKnowledge: [] as string[],
  worldPosition: [0, 0, 0] as [number, number, number],
  _hasHydrated: false,
  isMenuOpen: false,
  currentAnimation: null as string | null,
  cameraMode: 'falcon' as const,
};

// ── Set<string> Serialization ────────────────────────────────────

/**
 * Custom replacer/reviver for JSON serialization of Set<string>.
 * Zustand persist serializes state to JSON, which doesn't support Set.
 */
function serializeState(state: any): any {
  return {
    ...state,
    visitedNodes: state.visitedNodes instanceof Set
      ? Array.from(state.visitedNodes)
      : state.visitedNodes,
  };
}

function deserializeState(raw: any): any {
  return {
    ...raw,
    visitedNodes: Array.isArray(raw.visitedNodes)
      ? new Set(raw.visitedNodes)
      : new Set(),
  };
}

// ── Deep Merge ───────────────────────────────────────────────────

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceVal = source[key];
    const targetVal = target[key];

    if (
      sourceVal !== null &&
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      !(sourceVal instanceof Set) &&
      !(sourceVal instanceof Map) &&
      typeof targetVal === 'object' &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal as any, sourceVal as any);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal as T[keyof T];
    }
  }

  return result;
}

// ── Store Creation ───────────────────────────────────────────────

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setPlayer: (updates) =>
        set((s) => ({ player: { ...s.player, ...updates } })),

      takeDamage: (amount) =>
        set((s) => ({
          player: {
            ...s.player,
            health: Math.max(0, s.player.health - amount),
          },
        })),

      heal: (amount) =>
        set((s) => ({
          player: {
            ...s.player,
            health: Math.min(s.player.maxHealth, s.player.health + amount),
          },
        })),

      spendMana: (amount) => {
        const { player } = get();
        if (player.mana < amount) return false;
        set({
          player: { ...player, mana: player.mana - amount },
        });
        return true;
      },

      gainExperience: (amount) =>
        set((s) => {
          const newExp = s.player.experience + amount;
          const expPerLevel = s.player.level * 100;

          if (newExp >= expPerLevel) {
            // Level up
            return {
              player: {
                ...s.player,
                experience: newExp - expPerLevel,
                level: s.player.level + 1,
                maxHealth: s.player.maxHealth + 10,
                health: s.player.maxHealth + 10, // Full heal on level up
                maxMana: s.player.maxMana + 5,
                mana: s.player.maxMana + 5,
              },
            };
          }

          return {
            player: { ...s.player, experience: newExp },
          };
        }),

      addQuest: (quest) =>
        set((s) => ({ quests: [...s.quests, quest] })),

      updateQuestStatus: (questId, status) =>
        set((s) => ({
          quests: s.quests.map((q) =>
            q.id === questId ? { ...q, status } : q,
          ),
        })),

      visitNode: (nodeId) =>
        set((s) => {
          const next = new Set(s.visitedNodes);
          next.add(nodeId);
          return { visitedNodes: next };
        }),

      unlockKnowledge: (knowledgeId) =>
        set((s) =>
          s.unlockedKnowledge.includes(knowledgeId)
            ? s
            : { unlockedKnowledge: [...s.unlockedKnowledge, knowledgeId] },
        ),

      setWorldPosition: (pos) => set({ worldPosition: pos }),

      setCameraMode: (mode) => set({ cameraMode: mode }),

      setMenuOpen: (open) => set({ isMenuOpen: open }),

      reset: () => set(INITIAL_STATE),
    }),
    {
      name: 'dendrovia-save',
      version: SAVE_VERSION,
      storage: {
        getItem: async (name) => {
          const storage = createDendroviaStorage();
          const raw = await storage.getItem(name);
          if (!raw) return null;

          // Deserialize Set<string> on load
          if (raw.state) {
            raw.state = deserializeState(raw.state);
          }
          return raw as StorageValue<GameStoreState>;
        },
        setItem: async (name, value) => {
          const storage = createDendroviaStorage();
          // Serialize Set<string> before save
          const serialized = {
            ...value,
            state: value.state ? serializeState(value.state) : value.state,
          };
          await storage.setItem(name, serialized);
        },
        removeItem: async (name) => {
          const storage = createDendroviaStorage();
          await storage.removeItem(name);
        },
      },

      // Only persist game-relevant data, exclude transient state and actions
      partialize: (state) => ({
        player: state.player,
        quests: state.quests,
        visitedNodes: state.visitedNodes,
        unlockedKnowledge: state.unlockedKnowledge,
        worldPosition: state.worldPosition,
      }),

      // Deep merge preserves nested defaults when new fields are added
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current;
        return deepMerge(current, persisted as Partial<GameStoreState>);
      },

      // Track hydration for loading screens
      onRehydrateStorage: () => (state) => {
        state?._hasHydrated && void 0; // no-op read
        useGameStore.setState({ _hasHydrated: true });
      },
    },
  ),
);

/**
 * Wait for store hydration to complete.
 * Use this in the init pipeline before depending on game state.
 */
export function waitForHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useGameStore.getState()._hasHydrated) {
      resolve();
      return;
    }

    const unsub = useGameStore.subscribe((state) => {
      if (state._hasHydrated) {
        unsub();
        resolve();
      }
    });
  });
}

/**
 * Get a snapshot of game state suitable for GameSaveState.
 */
export function getGameSaveSnapshot(): GameSaveState {
  const { player, quests, visitedNodes, unlockedKnowledge } = useGameStore.getState();
  return {
    timestamp: Date.now(),
    character: player,
    quests,
    visitedNodes: Array.from(visitedNodes),
    unlockedKnowledge,
  };
}
