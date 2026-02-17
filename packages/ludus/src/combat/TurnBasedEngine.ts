/**
 * Turn-Based Engine — The core battle loop
 *
 * Architecture: Pure functional reducer.
 *   executeTurn(state, action) => newState
 *
 * No side effects. No Math.random(). No mutations.
 * Same input always produces same output.
 * Replay = actions.reduce(executeTurn, initialState)
 */

import type {
  BattleState,
  Action,
  ActionLogEntry,
  Character,
  Monster,
  RngState,
  CombatPhase,
  DamageResult,
  Item,
  InternalCombatEvent,
  StatusEffect,
} from '@dendrovia/shared';
import { createRngState } from '../utils/SeededRandom';
import {
  calculateDamage,
  calculateBasicAttack,
  calculateHealing,
  calculateShield,
  getElementMultiplier,
  effectiveAttack,
  effectiveDefense,
} from './CombatMath';
import {
  tickStatusEffects,
  applyStatusEffect,
  absorbDamage,
  isStunned,
  cleanse,
  createStatusEffect,
  getStatModifiers,
} from './StatusEffects';
import { getSpell } from '../spell/SpellFactory';
import {
  chooseEnemyAction,
  resolveEnemySpell,
  isSkippedTurn,
  isOffByOneHeal,
  isOffByOneSelfHit,
} from './EnemyAI';

// ─── Initialize a Battle ─────────────────────────────────────

export function initBattle(
  player: Character,
  enemies: Monster[],
  seed: number,
): BattleState {
  return {
    turn: 1,
    phase: { type: 'PLAYER_TURN' },
    player: { ...player, statusEffects: [], cooldowns: {} },
    enemies: enemies.map(e => ({ ...e, statusEffects: [] })),
    log: [],
    rng: createRngState(seed),
    combatEvents: [],
  };
}

// ─── Get Available Actions ───────────────────────────────────

export interface AvailableActions {
  canAttack: boolean;
  availableSpells: string[];
  canDefend: boolean;
  canUseItem: boolean;
}

export function getAvailableActions(state: BattleState): AvailableActions {
  if (state.phase.type !== 'PLAYER_TURN') {
    return { canAttack: false, availableSpells: [], canDefend: false, canUseItem: false };
  }

  const { player } = state;
  const stunned = isStunned(player.statusEffects);

  if (stunned) {
    return { canAttack: false, availableSpells: [], canDefend: false, canUseItem: false };
  }

  const availableSpells = player.spells.filter(spellId => {
    const spell = getSpell(spellId);
    if (!spell) return false;
    if (spell.manaCost > player.stats.mana) return false;
    if ((player.cooldowns[spellId] ?? 0) > 0) return false;
    return true;
  });

  return {
    canAttack: true,
    availableSpells,
    canDefend: true,
    canUseItem: true,
  };
}

// ─── Combat Event Helpers ────────────────────────────────────

function detectExpiredEffects(
  before: StatusEffect[],
  after: StatusEffect[],
  targetId: string,
): InternalCombatEvent[] {
  const afterIds = new Set(after.map(e => e.id));
  return before
    .filter(e => !afterIds.has(e.id))
    .map(e => ({
      type: 'STATUS_EXPIRED' as const,
      targetId,
      effectId: e.id,
      effectType: e.type,
      remainingTurns: 0,
    }));
}

// ─── Execute a Turn ──────────────────────────────────────────
// This is the REDUCER. Pure function.

export function executeTurn(state: BattleState, action: Action): BattleState {
  // Terminal states — no more actions
  if (state.phase.type === 'VICTORY' || state.phase.type === 'DEFEAT') {
    return state;
  }

  // Clear combatEvents at entry — each executeTurn produces fresh events
  const cleanState = { ...state, combatEvents: [] as InternalCombatEvent[] };

  switch (action.type) {
    case 'ATTACK':
      return executePlayerAttack(cleanState, action.targetIndex);
    case 'CAST_SPELL':
      return executePlayerSpell(cleanState, action.spellId, action.targetIndex);
    case 'DEFEND':
      return executePlayerDefend(cleanState);
    case 'USE_ITEM':
      return executeUseItem(cleanState, action.itemId);
    case 'ENEMY_ACT':
      return executeEnemyTurn(cleanState);
    default:
      return state;
  }
}

