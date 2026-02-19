/**
 * Event Wiring — Integration Layer
 *
 * Connects LUDUS to the shared EventBus so other pillars can
 * react to game events without direct coupling.
 *
 * Listens:
 *   ARCHITECTUS → LUDUS: PLAYER_MOVED, NODE_CLICKED, BRANCH_ENTERED
 *   OCULUS → LUDUS:      SPELL_CAST, ITEM_USED, COMBAT_ACTION
 *
 * Emits:
 *   LUDUS → OCULUS:      HEALTH_CHANGED, MANA_CHANGED, COMBAT_STARTED/ENDED, QUEST_UPDATED
 *   LUDUS → ARCHITECTUS: ENCOUNTER_TRIGGERED, DAMAGE_DEALT
 *   LUDUS → all:         LEVEL_UP, LOOT_DROPPED, EXPERIENCE_GAINED
 */

import type {
  ParsedFile,
  ParsedCommit,
  Hotspot,
  ContributorProfile,
  Character,
  BattleState,
  Quest,
  Action,
  RngState,
  InternalCombatEvent,
} from '@dendrovia/shared';
import {
  EventBus,
  getEventBus,
  GameEvents,
  type NodeClickedEvent,
  type PlayerMovedEvent,
  type BranchEnteredEvent,
  type SpellCastEvent,
  type ItemUsedEvent,
} from '@dendrovia/shared';
import { type GameStore, type GameState } from '../state/GameStore';
import { initBattle, executeTurn } from '../combat/TurnBasedEngine';
import {
  checkEncounter,
  createEncounterState,
  markBossDefeated,
  markMinibossDefeated,
  markBugDefeated,
  type EncounterState,
  type EncounterConfig,
  DEFAULT_CONFIG,
} from '../encounter/EncounterSystem';
import {
  resolveBattleRewards,
  applyBattleRewards,
  updateBattleStatistics,
  createBattleStatistics,
  type BattleStatistics,
} from '../progression/ProgressionSystem';
import {
  completeQuest,
  startQuest,
  getQuestsByStatus,
} from '../quest/QuestGenerator';
import {
  useItem as useItemFromInventory,
  hasItem,
  removeItem,
  resolveLootToInventory,
  createInventory,
  type Inventory,
} from '../inventory/InventorySystem';
import { createRngState } from '../utils/SeededRandom';
import { createLogger } from '@dendrovia/shared/logger';

const log = createLogger('LUDUS', 'event-wiring');

// ─── Game Session ───────────────────────────────────────────

export interface GameSession {
  store: GameStore;
  encounterState: EncounterState;
  encounterConfig: EncounterConfig;
  battleStats: BattleStatistics;
  inventory: Inventory;
  rng: RngState;
  quests: Quest[];
  /** Topology data from CHRONOS */
  files: ParsedFile[];
  commits: ParsedCommit[];
  hotspots: Hotspot[];
  /** Contributor profiles from CHRONOS — NPC data for encounters */
  contributors: ContributorProfile[];
  /** Accumulated combat events for the current battle (for structured stats) */
  currentBattleCombatEvents: InternalCombatEvent[];
}

export function createGameSession(
  store: GameStore,
  files: ParsedFile[],
  commits: ParsedCommit[],
  hotspots: Hotspot[],
  seed: number = Date.now(),
  config: EncounterConfig = DEFAULT_CONFIG,
  contributors: ContributorProfile[] = [],
): GameSession {
  return {
    store,
    encounterState: createEncounterState(),
    encounterConfig: config,
    battleStats: createBattleStatistics(),
    inventory: createInventory(),
    rng: createRngState(seed),
    quests: [],
    files,
    commits,
    hotspots,
    contributors,
    currentBattleCombatEvents: [],
  };
}

// ─── Wire Events ────────────────────────────────────────────

/**
 * Wire all game events. Call once at initialization.
 * Returns a cleanup function that removes all listeners.
 */
