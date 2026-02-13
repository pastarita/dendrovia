/**
 * Balance Config — All Tuning Knobs in One Place
 *
 * Every magic number in the combat system lives here.
 * Adjust these values to rebalance the game without changing code.
 *
 * The DEFAULT_BALANCE_CONFIG matches the Tranche 1 decisions.
 * Override individual fields via createBalanceConfig({ ... }).
 */

import type { Element, CharacterClass } from '@dendrovia/shared';

// ─── Damage Formula Config ──────────────────────────────────

export interface DamageConfig {
  /** At this DEF value, 50% of raw power passes through */
  defenseConstant: number;
  /** Base critical hit chance (0-1) */
  baseCritChance: number;
  /** Critical hit damage multiplier */
  critMultiplier: number;
  /** Maximum critical hit chance cap (0-1) */
  maxCritChance: number;
  /** Speed contribution to crit: +this per speed point */
  critPerSpeed: number;
  /** Minimum damage variance (lower bound of [min, min+range]) */
  varianceMin: number;
  /** Damage variance range added to min */
  varianceRange: number;
  /** Minimum damage dealt (prevents zero-damage stalemates) */
  minDamage: number;
}

// ─── Element Config ─────────────────────────────────────────

export interface ElementConfig {
  /** 5×5 element effectiveness table */
  effectivenessTable: Record<Element, Record<Element, number>>;
}

// ─── Character Config ───────────────────────────────────────

export interface StatGrowthConfig {
  hp: number;
  mana: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface CharacterConfig {
  /** Base stats per class at level 1 */
  baseStats: Record<CharacterClass, {
    health: number; mana: number; attack: number; defense: number; speed: number;
  }>;
  /** Stat growth per level per class */
  growthRates: Record<CharacterClass, StatGrowthConfig>;
  /** Level cap */
  maxLevel: number;
}

// ─── XP Config ──────────────────────────────────────────────

export interface XPConfig {
  /** Base XP multiplier: totalXP(n) = base * n^exponent */
  base: number;
  /** XP curve exponent */
  exponent: number;
  /** Monster XP formula: base * severity^exponent * (1 + complexityBonus * complexity) */
  monsterXPBase: number;
  monsterXPExponent: number;
  monsterComplexityBonus: number;
}

// ─── Monster Config ─────────────────────────────────────────

export interface MonsterScalingConfig {
  /** Per-severity multiplier: 1 + severityStep * (severity - 1) */
  severityStep: number;
  /** Per-complexity multiplier: 1 + complexityStep * complexity */
  complexityStep: number;
  /** Boss XP multiplier */
  bossXPMultiplier: number;
  /** Miniboss XP multiplier */
  minibossXPMultiplier: number;
}

// ─── Combat Config ──────────────────────────────────────────

export interface CombatConfig {
  /** Defense buff granted by DEFEND action */
  defendDefenseBonus: number;
  /** Duration of defend buff in turns */
  defendDuration: number;
  /** Healing formula: spellPower + casterAttack * healAttackRatio */
  healAttackRatio: number;
  /** Shield formula: spellPower + casterDefense * shieldDefenseRatio */
  shieldDefenseRatio: number;
}

// ─── Encounter Config ───────────────────────────────────────

export interface EncounterBalanceConfig {
  /** Minimum file complexity for boss encounters */
  bossComplexityThreshold: number;
  /** Minimum hotspot risk for miniboss encounters */
  minibossRiskThreshold: number;
  /** Random encounter chance per navigation step */
  randomEncounterChance: number;
  /** Steps between encounters */
  encounterCooldown: number;
}

// ─── Full Balance Config ────────────────────────────────────

export interface BalanceConfig {
  damage: DamageConfig;
  elements: ElementConfig;
  characters: CharacterConfig;
  xp: XPConfig;
  monsters: MonsterScalingConfig;
  combat: CombatConfig;
  encounters: EncounterBalanceConfig;
}

// ─── Defaults (Tranche 1 Decisions) ─────────────────────────

export const DEFAULT_BALANCE_CONFIG: BalanceConfig = {
  damage: {
    defenseConstant: 20,
    baseCritChance: 0.05,
    critMultiplier: 1.5,
    maxCritChance: 0.25,
    critPerSpeed: 0.005,
    varianceMin: 0.85,
    varianceRange: 0.15,
    minDamage: 1,
  },

  elements: {
    effectivenessTable: {
      fire:  { fire: 0.5, water: 0.5, earth: 1.5, air: 1.0, none: 1.0 },
      water: { fire: 1.5, water: 0.5, earth: 1.0, air: 0.5, none: 1.0 },
      earth: { fire: 1.0, water: 1.5, earth: 0.5, air: 1.5, none: 1.0 },
      air:   { fire: 1.0, water: 1.5, earth: 0.5, air: 0.5, none: 1.0 },
      none:  { fire: 1.0, water: 1.0, earth: 1.0, air: 1.0, none: 1.0 },
    },
  },

  characters: {
    baseStats: {
      tank:   { health: 150, mana: 50,  attack: 5,  defense: 15, speed: 6 },
      healer: { health: 100, mana: 100, attack: 3,  defense: 8,  speed: 8 },
      dps:    { health: 80,  mana: 75,  attack: 15, defense: 5,  speed: 7 },
    },
    growthRates: {
      tank:   { hp: 8,   mana: 2, attack: 1,   defense: 2,   speed: 1   },
      healer: { hp: 5,   mana: 5, attack: 0.5, defense: 1,   speed: 1.5 },
      dps:    { hp: 3,   mana: 3, attack: 2,   defense: 0.5, speed: 1   },
    },
    maxLevel: 30,
  },

  xp: {
    base: 50,
    exponent: 2,
    monsterXPBase: 25,
    monsterXPExponent: 2,
    monsterComplexityBonus: 0.05,
  },

  monsters: {
    severityStep: 0.35,
    complexityStep: 0.1,
    bossXPMultiplier: 3,
    minibossXPMultiplier: 2,
  },

  combat: {
    defendDefenseBonus: 5,
    defendDuration: 1,
    healAttackRatio: 0.5,
    shieldDefenseRatio: 0.5,
  },

  encounters: {
    bossComplexityThreshold: 20,
    minibossRiskThreshold: 6,
    randomEncounterChance: 0.15,
    encounterCooldown: 3,
  },
};

// ─── Config Factory ─────────────────────────────────────────

/** Create a custom balance config by overriding specific values */
export function createBalanceConfig(
  overrides: DeepPartial<BalanceConfig>,
): BalanceConfig {
  return deepMerge(DEFAULT_BALANCE_CONFIG, overrides) as BalanceConfig;
}

// ─── Preset Configs ─────────────────────────────────────────

/** Easy mode: player deals more damage, takes less */
export const EASY_CONFIG = createBalanceConfig({
  damage: { defenseConstant: 15, baseCritChance: 0.08 },
  combat: { defendDefenseBonus: 8, healAttackRatio: 0.7 },
  encounters: { randomEncounterChance: 0.10, encounterCooldown: 5 },
});

/** Hard mode: monsters hit harder, less healing */
export const HARD_CONFIG = createBalanceConfig({
  damage: { defenseConstant: 25, baseCritChance: 0.03 },
  monsters: { severityStep: 0.45 },
  combat: { healAttackRatio: 0.3, shieldDefenseRatio: 0.3 },
  encounters: { randomEncounterChance: 0.25, encounterCooldown: 2 },
});

// ─── Deep Merge Utility ─────────────────────────────────────

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
