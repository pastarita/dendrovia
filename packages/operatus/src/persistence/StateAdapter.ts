/**
 * State Adapter — Bidirectional Bridge between LUDUS and OPERATUS stores
 *
 * LUDUS uses a DIY pub/sub GameStore (runtime-only, no persistence).
 * OPERATUS uses a Zustand store with IndexedDB persistence.
 *
 * This adapter keeps both in sync:
 *   1. On hydration: OPERATUS persisted state → LUDUS store
 *   2. During gameplay: LUDUS store changes → OPERATUS Zustand store
 *
 * Quest model difference:
 *   LUDUS:    activeQuests[] + completedQuests[]
 *   OPERATUS: quests[] (all statuses in one flat array)
 */

import type { Character, Item, Quest } from '@dendrovia/shared';
import { useGameStore, waitForHydration } from './GameStore';

// ── Types ────────────────────────────────────────────────────

/** LUDUS GameState shape (mirrors ludus/src/state/GameStore.ts) */
interface LudusGameState {
  character: Character;
  inventory: Item[];
  activeQuests: Quest[];
  completedQuests: Quest[];
  battleState: unknown;
  gameFlags: Record<string, boolean>;
}

/** LUDUS GameStore interface (mirrors ludus/src/state/GameStore.ts) */
interface LudusGameStore {
  getState(): LudusGameState;
  setState(partial: Partial<LudusGameState>): void;
  subscribe(listener: (state: LudusGameState, prev: LudusGameState) => void): () => void;
}

export interface StateAdapterConfig {
  /** Skip initial hydration from OPERATUS → LUDUS (default: false) */
  skipHydration?: boolean;
  /** Debounce LUDUS → OPERATUS sync in ms (default: 100) */
  syncDebounceMs?: number;
}

// ── Adapter ──────────────────────────────────────────────────

export class StateAdapter {
  private unsubLudus: (() => void) | null = null;
  private unsubOperatus: (() => void) | null = null;
  private syncing = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private config: Required<StateAdapterConfig>;

  constructor(config: StateAdapterConfig = {}) {
    this.config = {
      skipHydration: config.skipHydration ?? false,
      syncDebounceMs: config.syncDebounceMs ?? 100,
    };
  }

  /**
   * Connect the adapter to a LUDUS GameStore.
   * Waits for OPERATUS hydration, populates the LUDUS store,
   * then starts bidirectional sync.
   */
  async connect(ludusStore: LudusGameStore): Promise<void> {
    // Wait for OPERATUS persisted state to load from IndexedDB
    await waitForHydration();

    // Step 1: Hydrate LUDUS from persisted OPERATUS state
    if (!this.config.skipHydration) {
      this.hydrateFromOperatus(ludusStore);
    }

    // Step 2: LUDUS → OPERATUS sync (gameplay changes flow to persistence)
    this.unsubLudus = ludusStore.subscribe((state, prev) => {
      if (this.syncing) return;
      this.debouncedSyncToOperatus(state, prev);
    });

    // Step 3: OPERATUS → LUDUS sync (import save, manual reset, etc.)
    this.unsubOperatus = useGameStore.subscribe((operatusState, prevOperatusState) => {
      if (this.syncing) return;
      this.syncToLudus(ludusStore, operatusState, prevOperatusState);
    });
  }

  /**
   * Disconnect both sync subscriptions and cancel pending debounce.
   */
  disconnect(): void {
    this.unsubLudus?.();
    this.unsubOperatus?.();
    this.unsubLudus = null;
    this.unsubOperatus = null;

    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  // ── Private ─────────────────────────────────────────────────

  /**
   * Populate LUDUS store from the hydrated OPERATUS Zustand state.
   * Called once at connect time.
   */
  private hydrateFromOperatus(ludusStore: LudusGameStore): void {
    const operatus = useGameStore.getState();

    // Split OPERATUS flat quests into active/completed for LUDUS
    const activeQuests = operatus.quests.filter((q) => q.status === 'active' || q.status === 'available');
    const completedQuests = operatus.quests.filter((q) => q.status === 'completed');

    this.syncing = true;
    try {
      ludusStore.setState({
        character: operatus.character,
        inventory: operatus.inventory,
        activeQuests,
        completedQuests,
        gameFlags: operatus.gameFlags,
      });
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Debounced sync: LUDUS store → OPERATUS Zustand store.
   * Batches rapid changes (e.g., combat ticks) into a single write.
   */
  private debouncedSyncToOperatus(state: LudusGameState, _prev: LudusGameState): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.syncToOperatus(state);
    }, this.config.syncDebounceMs);
  }

  /**
   * Push LUDUS state into OPERATUS Zustand store for persistence.
   */
  private syncToOperatus(ludusState: LudusGameState): void {
    // Merge activeQuests + completedQuests into flat quests array
    const quests: Quest[] = [...ludusState.activeQuests, ...ludusState.completedQuests];

    this.syncing = true;
    try {
      useGameStore.setState({
        character: ludusState.character,
        inventory: ludusState.inventory,
        quests,
        gameFlags: ludusState.gameFlags,
      });
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Reverse sync: OPERATUS → LUDUS.
   * Only fires on significant changes (save import, manual reset).
   * Skips battleState-adjacent fields since OPERATUS doesn't track combat.
   */
  private syncToLudus(ludusStore: LudusGameStore, operatus: any, prev: any): void {
    // Only sync if character or quests actually changed reference
    const characterChanged = operatus.character !== prev.character;
    const questsChanged = operatus.quests !== prev.quests;
    const inventoryChanged = operatus.inventory !== prev.inventory;
    const flagsChanged = operatus.gameFlags !== prev.gameFlags;

    if (!characterChanged && !questsChanged && !inventoryChanged && !flagsChanged) {
      return;
    }

    const patch: Partial<LudusGameState> = {};

    if (characterChanged) {
      patch.character = operatus.character;
    }

    if (questsChanged) {
      patch.activeQuests = operatus.quests.filter((q: Quest) => q.status === 'active' || q.status === 'available');
      patch.completedQuests = operatus.quests.filter((q: Quest) => q.status === 'completed');
    }

    if (inventoryChanged) {
      patch.inventory = operatus.inventory;
    }

    if (flagsChanged) {
      patch.gameFlags = operatus.gameFlags;
    }

    this.syncing = true;
    try {
      ludusStore.setState(patch);
    } finally {
      this.syncing = false;
    }
  }
}