export function wireGameEvents(session: GameSession): () => void {
  const bus = getEventBus();
  const unsubs: Array<() => void> = [];

  log.info('Wiring game events');

  // ── ARCHITECTUS → LUDUS: Player moved to a new location ──

  unsubs.push(bus.on(GameEvents.NODE_CLICKED, (event) => {
    handleNodeClicked(session, event, bus);
  }));

  unsubs.push(bus.on(GameEvents.PLAYER_MOVED, (event) => {
    handlePlayerMoved(session, event, bus);
  }));

  // ── OCULUS → LUDUS: Player casts a spell in combat ──

  unsubs.push(bus.on(GameEvents.SPELL_CAST, (event) => {
    handleSpellCast(session, event, bus);
  }));

  // ── OCULUS → LUDUS: Player uses an item ──

  unsubs.push(bus.on(GameEvents.ITEM_USED, (event) => {
    handleItemUsed(session, event, bus);
  }));

  // ── ARCHITECTUS → LUDUS: Player enters a branch ──

  unsubs.push(bus.on(GameEvents.BRANCH_ENTERED, (event) => {
    handleBranchEntered(session, event, bus);
  }));

  // ── Any pillar → LUDUS: Generic combat action ──

  unsubs.push(bus.on(GameEvents.COMBAT_ACTION, (event) => {
    dispatchCombatAction(session, event.action);
  }));

  log.info({ listeners: unsubs.length }, 'Game events wired');

  return () => {
    for (const unsub of unsubs) unsub();
    log.info('Game events unwired');
  };
}

// ─── Event Handlers ─────────────────────────────────────────

function handleNodeClicked(
  session: GameSession,
  event: NodeClickedEvent,
  bus: EventBus,
): void {
  const file = session.files.find(f => f.path === event.filePath);
  if (!file) return;

  // Check for encounter
  const result = checkEncounter(
    file,
    session.commits,
    session.hotspots,
    session.encounterState,
    session.rng,
    session.encounterConfig,
  );

  session.encounterState = result.state;
  session.rng = result.rng;

  if (result.encounter) {
    // Emit encounter trigger for ARCHITECTUS visual feedback
    bus.emit(GameEvents.ENCOUNTER_TRIGGERED, {
      type: result.encounter.type,
      severity: result.encounter.monster.severity,
      position: event.position,
    });

    // Start combat
    const state = session.store.getState();
    const battleState = initBattle(state.character, [result.encounter.monster], session.rng.a);
    session.store.setState({ battleState });
    session.currentBattleCombatEvents = [];

    bus.emit(GameEvents.COMBAT_STARTED, {
      monsterId: result.encounter.monster.id,
      monsterName: result.encounter.monster.name,
      monsterType: result.encounter.monster.type,
      severity: result.encounter.monster.severity,
      monsterHealth: result.encounter.monster.stats.health,
      monsterMaxHealth: result.encounter.monster.stats.maxHealth,
    });
  }
}

function handlePlayerMoved(
  session: GameSession,
  event: PlayerMovedEvent,
  _bus: EventBus,
): void {
  // Update step counter for encounter cooldown
  session.encounterState = {
    ...session.encounterState,
    stepsSinceLastEncounter: session.encounterState.stepsSinceLastEncounter + 1,
  };
}

function handleBranchEntered(
  session: GameSession,
  event: BranchEnteredEvent,
  bus: EventBus,
): void {
  // Don't trigger encounters during active combat
  const state = session.store.getState();
  if (state.battleState) return;

  const file = session.files.find(f => f.path === event.filePath);
  if (!file) return;

  // Check for encounter
  const result = checkEncounter(
    file,
    session.commits,
    session.hotspots,
    session.encounterState,
    session.rng,
    session.encounterConfig,
  );

  session.encounterState = result.state;
  session.rng = result.rng;

  if (result.encounter) {
    bus.emit(GameEvents.ENCOUNTER_TRIGGERED, {
      type: result.encounter.type,
      severity: result.encounter.monster.severity,
      position: [0, 0, 0],
    });

    const battleState = initBattle(state.character, [result.encounter.monster], session.rng.a);
    session.store.setState({ battleState });
    session.currentBattleCombatEvents = [];

    bus.emit(GameEvents.COMBAT_STARTED, {
      monsterId: result.encounter.monster.id,
      monsterName: result.encounter.monster.name,
      monsterType: result.encounter.monster.type,
      severity: result.encounter.monster.severity,
      monsterHealth: result.encounter.monster.stats.health,
      monsterMaxHealth: result.encounter.monster.stats.maxHealth,
    });
  }
}

