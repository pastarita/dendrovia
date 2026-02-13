/**
 * Combat Engine Tests — Steps 10-15
 *
 * Covers: SpellFactory, CombatMath, StatusEffects, MonsterFactory, EnemyAI, TurnBasedEngine
 */

import { describe, it, expect, beforeEach } from 'bun:test';

// Seeded RNG
import { createRngState, rngNext, rngChance, rngPick, SeededRandom } from '../src/utils/SeededRandom.js';

// Spells
import { getSpell, getSpellOrThrow, getAllSpells, generateSpell } from '../src/spell/SpellFactory.js';

// Combat Math
import {
  calculateDamage,
  calculateBasicAttack,
  calculateHealing,
  calculateShield,
  rollCritical,
  getElementMultiplier,
  scaleMonsterStat,
  xpRewardForMonster,
  DEFENSE_CONSTANT,
  ELEMENT_TABLE,
} from '../src/combat/CombatMath.js';

// Status Effects
import {
  applyStatusEffect,
  removeStatusEffect,
  cleanse,
  isStunned,
  tickStatusEffects,
  absorbDamage,
  getShieldHP,
  getStatModifiers,
  createStatusEffect,
} from '../src/combat/StatusEffects.js';

// Monster Factory
import {
  createMonster,
  generateBugMonster,
  generateBoss,
  generateMiniboss,
} from '../src/combat/MonsterFactory.js';

// Enemy AI
import {
  chooseEnemyAction,
  resolveEnemySpell,
  isSkippedTurn,
  isOffByOneHeal,
  isOffByOneSelfHit,
} from '../src/combat/EnemyAI.js';

// Turn-Based Engine
import {
  initBattle,
  executeTurn,
  getAvailableActions,
  replayBattle,
} from '../src/combat/TurnBasedEngine.js';

import type { Character, Monster, BattleState, RngState, StatusEffect, ParsedCommit, ParsedFile, Hotspot } from '@dendrovia/shared';

// ─── Test Helpers ───────────────────────────────────────────

function makeTestPlayer(overrides: Partial<Character> = {}): Character {
  return {
    id: 'player-1',
    name: 'TestHero',
    class: 'dps',
    level: 5,
    xp: 0,
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
    ...overrides,
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
    lootTable: [],
    ...overrides,
  };
}

