/**
 * CANONICAL STATE CONTRACTS
 *
 * These interfaces define the authoritative shape of game state
 * that crosses pillar boundaries. Every pillar that reads or writes
 * game state MUST use these types — no local redefinitions.
 *
 * Design principles:
 *   1. One canonical shape per concept (no competing definitions)
 *   2. Ownership is explicit (one writer, many readers)
 *   3. Persistence boundary is declared (what survives a page reload)
 *   4. Read-only projections for consumers who don't own the data
 *
 * Replaces:
 *   - LUDUS GameState (ludus/src/state/GameStore.ts)
 *   - OPERATUS GameStoreState (operatus/src/persistence/GameStore.ts)
 *   - shared GameSaveState (shared/src/types/index.ts)
 *   - shared GameWorldState (shared/src/types/index.ts)
 *   - OCULUS BattleState (oculus/src/store/useOculusStore.ts)
 *   - engine GameState (dendrovia-engine/src/types.ts)
 */

import type {
  Character,
  Quest,
  Item,
  BattleState,
  BugType,
} from '../types/index.js';

// ── Shared Enumerations ─────────────────────────────────────────

/** Camera/movement mode — used by both IGameState and IEngineState. */
export type ViewMode = 'falcon' | 'player';

// ── Core Game State ─────────────────────────────────────────────
//
// The complete game state. LUDUS owns the runtime mutations.
// OPERATUS persists it. OCULUS reads projections of it.
//
// Quest model: flat array with status field. Consumers filter by
// status rather than maintaining separate active/completed arrays.

/**
 * The canonical game state shape.
 *
 * This is the UNION of all fields that any pillar needs.
 * Ownership determines who writes each field; all pillars may read.
 *
 * @owner LUDUS — character, inventory, quests, battleState, gameFlags
 * @owner ARCHITECTUS — worldPosition, cameraMode
 * @owner OPERATUS — visitedNodes, unlockedKnowledge, playtimeMs (persistence-tracked)
 */
export interface IGameState {
  // ── Character & Combat (LUDUS owns) ───────────────
  character: Character;
  inventory: Item[];
  quests: Quest[];
  gameFlags: Record<string, boolean>;

  // ── Spatial (ARCHITECTUS writes, OPERATUS persists) ─
  worldPosition: [number, number, number];
  cameraMode: ViewMode;

  // ── Exploration (OPERATUS tracks) ─────────────────
  visitedNodes: string[];
  unlockedKnowledge: string[];
  playtimeMs: number;
}

/**
 * Transient combat state. Lives in memory only — never persisted.
 *
 * LUDUS owns this entirely. OCULUS reads a projection via IBattleView.
 * When battleState is null, no combat is active.
 *
 * This re-exports the existing BattleState from shared/types for now.
 * The canonical type lives there; this contract declares ownership.
 *
 * @owner LUDUS
 * @persisted never
 */
export type ICombatState = BattleState;

/**
 * Engine runtime state. Not game state — renderer configuration.
 *
 * Kept separate from IGameState because it's frame-level state
 * (timeScale, isPaused) that doesn't belong in save files.
 *
 * @owner ARCHITECTUS
 * @persisted never
 */
export interface IEngineState {
  /** Active view mode — ARCHITECTUS syncs this with IGameState.cameraMode. */
  mode: ViewMode;
  timeScale: number;
  isPaused: boolean;
}

// ── Store Interface ─────────────────────────────────────────────
//
// The minimal store contract that LUDUS implements and OPERATUS
// bridges to for persistence. Implementation-agnostic — works with
// DIY pub/sub, Zustand, or any future store library.

/** Callback shape for store subscriptions. */
export type StateListener = (state: IGameState, prevState: IGameState) => void;

/**
 * The store contract. LUDUS implements this as the runtime store.
 * OPERATUS consumes it via StateAdapter for persistence.
 *
 * @implementor LUDUS (createGameStore)
 * @consumer OPERATUS (StateAdapter.connect)
 */
export interface IGameStore {
  getState(): IGameState;
  setState(partial: Partial<IGameState>): void;
  subscribe(listener: StateListener): () => void;
}

// ── Read-Only Projections ───────────────────────────────────────
//
// Consumers that only READ state get typed projections.
// These are NOT separate stores — they're type-level views
// that document what each consumer actually needs.

/**
 * What OCULUS needs to render the HUD.
 *
 * Projected from IGameState by the event bridge or store subscription.
 * OCULUS should never import IGameStore — it receives updates via events.
 */
export interface IHudView {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;
  activeQuest: Quest | null;
}

/**
 * What OCULUS needs to render the battle pane.
 *
 * This is a UI-friendly projection of ICombatState.
 * OCULUS should NOT import BattleState directly — it receives
 * this shape via event payloads (COMBAT_STARTED, DAMAGE_DEALT, etc).
 */
export interface IBattleView {
  active: boolean;
  enemyName: string | null;
  enemyType: BugType | null;
  enemyHealth: number;
  enemyMaxHealth: number;
  turn: number;
  log: string[];
}

/**
 * What OPERATUS needs for persistence.
 *
 * This is IGameState + a timestamp. The serialization format.
 * Replaces the old GameSaveState — same shape, canonical name.
 */
export interface ISaveSnapshot extends IGameState {
  /** When the snapshot was taken (epoch ms). */
  timestamp: number;
}

// ── Quest Helpers ───────────────────────────────────────────────
//
// Since the canonical model uses a flat quest array, consumers
// that need filtered views use these projections.

/** Quests that the player is currently working on. */
export type ActiveQuests = Quest & { status: 'active' };

/** Filter helpers — use with quests.filter(isActiveQuest). */
export function isActiveQuest(q: Quest): q is ActiveQuests {
  return q.status === 'active';
}

export function isCompletedQuest(q: Quest): boolean {
  return q.status === 'completed';
}

export function isAvailableQuest(q: Quest): boolean {
  return q.status === 'available';
}

// ── Migration Notes ─────────────────────────────────────────────
//
// To adopt these contracts, each pillar changes:
//
// LUDUS:
//   - GameState → import { IGameState } from '@dendrovia/shared'
//   - GameStore → import { IGameStore } from '@dendrovia/shared'
//   - Remove local activeQuests/completedQuests split
//   - Use quests.filter(isActiveQuest) where the split was needed
//   - bridgeStoreToEventBus signature unchanged
//
// OPERATUS:
//   - GameStoreState → import { IGameState } from '@dendrovia/shared'
//   - Delete LudusGameState/LudusGameStore from StateAdapter
//   - Import { IGameStore } instead — the shapes now match
//   - GameSaveState → ISaveSnapshot
//   - Remove quest active/completed conversion (flat array matches)
//
// OCULUS:
//   - Local BattleState → import { IBattleView } from '@dendrovia/shared'
//   - Local CameraMode → use IGameState['cameraMode']
//   - StatusEffect → import from shared (already exists there)
//
// dendrovia-engine:
//   - GameState → import { IEngineState } from '@dendrovia/shared'
//
// shared/types:
//   - GameSaveState → deprecated, replaced by ISaveSnapshot
//   - GameWorldState → deprecated, fields absorbed into IGameState
//   - BattleState stays (ICombatState re-exports it)
