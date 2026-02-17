/**
 * LUDUS Game Store — DIY pub/sub store
 *
 * Minimal store with dispatch/subscribe/getState pattern.
 * Zero dependencies. Will migrate to zustand/vanilla when OCULUS needs React bridging.
 *
 * The store bridges state changes to the EventBus so peer pillars
 * (OCULUS, ARCHITECTUS) receive updates without direct coupling.
 */

import type {
  Character,
  Quest,
  BattleState,
  Item,
  Action,
} from '@dendrovia/shared';
import {
  getEventBus,
  GameEvents,
} from '@dendrovia/shared';

export interface GameState {
  character: Character;
  inventory: Item[];
  activeQuests: Quest[];
  completedQuests: Quest[];
  battleState: BattleState | null;
  gameFlags: Record<string, boolean>;
}

type Listener = (state: GameState, prevState: GameState) => void;

export interface GameStore {
  getState(): GameState;
  setState(partial: Partial<GameState>): void;
  subscribe(listener: Listener): () => void;
}

export function createGameStore(initialState: GameState): GameStore {
  let state = initialState;
  const listeners = new Set<Listener>();

  return {
    getState() {
      return state;
    },

    setState(partial: Partial<GameState>) {
      const prev = state;
      state = { ...state, ...partial };
      listeners.forEach(fn => fn(state, prev));
    },

    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

/**
 * Wire a GameStore to the shared EventBus.
 * Call once at initialization; returns an unsubscribe function.
 */
export function bridgeStoreToEventBus(store: GameStore): () => void {
  const bus = getEventBus();

  const unsub = store.subscribe((state, prev) => {
    // Health changes
    if (state.character.stats.health !== prev.character.stats.health) {
      bus.emit(GameEvents.HEALTH_CHANGED, {
        entityId: state.character.id,
        current: state.character.stats.health,
        max: state.character.stats.maxHealth,
        delta: state.character.stats.health - prev.character.stats.health,
      });
    }

    // Mana changes
    if (state.character.stats.mana !== prev.character.stats.mana) {
      bus.emit(GameEvents.MANA_CHANGED, {
        entityId: state.character.id,
        current: state.character.stats.mana,
        max: state.character.stats.maxMana,
        delta: state.character.stats.mana - prev.character.stats.mana,
      });
    }

    // Quest updates
    if (state.activeQuests !== prev.activeQuests) {
      const newQuests = state.activeQuests.filter(
        q => !prev.activeQuests.some(pq => pq.id === q.id)
      );
      for (const quest of newQuests) {
        bus.emit(GameEvents.QUEST_UPDATED, {
          questId: quest.id,
          status: quest.status === 'active' ? 'started' : 'in-progress',
          title: quest.title,
          description: quest.description,
        });
      }
    }

  });

  return unsub;
}
