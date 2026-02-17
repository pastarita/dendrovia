/**
 * Enemy AI — Decision-making for monsters
 *
 * Each bug type has a distinct behavioral pattern:
 *   null-pointer:    Random attacks, chance to "crash" (skip) or "propagate" (double)
 *   memory-leak:     Gets stronger each turn (stacking buff), low initial damage
 *   race-condition:  Alternates between double-attacks and doing nothing
 *   off-by-one:      Attacks are slightly wrong (occasionally heals player)
 *
 * Boss AI adds phase transitions at HP thresholds.
 * All decisions are seeded through the battle's PRNG.
 */

import type { Action, BattleState, Character, Monster, RngState } from '@dendrovia/shared';
import { rngNext } from '../utils/SeededRandom';

export interface EnemyDecision {
  action: Action;
  rng: RngState;
  log: string;
}

/** Choose an enemy action based on monster type and battle state */
export function chooseEnemyAction(enemyIndex: number, state: BattleState): EnemyDecision {
  const monster = state.enemies[enemyIndex];
  const rng = state.rng;

  // Boss phase transitions override normal behavior
  if (monster.name.includes('[BOSS]') || monster.name.includes('[MINIBOSS]')) {
    return chooseBossAction(enemyIndex, monster, state.player, rng);
  }

  switch (monster.type) {
    case 'null-pointer':
      return chooseNullPointerAction(enemyIndex, monster, rng);
    case 'memory-leak':
      return chooseMemoryLeakAction(enemyIndex, monster, state.turn, rng);
    case 'race-condition':
      return chooseRaceConditionAction(enemyIndex, monster, state.turn, rng);
    case 'off-by-one':
      return chooseOffByOneAction(enemyIndex, monster, rng);
    default:
      return { action: basicAttack(enemyIndex), rng, log: `${monster.name} attacks!` };
  }
}

// ─── Null Pointer: Chaotic — crash, propagate, or normal ────

function chooseNullPointerAction(enemyIndex: number, monster: Monster, rng: RngState): EnemyDecision {
  const [roll, rng1] = rngNext(rng);

  // 15% chance to "crash" — skip turn
  if (roll < 0.15) {
    return {
      action: basicAttack(enemyIndex), // Action is issued but will be flagged as skipped
      rng: rng1,
      log: `${monster.name} tried to dereference null and crashed! (skips turn)`,
    };
  }

  // 20% chance to use special spell if available
  if (roll < 0.35 && monster.spells.length > 0) {
    return {
      action: { type: 'ENEMY_ACT', enemyIndex },
      rng: rng1,
      log: `${monster.name} throws a ${monster.spells[0]}!`,
    };
  }

  // Normal attack
  return {
    action: basicAttack(enemyIndex),
    rng: rng1,
    log: `${monster.name} attacks!`,
  };
}

// ─── Memory Leak: Gets stronger every turn ──────────────────

function chooseMemoryLeakAction(enemyIndex: number, monster: Monster, turn: number, rng: RngState): EnemyDecision {
  const [_roll, rng1] = rngNext(rng);

  // Every 3rd turn, buff itself instead of attacking
  if (turn % 3 === 0 && monster.spells.includes('spell-heap-grow')) {
    return {
      action: { type: 'ENEMY_ACT', enemyIndex },
      rng: rng1,
      log: `${monster.name}'s memory consumption grows... (ATK up!)`,
    };
  }

  // Use special attack if HP is low
  if (monster.stats.health < monster.stats.maxHealth * 0.3 && monster.spells.includes('spell-oom-kill')) {
    return {
      action: { type: 'ENEMY_ACT', enemyIndex },
      rng: rng1,
      log: `${monster.name} triggers OOM Killer!`,
    };
  }

  return {
    action: basicAttack(enemyIndex),
    rng: rng1,
    log: `${monster.name} slowly leaks into your system...`,
  };
}

// ─── Race Condition: Fast/slow alternation ──────────────────