// ─── Player Attack ───────────────────────────────────────────

function executePlayerAttack(state: BattleState, targetIndex: number): BattleState {
  let { player, enemies, rng, log, turn } = state;
  let events: InternalCombatEvent[] = [...state.combatEvents];

  // TURN_START for player
  events.push({ type: 'TURN_START', turn, phase: 'player' });

  // Tick player status effects at start of turn
  const beforeEffects = player.statusEffects;
  const playerTick = tickStatusEffects(player.statusEffects, player.name);
  player = applyHpDelta(player, playerTick.hpDelta);
  player = { ...player, statusEffects: playerTick.effects };
  log = [...log, ...playerTick.log.map(l => makeLog(turn, 'player', state.log.length, l))];

  // Detect expired effects from tick
  events.push(...detectExpiredEffects(beforeEffects, playerTick.effects, player.id));

  // Check if player died from DoT
  if (player.stats.health <= 0) {
    return { ...state, player, log, combatEvents: events, phase: { type: 'DEFEAT', cause: 'Killed by status effect' } };
  }

  // Check stun
  if (isStunned(player.statusEffects)) {
    log = [...log, makeLog(turn, 'player', log.length, `${player.name} is stunned and cannot act!`)];
    return proceedToEnemyPhase({ ...state, player, log, rng, combatEvents: events });
  }

  // Decrement cooldowns
  player = tickCooldowns(player);

  // Get effective stats
  const mods = getStatModifiers(player.statusEffects);
  const atk = effectiveAttack(player.stats, mods.attack ?? 0);
  const spd = player.stats.speed;

  const enemy = enemies[targetIndex];
  if (!enemy || enemy.stats.health <= 0) {
    // Target already dead, pick first alive
    const aliveIdx = enemies.findIndex(e => e.stats.health > 0);
    if (aliveIdx < 0) return { ...state, player, log, combatEvents: events, phase: victoryPhase(enemies) };
    return executePlayerAttack({ ...state, player, log, combatEvents: events }, aliveIdx);
  }

  const enemyMods = getStatModifiers(enemy.statusEffects);
  const def = effectiveDefense(enemy.stats, enemyMods.defense ?? 0);

  // Calculate damage
  const [result, rng1] = calculateBasicAttack(atk, spd, def, rng);
  rng = rng1;

  // Apply damage through shields
  const { effects: newEnemyEffects, remainingDamage, absorbed } = absorbDamage(enemy.statusEffects, result.damage);
  const updatedEnemy: Monster = {
    ...enemy,
    statusEffects: newEnemyEffects,
    stats: { ...enemy.stats, health: Math.max(0, enemy.stats.health - remainingDamage) },
  };

  enemies = enemies.map((e, i) => i === targetIndex ? updatedEnemy : e);

  // DAMAGE event
  events.push({
    type: 'DAMAGE',
    attackerId: player.id,
    targetId: enemy.id,
    damage: remainingDamage,
    isCritical: result.isCritical,
    element: 'none',
  });

  let logMsg = `${player.name} attacks ${enemy.name} for ${result.log}`;
  if (absorbed > 0) logMsg += ` (${absorbed} absorbed by shield)`;
  log = [...log, makeLog(turn, 'player', log.length, logMsg)];

  // Check victory
  if (enemies.every(e => e.stats.health <= 0)) {
    return { ...state, turn, player, enemies, log, rng, combatEvents: events, phase: victoryPhase(enemies) };
  }

  return proceedToEnemyPhase({ ...state, turn, player, enemies, log, rng, combatEvents: events });
}

// ─── Player Spell Cast ──────────────────────────────────────

