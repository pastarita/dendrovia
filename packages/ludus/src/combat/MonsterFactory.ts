/**
 * Monster Factory
 *
 * Generates monsters from CHRONOS data (commits, files, hotspots).
 * Maps code-themed bugs to RPG enemies with scaled stats.
 */

import type {
  Monster,
  BugType,
  Element,
  CharacterStats,
  LootEntry,
  ParsedCommit,
  ParsedFile,
  Hotspot,
  RngState,
} from '@dendrovia/shared';
import { scaleMonsterStat, xpRewardForMonster } from './CombatMath';
import { rngNext, rngPick } from '../utils/SeededRandom';
import { DEFAULT_BALANCE_CONFIG } from '../config/BalanceConfig';

// ─── Base Monster Templates ─────────────────────────────────

interface MonsterTemplate {
  type: BugType;
  baseName: string;
  element: Element;
  baseHP: number;
  baseATK: number;
  baseDEF: number;
  baseSpeed: number;
  spells: string[];
  bossSpells: string[];
}

const TEMPLATES: Record<BugType, MonsterTemplate> = {
  'null-pointer': {
    type: 'null-pointer',
    baseName: 'NullPointerException',
    element: 'none',
    baseHP: 40,
    baseATK: 8,
    baseDEF: 3,
    baseSpeed: 6,
    spells: ['spell-null-deref'],
    bossSpells: ['spell-null-deref', 'spell-segfault', 'spell-deadlock-boss'],
  },
  'memory-leak': {
    type: 'memory-leak',
    baseName: 'MemoryLeak',
    element: 'earth',
    baseHP: 60,
    baseATK: 5,
    baseDEF: 6,
    baseSpeed: 3,
    spells: ['spell-heap-grow'],
    bossSpells: ['spell-heap-grow', 'spell-oom-kill', 'spell-stack-smash'],
  },
  'race-condition': {
    type: 'race-condition',
    baseName: 'RaceCondition',
    element: 'air',
    baseHP: 35,
    baseATK: 10,
    baseDEF: 2,
    baseSpeed: 12,
    spells: ['spell-thread-swap'],
    bossSpells: ['spell-thread-swap', 'spell-deadlock-boss'],
  },
  'off-by-one': {
    type: 'off-by-one',
    baseName: 'OffByOneError',
    element: 'none',
    baseHP: 25,
    baseATK: 6,
    baseDEF: 4,
    baseSpeed: 8,
    spells: ['spell-fence-post'],
    bossSpells: ['spell-fence-post', 'spell-stack-smash'],
  },
};

// ─── Name Generation ─────────────────────────────────────────

const ADJECTIVES = [
  'Recursive', 'Polymorphic', 'Async', 'Deprecated', 'Volatile',
  'Orphaned', 'Dangling', 'Corrupted', 'Uninitialized', 'Phantom',
  'Legacy', 'Stale', 'Circular', 'Transient', 'Persistent',
];

const BOSS_PREFIXES = [
  'Catastrophic', 'Critical', 'Fatal', 'Systemic', 'Cascading',
];

function generateMonsterName(
  template: MonsterTemplate,
  severity: number,
  rng: RngState,
): [string, RngState] {
  if (severity >= 4) {
    const [prefix, rng1] = rngPick(rng, BOSS_PREFIXES);
    return [`${prefix} ${template.baseName}`, rng1];
  }
  if (severity >= 2) {
    const [adj, rng1] = rngPick(rng, ADJECTIVES);
    return [`${adj} ${template.baseName}`, rng1];
  }
  return [template.baseName, rng];
}

// ─── Loot Table Generation ───────────────────────────────────

function generateLootTable(severity: number): LootEntry[] {
  const entries: LootEntry[] = [
    { itemId: 'item-debug-log', chance: 0.5 },
  ];

  if (severity >= 2) {
    entries.push({ itemId: 'item-stack-trace', chance: 0.3 });
  }
  if (severity >= 3) {
    entries.push({ itemId: 'item-core-dump', chance: 0.2 });
  }
  if (severity >= 4) {
    entries.push({ itemId: 'item-memory-snapshot', chance: 0.15 });
  }
  if (severity >= 5) {
    entries.push({ itemId: 'item-root-cause', chance: 0.1 });
  }

  return entries;
}

// ─── Scale stats from template ──────────────────────────────

function scaleStats(
  template: MonsterTemplate,
  severity: 1 | 2 | 3 | 4 | 5,
  complexity: number,
): CharacterStats {
  const maxHealth = scaleMonsterStat(template.baseHP, severity, complexity);
  return {
    health: maxHealth,
    maxHealth,
    mana: 0,
    maxMana: 0,
    attack: scaleMonsterStat(template.baseATK, severity, complexity),
    defense: scaleMonsterStat(template.baseDEF, severity, complexity),
    speed: scaleMonsterStat(template.baseSpeed, severity, complexity),
  };
}

// ─── Monster ID generation ──────────────────────────────────

let monsterIdCounter = 0;

// ─── Public API ──────────────────────────────────────────────

