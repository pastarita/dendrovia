/**
 * Status Effect System
 *
 * Manages buffs, debuffs, DoTs, shields, and stuns on characters/monsters.
 * All functions are pure — they return new state, never mutate.
 */

import type { CharacterStats, StatusEffect } from '@dendrovia/shared';

// ─── Apply a new status effect ───────────────────────────────

export function applyStatusEffect(existing: StatusEffect[], effect: StatusEffect): StatusEffect[] {
  // Check for existing effect of same type
  const idx = existing.findIndex((e) => e.type === effect.type);

  if (idx >= 0) {
    if (effect.stackable) {
      // Stack: add value, refresh duration
      const stacked: StatusEffect = {
        ...existing[idx],
        value: existing[idx].value + effect.value,
        remainingTurns: Math.max(existing[idx].remainingTurns, effect.remainingTurns),
      };
      return [...existing.slice(0, idx), stacked, ...existing.slice(idx + 1)];
    } else {
      // Replace if new effect is stronger or has longer duration
      if (effect.value >= existing[idx].value || effect.remainingTurns > existing[idx].remainingTurns) {
        return [...existing.slice(0, idx), effect, ...existing.slice(idx + 1)];
      }
      return existing; // Keep existing, it's better
    }
  }

  return [...existing, effect];
}

// ─── Remove a status effect by ID ────────────────────────────

export function removeStatusEffect(effects: StatusEffect[], effectId: string): StatusEffect[] {
  return effects.filter((e) => e.id !== effectId);
}

// ─── Remove all negative status effects (cleanse) ────────────

const NEGATIVE_TYPES: Set<StatusEffect['type']> = new Set(['poison', 'stun', 'attack-down', 'defense-down']);

export function cleanse(effects: StatusEffect[]): StatusEffect[] {
  return effects.filter((e) => !NEGATIVE_TYPES.has(e.type));
}

// ─── Check if entity is stunned ──────────────────────────────

export function isStunned(effects: StatusEffect[]): boolean {
  return effects.some((e) => e.type === 'stun' && e.remainingTurns > 0);
}

// ─── Tick all effects at start of turn ──────────────────────

export interface TickResult {
  effects: StatusEffect[];
  hpDelta: number;
  statMods: Partial<CharacterStats>;
  log: string[];
}

export function tickStatusEffects(effects: StatusEffect[], entityName: string): TickResult {
  let hpDelta = 0;
  const log: string[] = [];
  const statMods: Partial<CharacterStats> = {};

  const remaining: StatusEffect[] = [];

  for (const effect of effects) {
    // Apply per-turn effects
    switch (effect.type) {
      case 'poison':
        hpDelta -= effect.value;
        log.push(`${entityName} takes ${effect.value} poison damage`);
        break;
      case 'regen':
        hpDelta += effect.value;
        log.push(`${entityName} regenerates ${effect.value} HP`);
        break;
      case 'attack-up':
        statMods.attack = (statMods.attack ?? 0) + effect.value;
        break;
      case 'attack-down':
        statMods.attack = (statMods.attack ?? 0) - effect.value;
        break;
      case 'defense-up':
        statMods.defense = (statMods.defense ?? 0) + effect.value;
        break;
      case 'defense-down':
        statMods.defense = (statMods.defense ?? 0) - effect.value;
        break;
      case 'stun':
        log.push(`${entityName} is stunned!`);
        break;
      case 'shield':
        // Shield doesn't tick — it's consumed on damage
        break;
    }

    // Decrement duration
    const updated = { ...effect, remainingTurns: effect.remainingTurns - 1 };
    if (updated.remainingTurns > 0) {
      remaining.push(updated);
    } else {
      log.push(`${entityName}'s ${effect.name} expired`);
    }
  }

  return { effects: remaining, hpDelta, statMods, log };
}

// ─── Get total shield HP from all shield effects ─────────────

export function getShieldHP(effects: StatusEffect[]): number {
  return effects.filter((e) => e.type === 'shield').reduce((sum, e) => sum + e.value, 0);
}

// ─── Absorb damage through shields, return remaining damage ──

export function absorbDamage(
  effects: StatusEffect[],
  damage: number,
): { effects: StatusEffect[]; remainingDamage: number; absorbed: number } {
  let remaining = damage;
  const newEffects: StatusEffect[] = [];

  for (const effect of effects) {
    if (effect.type === 'shield' && remaining > 0) {
      if (effect.value > remaining) {
        // Shield partially consumed
        newEffects.push({ ...effect, value: effect.value - remaining });
        remaining = 0;
      } else {
        // Shield fully consumed
        remaining -= effect.value;
        // Don't push — shield is destroyed
      }
    } else {
      newEffects.push(effect);
    }
  }

  return {
    effects: newEffects,
    remainingDamage: remaining,
    absorbed: damage - remaining,
  };
}

// ─── Compute effective stat modifiers from all active effects ─

export function getStatModifiers(effects: StatusEffect[]): Partial<CharacterStats> {
  const mods: Partial<CharacterStats> = {};

  for (const effect of effects) {
    switch (effect.type) {
      case 'attack-up':
        mods.attack = (mods.attack ?? 0) + effect.value;
        break;
      case 'attack-down':
        mods.attack = (mods.attack ?? 0) - effect.value;
        break;
      case 'defense-up':
        mods.defense = (mods.defense ?? 0) + effect.value;
        break;
      case 'defense-down':
        mods.defense = (mods.defense ?? 0) - effect.value;
        break;
    }
  }

  return mods;
}

// ─── Create a status effect ──────────────────────────────────

let effectCounter = 0;

export function createStatusEffect(
  type: StatusEffect['type'],
  name: string,
  value: number,
  duration: number,
  stackable: boolean = false,
): StatusEffect {
  return {
    id: `fx-${++effectCounter}`,
    name,
    type,
    value,
    remainingTurns: duration,
    stackable,
  };
}