function executePlayerSpell(state: BattleState, spellId: string, targetIndex: number): BattleState {
  let { player, enemies, rng, log, turn } = state;
  let events: InternalCombatEvent[] = [...state.combatEvents];

  // TURN_START for player
  events.push({ type: 'TURN_START', turn, phase: 'player' });

  // Tick status effects
  const beforeEffects = player.statusEffects;
  const playerTick = tickStatusEffects(player.statusEffects, player.name);
  player = applyHpDelta(player, playerTick.hpDelta);
  player = { ...player, statusEffects: playerTick.effects };
  log = [...log, ...playerTick.log.map(l => makeLog(turn, 'player', log.length, l))];

  events.push(...detectExpiredEffects(beforeEffects, playerTick.effects, player.id));

  if (player.stats.health <= 0) {
    return { ...state, player, log, combatEvents: events, phase: { type: 'DEFEAT', cause: 'Killed by status effect' } };
  }

  if (isStunned(player.statusEffects)) {
    log = [...log, makeLog(turn, 'player', log.length, `${player.name} is stunned!`)];
    return proceedToEnemyPhase({ ...state, player, log, rng, combatEvents: events });
  }

  player = tickCooldowns(player);

  const spell = getSpell(spellId);
  if (!spell) {
    log = [...log, makeLog(turn, 'player', log.length, `Unknown spell: ${spellId}`)];
    return proceedToEnemyPhase({ ...state, player, log, rng, combatEvents: events });
  }

  // Check mana
  if (spell.manaCost > player.stats.mana) {
    log = [...log, makeLog(turn, 'player', log.length, `Not enough mana for ${spell.name}!`)];
    return { ...state, player, log, rng, combatEvents: events }; // Stay in PLAYER_TURN
  }

  // Check cooldown
  if ((player.cooldowns[spellId] ?? 0) > 0) {
    log = [...log, makeLog(turn, 'player', log.length, `${spell.name} is on cooldown!`)];
    return { ...state, player, log, rng, combatEvents: events };
  }

  // Spend mana and set cooldown
  player = {
    ...player,
    stats: { ...player.stats, mana: player.stats.mana - spell.manaCost },
    cooldowns: { ...player.cooldowns, [spellId]: spell.cooldown },
  };

  const mods = getStatModifiers(player.statusEffects);

  // Apply spell effect
  switch (spell.effect.type) {
    case 'damage': {
      const enemy = enemies[targetIndex] ?? enemies.find(e => e.stats.health > 0);
      if (!enemy) break;
      const idx = enemies.indexOf(enemy);
      const enemyMods = getStatModifiers(enemy.statusEffects);
      const [result, rng1] = calculateDamage(
        {
          attackerAttack: effectiveAttack(player.stats, mods.attack ?? 0),
          attackerSpeed: player.stats.speed,
          spellPower: spell.effect.value,
          defenderDefense: effectiveDefense(enemy.stats, enemyMods.defense ?? 0),
          attackElement: spell.element,
          defenderElement: enemy.element,
        },
        rng,
      );
      rng = rng1;
      const { effects: eFx, remainingDamage, absorbed } = absorbDamage(enemy.statusEffects, result.damage);
      enemies = enemies.map((e, i) => i === idx ? {
        ...e,
        statusEffects: eFx,
        stats: { ...e.stats, health: Math.max(0, e.stats.health - remainingDamage) },
      } : e);

      events.push({
        type: 'SPELL',
        spellId,
        casterId: player.id,
        targetId: enemy.id,
        effectType: 'damage',
        value: remainingDamage,
      });
      events.push({
        type: 'DAMAGE',
        attackerId: player.id,
        targetId: enemy.id,
        damage: remainingDamage,
        isCritical: result.isCritical,
        element: spell.element,
      });

      let msg = `${player.name} casts ${spell.name} on ${enemy.name} for ${result.log}`;
      if (absorbed > 0) msg += ` (${absorbed} absorbed)`;
      log = [...log, makeLog(turn, 'player', log.length, msg)];
      break;
    }

    case 'aoe-damage': {
      for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].stats.health <= 0) continue;
        const eMods = getStatModifiers(enemies[i].statusEffects);
        const [result, rng1] = calculateDamage(
          {
            attackerAttack: effectiveAttack(player.stats, mods.attack ?? 0),
            attackerSpeed: player.stats.speed,
            spellPower: spell.effect.value,
            defenderDefense: effectiveDefense(enemies[i].stats, eMods.defense ?? 0),
            attackElement: spell.element,
            defenderElement: enemies[i].element,
          },
          rng,
        );
        rng = rng1;
        const { effects: eFx, remainingDamage } = absorbDamage(enemies[i].statusEffects, result.damage);
        enemies = enemies.map((e, j) => j === i ? {
          ...e,
          statusEffects: eFx,
          stats: { ...e.stats, health: Math.max(0, e.stats.health - remainingDamage) },
        } : e);

        events.push({
          type: 'SPELL',
          spellId,
          casterId: player.id,
          targetId: enemies[i].id,
          effectType: 'aoe-damage',
          value: remainingDamage,
        });
        events.push({
          type: 'DAMAGE',
          attackerId: player.id,
          targetId: enemies[i].id,
          damage: remainingDamage,
          isCritical: result.isCritical,
          element: spell.element,
        });

        log = [...log, makeLog(turn, 'player', log.length, `${spell.name} hits ${enemies[i].name} for ${result.log}`)];
      }
      break;
    }

    case 'heal': {
      const healing = calculateHealing(spell.effect.value, effectiveAttack(player.stats, mods.attack ?? 0));
      player = applyHpDelta(player, healing);
      log = [...log, makeLog(turn, 'player', log.length, `${player.name} casts ${spell.name}, healing for ${healing} HP`)];

      events.push({
        type: 'SPELL',
        spellId,
        casterId: player.id,
        targetId: player.id,
        effectType: 'heal',
        value: healing,
      });

      // If heal-over-time (has duration), also apply a regen effect
      if (spell.effect.duration && spell.effect.duration > 1) {
        const hotEffect = createStatusEffect('regen', `${spell.name} HoT`, Math.floor(spell.effect.value / 2), spell.effect.duration, false);
        player = { ...player, statusEffects: applyStatusEffect(player.statusEffects, hotEffect) };
        events.push({
          type: 'STATUS_APPLIED',
          targetId: player.id,
          effectId: hotEffect.id,
          effectType: hotEffect.type,
          remainingTurns: hotEffect.remainingTurns,
        });
      }
      break;
    }

    case 'shield': {
      const shieldHP = calculateShield(spell.effect.value, player.stats.defense);
      const shieldEffect = createStatusEffect('shield', spell.name, shieldHP, 3, false);
      player = { ...player, statusEffects: applyStatusEffect(player.statusEffects, shieldEffect) };
      log = [...log, makeLog(turn, 'player', log.length, `${player.name} casts ${spell.name}, gaining ${shieldHP} shield`)];

      events.push({
        type: 'SPELL',
        spellId,
        casterId: player.id,
        targetId: player.id,
        effectType: 'shield',
        value: shieldHP,
      });
      events.push({
        type: 'STATUS_APPLIED',
        targetId: player.id,
        effectId: shieldEffect.id,
        effectType: shieldEffect.type,
        remainingTurns: shieldEffect.remainingTurns,
      });
      break;
    }

    case 'buff': {
      const buffEffect = createStatusEffect('attack-up', spell.name, spell.effect.value, spell.effect.duration ?? 3, false);
      player = { ...player, statusEffects: applyStatusEffect(player.statusEffects, buffEffect) };
      log = [...log, makeLog(turn, 'player', log.length, `${player.name} casts ${spell.name}, ATK +${spell.effect.value}`)];

      events.push({
        type: 'SPELL',
        spellId,
        casterId: player.id,
        targetId: player.id,
        effectType: 'buff',
        value: spell.effect.value,
      });
      events.push({
        type: 'STATUS_APPLIED',
        targetId: player.id,
        effectId: buffEffect.id,
        effectType: buffEffect.type,
        remainingTurns: buffEffect.remainingTurns,
      });
      break;
    }

    case 'debuff': {
      const enemy = enemies[targetIndex] ?? enemies.find(e => e.stats.health > 0);
      if (!enemy) break;
      const idx = enemies.indexOf(enemy);
      // Deadlock/stun = duration-based debuff with value 0
      if (spell.effect.value === 0) {
        const stunEffect = createStatusEffect('stun', spell.name, 0, spell.effect.duration ?? 1, false);
        enemies = enemies.map((e, i) => i === idx ? { ...e, statusEffects: applyStatusEffect(e.statusEffects, stunEffect) } : e);
        log = [...log, makeLog(turn, 'player', log.length, `${player.name} casts ${spell.name}, stunning ${enemy.name}!`)];

        events.push({
          type: 'SPELL',
          spellId,
          casterId: player.id,
          targetId: enemy.id,
          effectType: 'debuff',
          value: 0,
        });
        events.push({
          type: 'STATUS_APPLIED',
          targetId: enemy.id,
          effectId: stunEffect.id,
          effectType: stunEffect.type,
          remainingTurns: stunEffect.remainingTurns,
        });
      } else {
        const defDown = createStatusEffect('defense-down', spell.name, spell.effect.value, spell.effect.duration ?? 3, false);
        enemies = enemies.map((e, i) => i === idx ? { ...e, statusEffects: applyStatusEffect(e.statusEffects, defDown) } : e);
        log = [...log, makeLog(turn, 'player', log.length, `${player.name} casts ${spell.name}, DEF -${spell.effect.value} on ${enemy.name}`)];

        events.push({
          type: 'SPELL',
          spellId,
          casterId: player.id,
          targetId: enemy.id,
          effectType: 'debuff',
          value: spell.effect.value,
        });
        events.push({
          type: 'STATUS_APPLIED',
          targetId: enemy.id,
          effectId: defDown.id,
          effectType: defDown.type,
          remainingTurns: defDown.remainingTurns,
        });
      }
      break;
    }

    case 'dot': {
      const enemy = enemies[targetIndex] ?? enemies.find(e => e.stats.health > 0);
      if (!enemy) break;
      const idx = enemies.indexOf(enemy);
      const poisonEffect = createStatusEffect('poison', spell.name, spell.effect.value, spell.effect.duration ?? 3, false);
      enemies = enemies.map((e, i) => i === idx ? { ...e, statusEffects: applyStatusEffect(e.statusEffects, poisonEffect) } : e);
      log = [...log, makeLog(turn, 'player', log.length, `${player.name} casts ${spell.name}, poisoning ${enemy.name} for ${spell.effect.value}/turn`)];

      events.push({
        type: 'SPELL',
        spellId,
        casterId: player.id,
        targetId: enemy.id,
        effectType: 'dot',
        value: spell.effect.value,
      });
      events.push({
        type: 'STATUS_APPLIED',
        targetId: enemy.id,
        effectId: poisonEffect.id,
        effectType: poisonEffect.type,
        remainingTurns: poisonEffect.remainingTurns,
      });
      break;
    }

    case 'cleanse': {
      const beforeCleanse = player.statusEffects;
      player = { ...player, statusEffects: cleanse(player.statusEffects) };
      log = [...log, makeLog(turn, 'player', log.length, `${player.name} casts ${spell.name}, removing all debuffs!`)];

      events.push({
        type: 'SPELL',
        spellId,
        casterId: player.id,
        targetId: player.id,
        effectType: 'cleanse',
        value: 0,
      });
      // Each removed debuff produces STATUS_EXPIRED
      events.push(...detectExpiredEffects(beforeCleanse, player.statusEffects, player.id));
      break;
    }

    case 'revive': {
      const reviveHP = spell.effect.value;
      player = applyHpDelta(player, reviveHP);
      log = [...log, makeLog(turn, 'player', log.length, `${player.name} casts ${spell.name}, restoring ${reviveHP} HP!`)];

      events.push({
        type: 'SPELL',
        spellId,
        casterId: player.id,
        targetId: player.id,
        effectType: 'revive',
        value: reviveHP,
      });
      break;
    }

    case 'taunt': {
      // Taunt doesn't do anything mechanically in 1v1; matters for multi-enemy
      log = [...log, makeLog(turn, 'player', log.length, `${player.name} casts ${spell.name}, drawing enemy attention!`)];

      events.push({
        type: 'SPELL',
        spellId,
        casterId: player.id,
        targetId: player.id,
        effectType: 'taunt',
        value: 0,
      });
      break;
    }
  }

  // Check victory
  if (enemies.every(e => e.stats.health <= 0)) {
    return { ...state, turn, player, enemies, log, rng, combatEvents: events, phase: victoryPhase(enemies) };
  }

  return proceedToEnemyPhase({ ...state, turn, player, enemies, log, rng, combatEvents: events });
}

