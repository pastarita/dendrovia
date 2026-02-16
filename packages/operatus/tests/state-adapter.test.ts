/**
 * StateAdapter Tests
 *
 * Tests the bidirectional bridge between LUDUS and OPERATUS stores.
 * Uses a mock LUDUS store and the real OPERATUS Zustand store.
 */

import './setup.js';
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { StateAdapter } from '../src/persistence/StateAdapter.js';
import { useGameStore } from '../src/persistence/GameStore.js';
import type { Character, Quest, Item } from '@dendrovia/shared';

// Mock LUDUS GameStore
function createMockLudusStore() {
  let state = {
    character: {} as Character,
    inventory: [] as Item[],
    activeQuests: [] as Quest[],
    completedQuests: [] as Quest[],
    battleState: null,
    gameFlags: {} as Record<string, boolean>,
  };

  const listeners = new Set<(state: any, prev: any) => void>();

  return {
    getState: () => ({ ...state }),
    setState: (partial: any) => {
      const prev = { ...state };
      state = { ...state, ...partial };
      for (const listener of listeners) {
        listener(state, prev);
      }
    },
    subscribe: (listener: (state: any, prev: any) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    _getInternalState: () => state,
    _listeners: listeners,
  };
}

beforeEach(() => {
  useGameStore.getState().reset();
});

describe('StateAdapter — construction', () => {
  test('creates with default config', () => {
    const adapter = new StateAdapter();
    expect(adapter).toBeDefined();
  });

  test('creates with custom config', () => {
    const adapter = new StateAdapter({
      skipHydration: true,
      syncDebounceMs: 200,
    });
    expect(adapter).toBeDefined();
  });
});

describe('StateAdapter — connect with hydration', () => {
  test('hydrates LUDUS store from OPERATUS state', async () => {
    // Set up OPERATUS state
    useGameStore.getState().setCharacter({ name: 'TestHero' });
    useGameStore.getState().addItem({ id: 'sw1', name: 'Sword', type: 'weapon', rarity: 'common' });
    useGameStore.getState().addQuest({
      id: 'q1', title: 'Test', description: 'A test quest',
      status: 'active', objectives: [],
    });
    useGameStore.getState().addQuest({
      id: 'q2', title: 'Done', description: 'A completed quest',
      status: 'completed', objectives: [],
    });
    useGameStore.getState().setGameFlag('tutorial', true);
    // Mark hydrated so waitForHydration resolves
    useGameStore.setState({ _hasHydrated: true });

    const ludus = createMockLudusStore();
    const adapter = new StateAdapter();
    await adapter.connect(ludus);

    const ludusState = ludus.getState();
    expect(ludusState.character.name).toBe('TestHero');
    expect(ludusState.inventory).toHaveLength(1);
    expect(ludusState.activeQuests).toHaveLength(1);
    expect(ludusState.activeQuests[0].id).toBe('q1');
    expect(ludusState.completedQuests).toHaveLength(1);
    expect(ludusState.completedQuests[0].id).toBe('q2');
    expect(ludusState.gameFlags.tutorial).toBe(true);

    adapter.disconnect();
  });

  test('skips hydration when configured', async () => {
    useGameStore.getState().setCharacter({ name: 'ShouldNotSync' });
    useGameStore.setState({ _hasHydrated: true });

    const ludus = createMockLudusStore();
    const adapter = new StateAdapter({ skipHydration: true });
    await adapter.connect(ludus);

    // LUDUS should NOT have OPERATUS data
    expect(ludus.getState().character.name).not.toBe('ShouldNotSync');

    adapter.disconnect();
  });
});

describe('StateAdapter — disconnect', () => {
  test('disconnect cleans up subscriptions', async () => {
    useGameStore.setState({ _hasHydrated: true });

    const ludus = createMockLudusStore();
    const adapter = new StateAdapter({ skipHydration: true });
    await adapter.connect(ludus);

    adapter.disconnect();
    // Double disconnect should be safe
    adapter.disconnect();
  });

  test('disconnect before connect is safe', () => {
    const adapter = new StateAdapter();
    adapter.disconnect(); // No-op
  });
});

describe('StateAdapter — OPERATUS → LUDUS sync', () => {
  test('character changes in OPERATUS propagate to LUDUS', async () => {
    useGameStore.setState({ _hasHydrated: true });

    const ludus = createMockLudusStore();
    const adapter = new StateAdapter({ skipHydration: true });
    await adapter.connect(ludus);

    // Change OPERATUS character
    useGameStore.getState().setCharacter({ name: 'UpdatedHero' });

    // The sync fires via subscription (synchronous in Zustand)
    const ludusState = ludus.getState();
    expect(ludusState.character.name).toBe('UpdatedHero');

    adapter.disconnect();
  });

  test('quest changes split into active/completed for LUDUS', async () => {
    useGameStore.setState({ _hasHydrated: true });

    const ludus = createMockLudusStore();
    const adapter = new StateAdapter({ skipHydration: true });
    await adapter.connect(ludus);

    // Add quests to OPERATUS
    useGameStore.getState().addQuest({
      id: 'q1', title: 'Active', description: '',
      status: 'active', objectives: [],
    });

    let ludusState = ludus.getState();
    expect(ludusState.activeQuests).toHaveLength(1);
    expect(ludusState.completedQuests).toHaveLength(0);

    // Complete the quest
    useGameStore.getState().updateQuestStatus('q1', 'completed');

    ludusState = ludus.getState();
    expect(ludusState.activeQuests).toHaveLength(0);
    expect(ludusState.completedQuests).toHaveLength(1);

    adapter.disconnect();
  });
});