function handleSpellCast(
  session: GameSession,
  event: SpellCastEvent,
  bus: EventBus,
): void {
  const state = session.store.getState();
  if (!state.battleState) return;

  const action: Action = {
    type: 'CAST_SPELL',
    spellId: event.spellId,
    targetIndex: 0, // Default to first enemy
  };

  const newBattle = executeTurn(state.battleState, action);
  session.store.setState({ battleState: newBattle });

  // Emit granular combat events
  emitCombatEvents(newBattle, bus, session);

  // Check for battle end
  checkBattleEnd(session, newBattle, bus);
}

function handleItemUsed(
  session: GameSession,
  event: ItemUsedEvent,
  bus: EventBus,
): void {
  const state = session.store.getState();
  if (!hasItem(session.inventory, event.itemId)) return;

  if (state.battleState) {
    // IN COMBAT: route through combat engine (same pattern as handleSpellCast)
    const action: Action = { type: 'USE_ITEM', itemId: event.itemId };
    const newBattle = executeTurn(state.battleState, action);
    session.store.setState({ battleState: newBattle });
    emitCombatEvents(newBattle, bus, session);
    session.inventory = removeItem(session.inventory, event.itemId);
    checkBattleEnd(session, newBattle, bus);
  } else {
    // OUT OF COMBAT: apply directly
    const result = useItemFromInventory(state.character, event.itemId);
    if (result.consumed) {
      session.store.setState({ character: result.character });
      session.inventory = removeItem(session.inventory, event.itemId);
    }
  }
}

// ─── Emit Granular Combat Events ────────────────────────────

function emitCombatEvents(battleState: BattleState, bus: EventBus, session?: GameSession): void {
  // Accumulate into session for structured stats
  if (session) {
    session.currentBattleCombatEvents.push(...battleState.combatEvents);
  }
  for (const event of battleState.combatEvents) {
    switch (event.type) {
      case 'TURN_START':
        bus.emit(GameEvents.COMBAT_TURN_START, {
          turn: event.turn,
          phase: event.phase,
        });
        break;
      case 'TURN_END':
        bus.emit(GameEvents.COMBAT_TURN_END, {
          turn: event.turn,
          phase: event.phase,
        });
        break;
      case 'DAMAGE':
        bus.emit(GameEvents.DAMAGE_DEALT, {
          attackerId: event.attackerId,
          targetId: event.targetId,
          damage: event.damage,
          isCritical: event.isCritical,
          element: event.element,
        });
        break;
      case 'SPELL':
        bus.emit(GameEvents.SPELL_RESOLVED, {
          spellId: event.spellId,
          casterId: event.casterId,
          targetId: event.targetId,
          effectType: event.effectType,
          value: event.value,
        });
        break;
      case 'STATUS_APPLIED':
        bus.emit(GameEvents.STATUS_EFFECT_APPLIED, {
          targetId: event.targetId,
          effectId: event.effectId,
          effectType: event.effectType,
          remainingTurns: event.remainingTurns,
        });
        break;
      case 'STATUS_EXPIRED':
        bus.emit(GameEvents.STATUS_EFFECT_EXPIRED, {
          targetId: event.targetId,
          effectId: event.effectId,
          effectType: event.effectType,
          remainingTurns: event.remainingTurns,
        });
        break;
    }
  }
}

// ─── Battle Resolution ──────────────────────────────────────

