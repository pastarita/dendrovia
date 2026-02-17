'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { Character, Monster, BattleState, Action } from '@dendrovia/shared';
import {
  createGameStore,
  createGameSession,
  wireGameEvents,
  bridgeStoreToEventBus,
  startBattle as sessionStartBattle,
  dispatchCombatAction,
  addItem,
  createInventory,
  getItemCount,
  type GameSession,
  type GameStore,
  type Inventory,
} from '@dendrovia/ludus';

interface UseGameSessionReturn {
  session: GameSession | null;
  character: Character | null;
  battleState: BattleState | null;
  /** Terminal battle state preserved for victory/defeat overlay */
  terminalBattle: BattleState | null;
  inventoryItems: Array<{ itemId: string; name: string; quantity: number }>;
  startNewBattle: (enemies: Monster[], seed: number) => void;
  doAction: (action: Action) => void;
  resetSession: () => void;
  clearTerminal: () => void;
}

const STARTER_ITEMS = ['item-debug-log', 'item-stack-trace', 'item-rubber-duck'];

export function useGameSession(initialCharacter: Character): UseGameSessionReturn {
  const sessionRef = useRef<GameSession | null>(null);
  const storeRef = useRef<GameStore | null>(null);
  const cleanupRef = useRef<Array<() => void>>([]);

  const [character, setCharacter] = useState<Character | null>(initialCharacter);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [terminalBattle, setTerminalBattle] = useState<BattleState | null>(null);
  const [inventoryItems, setInventoryItems] = useState<Array<{ itemId: string; name: string; quantity: number }>>([]);

  const syncInventory = useCallback((inv: Inventory) => {
    setInventoryItems(
      inv.items.map(slot => ({
        itemId: slot.itemId,
        name: slot.itemId, // Use itemId as name for now
        quantity: slot.quantity,
      })),
    );
  }, []);

  // Initialize session on mount or when character identity changes
  useEffect(() => {
    // Cleanup previous session
    for (const fn of cleanupRef.current) fn();
    cleanupRef.current = [];

    const store = createGameStore({
      character: initialCharacter,
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      battleState: null,
      gameFlags: {},
    });
    storeRef.current = store;

    const session = createGameSession(store, [], [], [], Date.now());

    // Seed starter items
    let inv = session.inventory;
    for (const itemId of STARTER_ITEMS) {
      inv = addItem(inv, itemId, 1);
    }
    session.inventory = inv;

    sessionRef.current = session;

    // Wire events
    const cleanupWire = wireGameEvents(session);
    const cleanupBridge = bridgeStoreToEventBus(store);
    cleanupRef.current.push(cleanupWire, cleanupBridge);

    // Subscribe to store changes for React state sync
    const cleanupSub = store.subscribe((state, prev) => {
      if (state.character !== prev.character) {
        setCharacter(state.character);
      }
      if (state.battleState !== prev.battleState) {
        // If transitioning to terminal state, preserve it
        if (
          state.battleState &&
          (state.battleState.phase.type === 'VICTORY' || state.battleState.phase.type === 'DEFEAT')
        ) {
          setTerminalBattle(state.battleState);
        }
        setBattleState(state.battleState);
      }
    });
    cleanupRef.current.push(cleanupSub);

    // Initial sync
    setCharacter(initialCharacter);
    setBattleState(null);
    setTerminalBattle(null);
    syncInventory(session.inventory);

    return () => {
      for (const fn of cleanupRef.current) fn();
      cleanupRef.current = [];
    };
  }, [initialCharacter.id, initialCharacter.class, initialCharacter.level]);

  const startNewBattle = useCallback((enemies: Monster[], seed: number) => {
    const session = sessionRef.current;
    if (!session) return;
    setTerminalBattle(null);
    const battle = sessionStartBattle(session, enemies, seed);
    setBattleState(battle);
  }, []);

  const doAction = useCallback((action: Action) => {
    const session = sessionRef.current;
    if (!session) return;

    const result = dispatchCombatAction(session, action);
    if (result) {
      // If battle ended in victory/defeat, checkBattleEnd already cleared battleState
      // but we need to hold the terminal state for the overlay
      if (result.phase.type === 'VICTORY' || result.phase.type === 'DEFEAT') {
        setTerminalBattle(result);
      }
    }
    // Sync inventory (items may have been consumed/gained)
    syncInventory(session.inventory);
  }, [syncInventory]);

  const resetSession = useCallback(() => {
    const session = sessionRef.current;
    const store = storeRef.current;
    if (!session || !store) return;

    store.setState({ battleState: null });
    setBattleState(null);
    setTerminalBattle(null);

    // Reseed inventory
    let inv = createInventory();
    for (const itemId of STARTER_ITEMS) {
      inv = addItem(inv, itemId, 1);
    }
    session.inventory = inv;
    syncInventory(inv);
  }, [syncInventory]);

  const clearTerminal = useCallback(() => {
    setTerminalBattle(null);
  }, []);

  return {
    session: sessionRef.current,
    character,
    battleState,
    terminalBattle,
    inventoryItems,
    startNewBattle,
    doAction,
    resetSession,
    clearTerminal,
  };
}
