import { describe, test, expect } from 'bun:test';
import {
  SeededRandom,
  rngNext,
  createRngState,
  rngRange,
  rngChance,
} from '../src/utils/SeededRandom';
import {
  createCharacter,
  gainExperience,
  computeStatsAtLevel,
  totalXPForLevel,
  xpToNextLevel,
  GROWTH_RATES,
  BASE_STATS,
} from '../src/character/CharacterSystem';
import {
  createGameStore,
} from '../src/state/GameStore';

// ─── PRNG Tests ──────────────────────────────────────────────

describe('SeededRandom', () => {
  test('same seed produces same sequence', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);

    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  test('different seeds produce different sequences', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(99);

    // Extremely unlikely to match
    let matches = 0;
    for (let i = 0; i < 100; i++) {
      if (a.next() === b.next()) matches++;
    }
    expect(matches).toBeLessThan(5);
  });

  test('values are in [0, 1)', () => {
    const rng = new SeededRandom(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  test('range produces integers in [min, max]', () => {
    const rng = new SeededRandom(7);
    for (let i = 0; i < 200; i++) {
      const v = rng.range(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  test('chance respects probability', () => {
    const rng = new SeededRandom(55);
    let trueCount = 0;
    const trials = 10000;
    for (let i = 0; i < trials; i++) {
      if (rng.chance(0.3)) trueCount++;
    }
    // Should be roughly 30% +/- 3%
    expect(trueCount / trials).toBeGreaterThan(0.27);
    expect(trueCount / trials).toBeLessThan(0.33);
  });

  test('pick selects from array', () => {
    const rng = new SeededRandom(11);
    const items = ['a', 'b', 'c'];
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(rng.pick(items));
    }
    // Should have picked all items eventually
    expect(seen.size).toBe(3);
  });

  test('shuffle is deterministic', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    a.shuffle(arr1);
    b.shuffle(arr2);
    expect(arr1).toEqual(arr2);
  });

  test('getState/setState preserves sequence', () => {
    const rng = new SeededRandom(42);
    rng.next(); rng.next(); rng.next();
    const snapshot = rng.getState();
    const v1 = rng.next();

    const rng2 = new SeededRandom(0);
    rng2.setState(snapshot);
    const v2 = rng2.next();
    expect(v1).toBe(v2);
  });
});

describe('rngNext (pure functional)', () => {
  test('deterministic with state passing', () => {
    const state = createRngState(42);
    const [v1, s1] = rngNext(state);
    const [v2, s2] = rngNext(state); // same input state
    expect(v1).toBe(v2);

    // Advancing state produces new value
    const [v3, _] = rngNext(s1);
    expect(v3).not.toBe(v1);
  });

  test('rngRange returns integers in bounds', () => {
    let state = createRngState(77);
    for (let i = 0; i < 100; i++) {
      let value: number;
      [value, state] = rngRange(state, 10, 20);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
  });
});

// ─── Character System Tests ─────────────────────────────────

describe('CharacterSystem', () => {
  test('createCharacter returns correct class stats', () => {
    const tank = createCharacter('tank', 'TestTank');
    expect(tank.class).toBe('tank');
    expect(tank.stats.health).toBe(150);
    expect(tank.stats.maxHealth).toBe(150);
    expect(tank.stats.attack).toBe(5);
    expect(tank.stats.defense).toBe(15);
    expect(tank.level).toBe(1);
    expect(tank.spells.length).toBe(4);
  });

  test('createCharacter at higher level has scaled stats', () => {
    const dps1 = createCharacter('dps', 'Lv1', 1);
    const dps10 = createCharacter('dps', 'Lv10', 10);
    expect(dps10.stats.attack).toBeGreaterThan(dps1.stats.attack);
    expect(dps10.stats.maxHealth).toBeGreaterThan(dps1.stats.maxHealth);
    expect(dps10.level).toBe(10);
  });

  test('all three classes have 4 starter spells', () => {
    for (const cls of ['tank', 'healer', 'dps'] as const) {
      const char = createCharacter(cls, `test-${cls}`);
      expect(char.spells.length).toBe(4);
    }
  });

  test('computeStatsAtLevel matches expected growth', () => {
    // Tank at level 30: HP = 150 + 8*29 = 382
    const tankL30 = computeStatsAtLevel('tank', 30);
    expect(tankL30.maxHealth).toBe(382);
    expect(tankL30.attack).toBe(34); // 5 + 1*29

    // DPS at level 30: ATK = 15 + 2*29 = 73
    const dpsL30 = computeStatsAtLevel('dps', 30);
    expect(dpsL30.attack).toBe(73);
    expect(dpsL30.maxHealth).toBe(167); // 80 + 3*29
  });
});

describe('XP Curve', () => {
  test('totalXPForLevel is quadratic', () => {
    expect(totalXPForLevel(1)).toBe(50);
    expect(totalXPForLevel(10)).toBe(5000);
    expect(totalXPForLevel(30)).toBe(45000);
  });

  test('xpToNextLevel increases with level', () => {
    const x1 = xpToNextLevel(1);
    const x10 = xpToNextLevel(10);
    const x20 = xpToNextLevel(20);
    expect(x10).toBeGreaterThan(x1);
    expect(x20).toBeGreaterThan(x10);
  });
});

describe('Level Up', () => {
  test('gaining enough XP triggers level up', () => {
    const char = createCharacter('dps', 'TestDPS');
    const needed = xpToNextLevel(1);
    const result = gainExperience(char, needed + 1);
    expect(result.leveledUp).toBe(true);
    expect(result.character.level).toBe(2);
    expect(result.character.stats.maxHealth).toBeGreaterThan(char.stats.maxHealth);
  });

  test('not enough XP does not level up', () => {
    const char = createCharacter('healer', 'TestHealer');
    const result = gainExperience(char, 10);
    expect(result.leveledUp).toBe(false);
    expect(result.character.level).toBe(1);
    expect(result.character.experience).toBe(char.experience + 10);
  });

  test('reaching level 5 unlocks a new spell', () => {
    const char = createCharacter('tank', 'TestTank');
    // Give enough XP to reach level 5
    const xpNeeded = totalXPForLevel(5) - char.experience;
    const result = gainExperience(char, xpNeeded + 1);
    expect(result.character.level).toBeGreaterThanOrEqual(5);
    expect(result.newSpells.length).toBeGreaterThan(0);
    expect(result.character.spells.length).toBeGreaterThan(4);
  });

  test('heals to full on level up', () => {
    const char = createCharacter('dps', 'TestDPS');
    // Simulate taking damage
    char.stats.health = 10;
    char.stats.mana = 5;
    const needed = xpToNextLevel(1);
    const result = gainExperience(char, needed + 1);
    expect(result.character.stats.health).toBe(result.character.stats.maxHealth);
    expect(result.character.stats.mana).toBe(result.character.stats.maxMana);
  });

  test('level cap is 30', () => {
    const char = createCharacter('tank', 'TestTank');
    const result = gainExperience(char, 999999);
    expect(result.character.level).toBe(30);
  });
});

// ─── GameStore Tests ─────────────────────────────────────────

describe('GameStore', () => {
  test('getState returns initial state', () => {
    const char = createCharacter('tank', 'TestTank');
    const store = createGameStore({
      character: char,
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      battleState: null,
      gameFlags: {},
    });
    expect(store.getState().character.name).toBe('TestTank');
  });

  test('setState triggers subscribers', () => {
    const char = createCharacter('dps', 'TestDPS');
    const store = createGameStore({
      character: char,
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      battleState: null,
      gameFlags: {},
    });

    let callCount = 0;
    store.subscribe(() => { callCount++; });

    store.setState({ gameFlags: { testFlag: true } });
    expect(callCount).toBe(1);
    expect(store.getState().gameFlags.testFlag).toBe(true);
  });

  test('unsubscribe stops notifications', () => {
    const char = createCharacter('healer', 'TestHealer');
    const store = createGameStore({
      character: char,
      inventory: [],
      activeQuests: [],
      completedQuests: [],
      battleState: null,
      gameFlags: {},
    });

    let callCount = 0;
    const unsub = store.subscribe(() => { callCount++; });

    store.setState({ gameFlags: { a: true } });
    expect(callCount).toBe(1);

    unsub();
    store.setState({ gameFlags: { b: true } });
    expect(callCount).toBe(1); // no additional call
  });
});
