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

    // Combat started
    if (state.battleState && !prev.battleState) {
      const enemy = state.battleState.enemies[0];
      bus.emit(GameEvents.COMBAT_STARTED, {
        monsterId: enemy.id,
        monsterName: enemy.name,
        monsterType: enemy.type,
        severity: enemy.severity,
      });
    }

    // Combat ended
    if (!state.battleState && prev.battleState) {
      const lastPhase = prev.battleState.phase;
      bus.emit(GameEvents.COMBAT_ENDED, {
        outcome: lastPhase.type === 'VICTORY' ? 'victory' : 'defeat',
        turns: prev.battleState.turn,
        xpGained: lastPhase.type === 'VICTORY' ? lastPhase.xpGained : undefined,
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

    // Level up
    if (state.character.level > prev.character.level) {
      bus.emit(GameEvents.LEVEL_UP, {
        characterId: state.character.id,
        newLevel: state.character.level,
        statChanges: {
          health: state.character.stats.maxHealth - prev.character.stats.maxHealth,
          mana: state.character.stats.maxMana - prev.character.stats.maxMana,
          attack: state.character.stats.attack - prev.character.stats.attack,
          defense: state.character.stats.defense - prev.character.stats.defense,
          speed: state.character.stats.speed - prev.character.stats.speed,
        },
      });
    }
  });

  return unsub;
}