// ─── Player Defend ──────────────────────────────────────────

function executePlayerDefend(state: BattleState): BattleState {
  let { player, log, turn, rng } = state;
  let events: InternalCombatEvent[] = [...state.combatEvents];

  // TURN_START for player
  events.push({ type: 'TURN_START', turn, phase: 'player' });

  // Tick status effects
  const beforeEffects = player.statusEffects;
  const playerTick = tickStatusEffects(player.statusEffects, player.name);
  player = applyHpDelta(player, playerTick.hpDelta);
  player = { ...player, statusEffects: playerTick.effects };
  log = [...log, ...playerTick.log.map(l => makeLog(turn, 'player', log.length, l))];

  events.push(...detectExpiredEffects(beforeEffects, playerTick.effects, player.id));

  if (player.stats.health <= 0) {
    return { ...state, player, log, combatEvents: events, phase: { type: 'DEFEAT', cause: 'Killed by status effect' } };
  }

  player = tickCooldowns(player);

  // Defend: temporary defense boost
  const defBuff = createStatusEffect('defense-up', 'Defend', 5, 1, false);
  player = { ...player, statusEffects: applyStatusEffect(player.statusEffects, defBuff) };
  log = [...log, makeLog(turn, 'player', log.length, `${player.name} takes a defensive stance! DEF +5 this turn`)];

  events.push({
    type: 'STATUS_APPLIED',
    targetId: player.id,
    effectId: defBuff.id,
    effectType: defBuff.type,
    remainingTurns: defBuff.remainingTurns,
  });

  return proceedToEnemyPhase({ ...state, player, log, rng, combatEvents: events });
}

