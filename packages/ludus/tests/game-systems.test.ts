/**
 * Game Systems Tests — Steps 16-20
 *
 * Covers: QuestGenerator, EncounterSystem, InventorySystem, ProgressionSystem, EventWiring
 */

import { describe, it, expect, beforeEach } from 'bun:test';

// Seeded RNG
import { createRngState } from '../src/utils/SeededRandom.js';

// Quest Generator
import {
  generateQuestGraph,
  generateBugHuntQuests,
  generateArchaeologyQuests,
  generateHotspotQuests,
  unlockAvailableQuests,
  startQuest,
  completeQuest,
  getQuestsByStatus,
  getQuestRewards,
  resetQuestIds,
} from '../src/quest/QuestGenerator.js';

// Encounter System
import {
  checkEncounter,
  createEncounterState,
  markBossDefeated,
  markMinibossDefeated,
  markBugDefeated,
  scanAllEncounters,
  getEncounterDensity,
  DEFAULT_CONFIG,
} from '../src/encounter/EncounterSystem.js';

// Inventory System
import {
  getItem,
  getAllItems,
  createInventory,
  addItem,
  removeItem,
  hasItem,
  getItemCount,
  useItem,
  resolveLoot,
  resolveLootToInventory,
} from '../src/inventory/InventorySystem.js';

// Progression System
import {
  resolveBattleRewards,
  applyBattleRewards,
  applyQuestRewards,
  updateBattleStatistics,
  createBattleStatistics,
  buildVictoryScreen,
} from '../src/progression/ProgressionSystem.js';

// Combat (for building test states)
import { initBattle, executeTurn } from '../src/combat/TurnBasedEngine.js';

// Event Wiring
import {
  createGameSession,
  wireGameEvents,
  startBattle,
  dispatchCombatAction,
} from '../src/integration/EventWiring.js';
import { createGameStore } from '../src/state/GameStore.js';
import { createCharacter } from '../src/character/CharacterSystem.js';
import { createMonster } from '../src/combat/MonsterFactory.js';

import type { ParsedCommit, ParsedFile, Hotspot, Character, Monster, RngState, Quest, BattleState } from '@dendrovia/shared';
import { EventBus, getEventBus, GameEvents } from '@dendrovia/shared';

// ─── Test Helpers ───────────────────────────────────────────

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

function makeTestPlayer(): Character {
  return {
    id: 'player-1',
    name: 'TestHero',
    class: 'dps',
    level: 5,
    experience: 1250,
    stats: {
      health: 100,
      maxHealth: 100,
      mana: 80,
      maxMana: 80,
      attack: 15,
      defense: 5,
      speed: 8,
    },
    spells: ['spell-sql-injection', 'spell-fork-bomb', 'spell-buffer-overflow', 'spell-regex-nuke'],
    statusEffects: [],
    cooldowns: {},
  };
}

function makeTestMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'monster-test-1',
    name: 'TestBug',
    type: 'null-pointer',
    element: 'none',
    severity: 1,
    stats: {
      health: 50,
      maxHealth: 50,
      mana: 0,
      maxMana: 0,
      attack: 8,
      defense: 3,
      speed: 5,
    },
    spells: ['spell-null-deref'],
    statusEffects: [],
    xpReward: 25,
    lootTable: [{ itemId: 'item-debug-log', chance: 0.5 }],
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════
// QUEST GENERATOR (Step 16)
// ════════════════════════════════════════════════════════════

