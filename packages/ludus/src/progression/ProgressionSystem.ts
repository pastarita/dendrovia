/**
 * Progression System — Post-Combat Rewards & Character Growth
 *
 * Connects victory → XP → level-up → stat growth → spell unlocks.
 * Handles quest completion rewards, battle statistics, and
 * the full "victory screen" data pipeline.
 */

import type { BattleState, Character, Quest, RngState } from '@dendrovia/shared';
import { gainExperience, type LevelUpResult } from '../character/CharacterSystem';
import type { Inventory } from '../inventory/InventorySystem';
import { addItem, resolveLoot } from '../inventory/InventorySystem';
import { getQuestRewards } from '../quest/QuestGenerator';

// ─── Battle Statistics ──────────────────────────────────────

export interface BattleStatistics {
  totalBattles: number;
  victories: number;
  defeats: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
  totalHealing: number;
  totalSpellsCast: number;
  totalTurns: number;
  monstersDefeated: number;
  bossesDefeated: number;
  criticalHits: number;
  longestBattle: number; // turns
  fastestVictory: number; // turns
}

export function createBattleStatistics(): BattleStatistics {
  return {
    totalBattles: 0,
    victories: 0,
    defeats: 0,
    totalDamageDealt: 0,
    totalDamageReceived: 0,
    totalHealing: 0,
    totalSpellsCast: 0,
    totalTurns: 0,
    monstersDefeated: 0,
    bossesDefeated: 0,
    criticalHits: 0,
    longestBattle: 0,
    fastestVictory: Infinity,
  };
}

// ─── Battle Rewards ─────────────────────────────────────────

export interface BattleRewards {
  xp: number;
  lootItems: string[];
  monstersDefeated: number;
  bossDefeated: boolean;
  turnsElapsed: number;
}

/** Extract rewards from a completed battle state (VICTORY phase only) */
export function resolveBattleRewards(
  state: BattleState,
  rng: RngState,
): { rewards: BattleRewards; rng: RngState } | null {
  if (state.phase.type !== 'VICTORY') return null;

  const xp = state.phase.xpGained;
  const allLoot: string[] = [];
  let currentRng = rng;

  // Roll loot from each defeated enemy
  for (const enemy of state.enemies) {
    if (enemy.stats.health <= 0 && enemy.lootTable.length > 0) {
      const { items, rng: nextRng } = resolveLoot(enemy.lootTable, currentRng);
      allLoot.push(...items);
      currentRng = nextRng;
    }
  }

  const bossDefeated = state.enemies.some((e) => e.stats.health <= 0 && e.name.includes('[BOSS]'));

  return {
    rewards: {
      xp,
      lootItems: allLoot,
      monstersDefeated: state.enemies.filter((e) => e.stats.health <= 0).length,
      bossDefeated,
      turnsElapsed: state.turn,
    },
    rng: currentRng,
  };
}

// ─── Apply Rewards to Character ─────────────────────────────

export interface ProgressionResult {
  character: Character;
  inventory: Inventory;
  levelUpResult: LevelUpResult;
  rewards: BattleRewards;
  log: string[];
}

/** Apply battle rewards: XP gain, loot to inventory, level-up check */
export function applyBattleRewards(
  character: Character,
  inventory: Inventory,
  rewards: BattleRewards,
): ProgressionResult {
  const log: string[] = [];

  // 1. Grant XP
  const levelUpResult = gainExperience(character, rewards.xp);
  const updatedChar = levelUpResult.character;
  log.push(`Gained ${rewards.xp} XP`);

  if (levelUpResult.leveledUp) {
    log.push(`LEVEL UP! Now level ${updatedChar.level} (+${levelUpResult.levelsGained})`);
    for (const spell of levelUpResult.newSpells) {
      log.push(`New spell unlocked: ${spell}`);
    }
  }

  // 2. Add loot to inventory
  let updatedInventory = inventory;
  for (const itemId of rewards.lootItems) {
    updatedInventory = addItem(updatedInventory, itemId);
    log.push(`Obtained: ${itemId}`);
  }

  // 3. Summary
  log.push(
    `Defeated ${rewards.monstersDefeated} monster${rewards.monstersDefeated > 1 ? 's' : ''} in ${rewards.turnsElapsed} turns`,
  );
  if (rewards.bossDefeated) {
    log.push('BOSS DEFEATED!');
  }

  return {
    character: updatedChar,
    inventory: updatedInventory,
    levelUpResult,
    rewards,
    log,
  };
}

