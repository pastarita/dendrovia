/**
 * End-to-End Integration Tests — Steps 21-24
 *
 * Full lifecycle: character creation → quest generation → encounter →
 * battle → loot → progression → save/load → simulation.
 *
 * Also covers: SimulationHarness, SaveSystem, BalanceConfig.
 */

import { describe, it, expect, beforeEach } from 'bun:test';

// All LUDUS modules
import { createRngState } from '../src/utils/SeededRandom.js';
import { createCharacter, gainExperience, totalXPForLevel } from '../src/character/CharacterSystem.js';
import { getSpell, getAllSpells, generateSpell } from '../src/spell/SpellFactory.js';
import { createMonster, generateBugMonster, generateBoss } from '../src/combat/MonsterFactory.js';
import { initBattle, executeTurn, getAvailableActions, replayBattle } from '../src/combat/TurnBasedEngine.js';
import { calculateBasicAttack, calculateDamage } from '../src/combat/CombatMath.js';
import { createStatusEffect, applyStatusEffect, tickStatusEffects, absorbDamage } from '../src/combat/StatusEffects.js';
import { chooseEnemyAction } from '../src/combat/EnemyAI.js';
import {
  generateQuestGraph, generateBugHuntQuests, generateArchaeologyQuests,
  startQuest, completeQuest, getQuestRewards, resetQuestIds,
} from '../src/quest/QuestGenerator.js';
import {
  checkEncounter, createEncounterState, scanAllEncounters,
  markBossDefeated,
} from '../src/encounter/EncounterSystem.js';
import {
  getItem, createInventory, addItem, removeItem, hasItem, useItem,
  resolveLoot, resolveLootToInventory,
} from '../src/inventory/InventorySystem.js';
import {
  resolveBattleRewards, applyBattleRewards, applyQuestRewards,
  updateBattleStatistics, createBattleStatistics, buildVictoryScreen,
} from '../src/progression/ProgressionSystem.js';
import { createGameStore } from '../src/state/GameStore.js';
import {
  createGameSession, wireGameEvents, startBattle, dispatchCombatAction,
} from '../src/integration/EventWiring.js';
import {
  simulateBattle, simulateMatchup, runFullSimulation,
  formatReport, formatCSV, DEFAULT_SIM_CONFIG,
} from '../src/simulation/SimulationHarness.js';
import {
  serializeGameState, saveToJSON, loadFromJSON, validateSave,
  createSaveSnapshot, SAVE_VERSION,
} from '../src/save/SaveSystem.js';
import {
  DEFAULT_BALANCE_CONFIG, createBalanceConfig, EASY_CONFIG, HARD_CONFIG,
} from '../src/config/BalanceConfig.js';

import type { ParsedCommit, ParsedFile, Hotspot, Character, Monster, Quest, RngState } from '@dendrovia/shared';

// ─── Test Data Builders ─────────────────────────────────────

function makeCommit(overrides: Partial<ParsedCommit> = {}): ParsedCommit {
  return {
    hash: `hash-${Math.random().toString(36).slice(2, 9)}`,
    message: 'fix: null pointer in parser',
    author: 'dev',
    date: new Date('2024-01-01'),
    filesChanged: ['src/parser.ts'],
    insertions: 30,
    deletions: 10,
    isMerge: false,
    type: 'bug-fix',
    ...overrides,
  };
}

function makeFile(overrides: Partial<ParsedFile> = {}): ParsedFile {
  return {
    path: 'src/parser.ts',
    hash: 'abc123',
    language: 'typescript',
    complexity: 10,
    loc: 200,
    lastModified: new Date('2024-06-01'),
    author: 'dev',
    ...overrides,
  };
}