describe('QuestGenerator', () => {
  beforeEach(() => {
    resetQuestIds();
  });

  it('should generate quests from commits', () => {
    const commits = [
      makeCommit({ message: 'fix: null pointer in parser' }),
      makeCommit({ message: 'feat: add user auth', type: 'feature' }),
      makeCommit({ message: 'fix: memory leak in cache', type: 'bug-fix' }),
    ];
    const quests = generateQuestGraph(commits);
    expect(quests).toHaveLength(3);
    expect(quests[0].type).toBe('bug-hunt');
    expect(quests[1].type).toBe('feature');
    expect(quests[2].type).toBe('bug-hunt');
  });

  it('should assign IDs sequentially', () => {
    const commits = [makeCommit(), makeCommit()];
    const quests = generateQuestGraph(commits);
    expect(quests[0].id).toBe('quest-1');
    expect(quests[1].id).toBe('quest-2');
  });

  it('should chain prerequisites linearly', () => {
    const commits = [makeCommit(), makeCommit(), makeCommit()];
    const quests = generateQuestGraph(commits);
    expect(quests[0].requirements).toHaveLength(0);
    expect(quests[0].status).toBe('available');
    expect(quests[1].requirements).toEqual(['quest-1']);
    expect(quests[1].status).toBe('locked');
    expect(quests[2].requirements).toEqual(['quest-2']);
  });

  it('should scale XP rewards with commit size', () => {
    const small = makeCommit({ insertions: 5, deletions: 5 });
    const big = makeCommit({ insertions: 150, deletions: 80 });
    const [q1] = generateQuestGraph([small]);
    resetQuestIds();
    const [q2] = generateQuestGraph([big]);
    const r1 = getQuestRewards(q1);
    const r2 = getQuestRewards(q2);
    expect(r2.xp).toBeGreaterThan(r1.xp);
  });

  it('should add item rewards for large commits', () => {
    const huge = makeCommit({ insertions: 200, deletions: 100 });
    const [quest] = generateQuestGraph([huge]);
    const rewards = getQuestRewards(quest);
    expect(rewards.items.length).toBeGreaterThan(0);
  });

  it('should add knowledge rewards for multi-file commits', () => {
    const commit = makeCommit({ filesChanged: ['a.ts', 'b.ts', 'c.ts'] });
    const [quest] = generateQuestGraph([commit]);
    const rewards = getQuestRewards(quest);
    expect(rewards.knowledge.length).toBeGreaterThan(0);
  });

  it('should generate bug-hunt quests from bug-fix commits only', () => {
    const commits = [
      makeCommit({ type: 'bug-fix' }),
      makeCommit({ type: 'feature' }),
      makeCommit({ type: 'bug-fix' }),
    ];
    const bugQuests = generateBugHuntQuests(commits);
    expect(bugQuests).toHaveLength(2);
    expect(bugQuests.every(q => q.type === 'bug-hunt')).toBe(true);
  });

  it('should generate archaeology quests from complex files', () => {
    const files = [
      makeFile({ path: 'src/old.ts', complexity: 25 }),
      makeFile({ path: 'src/simple.ts', complexity: 5 }),
      makeFile({ path: 'src/legacy.ts', complexity: 30 }),
    ];
    const quests = generateArchaeologyQuests(files, 15);
    expect(quests).toHaveLength(2);
    expect(quests.every(q => q.type === 'archaeology')).toBe(true);
  });

  it('should generate hotspot quests', () => {
    const hotspots = [
      makeHotspot({ path: 'src/hot.ts', riskScore: 8 }),
      makeHotspot({ path: 'src/hotter.ts', riskScore: 9 }),
    ];
    const quests = generateHotspotQuests(hotspots);
    expect(quests).toHaveLength(2);
    expect(quests[0].description).toContain('risk score');
  });

  describe('Quest State Management', () => {
    it('should unlock quests when prerequisites are met', () => {
      const quests: Quest[] = [
        { id: 'q1', title: 'Q1', description: '', type: 'bug-hunt', status: 'completed', requirements: [], rewards: [] },
        { id: 'q2', title: 'Q2', description: '', type: 'bug-hunt', status: 'locked', requirements: ['q1'], rewards: [] },
        { id: 'q3', title: 'Q3', description: '', type: 'bug-hunt', status: 'locked', requirements: ['q2'], rewards: [] },
      ];
      const unlocked = unlockAvailableQuests(quests, new Set(['q1']));
      expect(unlocked[1].status).toBe('available');
      expect(unlocked[2].status).toBe('locked'); // q2 not completed yet
    });

    it('should start an available quest', () => {
      const quests: Quest[] = [
        { id: 'q1', title: 'Q1', description: '', type: 'bug-hunt', status: 'available', requirements: [], rewards: [] },
      ];
      const updated = startQuest(quests, 'q1');
      expect(updated[0].status).toBe('active');
    });

    it('should not start a locked quest', () => {
      const quests: Quest[] = [
        { id: 'q1', title: 'Q1', description: '', type: 'bug-hunt', status: 'locked', requirements: ['q0'], rewards: [] },
      ];
      const updated = startQuest(quests, 'q1');
      expect(updated[0].status).toBe('locked');
    });

    it('should complete a quest and unlock dependents', () => {
      const quests: Quest[] = [
        { id: 'q1', title: 'Q1', description: '', type: 'bug-hunt', status: 'active', requirements: [], rewards: [] },
        { id: 'q2', title: 'Q2', description: '', type: 'feature', status: 'locked', requirements: ['q1'], rewards: [] },
      ];
      const updated = completeQuest(quests, 'q1');
      expect(updated[0].status).toBe('completed');
      expect(updated[1].status).toBe('available');
    });

    it('should filter quests by status', () => {
      const quests: Quest[] = [
        { id: 'q1', title: '', description: '', type: 'bug-hunt', status: 'completed', requirements: [], rewards: [] },
        { id: 'q2', title: '', description: '', type: 'feature', status: 'available', requirements: [], rewards: [] },
        { id: 'q3', title: '', description: '', type: 'bug-hunt', status: 'available', requirements: [], rewards: [] },
      ];
      expect(getQuestsByStatus(quests, 'available')).toHaveLength(2);
      expect(getQuestsByStatus(quests, 'completed')).toHaveLength(1);
    });
  });
});