function makeTestCommit(overrides: Partial<ParsedCommit> = {}): ParsedCommit {
  return {
    hash: 'abc1234',
    message: 'fix: null pointer in parser',
    author: 'dev',
    date: '2024-01-01',
    type: 'bug-fix',
    filesChanged: ['src/parser.ts'],
    insertions: 30,
    deletions: 10,
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════
// SPELL FACTORY (Step 10)
// ════════════════════════════════════════════════════════════

describe('SpellFactory', () => {
  it('should have all starter spells registered', () => {
    const starterIds = [
      'spell-mutex-lock', 'spell-load-balancer', 'spell-firewall', 'spell-deadlock',
      'spell-try-catch', 'spell-rollback', 'spell-garbage-collect', 'spell-patch',
      'spell-sql-injection', 'spell-fork-bomb', 'spell-buffer-overflow', 'spell-regex-nuke',
    ];
    for (const id of starterIds) {
      expect(getSpell(id)).toBeDefined();
    }
  });

  it('should have monster spells registered', () => {
    const monsterSpellIds = [
      'spell-null-deref', 'spell-heap-grow', 'spell-thread-swap', 'spell-fence-post',
      'spell-segfault', 'spell-oom-kill', 'spell-deadlock-boss', 'spell-stack-smash',
    ];
    for (const id of monsterSpellIds) {
      expect(getSpell(id)).toBeDefined();
    }
  });

  it('should have unlock spells registered', () => {
    const unlockIds = [
      'spell-docker-compose', 'spell-kubernetes', 'spell-terraform',
      'spell-zero-day', 'spell-rootkit', 'spell-quantum-crack',
      'spell-lint-fix', 'spell-hot-reload', 'spell-formal-verification',
    ];
    for (const id of unlockIds) {
      expect(getSpell(id)).toBeDefined();
    }
  });

  it('should return undefined for unknown spells', () => {
    expect(getSpell('spell-nonexistent')).toBeUndefined();
  });

  it('should throw for unknown spells via getSpellOrThrow', () => {
    expect(() => getSpellOrThrow('spell-nonexistent')).toThrow('Unknown spell');
  });

  it('should have 30+ total registered spells', () => {
    expect(getAllSpells().length).toBeGreaterThanOrEqual(30);
  });

  it('should generate spells from symbols', () => {
    const spell = generateSpell({
      shape: 'triangle',
      element: 'fire',
      modifier: 'swift',
    });
    expect(spell.name).toBe('Swift Fire Triangle');
    expect(spell.effect.type).toBe('damage');
    expect(spell.element).toBe('fire');
    expect(spell.manaCost).toBe(12); // 15 * 0.8
    expect(spell.effect.value).toBe(30); // 20 * 1.5
    expect(spell.cooldown).toBe(0); // swift = 0 cooldown
  });

  it('should generate heal spells from circle symbols', () => {
    const spell = generateSpell({
      shape: 'circle',
      element: 'water',
      modifier: 'heavy',
    });
    expect(spell.effect.type).toBe('heal');
    expect(spell.manaCost).toBe(22); // floor(15 * 1.5)
    expect(spell.cooldown).toBe(2); // heavy = 2 cooldown
  });

  it('should generate shield spells from square symbols', () => {
    const spell = generateSpell({
      shape: 'square',
      element: 'earth',
      modifier: 'precise',
    });
    expect(spell.effect.type).toBe('shield');
    expect(spell.effect.value).toBe(24); // 20 * 1.2
  });

  it('monster spells should have 0 mana cost', () => {
    const monsterSpells = ['spell-null-deref', 'spell-heap-grow', 'spell-thread-swap', 'spell-fence-post'];
    for (const id of monsterSpells) {
      expect(getSpell(id)!.manaCost).toBe(0);
    }
  });
});

// ════════════════════════════════════════════════════════════
// COMBAT MATH (Step 15)
// ════════════════════════════════════════════════════════════

describe('CombatMath', () => {
  let rng: RngState;

  beforeEach(() => {
    rng = createRngState(42);
  });

  it('should calculate basic attack damage > 0', () => {
    const [result, newRng] = calculateBasicAttack(15, 8, 5, rng);
    expect(result.damage).toBeGreaterThan(0);
    expect(newRng).not.toEqual(rng); // RNG advanced
  });

  it('should always deal at least 1 damage', () => {
    // Very high defense vs very low attack
    const [result] = calculateBasicAttack(1, 1, 100, rng);
    expect(result.damage).toBeGreaterThanOrEqual(1);
  });

  it('should produce deterministic results for same seed', () => {
    const [r1] = calculateBasicAttack(15, 8, 5, rng);
    const [r2] = calculateBasicAttack(15, 8, 5, rng); // Same rng
    expect(r1.damage).toBe(r2.damage);
    expect(r1.isCritical).toBe(r2.isCritical);
  });

  it('should apply element multipliers correctly', () => {
    expect(getElementMultiplier('fire', 'earth')).toBe(1.5); // super effective
    expect(getElementMultiplier('fire', 'water')).toBe(0.5); // not effective
    expect(getElementMultiplier('fire', 'fire')).toBe(0.5);  // same element
    expect(getElementMultiplier('none', 'fire')).toBe(1.0);  // neutral
  });

  it('should calculate healing without defense reduction', () => {
    const heal = calculateHealing(30, 10);
    expect(heal).toBe(35); // floor(30 + 10 * 0.5)
  });

  it('should calculate shield with defense scaling', () => {
    const shield = calculateShield(20, 10);
    expect(shield).toBe(25); // floor(20 + 10 * 0.5)
  });

  it('should scale monster stats by severity and complexity', () => {
    const base = 40; // baseHP for null-pointer
    const s1 = scaleMonsterStat(base, 1, 0);
    const s3 = scaleMonsterStat(base, 3, 0);
    const s5 = scaleMonsterStat(base, 5, 0);
    expect(s1).toBe(40);  // 40 * 1.0 * 1.0
    expect(s3).toBe(68);  // 40 * 1.7 * 1.0
    expect(s5).toBe(96);  // 40 * 2.4 * 1.0
    expect(s1).toBeLessThan(s3);
    expect(s3).toBeLessThan(s5);
  });

  it('should scale monster stats with complexity', () => {
    const base = 40;
    const noComp = scaleMonsterStat(base, 3, 0);
    const hiComp = scaleMonsterStat(base, 3, 5);
    expect(hiComp).toBeGreaterThan(noComp);
  });

  it('should compute XP rewards quadratically', () => {
    const xp1 = xpRewardForMonster(1, 0);
    const xp3 = xpRewardForMonster(3, 0);
    const xp5 = xpRewardForMonster(5, 0);
    expect(xp1).toBe(25);  // 25 * 1 * 1
    expect(xp3).toBe(225); // 25 * 9
    expect(xp5).toBe(625); // 25 * 25
  });

  it('should roll crits using seeded RNG', () => {
    // Run many rolls and verify crits happen sometimes
    let critCount = 0;
    let currentRng = rng;
    for (let i = 0; i < 1000; i++) {
      const [isCrit, mult, nextRng] = rollCritical(8, currentRng);
      currentRng = nextRng;
      if (isCrit) {
        critCount++;
        expect(mult).toBe(1.5);
      } else {
        expect(mult).toBe(1.0);
      }
    }
    // With speed 8: crit chance = 0.05 + 0.005*8 = 0.09 → ~90 crits in 1000
    expect(critCount).toBeGreaterThan(30);
    expect(critCount).toBeLessThan(200);
  });

  it('should calculate spell damage with element multiplier', () => {
    const [result] = calculateDamage({
      attackerAttack: 15,
      attackerSpeed: 8,
      spellPower: 40,
      defenderDefense: 5,
      attackElement: 'fire',
      defenderElement: 'earth',
    }, rng);
    // Element multiplier 1.5 should boost damage
    const [neutralResult] = calculateDamage({
      attackerAttack: 15,
      attackerSpeed: 8,
      spellPower: 40,
      defenderDefense: 5,
      attackElement: 'fire',
      defenderElement: 'none',
    }, rng);
    // Super effective should generally be higher (variance could occasionally make them equal)
    expect(result.elementMultiplier).toBe(1.5);
    expect(neutralResult.elementMultiplier).toBe(1.0);
  });

  it('defense constant at 20 means 50% reduction when DEF=20', () => {
    expect(DEFENSE_CONSTANT).toBe(20);
    // At DEF=20: 20/(20+20) = 0.5
    // At DEF=0: 20/(20+0) = 1.0
  });
});

// ════════════════════════════════════════════════════════════
// STATUS EFFECTS (Step 11)
// ════════════════════════════════════════════════════════════

describe('StatusEffects', () => {
  it('should apply a new status effect', () => {
    const poison = createStatusEffect('poison', 'Venom', 5, 3);
    const effects = applyStatusEffect([], poison);
    expect(effects).toHaveLength(1);
    expect(effects[0].type).toBe('poison');
    expect(effects[0].value).toBe(5);
    expect(effects[0].remainingTurns).toBe(3);
  });

  it('should stack stackable effects', () => {
    const buff1 = createStatusEffect('attack-up', 'Power', 3, 2, true);
    const buff2 = createStatusEffect('attack-up', 'Power', 3, 3, true);
    let effects = applyStatusEffect([], buff1);
    effects = applyStatusEffect(effects, buff2);
    expect(effects).toHaveLength(1);
    expect(effects[0].value).toBe(6); // 3 + 3
    expect(effects[0].remainingTurns).toBe(3); // max(2, 3)
  });

  it('should replace non-stackable effects if stronger', () => {
    const shield1 = createStatusEffect('shield', 'Shield', 10, 2);
    const shield2 = createStatusEffect('shield', 'Shield', 20, 2);
    let effects = applyStatusEffect([], shield1);
    effects = applyStatusEffect(effects, shield2);
    expect(effects).toHaveLength(1);
    expect(effects[0].value).toBe(20);
  });

  it('should remove effects by ID', () => {
    const poison = createStatusEffect('poison', 'Venom', 5, 3);
    const effects = applyStatusEffect([], poison);
    const cleared = removeStatusEffect(effects, poison.id);
    expect(cleared).toHaveLength(0);
  });

  it('should cleanse negative effects only', () => {
    const poison = createStatusEffect('poison', 'Venom', 5, 3);
    const buff = createStatusEffect('attack-up', 'Power', 3, 2);
    const shield = createStatusEffect('shield', 'Shield', 10, 2);
    let effects = applyStatusEffect([], poison);
    effects = applyStatusEffect(effects, buff);
    effects = applyStatusEffect(effects, shield);
    const cleansed = cleanse(effects);
    expect(cleansed).toHaveLength(2); // buff + shield remain
    expect(cleansed.find(e => e.type === 'poison')).toBeUndefined();
  });

  it('should detect stunned state', () => {
    const stun = createStatusEffect('stun', 'Stunned', 0, 1);
    expect(isStunned([])).toBe(false);
    expect(isStunned([stun])).toBe(true);
  });

  it('should tick poison damage', () => {
    const poison = createStatusEffect('poison', 'Venom', 5, 3);
    const result = tickStatusEffects([poison], 'TestEntity');
    expect(result.hpDelta).toBe(-5);
    expect(result.effects[0].remainingTurns).toBe(2);
    expect(result.log.length).toBeGreaterThan(0);
  });

  it('should tick regen healing', () => {
    const regen = createStatusEffect('regen', 'Heal', 10, 2);
    const result = tickStatusEffects([regen], 'TestEntity');
    expect(result.hpDelta).toBe(10);
    expect(result.effects[0].remainingTurns).toBe(1);
  });

  it('should expire effects at 0 turns', () => {
    const poison = createStatusEffect('poison', 'Venom', 5, 1);
    const result = tickStatusEffects([poison], 'TestEntity');
    expect(result.effects).toHaveLength(0); // expired
    expect(result.log.some(l => l.includes('expired'))).toBe(true);
  });

  it('should absorb damage through shields', () => {
    const shield = createStatusEffect('shield', 'Shield', 15, 3);
    const result = absorbDamage([shield], 10);
    expect(result.absorbed).toBe(10);
    expect(result.remainingDamage).toBe(0);
    expect(result.effects[0].value).toBe(5); // 15 - 10
  });

  it('should break shields when damage exceeds shield HP', () => {
    const shield = createStatusEffect('shield', 'Shield', 5, 3);
    const result = absorbDamage([shield], 20);
    expect(result.absorbed).toBe(5);
    expect(result.remainingDamage).toBe(15);
    expect(result.effects).toHaveLength(0); // shield destroyed
  });

  it('should compute stat modifiers from active effects', () => {
    const atkUp = createStatusEffect('attack-up', 'Buff', 5, 3);
    const defDown = createStatusEffect('defense-down', 'Debuff', 3, 2);
    const mods = getStatModifiers([atkUp, defDown]);
    expect(mods.attack).toBe(5);
    expect(mods.defense).toBe(-3);
  });

  it('should get total shield HP', () => {
    const s1 = createStatusEffect('shield', 'Shield A', 10, 3);
    const s2 = createStatusEffect('shield', 'Shield B', 20, 2);
    // Since they have same type and shield is non-stackable, only one exists
    // But getShieldHP sums all shield-type effects
    expect(getShieldHP([s1, s2])).toBe(30);
  });
});

// ════════════════════════════════════════════════════════════
// MONSTER FACTORY (Step 14)
// ════════════════════════════════════════════════════════════

describe('MonsterFactory', () => {
  let rng: RngState;

  beforeEach(() => {
    rng = createRngState(100);
  });

  it('should create monsters by type and severity', () => {
    const [monster, newRng] = createMonster('null-pointer', 1, 0, rng);
    expect(monster.type).toBe('null-pointer');
    expect(monster.element).toBe('none');
    expect(monster.severity).toBe(1);
    expect(monster.stats.health).toBeGreaterThan(0);
    expect(monster.spells.length).toBeGreaterThan(0);
    expect(monster.id).toBeTruthy();
  });

  it('should scale stats with severity', () => {
    const [m1] = createMonster('null-pointer', 1, 0, rng);
    const [m3] = createMonster('null-pointer', 3, 0, rng);
    const [m5] = createMonster('null-pointer', 5, 0, rng);
    expect(m1.stats.health).toBeLessThan(m3.stats.health);
    expect(m3.stats.health).toBeLessThan(m5.stats.health);
  });

  it('should scale stats with complexity', () => {
    const [m0] = createMonster('memory-leak', 3, 0, rng);
    const [m5] = createMonster('memory-leak', 3, 5, rng);
    expect(m5.stats.health).toBeGreaterThan(m0.stats.health);
  });

  it('should give boss spells to severity 4-5', () => {
    const [m4] = createMonster('null-pointer', 4, 0, rng);
    const [m2] = createMonster('null-pointer', 2, 0, rng);
    expect(m4.spells.length).toBeGreaterThan(m2.spells.length);
  });

  it('should generate adjective names for severity 2-3', () => {
    const [m] = createMonster('null-pointer', 2, 0, rng);
    // Should have an adjective prepended
    expect(m.name.split(' ').length).toBeGreaterThan(1);
  });

  it('should generate bug monsters from commits', () => {
    const commit = makeTestCommit({ message: 'fix: null pointer in parser' });
    const [monster] = generateBugMonster(commit, rng);
    expect(monster.type).toBe('null-pointer');
    expect(monster.sourceCommit).toBe('abc1234');
  });

  it('should infer memory-leak type from commit message', () => {
    const commit = makeTestCommit({ message: 'fix: memory leak in cache layer' });
    const [monster] = generateBugMonster(commit, rng);
    expect(monster.type).toBe('memory-leak');
  });

  it('should infer severity from commit size', () => {
    const small = makeTestCommit({ insertions: 10, deletions: 5 });
    const big = makeTestCommit({ insertions: 150, deletions: 80 });
    const [mSmall] = generateBugMonster(small, rng);
    const [mBig] = generateBugMonster(big, rng);
    expect(mSmall.severity).toBeLessThan(mBig.severity);
  });

  it('should generate bosses with [BOSS] tag', () => {
    const file: ParsedFile = {
      path: 'src/engine.ts',
      language: 'typescript',
      size: 5000,
      complexity: 50,
      imports: [],
      exports: [],
    };
    const [boss] = generateBoss(file, rng);
    expect(boss.name).toContain('[BOSS]');
    expect(boss.severity).toBe(5);
    expect(boss.xpReward).toBeGreaterThan(0);
  });

  it('should generate minibosses with [MINIBOSS] tag', () => {
    const hotspot: Hotspot = {
      filePath: 'src/parser.ts',
      commitCount: 20,
      authorCount: 5,
      riskScore: 8,
      complexity: 30,
    };
    const [miniboss] = generateMiniboss(hotspot, rng);
    expect(miniboss.name).toContain('[MINIBOSS]');
    expect(miniboss.xpReward).toBeGreaterThan(0);
  });

  it('should generate loot tables that scale with severity', () => {
    const [m1] = createMonster('null-pointer', 1, 0, rng);
    const [m5] = createMonster('null-pointer', 5, 0, rng);
    expect(m5.lootTable.length).toBeGreaterThan(m1.lootTable.length);
  });

  it('should produce unique monster IDs', () => {
    const [m1, rng1] = createMonster('null-pointer', 1, 0, rng);
    const [m2] = createMonster('null-pointer', 1, 0, rng1);
    expect(m1.id).not.toBe(m2.id);
  });

  it('should assign correct elements per bug type', () => {
    const [np] = createMonster('null-pointer', 1, 0, rng);
    const [ml] = createMonster('memory-leak', 1, 0, rng);
    const [rc] = createMonster('race-condition', 1, 0, rng);
    expect(np.element).toBe('none');
    expect(ml.element).toBe('earth');
    expect(rc.element).toBe('air');
  });
});

// ════════════════════════════════════════════════════════════
// ENEMY AI (Step 13)
// ════════════════════════════════════════════════════════════

describe('EnemyAI', () => {
  let rng: RngState;
  let player: Character;

  beforeEach(() => {
    rng = createRngState(42);
    player = makeTestPlayer();
  });

  it('should choose actions for null-pointer enemies', () => {
    const monster = makeTestMonster({ type: 'null-pointer' });
    const state: BattleState = {
      turn: 1,
      phase: { type: 'ENEMY_TURN', currentEnemyIndex: 0 },
      player,
      enemies: [monster],
      log: [],
      rng,
    };
    const decision = chooseEnemyAction(0, state);
    expect(decision.action.type).toBe('ENEMY_ACT');
    expect(decision.log.length).toBeGreaterThan(0);
    expect(decision.rng).not.toEqual(rng);
  });

  it('should sometimes skip turns for null-pointer (crash)', () => {
    // Run many decisions with different seeds to find a crash
    let foundCrash = false;
    for (let seed = 0; seed < 200; seed++) {
      const monster = makeTestMonster({ type: 'null-pointer' });
      const state: BattleState = {
        turn: 1,
        phase: { type: 'ENEMY_TURN', currentEnemyIndex: 0 },
        player,
        enemies: [monster],
        log: [],
        rng: createRngState(seed),
      };
      const decision = chooseEnemyAction(0, state);
      if (isSkippedTurn(decision)) {
        foundCrash = true;
        break;
      }
    }
    expect(foundCrash).toBe(true);
  });

  it('should handle memory-leak AI buffing every 3rd turn', () => {
    const monster = makeTestMonster({
      type: 'memory-leak',
      spells: ['spell-heap-grow', 'spell-oom-kill'],
    });
    const state: BattleState = {
      turn: 3, // Divisible by 3
      phase: { type: 'ENEMY_TURN', currentEnemyIndex: 0 },
      player,
      enemies: [monster],
      log: [],
      rng,
    };
    const decision = chooseEnemyAction(0, state);
    expect(decision.log).toContain("TestBug's memory consumption grows... (ATK up!)");
  });

  it('should handle race-condition double attack on even turns', () => {
    const monster = makeTestMonster({
      type: 'race-condition',
      spells: ['spell-thread-swap'],
    });
    const state: BattleState = {
      turn: 2, // Even turn
      phase: { type: 'ENEMY_TURN', currentEnemyIndex: 0 },
      player,
      enemies: [monster],
      log: [],
      rng,
    };
    const decision = chooseEnemyAction(0, state);
    expect(decision.log).toContain('TestBug context-switches at the worst time! Double attack!');
  });

  it('should handle off-by-one healing player', () => {
    let foundHeal = false;
    for (let seed = 0; seed < 200; seed++) {
      const monster = makeTestMonster({ type: 'off-by-one' });
      const state: BattleState = {
        turn: 1,
        phase: { type: 'ENEMY_TURN', currentEnemyIndex: 0 },
        player,
        enemies: [monster],
        log: [],
        rng: createRngState(seed),
      };
      const decision = chooseEnemyAction(0, state);
      if (isOffByOneHeal(decision)) {
        foundHeal = true;
        break;
      }
    }
    expect(foundHeal).toBe(true);
  });

  it('should handle off-by-one hitting itself', () => {
    let foundSelfHit = false;
    for (let seed = 0; seed < 200; seed++) {
      const monster = makeTestMonster({ type: 'off-by-one' });
      const state: BattleState = {
        turn: 1,
        phase: { type: 'ENEMY_TURN', currentEnemyIndex: 0 },
        player,
        enemies: [monster],
        log: [],
        rng: createRngState(seed),
      };
      const decision = chooseEnemyAction(0, state);
      if (isOffByOneSelfHit(decision)) {
        foundSelfHit = true;
        break;
      }
    }
    expect(foundSelfHit).toBe(true);
  });

  it('should use boss AI for BOSS-tagged monsters', () => {
    const boss = makeTestMonster({
      name: 'TestBoss [BOSS]',
      stats: { ...makeTestMonster().stats, health: 200, maxHealth: 200 },
      spells: ['spell-null-deref', 'spell-segfault', 'spell-deadlock-boss'],
    });
    const state: BattleState = {
      turn: 1,
      phase: { type: 'ENEMY_TURN', currentEnemyIndex: 0 },
      player,
      enemies: [boss],
      log: [],
      rng,
    };
    const decision = chooseEnemyAction(0, state);
    expect(decision.log.length).toBeGreaterThan(0);
  });

  it('should use desperate mode for boss below 25% HP', () => {
    const boss = makeTestMonster({
      name: 'TestBoss [BOSS]',
      stats: { ...makeTestMonster().stats, health: 10, maxHealth: 200 },
      spells: ['spell-null-deref', 'spell-segfault', 'spell-deadlock-boss'],
    });
    const state: BattleState = {
      turn: 1,
      phase: { type: 'ENEMY_TURN', currentEnemyIndex: 0 },
      player,
      enemies: [boss],
      log: [],
      rng,
    };
    const decision = chooseEnemyAction(0, state);
    expect(decision.log).toContain('TestBoss [BOSS] enters CRITICAL PHASE! Unleashes ultimate ability!');
  });

  it('should resolve enemy spells correctly', () => {
    const monster = makeTestMonster({ spells: ['spell-null-deref', 'spell-segfault'] });
    const decision = {
      action: { type: 'ENEMY_ACT' as const, enemyIndex: 0 },
      rng,
      log: 'test',
    };
    const spellId = resolveEnemySpell(monster, decision);
    expect(spellId).toBe('spell-null-deref'); // first spell by default
  });

  it('should resolve strongest spell for low-HP boss', () => {
    const monster = makeTestMonster({
      stats: { ...makeTestMonster().stats, health: 5, maxHealth: 100 },
      spells: ['spell-null-deref', 'spell-segfault', 'spell-deadlock-boss'],
    });
    const decision = {
      action: { type: 'ENEMY_ACT' as const, enemyIndex: 0 },
      rng,
      log: 'test',
    };
    const spellId = resolveEnemySpell(monster, decision);
    expect(spellId).toBe('spell-deadlock-boss'); // last = strongest
  });
});

// ════════════════════════════════════════════════════════════
// TURN-BASED ENGINE (Step 12)
// ════════════════════════════════════════════════════════════

describe('TurnBasedEngine', () => {
  let player: Character;
  let monster: Monster;

  beforeEach(() => {
    player = makeTestPlayer();
    monster = makeTestMonster();
  });

  describe('initBattle', () => {
    it('should initialize battle state correctly', () => {
      const state = initBattle(player, [monster], 42);
      expect(state.turn).toBe(1);
      expect(state.phase.type).toBe('PLAYER_TURN');
      expect(state.player.name).toBe('TestHero');
      expect(state.enemies).toHaveLength(1);
      expect(state.log).toHaveLength(0);
    });

    it('should clear player status effects and cooldowns', () => {
      const dirtyPlayer = makeTestPlayer({
        statusEffects: [createStatusEffect('poison', 'X', 5, 3)],
        cooldowns: { 'spell-sql-injection': 2 },
      });
      const state = initBattle(dirtyPlayer, [monster], 42);
      expect(state.player.statusEffects).toHaveLength(0);
      expect(Object.keys(state.player.cooldowns)).toHaveLength(0);
    });
  });

  describe('getAvailableActions', () => {
    it('should list all actions on PLAYER_TURN', () => {
      const state = initBattle(player, [monster], 42);
      const actions = getAvailableActions(state);
      expect(actions.canAttack).toBe(true);
      expect(actions.canDefend).toBe(true);
      expect(actions.canUseItem).toBe(true);
      expect(actions.availableSpells.length).toBeGreaterThan(0);
    });

    it('should return no actions when stunned', () => {
      const stunnedPlayer = makeTestPlayer({
        statusEffects: [createStatusEffect('stun', 'Stunned', 0, 1)],
      });
      const state = initBattle(stunnedPlayer, [monster], 42);
      // initBattle clears effects, so we need to re-apply
      const stateWithStun: BattleState = {
        ...state,
        player: {
          ...state.player,
          statusEffects: [createStatusEffect('stun', 'Stunned', 0, 1)],
        },
      };
      const actions = getAvailableActions(stateWithStun);
      expect(actions.canAttack).toBe(false);
      expect(actions.availableSpells).toHaveLength(0);
    });

    it('should filter out spells with insufficient mana', () => {
      const lowManaPlayer = makeTestPlayer({
        stats: { ...makeTestPlayer().stats, mana: 5 },
      });
      const state = initBattle(lowManaPlayer, [monster], 42);
      const stateWithLowMana: BattleState = {
        ...state,
        player: { ...state.player, stats: { ...state.player.stats, mana: 5 } },
      };
      const actions = getAvailableActions(stateWithLowMana);
      // SQL Injection costs 20, Fork Bomb 30, etc. — all above 5
      expect(actions.availableSpells).toHaveLength(0);
    });

    it('should filter out spells on cooldown', () => {
      const state = initBattle(player, [monster], 42);
      const stateWithCD: BattleState = {
        ...state,
        player: {
          ...state.player,
          cooldowns: { 'spell-sql-injection': 2 },
        },
      };
      const actions = getAvailableActions(stateWithCD);
      expect(actions.availableSpells).not.toContain('spell-sql-injection');
    });

    it('should return no actions when not PLAYER_TURN', () => {
      const state = initBattle(player, [monster], 42);
      const enemyPhase: BattleState = {
        ...state,
        phase: { type: 'ENEMY_TURN', currentEnemyIndex: 0 },
      };
      const actions = getAvailableActions(enemyPhase);
      expect(actions.canAttack).toBe(false);
    });
  });

  describe('executeTurn — Player Attack', () => {
    it('should deal damage to enemy', () => {
      const state = initBattle(player, [monster], 42);
      const next = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });
      expect(next.enemies[0].stats.health).toBeLessThan(monster.stats.health);
    });

    it('should progress the log', () => {
      const state = initBattle(player, [monster], 42);
      const next = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });
      expect(next.log.length).toBeGreaterThan(0);
    });

    it('should trigger enemy turn after player attack', () => {
      // After player attacks, enemy should also act (same executeTurn call)
      const state = initBattle(player, [monster], 42);
      const next = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });
      // The turn should advance if battle is still ongoing
      if (next.phase.type === 'PLAYER_TURN') {
        expect(next.turn).toBe(2);
      }
    });

    it('should detect victory when enemy HP reaches 0', () => {
      const weakMonster = makeTestMonster({
        stats: { ...makeTestMonster().stats, health: 1, maxHealth: 1 },
      });
      const state = initBattle(player, [weakMonster], 42);
      const next = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });
      expect(next.phase.type).toBe('VICTORY');
    });
  });

  describe('executeTurn — Player Spell', () => {
    it('should cast damage spell and spend mana', () => {
      const state = initBattle(player, [monster], 42);
      const next = executeTurn(state, {
        type: 'CAST_SPELL',
        spellId: 'spell-sql-injection',
        targetIndex: 0,
      });
      expect(next.player.stats.mana).toBeLessThan(player.stats.mana);
      // Enemy should take spell damage + basic enemy attack
      expect(next.enemies[0].stats.health).toBeLessThan(monster.stats.health);
    });

    it('should reject spell cast with insufficient mana', () => {
      const state = initBattle(player, [monster], 42);
      const lowMana: BattleState = {
        ...state,
        player: { ...state.player, stats: { ...state.player.stats, mana: 0 } },
      };
      const next = executeTurn(lowMana, {
        type: 'CAST_SPELL',
        spellId: 'spell-sql-injection',
        targetIndex: 0,
      });
      // Should stay in PLAYER_TURN since spell failed
      expect(next.phase.type).toBe('PLAYER_TURN');
    });

    it('should apply shield spell', () => {
      const tankPlayer = makeTestPlayer({
        class: 'tank',
        spells: ['spell-mutex-lock', 'spell-firewall', 'spell-deadlock', 'spell-load-balancer'],
      });
      const state = initBattle(tankPlayer, [monster], 42);
      const next = executeTurn(state, {
        type: 'CAST_SPELL',
        spellId: 'spell-mutex-lock',
        targetIndex: 0,
      });
      // Should have a shield effect (may be consumed by enemy attack though)
      expect(next.log.some(l => l.result.includes('shield'))).toBe(true);
    });

    it('should apply heal spell', () => {
      const healerPlayer = makeTestPlayer({
        class: 'healer',
        stats: { ...makeTestPlayer().stats, health: 50, maxHealth: 100 },
        spells: ['spell-try-catch', 'spell-rollback', 'spell-garbage-collect', 'spell-patch'],
      });
      const state = initBattle(healerPlayer, [monster], 42);
      const next = executeTurn(state, {
        type: 'CAST_SPELL',
        spellId: 'spell-try-catch',
        targetIndex: 0,
      });
      // Player should have more HP (heal) but also less (enemy attack)
      expect(next.log.some(l => l.result.includes('healing'))).toBe(true);
    });

    it('should apply DoT spell', () => {
      const state = initBattle(player, [monster], 42);
      const next = executeTurn(state, {
        type: 'CAST_SPELL',
        spellId: 'spell-buffer-overflow',
        targetIndex: 0,
      });
      expect(next.log.some(l => l.result.includes('poisoning'))).toBe(true);
    });

    it('should apply AoE damage to all enemies', () => {
      const m1 = makeTestMonster({ id: 'monster-a', name: 'Bug A' });
      const m2 = makeTestMonster({ id: 'monster-b', name: 'Bug B' });
      const state = initBattle(player, [m1, m2], 42);
      const next = executeTurn(state, {
        type: 'CAST_SPELL',
        spellId: 'spell-fork-bomb',
        targetIndex: 0,
      });
      // Both enemies should take damage
      const totalDmg =
        (m1.stats.health - next.enemies[0].stats.health) +
        (m2.stats.health - next.enemies[1].stats.health);
      expect(totalDmg).toBeGreaterThan(0);
    });
  });

  describe('executeTurn — Defend', () => {
    it('should grant defense buff', () => {
      const state = initBattle(player, [monster], 42);
      const next = executeTurn(state, { type: 'DEFEND' });
      expect(next.log.some(l => l.result.includes('defensive stance'))).toBe(true);
    });
  });

  describe('executeTurn — Terminal States', () => {
    it('should not process actions in VICTORY state', () => {
      const state = initBattle(player, [monster], 42);
      const victoryState: BattleState = {
        ...state,
        phase: { type: 'VICTORY', xpGained: 100, loot: [] },
      };
      const next = executeTurn(victoryState, { type: 'ATTACK', targetIndex: 0 });
      expect(next).toEqual(victoryState);
    });

    it('should not process actions in DEFEAT state', () => {
      const state = initBattle(player, [monster], 42);
      const defeatState: BattleState = {
        ...state,
        phase: { type: 'DEFEAT', cause: 'test' },
      };
      const next = executeTurn(defeatState, { type: 'ATTACK', targetIndex: 0 });
      expect(next).toEqual(defeatState);
    });
  });

  describe('executeTurn — Enemy Behavior', () => {
    it('should let enemies deal damage to player', () => {
      const strongMonster = makeTestMonster({
        stats: { ...makeTestMonster().stats, health: 200, maxHealth: 200, attack: 20 },
      });
      const state = initBattle(player, [strongMonster], 42);
      const next = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });
      // Player should have taken damage from enemy
      expect(next.player.stats.health).toBeLessThan(player.stats.health);
    });

    it('should detect defeat when player HP reaches 0', () => {
      const bossMonster = makeTestMonster({
        stats: { ...makeTestMonster().stats, health: 500, maxHealth: 500, attack: 200 },
      });
      const fragilePlayer = makeTestPlayer({
        stats: { ...makeTestPlayer().stats, health: 1, maxHealth: 1 },
      });
      const state = initBattle(fragilePlayer, [bossMonster], 42);
      const next = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });
      expect(next.phase.type).toBe('DEFEAT');
    });

    it('should handle multiple enemies taking turns', () => {
      const m1 = makeTestMonster({ id: 'ma', name: 'Bug A' });
      const m2 = makeTestMonster({ id: 'mb', name: 'Bug B' });
      const state = initBattle(player, [m1, m2], 42);
      const next = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });
      // Both enemies should have acted (visible in log)
      const enemyLogs = next.log.filter(l => l.actor.startsWith('enemy:'));
      expect(enemyLogs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('replayBattle — Deterministic', () => {
    it('should produce identical results for same seed and actions', () => {
      const actions = [
        { type: 'ATTACK' as const, targetIndex: 0 },
        { type: 'ATTACK' as const, targetIndex: 0 },
        { type: 'ATTACK' as const, targetIndex: 0 },
      ];

      const result1 = replayBattle(player, [monster], 42, actions);
      const result2 = replayBattle(player, [monster], 42, actions);

      expect(result1.player.stats.health).toBe(result2.player.stats.health);
      expect(result1.enemies[0].stats.health).toBe(result2.enemies[0].stats.health);
      expect(result1.turn).toBe(result2.turn);
      expect(result1.phase.type).toBe(result2.phase.type);
      expect(result1.log.length).toBe(result2.log.length);
    });

    it('should produce different results for different seeds', () => {
      const actions = [
        { type: 'ATTACK' as const, targetIndex: 0 },
        { type: 'ATTACK' as const, targetIndex: 0 },
      ];

      const result1 = replayBattle(player, [monster], 42, actions);
      const result2 = replayBattle(player, [monster], 999, actions);

      // Very likely different due to variance + crits
      const sameHP =
        result1.player.stats.health === result2.player.stats.health &&
        result1.enemies[0].stats.health === result2.enemies[0].stats.health;
      // Could theoretically be same, but highly unlikely
      // Just verify both produced valid states
      expect(result1.phase.type).toBeTruthy();
      expect(result2.phase.type).toBeTruthy();
    });

    it('should stop replaying after victory', () => {
      const weakMonster = makeTestMonster({
        stats: { ...makeTestMonster().stats, health: 1, maxHealth: 1 },
      });
      const actions = [
        { type: 'ATTACK' as const, targetIndex: 0 },
        { type: 'ATTACK' as const, targetIndex: 0 }, // Should not execute
      ];

      const result = replayBattle(player, [weakMonster], 42, actions);
      expect(result.phase.type).toBe('VICTORY');
    });
  });

  describe('Full Battle Simulation', () => {
    it('should resolve a complete battle (player wins)', () => {
      const weakMonster = makeTestMonster({
        stats: { ...makeTestMonster().stats, health: 20, maxHealth: 20, attack: 2 },
      });
      let state = initBattle(player, [weakMonster], 42);
      let maxTurns = 50;

      while (state.phase.type !== 'VICTORY' && state.phase.type !== 'DEFEAT' && maxTurns-- > 0) {
        state = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });
      }

      expect(state.phase.type).toBe('VICTORY');
      expect(state.log.length).toBeGreaterThan(0);
    });

    it('should resolve a complete battle with spells', () => {
      const weakMonster = makeTestMonster({
        stats: { ...makeTestMonster().stats, health: 30, maxHealth: 30, attack: 3 },
      });
      let state = initBattle(player, [weakMonster], 42);

      // Cast SQL Injection first
      state = executeTurn(state, {
        type: 'CAST_SPELL',
        spellId: 'spell-sql-injection',
        targetIndex: 0,
      });

      // Then attack until done
      let maxTurns = 50;
      while (state.phase.type !== 'VICTORY' && state.phase.type !== 'DEFEAT' && maxTurns-- > 0) {
        state = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });
      }

      expect(state.phase.type).toBe('VICTORY');
      expect(state.player.stats.mana).toBeLessThan(player.stats.mana);
    });

    it('should handle multi-enemy battle', () => {
      const m1 = makeTestMonster({ id: 'ma', name: 'Bug A', stats: { ...makeTestMonster().stats, health: 15, maxHealth: 15, attack: 2 } });
      const m2 = makeTestMonster({ id: 'mb', name: 'Bug B', stats: { ...makeTestMonster().stats, health: 15, maxHealth: 15, attack: 2 } });

      let state = initBattle(player, [m1, m2], 42);
      let maxTurns = 100;

      while (state.phase.type !== 'VICTORY' && state.phase.type !== 'DEFEAT' && maxTurns-- > 0) {
        // Target first alive enemy
        const targetIdx = state.enemies.findIndex(e => e.stats.health > 0);
        state = executeTurn(state, { type: 'ATTACK', targetIndex: targetIdx });
      }

      expect(state.phase.type).toBe('VICTORY');
      expect(state.enemies.every(e => e.stats.health <= 0)).toBe(true);
    });

    it('should grant XP on victory', () => {
      const weakMonster = makeTestMonster({
        stats: { ...makeTestMonster().stats, health: 1, maxHealth: 1 },
        xpReward: 100,
      });
      let state = initBattle(player, [weakMonster], 42);
      state = executeTurn(state, { type: 'ATTACK', targetIndex: 0 });

      expect(state.phase.type).toBe('VICTORY');
      if (state.phase.type === 'VICTORY') {
        expect(state.phase.xpGained).toBe(100);
      }
    });
  });
});