// ─── Quest Reward Application ───────────────────────────────

export interface QuestRewardResult {
  character: Character;
  inventory: Inventory;
  levelUpResult: LevelUpResult;
  knowledge: string[];
  log: string[];
}

/** Apply rewards from completing a quest */
export function applyQuestRewards(character: Character, inventory: Inventory, quest: Quest): QuestRewardResult {
  const { xp, items, knowledge } = getQuestRewards(quest);
  const log: string[] = [];

  // Grant XP
  const levelUpResult = gainExperience(character, xp);
  const updatedChar = levelUpResult.character;
  log.push(`Quest "${quest.title}" completed!`);
  log.push(`Gained ${xp} XP`);

  if (levelUpResult.leveledUp) {
    log.push(`LEVEL UP! Now level ${updatedChar.level}`);
    for (const spell of levelUpResult.newSpells) {
      log.push(`New spell unlocked: ${spell}`);
    }
  }

  // Add items
  let updatedInventory = inventory;
  for (const itemId of items) {
    updatedInventory = addItem(updatedInventory, itemId);
    log.push(`Obtained: ${itemId}`);
  }

  // Knowledge
  for (const k of knowledge) {
    log.push(`Knowledge unlocked: ${k}`);
  }

  return {
    character: updatedChar,
    inventory: updatedInventory,
    levelUpResult,
    knowledge,
    log,
  };
}

// ─── Statistics Updates ─────────────────────────────────────

/** Update battle statistics after a completed battle */
export function updateBattleStatistics(
  stats: BattleStatistics,
  state: BattleState,
  rewards: BattleRewards | null,
): BattleStatistics {
  const isVictory = state.phase.type === 'VICTORY';
  const turns = state.turn;

  // Parse log for damage/heal/spell counts
  let damageDealt = 0;
  let damageReceived = 0;
  let healing = 0;
  let spells = 0;
  let crits = 0;

  for (const entry of state.log) {
    if (entry.actor === 'player') {
      // Player actions
      const dmgMatch = entry.result.match(/(\d+) damage/);
      if (dmgMatch) damageDealt += parseInt(dmgMatch[1], 10);

      const healMatch = entry.result.match(/healing for (\d+)/i) || entry.result.match(/restoring (\d+)/i);
      if (healMatch) healing += parseInt(healMatch[1], 10);

      if (entry.result.includes('casts')) spells++;
      if (entry.result.includes('CRITICAL')) crits++;
    } else {
      // Enemy actions
      const dmgMatch = entry.result.match(/(\d+) damage/);
      if (dmgMatch) damageReceived += parseInt(dmgMatch[1], 10);
    }
  }

  return {
    totalBattles: stats.totalBattles + 1,
    victories: stats.victories + (isVictory ? 1 : 0),
    defeats: stats.defeats + (isVictory ? 0 : 1),
    totalDamageDealt: stats.totalDamageDealt + damageDealt,
    totalDamageReceived: stats.totalDamageReceived + damageReceived,
    totalHealing: stats.totalHealing + healing,
    totalSpellsCast: stats.totalSpellsCast + spells,
    totalTurns: stats.totalTurns + turns,
    monstersDefeated: stats.monstersDefeated + (rewards?.monstersDefeated ?? 0),
    bossesDefeated: stats.bossesDefeated + (rewards?.bossDefeated ? 1 : 0),
    criticalHits: stats.criticalHits + crits,
    longestBattle: Math.max(stats.longestBattle, turns),
    fastestVictory: isVictory ? Math.min(stats.fastestVictory, turns) : stats.fastestVictory,
  };
}

// ─── Victory Screen Data ────────────────────────────────────

export interface VictoryScreen {
  title: string;
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  levelsGained: number;
  newSpells: string[];
  lootItems: string[];
  turnsElapsed: number;
  bossDefeated: boolean;
}

/** Build the data for a victory screen overlay */
export function buildVictoryScreen(progression: ProgressionResult, levelBefore: number): VictoryScreen {
  return {
    title: progression.rewards.bossDefeated ? 'BOSS DEFEATED!' : 'VICTORY!',
    xpGained: progression.rewards.xp,
    levelBefore,
    levelAfter: progression.character.level,
    levelsGained: progression.levelUpResult.levelsGained,
    newSpells: progression.levelUpResult.newSpells,
    lootItems: progression.rewards.lootItems,
    turnsElapsed: progression.rewards.turnsElapsed,
    bossDefeated: progression.rewards.bossDefeated,
  };
}
