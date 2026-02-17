/**
 * Character System — Class templates, factory, and progression
 *
 * Three RPG classes mapped to developer archetypes:
 *   Tank       → Infrastructure Developer (high HP, high DEF)
 *   Healer     → Bug Fixer (high mana, support spells)
 *   DPS        → Feature Developer (high ATK, glass cannon)
 */

import type { Character, CharacterClass, CharacterStats, GrowthRates } from '@dendrovia/shared';

// ─── Base Stats ──────────────────────────────────────────────

const TANK_STATS: CharacterStats = {
  health: 150,
  maxHealth: 150,
  mana: 50,
  maxMana: 50,
  attack: 5,
  defense: 15,
  speed: 6,
};

const HEALER_STATS: CharacterStats = {
  health: 100,
  maxHealth: 100,
  mana: 100,
  maxMana: 100,
  attack: 3,
  defense: 8,
  speed: 8,
};

const DPS_STATS: CharacterStats = {
  health: 80,
  maxHealth: 80,
  mana: 75,
  maxMana: 75,
  attack: 15,
  defense: 5,
  speed: 7,
};

export const BASE_STATS: Record<CharacterClass, CharacterStats> = {
  tank: TANK_STATS,
  healer: HEALER_STATS,
  dps: DPS_STATS,
};

// ─── Growth Rates (per level) ────────────────────────────────

export const GROWTH_RATES: Record<CharacterClass, GrowthRates> = {
  tank: { hp: 8, mana: 2, attack: 1, defense: 2, speed: 1 },
  healer: { hp: 5, mana: 5, attack: 0.5, defense: 1, speed: 1.5 },
  dps: { hp: 3, mana: 3, attack: 2, defense: 0.5, speed: 1 },
};

// ─── Starter Spells ──────────────────────────────────────────

const STARTER_SPELLS: Record<CharacterClass, string[]> = {
  tank: ['spell-mutex-lock', 'spell-load-balancer', 'spell-firewall', 'spell-deadlock'],
  healer: ['spell-try-catch', 'spell-rollback', 'spell-garbage-collect', 'spell-patch'],
  dps: ['spell-sql-injection', 'spell-fork-bomb', 'spell-buffer-overflow', 'spell-regex-nuke'],
};

// ─── XP Curve ────────────────────────────────────────────────

const XP_BASE = 50;

export function totalXPForLevel(level: number): number {
  return Math.floor(XP_BASE * level * level);
}

export function xpToNextLevel(currentLevel: number): number {
  return totalXPForLevel(currentLevel + 1) - totalXPForLevel(currentLevel);
}

// ─── Stat Calculation ────────────────────────────────────────

export function statAtLevel(baseStat: number, growthPerLevel: number, level: number): number {
  return Math.floor(baseStat + growthPerLevel * (level - 1));
}

export function computeStatsAtLevel(charClass: CharacterClass, level: number): CharacterStats {
  const base = BASE_STATS[charClass];
  const growth = GROWTH_RATES[charClass];

  const maxHealth = statAtLevel(base.maxHealth, growth.hp, level);
  const maxMana = statAtLevel(base.maxMana, growth.mana, level);

  return {
    health: maxHealth,
    maxHealth,
    mana: maxMana,
    maxMana,
    attack: statAtLevel(base.attack, growth.attack, level),
    defense: statAtLevel(base.defense, growth.defense, level),
    speed: statAtLevel(base.speed, growth.speed, level),
  };
}

// ─── Factory ─────────────────────────────────────────────────

let nextId = 1;

export function createCharacter(charClass: CharacterClass, name: string, level: number = 1): Character {
  const stats = computeStatsAtLevel(charClass, level);

  return {
    id: `char-${nextId++}`,
    name,
    class: charClass,
    stats,
    level,
    experience: totalXPForLevel(level),
    spells: [...STARTER_SPELLS[charClass]],
    statusEffects: [],
    cooldowns: {},
  };
}

// ─── Level Up ────────────────────────────────────────────────

// Spell unlock schedule: new spell at these levels
const _SPELL_UNLOCK_LEVELS = [5, 10, 15, 20, 25, 30];

const UNLOCK_SPELLS: Record<CharacterClass, Record<number, string>> = {
  tank: {
    5: 'spell-docker-compose',
    10: 'spell-kubernetes',
    15: 'spell-terraform',
    20: 'spell-circuit-breaker',
    25: 'spell-chaos-monkey',
    30: 'spell-immutable-infra',
  },
  healer: {
    5: 'spell-lint-fix',
    10: 'spell-bisect',
    15: 'spell-hot-reload',
    20: 'spell-snapshot-restore',
    25: 'spell-time-travel-debug',
    30: 'spell-formal-verification',
  },
  dps: {
    5: 'spell-zero-day',
    10: 'spell-privilege-escalation',
    15: 'spell-ddos',
    20: 'spell-cryptominer',
    25: 'spell-rootkit',
    30: 'spell-quantum-crack',
  },
};

export interface LevelUpResult {
  character: Character;
  leveledUp: boolean;
  levelsGained: number;
  newSpells: string[];
}

export function gainExperience(character: Character, xp: number): LevelUpResult {
  let { level, experience } = character;
  experience += xp;

  const newSpells: string[] = [];
  let levelsGained = 0;

  // Check for level ups (can gain multiple levels at once)
  while (level < 30 && experience >= totalXPForLevel(level + 1)) {
    level++;
    levelsGained++;

    // Check for spell unlock at this level
    const unlock = UNLOCK_SPELLS[character.class][level];
    if (unlock) {
      newSpells.push(unlock);
    }
  }

  if (levelsGained === 0) {
    return {
      character: { ...character, experience },
      leveledUp: false,
      levelsGained: 0,
      newSpells: [],
    };
  }

  const newStats = computeStatsAtLevel(character.class, level);
  // Heal to full on level up
  newStats.health = newStats.maxHealth;
  newStats.mana = newStats.maxMana;

  return {
    character: {
      ...character,
      level,
      experience,
      stats: newStats,
      spells: [...character.spells, ...newSpells],
    },
    leveledUp: true,
    levelsGained,
    newSpells,
  };
}
