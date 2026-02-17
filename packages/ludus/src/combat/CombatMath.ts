/**
 * Combat Math — Damage, healing, shield, and critical hit formulas
 *
 * Core formula (Hybrid Tung/Pokemon):
 *   BaseDamage  = (SpellPower + Attack) * (C / (C + Defense))
 *   FinalDamage = floor(BaseDamage * CritMult * ElementMult * Variance)
 *   FinalDamage = max(FinalDamage, 1)
 *
 * All functions use state-passing RNG for deterministic replay.
 * Zero calls to Math.random().
 */

import type { Element, RngState, DamageResult, CharacterStats } from '@dendrovia/shared';
import { rngNext } from '../utils/SeededRandom';
import { DEFAULT_BALANCE_CONFIG } from '../config/BalanceConfig';

const cfg = DEFAULT_BALANCE_CONFIG;

// ─── Constants (derived from BalanceConfig) ──────────────────

/** At DEF = DEFENSE_CONSTANT, 50% of raw power passes through */
export const DEFENSE_CONSTANT = cfg.damage.defenseConstant;

/** Base critical hit chance (5%) */
export const BASE_CRIT_CHANCE = cfg.damage.baseCritChance;

/** Critical hit damage multiplier */
export const CRIT_MULTIPLIER = cfg.damage.critMultiplier;

/** Maximum critical hit chance (25%) */
export const MAX_CRIT_CHANCE = cfg.damage.maxCritChance;

/** Speed contribution to crit chance: +0.5% per point */
export const CRIT_PER_SPEED = cfg.damage.critPerSpeed;

/** Damage variance range: [0.85, 1.00] */
export const VARIANCE_MIN = cfg.damage.varianceMin;
export const VARIANCE_RANGE = cfg.damage.varianceRange;

// ─── Element Effectiveness Table ─────────────────────────────

export const ELEMENT_TABLE: Record<Element, Record<Element, number>> = cfg.elements.effectivenessTable;

export function getElementMultiplier(attackElement: Element, defenderElement: Element): number {
  return ELEMENT_TABLE[attackElement][defenderElement];
}

// ─── Effective Stats (base + status effect modifiers) ────────

export function effectiveAttack(stats: CharacterStats, attackMod: number): number {
  return Math.max(1, stats.attack + attackMod);
}

export function effectiveDefense(stats: CharacterStats, defenseMod: number): number {
  return Math.max(0, stats.defense + defenseMod);
}

// ─── Critical Hit Roll ──────────────────────────────────────

export function rollCritical(
  attackerSpeed: number,
  rng: RngState,
): [boolean, number, RngState] {
  const critChance = Math.min(BASE_CRIT_CHANCE + attackerSpeed * CRIT_PER_SPEED, MAX_CRIT_CHANCE);
  const [roll, newRng] = rngNext(rng);
  const isCrit = roll < critChance;
  return [isCrit, isCrit ? CRIT_MULTIPLIER : 1.0, newRng];
}

// ─── Damage Calculation ──────────────────────────────────────

export interface DamageInput {
  attackerAttack: number;
  attackerSpeed: number;
  spellPower: number;
  defenderDefense: number;
  attackElement: Element;
  defenderElement: Element;
}

export function calculateDamage(
  input: DamageInput,
  rng: RngState,
): [DamageResult, RngState] {
  const {
    attackerAttack,
    attackerSpeed,
    spellPower,
    defenderDefense,
    attackElement,
    defenderElement,
  } = input;

  // Core formula: (Power + ATK) * C/(C + DEF)
  const rawPower = spellPower + attackerAttack;
  const defenseReduction = DEFENSE_CONSTANT / (DEFENSE_CONSTANT + defenderDefense);
  const baseDamage = rawPower * defenseReduction;

  // Roll critical hit
  const [isCritical, critMult, rng1] = rollCritical(attackerSpeed, rng);

  // Element effectiveness
  const elementMultiplier = getElementMultiplier(attackElement, defenderElement);

  // Variance: seeded random in [0.85, 1.00]
  const [varianceRoll, rng2] = rngNext(rng1);
  const variance = VARIANCE_MIN + varianceRoll * VARIANCE_RANGE;

  // Final calculation
  const finalDamage = Math.max(cfg.damage.minDamage, Math.floor(baseDamage * critMult * elementMultiplier * variance));

  // Build log string
  const parts: string[] = [`${finalDamage} damage`];
  if (isCritical) parts.push('CRITICAL');
  if (elementMultiplier > 1.0) parts.push('super effective');
  if (elementMultiplier < 1.0) parts.push('not very effective');

  return [
    {
      damage: finalDamage,
      isCritical,
      elementMultiplier,
      log: parts.join(' — '),
    },
    rng2,
  ];
}

// ─── Basic Attack (no spell, element = none) ─────────────────

export function calculateBasicAttack(
  attackerAttack: number,
  attackerSpeed: number,
  defenderDefense: number,
  rng: RngState,
): [DamageResult, RngState] {
  return calculateDamage(
    {
      attackerAttack,
      attackerSpeed,
      spellPower: 0,
      defenderDefense,
      attackElement: 'none',
      defenderElement: 'none',
    },
    rng,
  );
}

// ─── Healing Calculation ─────────────────────────────────────
// Healing is NOT reduced by defense. Raw power + portion of ATK.

export function calculateHealing(spellPower: number, casterAttack: number): number {
  return Math.floor(spellPower + casterAttack * cfg.combat.healAttackRatio);
}

// ─── Shield Calculation ──────────────────────────────────────
// Shield HP scales with caster's defense.

export function calculateShield(spellPower: number, casterDefense: number): number {
  return Math.floor(spellPower + casterDefense * cfg.combat.shieldDefenseRatio);
}

// ─── XP Reward Calculation ───────────────────────────────────

export function xpRewardForMonster(severity: number, complexity: number = 0): number {
  return Math.floor(cfg.xp.monsterXPBase * Math.pow(severity, cfg.xp.monsterXPExponent) * (1 + cfg.xp.monsterComplexityBonus * complexity));
}

// ─── Monster Stat Scaling ────────────────────────────────────

export function scaleMonsterStat(
  baseStat: number,
  severity: number,
  complexity: number = 0,
): number {
  const severityMult = 1 + cfg.monsters.severityStep * (severity - 1);
  const complexityMult = 1 + cfg.monsters.complexityStep * complexity;
  return Math.floor(baseStat * severityMult * complexityMult);
}
