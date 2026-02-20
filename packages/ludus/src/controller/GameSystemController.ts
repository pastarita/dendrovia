/**
 * GameSystemController — Toggleable, Inspectable LUDUS Engine
 *
 * Sits alongside GameSession (does not wrap it). Provides:
 * - Per-system enable/disable toggles with master override
 * - Shadow mode: trace what WOULD have happened for disabled systems
 * - Persistence via gameFlags (already serialized by SaveSystem)
 * - OCULUS-queryable status surface
 *
 * Each EventWiring handler is wrapped with gated() at subscription time.
 * Original handlers stay untouched — gating is applied externally.
 */

import {
  EventBus,
  getEventBus,
  GameEvents,
  type NodeClickedEvent,
  type PlayerMovedEvent,
  type BranchEnteredEvent,
  type SpellCastEvent,
  type ItemUsedEvent,
  type CombatActionEvent,
  type SystemStatusChangedEvent,
} from '@dendrovia/shared';
import type { GameSession } from '../integration/EventWiring';
import {
  handleNodeClicked,
  handlePlayerMoved,
  handleBranchEntered,
  handleSpellCast,
  handleItemUsed,
  emitCombatEvents,
  checkBattleEnd,
  dispatchCombatAction,
} from '../integration/EventWiring';
import { executeTurn } from '../combat/TurnBasedEngine';
import { checkEncounter } from '../encounter/EncounterSystem';
import {
  resolveBattleRewards,
  applyBattleRewards,
} from '../progression/ProgressionSystem';
import {
  hasItem,
  removeItem,
  useItem as useItemFromInventory,
} from '../inventory/InventorySystem';
import type { Action } from '@dendrovia/shared';

// ─── Types ──────────────────────────────────────────────────

export type GameSystemName = 'encounters' | 'combat' | 'progression' | 'quests' | 'inventory';

export const ALL_SYSTEMS: readonly GameSystemName[] = [
  'encounters', 'combat', 'progression', 'quests', 'inventory',
] as const;

export interface SystemStatus {
  master: boolean;
  shadow: boolean;
  systems: Record<GameSystemName, boolean>;
  effective: Record<GameSystemName, boolean>;
}

export interface ShadowTraceEntry {
  timestamp: number;
  system: GameSystemName;
  incomingEvent: string;
  wouldHave: string;
  payload: unknown;
  suppressed: {
    storeUpdates: Record<string, unknown> | null;
    busEmissions: Array<{ event: string; data: unknown }>;
  };
}

export interface GameSystemControllerConfig {
  maxShadowEntries?: number;
  shadowEnabled?: boolean;
}

// ─── Flag Key Conventions ───────────────────────────────────

const FLAG_MASTER = 'ludus.master.enabled';
const FLAG_SHADOW = 'ludus.shadow.enabled';
function systemFlagKey(name: GameSystemName): string {
  return `ludus.system.${name}.enabled`;
}

// ─── Controller ─────────────────────────────────────────────

export interface GameSystemController {
  setSystemEnabled(system: GameSystemName, enabled: boolean): void;
  setMasterEnabled(enabled: boolean): void;
  setShadowEnabled(enabled: boolean): void;
  isSystemActive(system: GameSystemName): boolean;
  getSystemStatus(): SystemStatus;
  getShadowTrace(system?: GameSystemName): readonly ShadowTraceEntry[];
  clearShadowTrace(): void;
  getSuppressedCount(): number;
  wireControlledEvents(): void;
  unwire(): void;
}

