/**
 * Event Wiring — Integration Layer
 *
 * Connects LUDUS to the shared EventBus so other pillars can
 * react to game events without direct coupling.
 *
 * Listens:
 *   ARCHITECTUS → LUDUS: PLAYER_MOVED, NODE_CLICKED, BRANCH_ENTERED
 *   OCULUS → LUDUS:      SPELL_CAST, ITEM_USED
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
  Character,
  BattleState,
  Quest,
  Action,
  RngState,
} from '@dendrovia/shared';
import {
  EventBus,
  getEventBus,
  GameEvents,
  type PlayerMovedEvent,
  type NodeClickedEvent,
  type BranchEnteredEvent,
  type SpellCastEvent,
  type CombatStartedEvent,
  type CombatEndedEvent,
  type EncounterTriggeredEvent,
  type LootDroppedEvent,
  type ExperienceGainedEvent,
  type LevelUpEvent,
} from '@dendrovia/shared';
import { type GameStore, type GameState } from '../state/GameStore.js';
import { initBattle, executeTurn } from '../combat/TurnBasedEngine.js';
import {
  checkEncounter,
  createEncounterState,
  markBossDefeated,
  markMinibossDefeated,
  markBugDefeated,
  type EncounterState,
  type EncounterConfig,
  DEFAULT_CONFIG,
} from '../encounter/EncounterSystem.js';
import {
  resolveBattleRewards,
  applyBattleRewards,
  updateBattleStatistics,
  createBattleStatistics,
  type BattleStatistics,
} from '../progression/ProgressionSystem.js';
import {
  completeQuest,
  startQuest,
  getQuestsByStatus,
} from '../quest/QuestGenerator.js';
import {
  useItem as useItemFromInventory,
  resolveLootToInventory,
  createInventory,
  type Inventory,
} from '../inventory/InventorySystem.js';
import { createRngState } from '../utils/SeededRandom.js';

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
}

export function createGameSession(
  store: GameStore,
  files: ParsedFile[],
  commits: ParsedCommit[],
  hotspots: Hotspot[],
  seed: number = Date.now(),
  config: EncounterConfig = DEFAULT_CONFIG,
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

  // ── ARCHITECTUS → LUDUS: Player moved to a new location ──

  unsubs.push(bus.on<NodeClickedEvent>(GameEvents.NODE_CLICKED, (event) => {
    handleNodeClicked(session, event, bus);
  }));

  unsubs.push(bus.on<PlayerMovedEvent>(GameEvents.PLAYER_MOVED, (event) => {
    handlePlayerMoved(session, event, bus);
  }));

  // ── OCULUS → LUDUS: Player casts a spell in combat ──

  unsubs.push(bus.on<SpellCastEvent>(GameEvents.SPELL_CAST, (event) => {
    handleSpellCast(session, event, bus);
  }));

  // ── OCULUS → LUDUS: Player uses an item ──

  unsubs.push(bus.on(GameEvents.ITEM_USED, (event: { itemId: string }) => {
    handleItemUsed(session, event, bus);
  }));

  return () => {
    for (const unsub of unsubs) unsub();
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
    bus.emit<EncounterTriggeredEvent>(GameEvents.ENCOUNTER_TRIGGERED, {
      type: result.encounter.type as 'bug' | 'merge-conflict' | 'tech-debt',
      severity: result.encounter.monster.severity,
      position: event.position,
    });

    // Start combat
    const state = session.store.getState();
    const battleState = initBattle(state.character, [result.encounter.monster], session.rng.a);
    session.store.setState({ battleState });

    bus.emit<CombatStartedEvent>(GameEvents.COMBAT_STARTED, {
      monsterId: result.encounter.monster.id,
      monsterName: result.encounter.monster.name,
      monsterType: result.encounter.monster.type,
      severity: result.encounter.monster.severity,
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

  // Check for battle end
  checkBattleEnd(session, newBattle, bus);
}

function handleItemUsed(
  session: GameSession,
  event: { itemId: string },
  bus: EventBus,
): void {
  const state = session.store.getState();

  // Use item on character
  const result = useItemFromInventory(state.character, event.itemId);
  if (result.consumed) {
    session.store.setState({ character: result.character });
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

      // Update stats
      session.battleStats = updateBattleStatistics(
        session.battleStats,
        battleState,
        rewardResult.rewards,
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
      bus.emit<ExperienceGainedEvent>(GameEvents.EXPERIENCE_GAINED, {
        characterId: progression.character.id,
        amount: rewardResult.rewards.xp,
        totalExperience: progression.character.experience,
      });

      if (progression.levelUpResult.leveledUp) {
        bus.emit<LevelUpEvent>(GameEvents.LEVEL_UP, {
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
        bus.emit<LootDroppedEvent>(GameEvents.LOOT_DROPPED, {
          monsterId: battleState.enemies[0].id,
          items: rewardResult.rewards.lootItems.map(id => ({ itemId: id, name: id })),
        });
      }
    }
  } else {
    // Defeat — clear battle, character keeps current state
    session.store.setState({ battleState: null });
    session.battleStats = updateBattleStatistics(session.battleStats, battleState, null);
  }

  bus.emit<CombatEndedEvent>(GameEvents.COMBAT_ENDED, {
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

  const bus = getEventBus();
  bus.emit<CombatStartedEvent>(GameEvents.COMBAT_STARTED, {
    monsterId: enemies[0].id,
    monsterName: enemies[0].name,
    monsterType: enemies[0].type,
    severity: enemies[0].severity,
  });

  return battleState;
}