function checkBattleEnd(
  session: GameSession,
  battleState: BattleState,
  bus: EventBus,
): void {
  if (battleState.phase.type !== 'VICTORY' && battleState.phase.type !== 'DEFEAT') {
    return;
  }

  const state = session.store.getState();

  if (battleState.phase.type === 'VICTORY') {
    // Resolve rewards
    const rewardResult = resolveBattleRewards(battleState, session.rng);
    if (rewardResult) {
      session.rng = rewardResult.rng;
      const progression = applyBattleRewards(
        state.character,
        session.inventory,
        rewardResult.rewards,
      );

      session.inventory = progression.inventory;
      const levelBefore = state.character.level;

      // Update store
      session.store.setState({
        character: progression.character,
        battleState: null,
      });

      // Update stats (structured path)
      session.battleStats = updateBattleStatistics(
        session.battleStats,
        battleState,
        rewardResult.rewards,
        session.currentBattleCombatEvents,
      );

      // Mark encounter defeated
      for (const enemy of battleState.enemies) {
        if (enemy.name.includes('[BOSS]')) {
          session.encounterState = markBossDefeated(session.encounterState, enemy.sourceCommit ?? enemy.id);
        } else if (enemy.name.includes('[MINIBOSS]')) {
          session.encounterState = markMinibossDefeated(session.encounterState, enemy.sourceCommit ?? enemy.id);
        } else if (enemy.sourceCommit) {
          session.encounterState = markBugDefeated(session.encounterState, enemy.sourceCommit);
        }
      }

      // Emit events
      bus.emit(GameEvents.EXPERIENCE_GAINED, {
        characterId: progression.character.id,
        amount: rewardResult.rewards.xp,
        totalExperience: progression.character.experience,
      });

      if (progression.levelUpResult.leveledUp) {
        bus.emit(GameEvents.LEVEL_UP, {
          characterId: progression.character.id,
          newLevel: progression.character.level,
          statChanges: {
            health: progression.character.stats.maxHealth - state.character.stats.maxHealth,
            mana: progression.character.stats.maxMana - state.character.stats.maxMana,
            attack: progression.character.stats.attack - state.character.stats.attack,
            defense: progression.character.stats.defense - state.character.stats.defense,
          },
        });
      }

      if (rewardResult.rewards.lootItems.length > 0) {
        bus.emit(GameEvents.LOOT_DROPPED, {
          monsterId: battleState.enemies[0].id,
          items: rewardResult.rewards.lootItems.map(id => ({ itemId: id, name: id })),
        });
      }
    }
  } else {
    // Defeat — clear battle, character keeps current state
    session.store.setState({ battleState: null });
    session.battleStats = updateBattleStatistics(session.battleStats, battleState, null, session.currentBattleCombatEvents);
  }

  bus.emit(GameEvents.COMBAT_ENDED, {
    outcome: battleState.phase.type === 'VICTORY' ? 'victory' : 'defeat',
    turns: battleState.turn,
    xpGained: battleState.phase.type === 'VICTORY' ? battleState.phase.xpGained : undefined,
  });
}

// ─── Public API for Direct Combat Actions ───────────────────

/** Execute a player combat action directly (for non-EventBus usage) */
export function dispatchCombatAction(
  session: GameSession,
  action: Action,
): BattleState | null {
  const state = session.store.getState();
  if (!state.battleState) return null;

  const newBattle = executeTurn(state.battleState, action);
  session.store.setState({ battleState: newBattle });

  const bus = getEventBus();
  emitCombatEvents(newBattle, bus, session);
  checkBattleEnd(session, newBattle, bus);

  return newBattle;
}

/** Start a battle directly (for testing or scripted encounters) */
export function startBattle(
  session: GameSession,
  enemies: import('@dendrovia/shared').Monster[],
  seed?: number,
): BattleState {
  const state = session.store.getState();
  const battleSeed = seed ?? session.rng.a;
  const battleState = initBattle(state.character, enemies, battleSeed);
  session.store.setState({ battleState });
  session.currentBattleCombatEvents = [];

  const bus = getEventBus();
  bus.emit(GameEvents.COMBAT_STARTED, {
    monsterId: enemies[0].id,
    monsterName: enemies[0].name,
    monsterType: enemies[0].type,
    severity: enemies[0].severity,
    monsterHealth: enemies[0].stats.health,
    monsterMaxHealth: enemies[0].stats.maxHealth,
  });

  return battleState;
}
