/**
 * State Ownership Map — F-2 Declaration
 *
 * Canonical registry of who OWNS (writes) and who MIRRORS (reads) each
 * piece of shared state. Ownership = single writer, one source of truth.
 *
 * This file is a TypeScript artifact — it emits no runtime code, but
 * provides compile-time documentation and enables tooling to verify
 * ownership invariants.
 *
 * Legend:
 *   owner   — the pillar that creates and mutates this state
 *   readers — pillars that subscribe to / derive from this state
 *   store   — the Zustand store that holds the canonical copy
 *   event   — the EventBus event that propagates changes (if any)
 */

// ─── Ownership Declarations ────────────────────────────────

export interface StateOwnershipEntry {
  /** Human-readable field name */
  field: string;
  /** Pillar that owns (writes) this state */
  owner: 'ARCHITECTUS' | 'LUDUS' | 'OCULUS' | 'OPERATUS' | 'CHRONOS' | 'IMAGINARIUM';
  /** Pillars that read/mirror this state */
  readers: Array<'ARCHITECTUS' | 'LUDUS' | 'OCULUS' | 'OPERATUS'>;
  /** Canonical store location */
  store: string;
  /** EventBus event that propagates updates, if any */
  event?: string;
}

/**
 * All 13 shared state fields and their ownership.
 *
 * This is the single source of truth for "who writes what."
 * Violations (multiple writers) should be caught in code review
 * and resolved by designating a single owner.
 */
export const STATE_OWNERSHIP: readonly StateOwnershipEntry[] = [
  // ── ARCHITECTUS-owned (rendering truth) ──────────────────
  {
    field: 'playerPosition',
    owner: 'ARCHITECTUS',
    readers: ['OCULUS', 'LUDUS', 'OPERATUS'],
    store: 'useRendererStore',
    event: 'player:moved',
  },
  {
    field: 'cameraMode',
    owner: 'ARCHITECTUS',
    readers: ['OCULUS', 'OPERATUS'],
    store: 'useRendererStore',
    event: undefined,
  },
  {
    field: 'playerBranchId',
    owner: 'ARCHITECTUS',
    readers: ['LUDUS', 'OCULUS'],
    store: 'useRendererStore',
    event: 'branch:entered',
  },
  {
    field: 'fps',
    owner: 'ARCHITECTUS',
    readers: ['OCULUS'],
    store: 'useRendererStore',
  },
  {
    field: 'qualityTier',
    owner: 'ARCHITECTUS',
    readers: ['OCULUS'],
    store: 'useRendererStore',
  },
  {
    field: 'isUiHovered',
    owner: 'ARCHITECTUS',
    readers: ['OCULUS'],
    store: 'useRendererStore',
  },

  // ── LUDUS-owned (game logic truth) ───────────────────────
  {
    field: 'health',
    owner: 'LUDUS',
    readers: ['OCULUS'],
    store: 'useOculusStore',
    event: 'health:changed',
  },
  {
    field: 'mana',
    owner: 'LUDUS',
    readers: ['OCULUS'],
    store: 'useOculusStore',
    event: 'mana:changed',
  },
  {
    field: 'combatState',
    owner: 'LUDUS',
    readers: ['OCULUS', 'ARCHITECTUS'],
    store: 'useOculusStore',
    event: 'combat:started',
  },
  {
    field: 'quests',
    owner: 'LUDUS',
    readers: ['OCULUS', 'OPERATUS'],
    store: 'useOculusStore',
    event: 'quest:updated',
  },

  // ── OCULUS-owned (UI truth) ──────────────────────────────
  {
    field: 'activePanel',
    owner: 'OCULUS',
    readers: [],
    store: 'useOculusStore',
  },
  {
    field: 'visitedNodes',
    owner: 'OCULUS',
    readers: ['OPERATUS'],
    store: 'useOculusStore',
    event: 'node:clicked',
  },

  // ── OPERATUS-owned (persistence truth) ───────────────────
  {
    field: 'saveState',
    owner: 'OPERATUS',
    readers: ['OCULUS'],
    store: 'useSaveStateStore',
    event: 'state:persisted',
  },
] as const;