/** Generate a bug monster from a parsed commit */
export function generateBugMonster(
  commit: ParsedCommit,
  rng: RngState,
  severityOverride?: 1 | 2 | 3 | 4 | 5,
): [Monster, RngState] {
  // Determine bug type from commit message heuristics
  const bugType = inferBugType(commit.message);
  const template = TEMPLATES[bugType];
  const severity = severityOverride ?? inferSeverity(commit);
  const complexity = Math.min(10, Math.floor(commit.filesChanged.length * 1.5));

  const [name, rng1] = generateMonsterName(template, severity, rng);

  const monster: Monster = {
    id: `monster-${++monsterIdCounter}`,
    name,
    type: bugType,
    element: template.element,
    severity,
    stats: scaleStats(template, severity, complexity),
    spells: [...template.spells],
    statusEffects: [],
    xpReward: xpRewardForMonster(severity, complexity),
    lootTable: generateLootTable(severity),
    sourceCommit: commit.hash,
  };

  return [monster, rng1];
}

/** Generate a boss from a high-complexity file */
export function generateBoss(
  file: ParsedFile,
  rng: RngState,
): [Monster, RngState] {
  // High complexity files produce bosses
  const bugType = inferBugTypeFromLanguage(file.language);
  const template = TEMPLATES[bugType];
  const severity: 1 | 2 | 3 | 4 | 5 = 5;
  const complexity = Math.min(10, Math.floor(file.complexity / 5));

  const [name, rng1] = generateMonsterName(template, severity, rng);

  const monster: Monster = {
    id: `monster-${++monsterIdCounter}`,
    name: `${name} [BOSS]`,
    type: bugType,
    element: template.element,
    severity,
    stats: scaleStats(template, severity, complexity),
    spells: [...template.bossSpells],
    statusEffects: [],
    xpReward: xpRewardForMonster(severity, complexity) * DEFAULT_BALANCE_CONFIG.monsters.bossXPMultiplier,
    lootTable: generateLootTable(severity),
  };

  return [monster, rng1];
}

/** Generate a miniboss from a hotspot */
export function generateMiniboss(
  hotspot: Hotspot,
  rng: RngState,
): [Monster, RngState] {
  const bugType = hotspot.riskScore > 7 ? 'memory-leak' : 'null-pointer';
  const template = TEMPLATES[bugType];
  const severity: 1 | 2 | 3 | 4 | 5 = Math.min(5, Math.max(1, Math.floor(hotspot.riskScore / 2))) as 1 | 2 | 3 | 4 | 5;
  const complexity = Math.min(10, Math.floor(hotspot.complexity / 3));

  const [name, rng1] = generateMonsterName(template, severity, rng);

  const monster: Monster = {
    id: `monster-${++monsterIdCounter}`,
    name: `${name} [MINIBOSS]`,
    type: bugType,
    element: template.element,
    severity,
    stats: scaleStats(template, severity, complexity),
    spells: [...template.bossSpells],
    statusEffects: [],
    xpReward: xpRewardForMonster(severity, complexity) * DEFAULT_BALANCE_CONFIG.monsters.minibossXPMultiplier,
    lootTable: generateLootTable(severity),
  };

  return [monster, rng1];
}

/** Create a simple monster by type and severity (for testing/simulation) */
export function createMonster(
  bugType: BugType,
  severity: 1 | 2 | 3 | 4 | 5,
  complexity: number = 0,
  rng: RngState,
): [Monster, RngState] {
  const template = TEMPLATES[bugType];
  const [name, rng1] = generateMonsterName(template, severity, rng);

  const monster: Monster = {
    id: `monster-${++monsterIdCounter}`,
    name,
    type: bugType,
    element: template.element,
    severity,
    stats: scaleStats(template, severity, complexity),
    spells: severity >= 4 ? [...template.bossSpells] : [...template.spells],
    statusEffects: [],
    xpReward: xpRewardForMonster(severity, complexity),
    lootTable: generateLootTable(severity),
  };

  return [monster, rng1];
}

// ─── Heuristics ──────────────────────────────────────────────

function inferBugType(commitMessage: string): BugType {
  const msg = commitMessage.toLowerCase();
  if (msg.includes('null') || msg.includes('undefined') || msg.includes('typeerror')) return 'null-pointer';
  if (msg.includes('memory') || msg.includes('leak') || msg.includes('gc')) return 'memory-leak';
  if (msg.includes('race') || msg.includes('concurrent') || msg.includes('async') || msg.includes('deadlock')) return 'race-condition';
  if (msg.includes('off-by') || msg.includes('index') || msg.includes('bound') || msg.includes('fence')) return 'off-by-one';
  // Default: null-pointer is the most common
  return 'null-pointer';
}

function inferSeverity(commit: ParsedCommit): 1 | 2 | 3 | 4 | 5 {
  const totalChanges = commit.insertions + commit.deletions;
  if (totalChanges > 200) return 5;
  if (totalChanges > 100) return 4;
  if (totalChanges > 50) return 3;
  if (totalChanges > 20) return 2;
  return 1;
}

function inferBugTypeFromLanguage(language: string): BugType {
  switch (language.toLowerCase()) {
    case 'c':
    case 'c++':
    case 'rust': return 'memory-leak';
    case 'go':
    case 'java': return 'race-condition';
    case 'python':
    case 'javascript':
    case 'typescript': return 'null-pointer';
    default: return 'off-by-one';
  }
}