function chooseRaceConditionAction(enemyIndex: number, monster: Monster, turn: number, rng: RngState): EnemyDecision {
  const [roll, rng1] = rngNext(rng);

  // Even turns: double-speed attack (uses Thread Swap spell)
  if (turn % 2 === 0 && monster.spells.includes('spell-thread-swap')) {
    return {
      action: { type: 'ENEMY_ACT', enemyIndex },
      rng: rng1,
      log: `${monster.name} context-switches at the worst time! Double attack!`,
    };
  }

  // Odd turns: 30% chance to do nothing (thread blocked)
  if (turn % 2 === 1 && roll < 0.3) {
    return {
      action: basicAttack(enemyIndex),
      rng: rng1,
      log: `${monster.name} is waiting for a lock... (skips turn)`,
    };
  }

  return {
    action: basicAttack(enemyIndex),
    rng: rng1,
    log: `${monster.name} races ahead!`,
  };
}

// ─── Off By One: Unreliable — sometimes helps the player ────

function chooseOffByOneAction(enemyIndex: number, monster: Monster, rng: RngState): EnemyDecision {
  const [roll, rng1] = rngNext(rng);

  // 10% chance to "miss by one" — attack heals player instead
  if (roll < 0.1) {
    return {
      action: basicAttack(enemyIndex),
      rng: rng1,
      log: `${monster.name} miscounted and healed you instead! (off by one)`,
    };
  }

  // 15% chance to hit itself
  if (roll < 0.25) {
    return {
      action: basicAttack(enemyIndex),
      rng: rng1,
      log: `${monster.name} hit itself in confusion! (index out of bounds)`,
    };
  }

  return {
    action: basicAttack(enemyIndex),
    rng: rng1,
    log: `${monster.name} attacks... probably at the right target.`,
  };
}

// ─── Boss AI: Phase transitions at HP thresholds ────────────

function chooseBossAction(enemyIndex: number, monster: Monster, _player: Character, rng: RngState): EnemyDecision {
  const hpPercent = monster.stats.health / monster.stats.maxHealth;
  const [roll, rng1] = rngNext(rng);

  // Phase 3: Below 25% HP — desperate mode, uses strongest spell
  if (hpPercent <= 0.25) {
    const strongSpell = monster.spells[monster.spells.length - 1];
    if (strongSpell) {
      return {
        action: { type: 'ENEMY_ACT', enemyIndex },
        rng: rng1,
        log: `${monster.name} enters CRITICAL PHASE! Unleashes ultimate ability!`,
      };
    }
  }

  // Phase 2: Below 50% HP — more aggressive, alternates specials
  if (hpPercent <= 0.5) {
    if (roll < 0.6 && monster.spells.length > 1) {
      return {
        action: { type: 'ENEMY_ACT', enemyIndex },
        rng: rng1,
        log: `${monster.name} is enraged! Uses special ability!`,
      };
    }
  }

  // Phase 1: Above 50% HP — standard attacks with occasional specials
  if (roll < 0.3 && monster.spells.length > 0) {
    return {
      action: { type: 'ENEMY_ACT', enemyIndex },
      rng: rng1,
      log: `${monster.name} uses a special attack!`,
    };
  }

  return {
    action: basicAttack(enemyIndex),
    rng: rng1,
    log: `${monster.name} attacks with full force!`,
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function basicAttack(enemyIndex: number): Action {
  return { type: 'ENEMY_ACT', enemyIndex };
}

/**
 * Determine which spell a monster should use based on its behavior.
 * Returns the spell ID or null if the monster should basic attack.
 */
export function resolveEnemySpell(monster: Monster, decision: EnemyDecision): string | null {
  // If the AI chose ENEMY_ACT and the monster has spells, pick one
  if (decision.action.type === 'ENEMY_ACT' && monster.spells.length > 0) {
    // For simplicity, use the first spell; boss AI picks the last (strongest)
    const hpPercent = monster.stats.health / monster.stats.maxHealth;
    if (hpPercent <= 0.25 && monster.spells.length > 1) {
      return monster.spells[monster.spells.length - 1]; // strongest
    }
    return monster.spells[0];
  }
  return null;
}

/**
 * Check if the enemy's action should be a "skip" (crash, waiting for lock, etc.)
 * This is encoded in the log message by convention.
 */
export function isSkippedTurn(decision: EnemyDecision): boolean {
  return decision.log.includes('skips turn') || decision.log.includes('crashed');
}

/**
 * Check if the off-by-one error healed the player instead.
 */
export function isOffByOneHeal(decision: EnemyDecision): boolean {
  return decision.log.includes('healed you instead');
}

/**
 * Check if the off-by-one error hit itself.
 */
export function isOffByOneSelfHit(decision: EnemyDecision): boolean {
  return decision.log.includes('hit itself');
}