export function createGameSystemController(
  session: GameSession,
  config?: GameSystemControllerConfig,
): GameSystemController {
  const maxShadowEntries = config?.maxShadowEntries ?? 500;

  // ── Internal State ──

  let masterEnabled = true;
  let shadowEnabled = config?.shadowEnabled ?? false;
  const systems: Record<GameSystemName, boolean> = {
    encounters: true,
    combat: true,
    progression: true,
    quests: true,
    inventory: true,
  };
  let transitioning = false;
  const shadowTrace: ShadowTraceEntry[] = [];
  let totalSuppressed = 0;
  const unsubs: Array<() => void> = [];
  let wired = false;

  // ── Restore from gameFlags ──

  const flags = session.store.getState().gameFlags;
  if (flags[FLAG_MASTER] !== undefined) masterEnabled = flags[FLAG_MASTER];
  if (flags[FLAG_SHADOW] !== undefined) shadowEnabled = flags[FLAG_SHADOW];
  for (const name of ALL_SYSTEMS) {
    const key = systemFlagKey(name);
    if (flags[key] !== undefined) systems[name] = flags[key];
  }

  // ── Helpers ──

  function isSystemActive(system: GameSystemName): boolean {
    return masterEnabled && systems[system];
  }

  function persistFlags(): void {
    const patch: Record<string, boolean> = {
      [FLAG_MASTER]: masterEnabled,
      [FLAG_SHADOW]: shadowEnabled,
    };
    for (const name of ALL_SYSTEMS) {
      patch[systemFlagKey(name)] = systems[name];
    }
    const state = session.store.getState();
    session.store.setState({
      gameFlags: { ...state.gameFlags, ...patch },
    });
  }

  function buildEffective(): Record<GameSystemName, boolean> {
    const eff: Record<string, boolean> = {};
    for (const name of ALL_SYSTEMS) {
      eff[name] = isSystemActive(name);
    }
    return eff as Record<GameSystemName, boolean>;
  }

  function emitStatusChanged(system: string, enabled: boolean): void {
    const bus = getEventBus();
    bus.emit<SystemStatusChangedEvent>(GameEvents.SYSTEM_STATUS_CHANGED, {
      system,
      enabled,
      effectiveStates: buildEffective(),
    });
  }

  function appendShadowTrace(entry: ShadowTraceEntry): void {
    if (shadowTrace.length >= maxShadowEntries) {
      shadowTrace.shift();
    }
    shadowTrace.push(entry);
  }

  // ── Gated Wrapper ──

  function gated<T>(
    system: GameSystemName,
    realHandler: (event: T) => void,
    shadowEvaluator?: (event: T) => ShadowTraceEntry | null,
  ): (event: T) => void {
    return (event: T) => {
      if (transitioning) return;
      if (isSystemActive(system)) {
        realHandler(event);
      } else {
        totalSuppressed++;
        if (shadowEnabled && shadowEvaluator) {
          const trace = shadowEvaluator(event);
          if (trace) appendShadowTrace(trace);
        }
      }
    };
  }

  // ── Shadow Evaluators ──

  function shadowEncounterNodeClicked(event: NodeClickedEvent): ShadowTraceEntry | null {
    const file = session.files.find(f => f.path === event.filePath);
    if (!file) return null;

    const result = checkEncounter(
      file,
      session.commits,
      session.hotspots,
      session.encounterState,
      session.rng,
      session.encounterConfig,
    );

    if (!result.encounter) return null;

    return {
      timestamp: Date.now(),
      system: 'encounters',
      incomingEvent: GameEvents.NODE_CLICKED,
      wouldHave: `Triggered ${result.encounter.type} encounter (${result.encounter.monster.name})`,
      payload: { encounter: result.encounter },
      suppressed: {
        storeUpdates: null,
        busEmissions: [
          { event: GameEvents.ENCOUNTER_TRIGGERED, data: { type: result.encounter.type, severity: result.encounter.monster.severity } },
          { event: GameEvents.COMBAT_STARTED, data: { monsterName: result.encounter.monster.name } },
        ],
      },
    };
  }

  function shadowEncounterBranchEntered(event: BranchEnteredEvent): ShadowTraceEntry | null {
    const state = session.store.getState();
    if (state.battleState) return null;

    const file = session.files.find(f => f.path === event.filePath);
    if (!file) return null;

    const result = checkEncounter(
      file,
      session.commits,
      session.hotspots,
      session.encounterState,
      session.rng,
      session.encounterConfig,
    );

    if (!result.encounter) return null;

    return {
      timestamp: Date.now(),
      system: 'encounters',
      incomingEvent: GameEvents.BRANCH_ENTERED,
      wouldHave: `Triggered ${result.encounter.type} encounter (${result.encounter.monster.name})`,
      payload: { encounter: result.encounter },
      suppressed: {
        storeUpdates: null,
        busEmissions: [
          { event: GameEvents.ENCOUNTER_TRIGGERED, data: { type: result.encounter.type, severity: result.encounter.monster.severity } },
          { event: GameEvents.COMBAT_STARTED, data: { monsterName: result.encounter.monster.name } },
        ],
      },
    };
  }

  function shadowCombatSpellCast(event: SpellCastEvent): ShadowTraceEntry | null {
    const state = session.store.getState();
    if (!state.battleState) return null;

    return {
      timestamp: Date.now(),
      system: 'combat',
      incomingEvent: GameEvents.SPELL_CAST,
      wouldHave: `Executed combat turn with spell ${event.spellId}`,
      payload: { spellId: event.spellId },
      suppressed: {
        storeUpdates: { battleState: 'would update' },
        busEmissions: [
          { event: GameEvents.COMBAT_TURN_START, data: {} },
          { event: GameEvents.COMBAT_TURN_END, data: {} },
        ],
      },
    };
  }

  function shadowCombatAction(event: CombatActionEvent): ShadowTraceEntry | null {
    const state = session.store.getState();
    if (!state.battleState) return null;

    return {
      timestamp: Date.now(),
      system: 'combat',
      incomingEvent: GameEvents.COMBAT_ACTION,
      wouldHave: `Dispatched combat action ${event.action.type}`,
      payload: { action: event.action },
      suppressed: {
        storeUpdates: { battleState: 'would update' },
        busEmissions: [],
      },
    };
  }

  function shadowInventoryItemUsed(event: ItemUsedEvent): ShadowTraceEntry | null {
    if (!hasItem(session.inventory, event.itemId)) return null;

    return {
      timestamp: Date.now(),
      system: 'inventory',
      incomingEvent: GameEvents.ITEM_USED,
      wouldHave: `Used item ${event.itemId}`,
      payload: { itemId: event.itemId },
      suppressed: {
        storeUpdates: { inventory: 'would remove item' },
        busEmissions: [],
      },
    };
  }

  // ── Controlled Battle End ──
  // When combat resolves, progression/quest effects are gated internally

  function controlledCheckBattleEnd(bus: EventBus): void {
    const state = session.store.getState();
    const battleState = state.battleState;
    if (!battleState) return;
    if (battleState.phase.type !== 'VICTORY' && battleState.phase.type !== 'DEFEAT') return;

    if (battleState.phase.type === 'VICTORY') {
      if (isSystemActive('progression')) {
        // Full resolution — delegate to the original
        checkBattleEnd(session, battleState, bus);
      } else {
        // Progression disabled: emit COMBAT_ENDED but shadow-trace rewards
        const rewardResult = resolveBattleRewards(battleState, session.rng);
        if (rewardResult && shadowEnabled) {
          appendShadowTrace({
            timestamp: Date.now(),
            system: 'progression',
            incomingEvent: 'battle:victory',
            wouldHave: `Awarded ${rewardResult.rewards.xp} XP, ${rewardResult.rewards.lootItems.length} items`,
            payload: rewardResult.rewards,
            suppressed: {
              storeUpdates: { character: 'XP and level would update' },
              busEmissions: [
                { event: GameEvents.EXPERIENCE_GAINED, data: { amount: rewardResult.rewards.xp } },
                ...(rewardResult.rewards.lootItems.length > 0
                  ? [{ event: GameEvents.LOOT_DROPPED, data: { items: rewardResult.rewards.lootItems } }]
                  : []),
              ],
            },
          });
        } else if (!isSystemActive('progression')) {
          totalSuppressed++;
        }

        // Clear battle state even when progression disabled
        session.store.setState({ battleState: null });

        bus.emit(GameEvents.COMBAT_ENDED, {
          outcome: 'victory',
          turns: battleState.turn,
        });
      }
    } else {
      // Defeat — always process fully (no rewards to gate)
      checkBattleEnd(session, battleState, bus);
    }
  }

  // ── Wire ──

  function wireControlledEvents(): void {
    if (wired) return;
    wired = true;

    const bus = getEventBus();

    // PLAYER_MOVED — always subscribed (spatial awareness)
    unsubs.push(bus.on<PlayerMovedEvent>(GameEvents.PLAYER_MOVED, (event) => {
      handlePlayerMoved(session, event, bus);
    }));

    // NODE_CLICKED — gated by encounters
    unsubs.push(bus.on<NodeClickedEvent>(GameEvents.NODE_CLICKED,
      gated('encounters',
        (event) => handleNodeClicked(session, event, bus),
        shadowEncounterNodeClicked,
      ),
    ));

    // BRANCH_ENTERED — gated by encounters
    unsubs.push(bus.on<BranchEnteredEvent>(GameEvents.BRANCH_ENTERED,
      gated('encounters',
        (event) => handleBranchEntered(session, event, bus),
        shadowEncounterBranchEntered,
      ),
    ));

    // SPELL_CAST — gated by combat
    unsubs.push(bus.on<SpellCastEvent>(GameEvents.SPELL_CAST,
      gated('combat',
        (event) => {
          handleSpellCast(session, event, bus);
          // After spell, check battle end through controlled path
          controlledCheckBattleEnd(bus);
        },
        shadowCombatSpellCast,
      ),
    ));

    // ITEM_USED — gated by inventory
    unsubs.push(bus.on<ItemUsedEvent>(GameEvents.ITEM_USED,
      gated('inventory',
        (event) => handleItemUsed(session, event, bus),
        shadowInventoryItemUsed,
      ),
    ));

    // COMBAT_ACTION — gated by combat
    unsubs.push(bus.on<CombatActionEvent>(GameEvents.COMBAT_ACTION,
      gated('combat',
        (event) => {
          dispatchCombatAction(session, event.action);
        },
        shadowCombatAction,
      ),
    ));
  }

  function unwire(): void {
    for (const unsub of unsubs) unsub();
    unsubs.length = 0;
    wired = false;
  }

  // ── Public API ──

  const controller: GameSystemController = {
    setSystemEnabled(system: GameSystemName, enabled: boolean): void {
      transitioning = true;
      systems[system] = enabled;
      persistFlags();
      transitioning = false;
      emitStatusChanged(system, enabled);
    },

    setMasterEnabled(enabled: boolean): void {
      transitioning = true;
      masterEnabled = enabled;
      persistFlags();
      transitioning = false;
      emitStatusChanged('master', enabled);
    },

    setShadowEnabled(enabled: boolean): void {
      shadowEnabled = enabled;
      persistFlags();
    },

    isSystemActive,

    getSystemStatus(): SystemStatus {
      return {
        master: masterEnabled,
        shadow: shadowEnabled,
        systems: { ...systems },
        effective: buildEffective(),
      };
    },

    getShadowTrace(system?: GameSystemName): readonly ShadowTraceEntry[] {
      if (system) {
        return shadowTrace.filter(e => e.system === system);
      }
      return [...shadowTrace];
    },

    clearShadowTrace(): void {
      shadowTrace.length = 0;
    },

    getSuppressedCount(): number {
      return totalSuppressed;
    },

    wireControlledEvents,
    unwire,
  };

  return controller;
}