function makeHotspot(overrides: Partial<Hotspot> = {}): Hotspot {
  return {
    path: 'src/parser.ts',
    churnRate: 15,
    complexity: 20,
    riskScore: 7,
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════
// SIMULATION HARNESS (Step 21)
// ════════════════════════════════════════════════════════════

describe('SimulationHarness', () => {
  it('should simulate a single battle', () => {
    const player = createCharacter('dps', 'Sim-DPS', 5);
    const rng = createRngState(42);
    const [monster] = createMonster('null-pointer', 1, 0, rng);
    const outcome = simulateBattle(player, monster, 42);
    expect(['victory', 'defeat', 'draw']).toContain(outcome.result);
    expect(outcome.turns).toBeGreaterThan(0);
  });

  it('should produce deterministic battle results', () => {
    const player = createCharacter('dps', 'Sim-DPS', 5);
    const rng = createRngState(42);
    const [monster] = createMonster('null-pointer', 2, 0, rng);
    const o1 = simulateBattle(player, monster, 42);
    const o2 = simulateBattle(player, monster, 42);
    expect(o1.result).toBe(o2.result);
    expect(o1.turns).toBe(o2.turns);
    expect(o1.playerHPRemaining).toBe(o2.playerHPRemaining);
  });

  it('should simulate a matchup with multiple trials', () => {
    const result = simulateMatchup(
      'dps', 5, 'null-pointer', 1, 0,
      { ...DEFAULT_SIM_CONFIG, trials: 50 },
    );
    expect(result.trials).toBe(50);
    expect(result.victories + result.defeats + result.draws).toBe(50);
    expect(result.winRate).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeLessThanOrEqual(1);
    expect(result.avgTurns).toBeGreaterThan(0);
  });

  it('should flag too-easy matchups', () => {
    // Level 30 DPS vs severity 1 monster should be very easy
    const result = simulateMatchup(
      'dps', 30, 'off-by-one', 1, 0,
      { ...DEFAULT_SIM_CONFIG, trials: 100 },
    );
    expect(result.winRate).toBeGreaterThan(0.7);
  });

  it('should run full simulation across all matchups', () => {
    const report = runFullSimulation(5, 2, 0, { ...DEFAULT_SIM_CONFIG, trials: 20 });
    // 3 classes × 4 bug types = 12 matchups
    expect(report.matchups).toHaveLength(12);
    expect(report.totalTrials).toBe(240); // 12 × 20
    expect(report.overallWinRate).toBeGreaterThan(0);
  });

  it('should format report as string', () => {
    const report = runFullSimulation(5, 2, 0, { ...DEFAULT_SIM_CONFIG, trials: 10 });
    const text = formatReport(report);
    expect(text).toContain('LUDUS BALANCE REPORT');
    expect(text).toContain('Win%');
    expect(text).toContain('Avg Turns');
  });

  it('should format results as CSV', () => {
    const result = simulateMatchup('dps', 5, 'null-pointer', 1, 0, { ...DEFAULT_SIM_CONFIG, trials: 10 });
    const csv = formatCSV([result]);
    expect(csv).toContain('class,level,monster');
    expect(csv).toContain('dps,5,null-pointer');
  });
});

// ════════════════════════════════════════════════════════════
// SAVE/LOAD SYSTEM (Step 22)
// ════════════════════════════════════════════════════════════

describe('SaveSystem', () => {
  let character: Character;

  beforeEach(() => {
    character = createCharacter('tank', 'SaveHero', 10);
  });

  it('should serialize game state', () => {
    const inventory = createInventory();
    const encounterState = createEncounterState();
    const battleStats = createBattleStatistics();
    const quests: Quest[] = [];

    const data = serializeGameState(
      character, inventory, quests, encounterState, battleStats,
    );

    expect(data.version).toBe(SAVE_VERSION);
    expect(data.character.name).toBe('SaveHero');
    expect(data.character.level).toBe(10);
    expect(data.timestamp).toBeGreaterThan(0);
  });

  it('should serialize to JSON and back', () => {
    const inventory = addItem(createInventory(), 'item-debug-log', 5);
    const encounterState = markBossDefeated(createEncounterState(), 'src/boss.ts');
    const battleStats = createBattleStatistics();
    const quests: Quest[] = [{
      id: 'q1', title: 'Test', description: 'A test quest',
      type: 'bug-hunt', status: 'completed', requirements: [],
      rewards: [{ type: 'experience', value: 100 }],
    }];

    const json = createSaveSnapshot(
      character, inventory, quests, encounterState, battleStats,
      ['knowledge-abc'], { tutorialDone: true }, 3600000,
    );

    const result = loadFromJSON(json);
    expect(result.success).toBe(true);
    expect(result.character!.name).toBe('SaveHero');
    expect(result.character!.level).toBe(10);
    expect(result.inventory!.items).toHaveLength(1);
    expect(result.inventory!.items[0].itemId).toBe('item-debug-log');
    expect(result.inventory!.items[0].quantity).toBe(5);
    expect(result.quests).toHaveLength(1);
    expect(result.encounterState!.defeatedBosses.has('src/boss.ts')).toBe(true);
    expect(result.knowledge).toContain('knowledge-abc');
    expect(result.gameFlags!.tutorialDone).toBe(true);
    expect(result.playtimeMs).toBe(3600000);
  });

  it('should validate save files', () => {
    const json = createSaveSnapshot(
      character, createInventory(), [], createEncounterState(), createBattleStatistics(),
    );
    const valid = validateSave(json);
    expect(valid.valid).toBe(true);
    expect(valid.version).toBe(SAVE_VERSION);
  });

  it('should reject invalid JSON', () => {
    const result = loadFromJSON('not json');
    expect(result.success).toBe(false);
    expect(result.error).toContain('parse error');
  });

  it('should reject non-object data', () => {
    const result = loadFromJSON('"just a string"');
    expect(result.success).toBe(false);
  });

  it('should reject missing version', () => {
    const result = loadFromJSON('{"character": {}}');
    expect(result.success).toBe(false);
    expect(result.error).toContain('version');
  });

  it('should reject future version', () => {
    const result = loadFromJSON(`{"version": 999, "character": {"name": "X", "level": 1}}`);
    expect(result.success).toBe(false);
    expect(result.error).toContain('newer');
  });

  it('should handle missing optional fields gracefully', () => {
    const minimal = JSON.stringify({
      version: 1,
      character: { name: 'Minimal', level: 1, class: 'dps' },
    });
    const result = loadFromJSON(minimal);
    expect(result.success).toBe(true);
    expect(result.character!.name).toBe('Minimal');
    expect(result.inventory!.items).toHaveLength(0);
    expect(result.quests).toHaveLength(0);
  });

  it('should validate save format', () => {
    expect(validateSave('not json').valid).toBe(false);
    expect(validateSave('42').valid).toBe(false);
    expect(validateSave('{"version": 1, "character": {}}').valid).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// BALANCE CONFIG (Step 23)
// ════════════════════════════════════════════════════════════

describe('BalanceConfig', () => {
  it('should have default config with Tranche 1 values', () => {
    expect(DEFAULT_BALANCE_CONFIG.damage.defenseConstant).toBe(20);
    expect(DEFAULT_BALANCE_CONFIG.damage.critMultiplier).toBe(1.5);
    expect(DEFAULT_BALANCE_CONFIG.damage.baseCritChance).toBe(0.05);
    expect(DEFAULT_BALANCE_CONFIG.xp.base).toBe(50);
    expect(DEFAULT_BALANCE_CONFIG.xp.exponent).toBe(2);
    expect(DEFAULT_BALANCE_CONFIG.monsters.severityStep).toBe(0.35);
    expect(DEFAULT_BALANCE_CONFIG.characters.maxLevel).toBe(30);
  });

  it('should have correct element effectiveness table', () => {
    const table = DEFAULT_BALANCE_CONFIG.elements.effectivenessTable;
    expect(table.fire.earth).toBe(1.5);
    expect(table.fire.water).toBe(0.5);
    expect(table.none.fire).toBe(1.0);
  });

  it('should have base stats for all classes', () => {
    expect(DEFAULT_BALANCE_CONFIG.characters.baseStats.tank.health).toBe(150);
    expect(DEFAULT_BALANCE_CONFIG.characters.baseStats.healer.mana).toBe(100);
    expect(DEFAULT_BALANCE_CONFIG.characters.baseStats.dps.attack).toBe(15);
  });

  it('should have growth rates for all classes', () => {
    expect(DEFAULT_BALANCE_CONFIG.characters.growthRates.tank.hp).toBe(8);
    expect(DEFAULT_BALANCE_CONFIG.characters.growthRates.dps.attack).toBe(2);
    expect(DEFAULT_BALANCE_CONFIG.characters.growthRates.healer.mana).toBe(5);
  });

  it('should create custom config via overrides', () => {
    const custom = createBalanceConfig({
      damage: { defenseConstant: 30 },
      xp: { base: 100 },
    });
    expect(custom.damage.defenseConstant).toBe(30);
    expect(custom.xp.base).toBe(100);
    // Other values should remain default
    expect(custom.damage.critMultiplier).toBe(1.5);
    expect(custom.xp.exponent).toBe(2);
  });

  it('should have easy preset', () => {
    expect(EASY_CONFIG.damage.defenseConstant).toBe(15);
    expect(EASY_CONFIG.combat.defendDefenseBonus).toBe(8);
    expect(EASY_CONFIG.encounters.randomEncounterChance).toBe(0.10);
  });

  it('should have hard preset', () => {
    expect(HARD_CONFIG.damage.defenseConstant).toBe(25);
    expect(HARD_CONFIG.monsters.severityStep).toBe(0.45);
    expect(HARD_CONFIG.encounters.randomEncounterChance).toBe(0.25);
  });

  it('should deep merge without mutating defaults', () => {
    const custom = createBalanceConfig({
      damage: { defenseConstant: 99 },
    });
    expect(DEFAULT_BALANCE_CONFIG.damage.defenseConstant).toBe(20);
    expect(custom.damage.defenseConstant).toBe(99);
  });
});

// ════════════════════════════════════════════════════════════
// FULL LIFECYCLE E2E TEST (Step 24)
// ════════════════════════════════════════════════════════════

describe('Full Lifecycle E2E', () => {
  beforeEach(() => {
    resetQuestIds();
  });

  it('should run a complete game session: character → quests → encounter → battle → loot → progression → save → load', () => {
    const rng = createRngState(42);

    // 1. Create character
    const hero = createCharacter('dps', 'E2E-Hero', 1);
    expect(hero.level).toBe(1);
    expect(hero.spells).toHaveLength(4);

    // 2. Generate quests from commits
    const commits = [
      makeCommit({ hash: 'aaa', message: 'fix: null pointer crash', type: 'bug-fix', insertions: 30, deletions: 10 }),
      makeCommit({ hash: 'bbb', message: 'feat: add auth system', type: 'feature', insertions: 100, deletions: 20 }),
      makeCommit({ hash: 'ccc', message: 'fix: memory leak in cache', type: 'bug-fix', insertions: 50, deletions: 30 }),
    ];
    const quests = generateQuestGraph(commits);
    expect(quests).toHaveLength(3);
    expect(quests[0].status).toBe('available');

    // 3. Start first quest
    let activeQuests = startQuest(quests, quests[0].id);
    expect(activeQuests[0].status).toBe('active');

    // 4. Check for encounter
    const file = makeFile({ path: 'src/parser.ts', complexity: 5 });
    const encounterState = { ...createEncounterState(), stepsSinceLastEncounter: 10 };
    const encounterResult = checkEncounter(file, commits, [], encounterState, rng);
    expect(encounterResult.encounter).not.toBeNull();
    expect(encounterResult.encounter!.type).toBe('bug');

    // 5. Fight the battle
    const monster = encounterResult.encounter!.monster;
    let battle = initBattle(hero, [monster], 42);
    expect(battle.phase.type).toBe('PLAYER_TURN');

    // Fight to conclusion
    let turnCount = 0;
    while (battle.phase.type !== 'VICTORY' && battle.phase.type !== 'DEFEAT' && turnCount < 50) {
      const actions = getAvailableActions(battle);
      if (actions.availableSpells.length > 0 && battle.player.stats.mana >= 20 && turnCount % 2 === 0) {
        battle = executeTurn(battle, {
          type: 'CAST_SPELL',
          spellId: actions.availableSpells[0],
          targetIndex: 0,
        });
      } else {
        battle = executeTurn(battle, { type: 'ATTACK', targetIndex: 0 });
      }
      turnCount++;
    }

    // Battle should have concluded
    expect(['VICTORY', 'DEFEAT']).toContain(battle.phase.type);

    if (battle.phase.type === 'VICTORY') {
      // 6. Resolve rewards
      const rewardResult = resolveBattleRewards(battle, rng);
      expect(rewardResult).not.toBeNull();

      let inventory = createInventory();
      const progression = applyBattleRewards(hero, inventory, rewardResult!.rewards);
      expect(progression.rewards.xp).toBeGreaterThan(0);
      expect(progression.log.length).toBeGreaterThan(0);

      // 7. Check if loot was gained
      if (progression.rewards.lootItems.length > 0) {
        expect(progression.inventory.items.length).toBeGreaterThan(0);
      }

      // 8. Complete quest
      activeQuests = completeQuest(activeQuests, activeQuests[0].id);
      expect(activeQuests[0].status).toBe('completed');
      // Second quest should unlock
      expect(activeQuests[1].status).toBe('available');

      // 9. Apply quest rewards
      const questResult = applyQuestRewards(
        progression.character,
        progression.inventory,
        { ...activeQuests[0], status: 'active' as const }, // Need active for reward
      );
      expect(questResult.character.experience).toBeGreaterThan(hero.experience);

      // 10. Victory screen
      const screen = buildVictoryScreen(progression, hero.level);
      expect(screen.xpGained).toBeGreaterThan(0);

      // 11. Update statistics
      let stats = createBattleStatistics();
      stats = updateBattleStatistics(stats, battle, rewardResult!.rewards);
      expect(stats.totalBattles).toBe(1);
      expect(stats.victories).toBe(1);

      // 12. Save game state
      const json = createSaveSnapshot(
        questResult.character,
        questResult.inventory,
        activeQuests,
        encounterResult.state,
        stats,
        questResult.knowledge,
        { firstBattleWon: true },
        turnCount * 1000,
      );

      // 13. Validate and load save
      const validation = validateSave(json);
      expect(validation.valid).toBe(true);

      const loaded = loadFromJSON(json);
      expect(loaded.success).toBe(true);
      expect(loaded.character!.name).toBe('E2E-Hero');
      expect(loaded.character!.experience).toBeGreaterThan(hero.experience);
      expect(loaded.gameFlags!.firstBattleWon).toBe(true);
      expect(loaded.battleStats!.victories).toBe(1);
    }
  });

  it('should handle multi-class progression through multiple encounters', () => {
    const classes = ['tank', 'healer', 'dps'] as const;
    const rng = createRngState(100);

    for (const cls of classes) {
      const hero = createCharacter(cls, `${cls}-hero`, 5);
      const [monster] = createMonster('null-pointer', 2, 0, rng);

      let battle = initBattle(hero, [monster], 100);
      let turns = 0;
      while (battle.phase.type !== 'VICTORY' && battle.phase.type !== 'DEFEAT' && turns < 50) {
        battle = executeTurn(battle, { type: 'ATTACK', targetIndex: 0 });
        turns++;
      }

      // All classes should be able to finish battles
      expect(['VICTORY', 'DEFEAT']).toContain(battle.phase.type);
    }
  });

  it('should maintain deterministic replay across the full pipeline', () => {
    const hero = createCharacter('dps', 'Replay-Hero', 5);
    const [monster] = createMonster('null-pointer', 2, 0, createRngState(42));

    const actions = [
      { type: 'ATTACK' as const, targetIndex: 0 },
      { type: 'CAST_SPELL' as const, spellId: 'spell-sql-injection', targetIndex: 0 },
      { type: 'ATTACK' as const, targetIndex: 0 },
      { type: 'ATTACK' as const, targetIndex: 0 },
      { type: 'ATTACK' as const, targetIndex: 0 },
    ];

    const result1 = replayBattle(hero, [monster], 42, actions);
    const result2 = replayBattle(hero, [monster], 42, actions);

    expect(result1.player.stats.health).toBe(result2.player.stats.health);
    expect(result1.enemies[0].stats.health).toBe(result2.enemies[0].stats.health);
    expect(result1.turn).toBe(result2.turn);
    expect(result1.log.length).toBe(result2.log.length);
  });

  it('should generate 60+ quests from enough commits', () => {
    resetQuestIds();
    const commits: ParsedCommit[] = [];
    for (let i = 0; i < 60; i++) {
      commits.push(makeCommit({
        hash: `hash-${i.toString().padStart(3, '0')}`,
        message: i % 3 === 0 ? `fix: bug ${i}` : `feat: feature ${i}`,
        type: i % 3 === 0 ? 'bug-fix' : 'feature',
        insertions: 10 + i * 2,
        deletions: 5 + i,
      }));
    }
    const quests = generateQuestGraph(commits);
    expect(quests.length).toBe(60);
  });

  it('should handle item usage during combat flow', () => {
    const hero = createCharacter('dps', 'Item-Hero', 5);
    const hurtHero = {
      ...hero,
      stats: { ...hero.stats, health: 30 },
    };

    // Use a debug log to heal
    const result = useItem(hurtHero, 'item-debug-log');
    expect(result.consumed).toBe(true);
    expect(result.character.stats.health).toBe(50); // 30 + 20

    // Use rubber duck to cleanse
    const poisoned = {
      ...hero,
      statusEffects: [createStatusEffect('poison', 'Venom', 5, 3)],
    };
    const cleansed = useItem(poisoned, 'item-rubber-duck');
    expect(cleansed.consumed).toBe(true);
    expect(cleansed.character.statusEffects).toHaveLength(0);
  });

  it('should run archaeology quests for complex files', () => {
    resetQuestIds();
    const files = [
      makeFile({ path: 'src/legacy/old-parser.ts', complexity: 25 }),
      makeFile({ path: 'src/legacy/ancient-util.ts', complexity: 30 }),
    ];
    const archQuests = generateArchaeologyQuests(files, 15);
    expect(archQuests).toHaveLength(2);
    expect(archQuests.every(q => q.type === 'archaeology')).toBe(true);

    // Rewards should scale with complexity
    const r1 = getQuestRewards(archQuests[0]);
    const r2 = getQuestRewards(archQuests[1]);
    expect(r2.xp).toBeGreaterThan(r1.xp);
  });

  it('should scan encounters across a codebase', () => {
    const rng = createRngState(42);
    const files = [
      makeFile({ path: 'src/engine.ts', complexity: 25 }),
      makeFile({ path: 'src/parser.ts', complexity: 5 }),
      makeFile({ path: 'src/util.ts', complexity: 3 }),
    ];
    const commits = [
      makeCommit({ hash: 'fix1', filesChanged: ['src/parser.ts'], type: 'bug-fix' }),
    ];
    const hotspots: Hotspot[] = [];

    const { encounters } = scanAllEncounters(files, commits, hotspots, rng);
    expect(encounters.length).toBeGreaterThanOrEqual(1);
    expect(encounters.some(e => e.encounter.type === 'boss')).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════
// BALANCE SIMULATION (Quick sanity check)
// ════════════════════════════════════════════════════════════

describe('Balance Sanity Check', () => {
  it('should have DPS winning most fights vs severity-1 monsters', () => {
    const result = simulateMatchup(
      'dps', 5, 'null-pointer', 1, 0,
      { ...DEFAULT_SIM_CONFIG, trials: 100 },
    );
    expect(result.winRate).toBeGreaterThan(0.5);
  });

  it('should have tank surviving longer than DPS', () => {
    const tankResult = simulateMatchup(
      'tank', 5, 'null-pointer', 3, 0,
      { ...DEFAULT_SIM_CONFIG, trials: 50 },
    );
    const dpsResult = simulateMatchup(
      'dps', 5, 'null-pointer', 3, 0,
      { ...DEFAULT_SIM_CONFIG, trials: 50 },
    );
    // Tank should have longer average battles
    expect(tankResult.avgTurns).toBeGreaterThan(dpsResult.avgTurns);
  });

  it('should have severity-5 monsters be harder than severity-1', () => {
    const easy = simulateMatchup(
      'dps', 5, 'null-pointer', 1, 0,
      { ...DEFAULT_SIM_CONFIG, trials: 50 },
    );
    const hard = simulateMatchup(
      'dps', 5, 'memory-leak', 5, 8,
      { ...DEFAULT_SIM_CONFIG, trials: 50 },
    );
    // Higher severity + complexity should result in harder fights (more turns or lower win rate)
    expect(hard.avgTurns).toBeGreaterThan(easy.avgTurns);
  });

  it('should have higher level players winning more', () => {
    const low = simulateMatchup(
      'healer', 1, 'race-condition', 4, 5,
      { ...DEFAULT_SIM_CONFIG, trials: 50 },
    );
    const high = simulateMatchup(
      'healer', 20, 'race-condition', 4, 5,
      { ...DEFAULT_SIM_CONFIG, trials: 50 },
    );
    // Higher level should have equal or better win rate
    expect(high.winRate).toBeGreaterThanOrEqual(low.winRate);
    // Higher level should win more often (or at least not fewer) battles
    expect(high.victories).toBeGreaterThanOrEqual(low.victories);
  });
});