// ─── Use Item ───────────────────────────────────────────────

function executeUseItem(state: BattleState, itemId: string): BattleState {
  let { player, log, turn, rng } = state;
  let events: InternalCombatEvent[] = [...state.combatEvents];

  // TURN_START for player
  events.push({ type: 'TURN_START', turn, phase: 'player' });

  // Tick status effects
  const beforeEffects = player.statusEffects;
  const playerTick = tickStatusEffects(player.statusEffects, player.name);
  player = applyHpDelta(player, playerTick.hpDelta);
  player = { ...player, statusEffects: playerTick.effects };

  events.push(...detectExpiredEffects(beforeEffects, playerTick.effects, player.id));

  if (player.stats.health <= 0) {
    return { ...state, player, log, combatEvents: events, phase: { type: 'DEFEAT', cause: 'Killed by status effect' } };
  }

  player = tickCooldowns(player);

  // Items are resolved by the inventory system externally
  // For now, just log and proceed
  log = [...log, makeLog(turn, 'player', log.length, `${player.name} uses item ${itemId}`)];

  return proceedToEnemyPhase({ ...state, player, log, rng, combatEvents: events });
}

// ─── Enemy Turn ──────────────────────────────────────────────

function executeEnemyTurn(state: BattleState): BattleState {
  let { player, enemies, rng, log, turn } = state;
  let events: InternalCombatEvent[] = [...state.combatEvents];

  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    if (enemy.stats.health <= 0) continue;

    // TURN_START for this enemy
    events.push({ type: 'TURN_START', turn, phase: 'enemy' });

    // Tick enemy status effects
    const beforeEnemyEffects = enemy.statusEffects;
    const enemyTick = tickStatusEffects(enemy.statusEffects, enemy.name);
    let updatedEnemy: Monster = {
      ...enemy,
      statusEffects: enemyTick.effects,
      stats: {
        ...enemy.stats,
        health: Math.max(0, enemy.stats.health + enemyTick.hpDelta),
      },
    };
    log = [...log, ...enemyTick.log.map(l => makeLog(turn, `enemy:${i}`, log.length, l))];

    events.push(...detectExpiredEffects(beforeEnemyEffects, enemyTick.effects, enemy.id));

    // Check if enemy died from DoT
    if (updatedEnemy.stats.health <= 0) {
      enemies = enemies.map((e, j) => j === i ? updatedEnemy : e);
      log = [...log, makeLog(turn, `enemy:${i}`, log.length, `${enemy.name} was defeated by status effects!`)];
      events.push({ type: 'TURN_END', turn, phase: 'enemy' });
      continue;
    }

    // Check stun
    if (isStunned(updatedEnemy.statusEffects)) {
      enemies = enemies.map((e, j) => j === i ? updatedEnemy : e);
      log = [...log, makeLog(turn, `enemy:${i}`, log.length, `${enemy.name} is stunned and cannot act!`)];
      events.push({ type: 'TURN_END', turn, phase: 'enemy' });
      continue;
    }

    // AI decision
    const decision = chooseEnemyAction(i, { ...state, enemies: enemies.map((e, j) => j === i ? updatedEnemy : e), rng, log });
    rng = decision.rng;
    log = [...log, makeLog(turn, `enemy:${i}`, log.length, decision.log)];

    // Handle special off-by-one behaviors
    if (isSkippedTurn(decision)) {
      enemies = enemies.map((e, j) => j === i ? updatedEnemy : e);
      events.push({ type: 'TURN_END', turn, phase: 'enemy' });
      continue;
    }

    if (isOffByOneHeal(decision)) {
      // Heals player instead of dealing damage
      player = applyHpDelta(player, 5);
      enemies = enemies.map((e, j) => j === i ? updatedEnemy : e);
      events.push({ type: 'TURN_END', turn, phase: 'enemy' });
      continue;
    }

    if (isOffByOneSelfHit(decision)) {
      // Hits itself
      updatedEnemy = {
        ...updatedEnemy,
        stats: { ...updatedEnemy.stats, health: Math.max(0, updatedEnemy.stats.health - 5) },
      };
      enemies = enemies.map((e, j) => j === i ? updatedEnemy : e);
      events.push({
        type: 'DAMAGE',
        attackerId: enemy.id,
        targetId: enemy.id,
        damage: 5,
        isCritical: false,
        element: enemy.element,
      });
      events.push({ type: 'TURN_END', turn, phase: 'enemy' });
      continue;
    }

    // Resolve enemy spell or basic attack
    const spellId = resolveEnemySpell(updatedEnemy, decision);
    const spell = spellId ? getSpell(spellId) : null;

    if (spell && spell.effect.type === 'buff') {
      // Self-buff (e.g., memory leak's Heap Growth)
      const buff = createStatusEffect('attack-up', spell.name, spell.effect.value, spell.effect.duration ?? 99, true);
      updatedEnemy = { ...updatedEnemy, statusEffects: applyStatusEffect(updatedEnemy.statusEffects, buff) };
      enemies = enemies.map((e, j) => j === i ? updatedEnemy : e);

      events.push({
        type: 'STATUS_APPLIED',
        targetId: enemy.id,
        effectId: buff.id,
        effectType: buff.type,
        remainingTurns: buff.remainingTurns,
      });
      events.push({ type: 'TURN_END', turn, phase: 'enemy' });
      continue;
    }

    if (spell && spell.effect.type === 'debuff') {
      // Debuff player (e.g., deadlock stun)
      if (spell.effect.value === 0) {
        const stun = createStatusEffect('stun', spell.name, 0, spell.effect.duration ?? 1, false);
        player = { ...player, statusEffects: applyStatusEffect(player.statusEffects, stun) };

        events.push({
          type: 'STATUS_APPLIED',
          targetId: player.id,
          effectId: stun.id,
          effectType: stun.type,
          remainingTurns: stun.remainingTurns,
        });
      }
      enemies = enemies.map((e, j) => j === i ? updatedEnemy : e);
      events.push({ type: 'TURN_END', turn, phase: 'enemy' });
      continue;
    }

    if (spell && spell.effect.type === 'dot') {
      const poison = createStatusEffect('poison', spell.name, spell.effect.value, spell.effect.duration ?? 3, false);
      player = { ...player, statusEffects: applyStatusEffect(player.statusEffects, poison) };
      enemies = enemies.map((e, j) => j === i ? updatedEnemy : e);

      events.push({
        type: 'STATUS_APPLIED',
        targetId: player.id,
        effectId: poison.id,
        effectType: poison.type,
        remainingTurns: poison.remainingTurns,
      });
      events.push({ type: 'TURN_END', turn, phase: 'enemy' });
      continue;
    }

    // Calculate damage (basic attack or damage spell)
    const eMods = getStatModifiers(updatedEnemy.statusEffects);
    const eAtk = effectiveAttack(updatedEnemy.stats, eMods.attack ?? 0);
    const pMods = getStatModifiers(player.statusEffects);
    const pDef = effectiveDefense(player.stats, pMods.defense ?? 0);

    const [dmgResult, rng1] = calculateDamage(
      {
        attackerAttack: eAtk,
        attackerSpeed: updatedEnemy.stats.speed,
        spellPower: spell ? spell.effect.value : 0,
        defenderDefense: pDef,
        attackElement: spell ? spell.element : updatedEnemy.element,
        defenderElement: 'none', // Player doesn't have an element
      },
      rng,
    );
    rng = rng1;

    // Apply through player shields
    const { effects: pFx, remainingDamage, absorbed } = absorbDamage(player.statusEffects, dmgResult.damage);
    player = {
      ...player,
      statusEffects: pFx,
      stats: { ...player.stats, health: Math.max(0, player.stats.health - remainingDamage) },
    };

    events.push({
      type: 'DAMAGE',
      attackerId: enemy.id,
      targetId: player.id,
      damage: remainingDamage,
      isCritical: dmgResult.isCritical,
      element: spell ? spell.element : updatedEnemy.element,
    });

    let dmgLog = `${updatedEnemy.name} deals ${dmgResult.log} to ${player.name}`;
    if (absorbed > 0) dmgLog += ` (${absorbed} absorbed by shield)`;
    log = [...log, makeLog(turn, `enemy:${i}`, log.length, dmgLog)];

    enemies = enemies.map((e, j) => j === i ? updatedEnemy : e);

    events.push({ type: 'TURN_END', turn, phase: 'enemy' });

    // Check defeat
    if (player.stats.health <= 0) {
      return { ...state, turn, player, enemies, log, rng, combatEvents: events, phase: { type: 'DEFEAT', cause: `Killed by ${updatedEnemy.name}` } };
    }
  }

  // Check victory (enemies may have died from DoTs during their own turn)
  if (enemies.every(e => e.stats.health <= 0)) {
    return { ...state, turn, player, enemies, log, rng, combatEvents: events, phase: victoryPhase(enemies) };
  }

  // Next turn
  return {
    ...state,
    turn: turn + 1,
    phase: { type: 'PLAYER_TURN' },
    player,
    enemies,
    log,
    rng,
    combatEvents: events,
  };
}

