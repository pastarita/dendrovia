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

import type { Character, CharacterStats, GameSaveState, Item, Quest } from '@dendrovia/shared';
import { create } from 'zustand';
import { persist, type StorageValue } from 'zustand/middleware';
import { createDendroviaStorage, SAVE_VERSION } from './StatePersistence';

// ── State Shape ──────────────────────────────────────────────────

export interface GameStoreState {
  // Persisted state (matches GameSaveState)
  character: Character;
  quests: Quest[];
  visitedNodes: Set<string>;
  unlockedKnowledge: string[];
  worldPosition: [number, number, number];
  cameraMode: 'falcon' | 'player';
  inventory: Item[];
  gameFlags: Record<string, boolean>;
  playtimeMs: number;

  // Transient state (NOT persisted)
  _hasHydrated: boolean;
  isMenuOpen: boolean;
  currentAnimation: string | null;

  // Actions (NOT persisted)
  setCharacter: (updates: Partial<Character>) => void;
  updateStats: (updates: Partial<CharacterStats>) => void;
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
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  setGameFlag: (key: string, value: boolean) => void;
  addPlaytime: (ms: number) => void;
  reset: () => void;
}

// ── Default State ────────────────────────────────────────────────

const DEFAULT_STATS: CharacterStats = {
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  attack: 10,
  defense: 5,
  speed: 5,
};

const DEFAULT_CHARACTER: Character = {
  id: 'player-1',
  name: 'Explorer',
  class: 'dps',
  stats: { ...DEFAULT_STATS },
  level: 1,
  experience: 0,
  spells: [],
  statusEffects: [],
  cooldowns: {},
};

const INITIAL_STATE = {
  character: DEFAULT_CHARACTER,
  quests: [] as Quest[],
  visitedNodes: new Set<string>(),
  unlockedKnowledge: [] as string[],
  worldPosition: [0, 0, 0] as [number, number, number],
  cameraMode: 'falcon' as const,
  inventory: [] as Item[],
  gameFlags: {} as Record<string, boolean>,
  playtimeMs: 0,
  _hasHydrated: false,
  isMenuOpen: false,
  currentAnimation: null as string | null,
};

// ── Set<string> Serialization ────────────────────────────────────

function serializeState(state: any): any {
  return {
    ...state,
    visitedNodes: state.visitedNodes instanceof Set ? Array.from(state.visitedNodes) : state.visitedNodes,
  };
}

function deserializeState(raw: any): any {
  return {
    ...raw,
    visitedNodes: Array.isArray(raw.visitedNodes) ? new Set(raw.visitedNodes) : new Set(),
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
      !((sourceVal as any) instanceof Set) &&
      !((sourceVal as any) instanceof Map) &&
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

      setCharacter: (updates) => set((s) => ({ character: { ...s.character, ...updates } })),

      updateStats: (updates) =>
        set((s) => ({
          character: {
            ...s.character,
            stats: { ...s.character.stats, ...updates },
          },
        })),

      takeDamage: (amount) =>
        set((s) => ({
          character: {
            ...s.character,
            stats: {
              ...s.character.stats,
              health: Math.max(0, s.character.stats.health - amount),
            },
          },
        })),

      heal: (amount) =>
        set((s) => ({
          character: {
            ...s.character,
            stats: {
              ...s.character.stats,
              health: Math.min(s.character.stats.maxHealth, s.character.stats.health + amount),
            },
          },
        })),

      spendMana: (amount) => {
        const { character } = get();
        if (character.stats.mana < amount) return false;
        set({
          character: {
            ...character,
            stats: { ...character.stats, mana: character.stats.mana - amount },
          },
        });
        return true;
      },

      gainExperience: (amount) =>
        set((s) => {
          const newExp = s.character.experience + amount;
          const expPerLevel = s.character.level * 100;

          if (newExp >= expPerLevel) {
            return {
              character: {
                ...s.character,
                experience: newExp - expPerLevel,
                level: s.character.level + 1,
                stats: {
                  ...s.character.stats,
                  maxHealth: s.character.stats.maxHealth + 10,
                  health: s.character.stats.maxHealth + 10,
                  maxMana: s.character.stats.maxMana + 5,
                  mana: s.character.stats.maxMana + 5,
                },
              },
            };
          }

          return {
            character: { ...s.character, experience: newExp },
          };
        }),

      addQuest: (quest) => set((s) => ({ quests: [...s.quests, quest] })),

      updateQuestStatus: (questId, status) =>
        set((s) => ({
          quests: s.quests.map((q) => (q.id === questId ? { ...q, status } : q)),
        })),

      visitNode: (nodeId) =>
        set((s) => {
          const next = new Set(s.visitedNodes);
          next.add(nodeId);
          return { visitedNodes: next };
        }),

      unlockKnowledge: (knowledgeId) =>
        set((s) =>
          s.unlockedKnowledge.includes(knowledgeId) ? s : { unlockedKnowledge: [...s.unlockedKnowledge, knowledgeId] },
        ),

      setWorldPosition: (pos) => set({ worldPosition: pos }),

      setCameraMode: (mode) => set({ cameraMode: mode }),

      setMenuOpen: (open) => set({ isMenuOpen: open }),

      addItem: (item) => set((s) => ({ inventory: [...s.inventory, item] })),

      removeItem: (itemId) => set((s) => ({ inventory: s.inventory.filter((i) => i.id !== itemId) })),

      setGameFlag: (key, value) => set((s) => ({ gameFlags: { ...s.gameFlags, [key]: value } })),

      addPlaytime: (ms) => set((s) => ({ playtimeMs: s.playtimeMs + ms })),

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

          if (raw.state) {
            raw.state = deserializeState(raw.state);
          }
          return raw as StorageValue<GameStoreState>;
        },
        setItem: async (name, value) => {
          const storage = createDendroviaStorage();
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

      partialize: (state) =>
        ({
          character: state.character,
          quests: state.quests,
          visitedNodes: state.visitedNodes,
          unlockedKnowledge: state.unlockedKnowledge,
          worldPosition: state.worldPosition,
          cameraMode: state.cameraMode,
          inventory: state.inventory,
          gameFlags: state.gameFlags,
          playtimeMs: state.playtimeMs,
        }) as GameStoreState,

      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object') return current;
        return deepMerge(current, persisted as Partial<GameStoreState>);
      },

      onRehydrateStorage: () => (state) => {
        state?._hasHydrated && void 0;
        useGameStore.setState({ _hasHydrated: true });
      },
    },
  ),
);

/**
 * Wait for store hydration to complete.
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
  const {
    character,
    quests,
    visitedNodes,
    unlockedKnowledge,
    inventory,
    gameFlags,
    worldPosition,
    cameraMode,
    playtimeMs,
  } = useGameStore.getState();
  return {
    timestamp: Date.now(),
    character,
    quests,
    visitedNodes: Array.from(visitedNodes),
    unlockedKnowledge,
    inventory,
    gameFlags,
    worldPosition,
    cameraMode,
    playtimeMs,
  };
}