// ════════════════════════════════════════════════════════════
// ENCOUNTER SYSTEM (Step 17)
// ════════════════════════════════════════════════════════════

describe('EncounterSystem', () => {
  let rng: RngState;
  let encounterState: ReturnType<typeof createEncounterState>;

  beforeEach(() => {
    rng = createRngState(42);
    encounterState = createEncounterState();
    // Start past cooldown
    encounterState.stepsSinceLastEncounter = 10;
  });

  it('should trigger boss encounter for high-complexity files', () => {
    const file = makeFile({ complexity: 25 }); // Above threshold of 20
    const result = checkEncounter(file, [], [], encounterState, rng);
    expect(result.encounter).not.toBeNull();
    expect(result.encounter!.type).toBe('boss');
  });

  it('should trigger miniboss encounter for hotspot files', () => {
    const file = makeFile({ path: 'src/hot.ts', complexity: 10 });
    const hotspots = [makeHotspot({ path: 'src/hot.ts', riskScore: 7 })];
    const result = checkEncounter(file, [], hotspots, encounterState, rng);
    expect(result.encounter).not.toBeNull();
    expect(result.encounter!.type).toBe('miniboss');
  });

  it('should trigger bug encounter for bug-fix commits', () => {
    const file = makeFile({ path: 'src/parser.ts', complexity: 5 });
    const commits = [makeCommit({ filesChanged: ['src/parser.ts'], type: 'bug-fix' })];
    const result = checkEncounter(file, commits, [], encounterState, rng);
    expect(result.encounter).not.toBeNull();
    expect(result.encounter!.type).toBe('bug');
  });

  it('should respect encounter cooldown', () => {
    const file = makeFile({ complexity: 25 });
    const freshState = createEncounterState(); // stepsSinceLastEncounter = 0
    const result = checkEncounter(file, [], [], freshState, rng);
    expect(result.encounter).toBeNull(); // Within cooldown
  });

  it('should not re-trigger defeated bosses', () => {
    const file = makeFile({ path: 'src/boss.ts', complexity: 25 });
    const state = { ...encounterState, defeatedBosses: new Set(['src/boss.ts']) };
    const result = checkEncounter(file, [], [], state, rng);
    // Boss is defeated, so no boss encounter; might get random encounter
    expect(result.encounter?.type !== 'boss' || result.encounter === null).toBe(true);
  });

  it('should not re-trigger defeated minibosses', () => {
    const file = makeFile({ path: 'src/hot.ts', complexity: 10 });
    const hotspots = [makeHotspot({ path: 'src/hot.ts', riskScore: 7 })];
    const state = { ...encounterState, defeatedMinibosses: new Set(['src/hot.ts']) };
    const result = checkEncounter(file, [], hotspots, state, rng);
    expect(result.encounter?.type !== 'miniboss' || result.encounter === null).toBe(true);
  });

  it('should mark encounters as defeated', () => {
    let state = createEncounterState();
    state = markBossDefeated(state, 'src/boss.ts');
    expect(state.defeatedBosses.has('src/boss.ts')).toBe(true);

    state = markMinibossDefeated(state, 'src/hot.ts');
    expect(state.defeatedMinibosses.has('src/hot.ts')).toBe(true);

    state = markBugDefeated(state, 'hash-abc123');
    expect(state.defeatedBugs.has('hash-abc123')).toBe(true);
  });

  it('should prioritize boss > miniboss > bug', () => {
    // File has both high complexity and a hotspot
    const file = makeFile({ path: 'src/complex.ts', complexity: 25 });
    const hotspots = [makeHotspot({ path: 'src/complex.ts', riskScore: 9 })];
    const commits = [makeCommit({ filesChanged: ['src/complex.ts'] })];

    const result = checkEncounter(file, commits, hotspots, encounterState, rng);
    expect(result.encounter!.type).toBe('boss'); // Boss takes priority
  });

  it('should scan all encounters across files', () => {
    const files = [
      makeFile({ path: 'src/boss.ts', complexity: 25 }),
      makeFile({ path: 'src/hot.ts', complexity: 10 }),
      makeFile({ path: 'src/buggy.ts', complexity: 5 }),
    ];
    const hotspots = [makeHotspot({ path: 'src/hot.ts', riskScore: 7 })];
    const commits = [makeCommit({ filesChanged: ['src/buggy.ts'] })];

    const { encounters } = scanAllEncounters(files, commits, hotspots, rng);
    expect(encounters).toHaveLength(3);
    expect(encounters[0].encounter.type).toBe('boss');
    expect(encounters[1].encounter.type).toBe('miniboss');
    expect(encounters[2].encounter.type).toBe('bug');
  });

  it('should compute encounter density', () => {
    const files = [
      makeFile({ path: 'a.ts', complexity: 25 }),
      makeFile({ path: 'b.ts', complexity: 5 }),
      makeFile({ path: 'c.ts', complexity: 5 }),
      makeFile({ path: 'd.ts', complexity: 5 }),
    ];
    const density = getEncounterDensity(files, [], [], DEFAULT_CONFIG);
    expect(density).toBe(0.25); // 1 boss out of 4 files
  });

  it('should reset cooldown counter after encounter', () => {
    const file = makeFile({ complexity: 25 });
    const result = checkEncounter(file, [], [], encounterState, rng);
    expect(result.state.stepsSinceLastEncounter).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════
// INVENTORY SYSTEM (Step 18)
// ════════════════════════════════════════════════════════════

describe('InventorySystem', () => {
  it('should have items registered', () => {
    expect(getItem('item-debug-log')).toBeDefined();
    expect(getItem('item-stack-trace')).toBeDefined();
    expect(getItem('item-core-dump')).toBeDefined();
    expect(getItem('item-memory-snapshot')).toBeDefined();
    expect(getItem('item-root-cause')).toBeDefined();
    expect(getItem('item-rubber-duck')).toBeDefined();
  });

  it('should have 10+ items in registry', () => {
    expect(getAllItems().length).toBeGreaterThanOrEqual(10);
  });

  describe('Inventory Management', () => {
    it('should create empty inventory', () => {
      const inv = createInventory();
      expect(inv.items).toHaveLength(0);
      expect(inv.maxSlots).toBe(20);
    });

    it('should add items', () => {
      let inv = createInventory();
      inv = addItem(inv, 'item-debug-log', 3);
      expect(hasItem(inv, 'item-debug-log')).toBe(true);
      expect(getItemCount(inv, 'item-debug-log')).toBe(3);
    });

    it('should stack items', () => {
      let inv = createInventory();
      inv = addItem(inv, 'item-debug-log', 2);
      inv = addItem(inv, 'item-debug-log', 3);
      expect(getItemCount(inv, 'item-debug-log')).toBe(5);
      expect(inv.items).toHaveLength(1); // Single slot
    });

    it('should remove items', () => {
      let inv = createInventory();
      inv = addItem(inv, 'item-debug-log', 5);
      inv = removeItem(inv, 'item-debug-log', 2);
      expect(getItemCount(inv, 'item-debug-log')).toBe(3);
    });

    it('should remove slot when quantity reaches 0', () => {
      let inv = createInventory();
      inv = addItem(inv, 'item-debug-log', 3);
      inv = removeItem(inv, 'item-debug-log', 3);
      expect(inv.items).toHaveLength(0);
      expect(hasItem(inv, 'item-debug-log')).toBe(false);
    });

    it('should not remove more than available', () => {
      let inv = createInventory();
      inv = addItem(inv, 'item-debug-log', 2);
      const result = removeItem(inv, 'item-debug-log', 5);
      expect(getItemCount(result, 'item-debug-log')).toBe(2); // Unchanged
    });

    it('should respect max slots', () => {
      let inv = createInventory(2);
      inv = addItem(inv, 'item-debug-log');
      inv = addItem(inv, 'item-stack-trace');
      inv = addItem(inv, 'item-core-dump'); // Should be rejected
      expect(inv.items).toHaveLength(2);
      expect(hasItem(inv, 'item-core-dump')).toBe(false);
    });
  });

  describe('Item Usage', () => {
    let player: Character;

    beforeEach(() => {
      player = makeTestPlayer();
    });

    it('should heal HP with heal-hp item', () => {
      const hurt = { ...player, stats: { ...player.stats, health: 50 } };
      const result = useItem(hurt, 'item-debug-log');
      expect(result.consumed).toBe(true);
      expect(result.character.stats.health).toBe(70); // 50 + 20
    });

    it('should cap heal at max HP', () => {
      const result = useItem(player, 'item-debug-log');
      expect(result.consumed).toBe(true);
      expect(result.character.stats.health).toBe(100); // Already full
    });

    it('should restore mana with heal-mana item', () => {
      const lowMana = { ...player, stats: { ...player.stats, mana: 10 } };
      const result = useItem(lowMana, 'item-stack-trace');
      expect(result.consumed).toBe(true);
      expect(result.character.stats.mana).toBe(35); // 10 + 25
    });

    it('should apply attack buff', () => {
      const result = useItem(player, 'item-root-cause');
      expect(result.consumed).toBe(true);
      expect(result.character.statusEffects.some(e => e.type === 'attack-up')).toBe(true);
    });

    it('should cleanse debuffs with rubber duck', () => {
      const poisoned = {
        ...player,
        statusEffects: [
          { id: 'fx-1', name: 'Venom', type: 'poison' as const, value: 5, remainingTurns: 3, stackable: false },
        ],
      };
      const result = useItem(poisoned, 'item-rubber-duck');
      expect(result.consumed).toBe(true);
      expect(result.character.statusEffects).toHaveLength(0);
    });

    it('should reject unknown items', () => {
      const result = useItem(player, 'item-nonexistent');
      expect(result.consumed).toBe(false);
    });
  });

  describe('Loot Resolution', () => {
    it('should resolve loot from loot table', () => {
      const rng = createRngState(42);
      const lootTable = [
        { itemId: 'item-debug-log', chance: 1.0 }, // Guaranteed
        { itemId: 'item-root-cause', chance: 0.0 }, // Never
      ];
      const { items } = resolveLoot(lootTable, rng);
      expect(items).toContain('item-debug-log');
      expect(items).not.toContain('item-root-cause');
    });

    it('should resolve loot to inventory', () => {
      const rng = createRngState(42);
      const lootTable = [
        { itemId: 'item-debug-log', chance: 1.0 },
      ];
      let inv = createInventory();
      const result = resolveLootToInventory(lootTable, inv, rng);
      expect(hasItem(result.inventory, 'item-debug-log')).toBe(true);
    });

    it('should be deterministic with same seed', () => {
      const rng = createRngState(42);
      const lootTable = [
        { itemId: 'item-debug-log', chance: 0.5 },
        { itemId: 'item-stack-trace', chance: 0.3 },
        { itemId: 'item-core-dump', chance: 0.2 },
      ];
      const { items: items1 } = resolveLoot(lootTable, rng);
      const { items: items2 } = resolveLoot(lootTable, rng);
      expect(items1).toEqual(items2);
    });
  });
});

// ════════════════════════════════════════════════════════════
// PROGRESSION SYSTEM (Step 19)
// ════════════════════════════════════════════════════════════

describe('ProgressionSystem', () => {
  let player: Character;
  let rng: RngState;

  beforeEach(() => {
    player = makeTestPlayer();
    rng = createRngState(42);
  });

  it('should resolve battle rewards from victory state', () => {
    const monster = makeTestMonster({ xpReward: 100 });
    let state = initBattle(player, [monster], 42);

    // Fight to victory
    while (state.phase.type !== 'VICTORY' && state.phase.type !== 'DEFEAT') {
      state = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });
    }

    if (state.phase.type === 'VICTORY') {
      const result = resolveBattleRewards(state, rng);
      expect(result).not.toBeNull();
      expect(result!.rewards.xp).toBe(100);
      expect(result!.rewards.monstersDefeated).toBe(1);
    }
  });

  it('should return null for non-victory states', () => {
    const state = initBattle(player, [makeTestMonster()], 42);
    const result = resolveBattleRewards(state, rng);
    expect(result).toBeNull();
  });

  it('should apply battle rewards and level up', () => {
    // Player at level 5, XP 1250. Next level at 50 * 36 = 1800. Need 550 XP.
    const inventory = createInventory();
    const rewards = {
      xp: 600, // Enough to level up
      lootItems: ['item-debug-log'],
      monstersDefeated: 1,
      bossDefeated: false,
      turnsElapsed: 5,
    };

    const result = applyBattleRewards(player, inventory, rewards);
    expect(result.character.level).toBe(6);
    expect(result.levelUpResult.leveledUp).toBe(true);
    expect(hasItem(result.inventory, 'item-debug-log')).toBe(true);
    expect(result.log.some(l => l.includes('LEVEL UP'))).toBe(true);
  });

  it('should apply quest rewards', () => {
    const quest: Quest = {
      id: 'q1',
      title: 'Test Quest',
      description: 'A test',
      type: 'bug-hunt',
      status: 'active',
      requirements: [],
      rewards: [
        { type: 'experience', value: 200 },
        { type: 'item', value: 'item-core-dump' },
        { type: 'knowledge', value: 'knowledge-test' },
      ],
    };

    const inventory = createInventory();
    const result = applyQuestRewards(player, inventory, quest);
    expect(result.character.experience).toBeGreaterThan(player.experience);
    expect(hasItem(result.inventory, 'item-core-dump')).toBe(true);
    expect(result.knowledge).toContain('knowledge-test');
  });

  describe('Battle Statistics', () => {
    it('should track battle statistics', () => {
      let stats = createBattleStatistics();
      expect(stats.totalBattles).toBe(0);

      // Simulate a victory
      const weakMonster = makeTestMonster({
        stats: { ...makeTestMonster().stats, health: 1, maxHealth: 1 },
        xpReward: 50,
      });
      let state = initBattle(player, [weakMonster], 42);
      state = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });

      stats = updateBattleStatistics(stats, state, {
        xp: 50, lootItems: [], monstersDefeated: 1, bossDefeated: false, turnsElapsed: 1,
      });

      expect(stats.totalBattles).toBe(1);
      expect(stats.victories).toBe(1);
      expect(stats.monstersDefeated).toBe(1);
    });

    it('should track fastest victory', () => {
      let stats = createBattleStatistics();
      const weakMonster = makeTestMonster({
        stats: { ...makeTestMonster().stats, health: 1, maxHealth: 1 },
      });

      let state = initBattle(player, [weakMonster], 42);
      state = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });

      stats = updateBattleStatistics(stats, state, {
        xp: 25, lootItems: [], monstersDefeated: 1, bossDefeated: false, turnsElapsed: 1,
      });

      expect(stats.fastestVictory).toBe(1);
    });
  });

  describe('Victory Screen', () => {
    it('should build victory screen data', () => {
      const inventory = createInventory();
      const rewards = {
        xp: 600,
        lootItems: ['item-debug-log'],
        monstersDefeated: 1,
        bossDefeated: false,
        turnsElapsed: 5,
      };
      const progression = applyBattleRewards(player, inventory, rewards);
      const screen = buildVictoryScreen(progression, 5);

      expect(screen.title).toBe('VICTORY!');
      expect(screen.xpGained).toBe(600);
      expect(screen.levelBefore).toBe(5);
      expect(screen.levelAfter).toBe(6);
      expect(screen.lootItems).toContain('item-debug-log');
    });

    it('should show boss title when boss defeated', () => {
      const inventory = createInventory();
      const rewards = {
        xp: 1000,
        lootItems: [],
        monstersDefeated: 1,
        bossDefeated: true,
        turnsElapsed: 10,
      };
      const progression = applyBattleRewards(player, inventory, rewards);
      const screen = buildVictoryScreen(progression, 5);
      expect(screen.title).toBe('BOSS DEFEATED!');
    });
  });
});