// ─── Replay ──────────────────────────────────────────────────

export function replayBattle(
  player: Character,
  enemies: Monster[],
  seed: number,
  actions: Action[],
): BattleState {
  let state = initBattle(player, enemies, seed);
  for (const action of actions) {
    state = executeTurn(state, action);
    if (state.phase.type === 'VICTORY' || state.phase.type === 'DEFEAT') break;
  }
  return state;
}

// ─── Helpers ─────────────────────────────────────────────────

function applyHpDelta(char: Character, delta: number): Character {
  const newHealth = Math.max(0, Math.min(char.stats.maxHealth, char.stats.health + delta));
  return { ...char, stats: { ...char.stats, health: newHealth } };
}

function tickCooldowns(char: Character): Character {
  const cooldowns: Record<string, number> = {};
  for (const [id, turns] of Object.entries(char.cooldowns)) {
    if (turns > 1) cooldowns[id] = turns - 1;
    // if turns <= 1, it drops off (cooldown expired)
  }
  return { ...char, cooldowns };
}

function proceedToEnemyPhase(state: BattleState): BattleState {
  // After player acts, enemies take their turns immediately
  return executeEnemyTurn({ ...state, phase: { type: 'ENEMY_TURN', currentEnemyIndex: 0 } });
}

function victoryPhase(enemies: Monster[]): CombatPhase {
  const xpGained = enemies.reduce((sum, e) => sum + e.xpReward, 0);
  return { type: 'VICTORY', xpGained, loot: [] };
}

function makeLog(turn: number, actor: string, idx: number, result: string): ActionLogEntry {
  return {
    turn,
    actor: actor as ActionLogEntry['actor'],
    action: { type: 'ATTACK', targetIndex: 0 }, // simplified
    result,
  };
}