// ════════════════════════════════════════════════════════════
// EVENT WIRING / INTEGRATION (Step 20)
// ════════════════════════════════════════════════════════════

describe('EventWiring', () => {
  let session: ReturnType<typeof createGameSession>;
  let store: ReturnType<typeof createGameStore>;

  beforeEach(() => {
    const char = createCharacter('dps', 'TestHero', 5);
    store = createGameStore({
      character: char,
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      battleState: null,
      gameFlags: {},
    });

    const files = [makeFile({ path: 'src/a.ts', complexity: 5 })];
    const commits = [makeCommit({ filesChanged: ['src/a.ts'] })];
    const hotspots: Hotspot[] = [];

    session = createGameSession(store, files, commits, hotspots, 42);
  });

  it('should create a game session', () => {
    expect(session.store).toBe(store);
    expect(session.encounterState.stepsSinceLastEncounter).toBe(0);
    expect(session.battleStats.totalBattles).toBe(0);
  });

  it('should start a battle directly', () => {
    const rng = createRngState(42);
    const [monster] = createMonster('null-pointer', 1, 0, rng);
    const battleState = startBattle(session, [monster]);
    expect(battleState.phase.type).toBe('PLAYER_TURN');
    expect(store.getState().battleState).not.toBeNull();
  });

  it('should dispatch combat actions', () => {
    const rng = createRngState(42);
    const [monster] = createMonster('null-pointer', 1, 0, rng);
    startBattle(session, [monster]);

    const result = dispatchCombatAction(session, { type: 'ATTACK', targetIndex: 0 });
    expect(result).not.toBeNull();
  });

  it('should return null when no battle is active', () => {
    const result = dispatchCombatAction(session, { type: 'ATTACK', targetIndex: 0 });
    expect(result).toBeNull();
  });

  it('should wire and cleanup events', () => {
    const cleanup = wireGameEvents(session);
    expect(typeof cleanup).toBe('function');
    cleanup(); // Should not throw
  });

  it('should resolve full battle through session', () => {
    const rng = createRngState(42);
    const [monster] = createMonster('null-pointer', 1, 0, rng);
    // Give monster very low HP for quick resolution
    const weakMonster: Monster = {
      ...monster,
      stats: { ...monster.stats, health: 1, maxHealth: 1 },
    };

    startBattle(session, [weakMonster]);

    const result = dispatchCombatAction(session, { type: 'ATTACK', targetIndex: 0 });
    // Should have ended in victory, clearing battleState
    const state = store.getState();
    expect(state.battleState).toBeNull();
  });
});
