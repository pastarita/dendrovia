/**
 * Simulation Harness — Monte Carlo Battle Simulator
 *
 * Runs N battles across class/monster matchups, collects statistics,
 * and flags imbalanced pairings.
 *
 * Target win rate: 55-65% for intended-difficulty encounters.
 * Flagging thresholds: Win rate <30% or >80% = unbalanced.
 *
 * All simulations are deterministic — each run uses a unique seed
 * derived from the trial index, so results are reproducible.
 */

import type { BattleState, BugType, Character, CharacterClass, Monster } from '@dendrovia/shared';
import { createCharacter } from '../character/CharacterSystem';
import { createMonster } from '../combat/MonsterFactory';
import { executeTurn, initBattle } from '../combat/TurnBasedEngine';
import { createRngState } from '../utils/SeededRandom';

// ─── Configuration ──────────────────────────────────────────

export interface SimulationConfig {
  /** Number of trials per matchup */
  trials: number;
  /** Maximum turns before declaring a draw */
  maxTurns: number;
  /** Win rate below this = too hard */
  lowWinThreshold: number;
  /** Win rate above this = too easy */
  highWinThreshold: number;
  /** Base seed for reproducibility */
  baseSeed: number;
}

export const DEFAULT_SIM_CONFIG: SimulationConfig = {
  trials: 1000,
  maxTurns: 100,
  lowWinThreshold: 0.3,
  highWinThreshold: 0.8,
  baseSeed: 12345,
};

// ─── Result Types ───────────────────────────────────────────

export interface MatchupResult {
  playerClass: CharacterClass;
  playerLevel: number;
  monsterType: BugType;
  monsterSeverity: 1 | 2 | 3 | 4 | 5;
  monsterComplexity: number;
  trials: number;
  victories: number;
  defeats: number;
  draws: number;
  winRate: number;
  avgTurns: number;
  avgPlayerHPRemaining: number;
  avgMonsterHPRemaining: number;
  medianTurns: number;
  balanced: boolean;
  flag: 'ok' | 'too-easy' | 'too-hard' | 'draw-heavy';
}

export interface SimulationReport {
  config: SimulationConfig;
  matchups: MatchupResult[];
  totalTrials: number;
  overallWinRate: number;
  flaggedMatchups: MatchupResult[];
  durationMs: number;
}

// ─── Single Battle Simulation ───────────────────────────────

export interface BattleOutcome {
  result: 'victory' | 'defeat' | 'draw';
  turns: number;
  playerHPRemaining: number;
  monsterHPRemaining: number;
}

/** Run a single battle to completion with a fixed strategy */
export function simulateBattle(
  player: Character,
  monster: Monster,
  seed: number,
  maxTurns: number = 100,
  strategy: 'attack-only' | 'spell-first' | 'mixed' = 'mixed',
): BattleOutcome {
  let state = initBattle(player, [monster], seed);
  let turn = 0;

  while (state.phase.type !== 'VICTORY' && state.phase.type !== 'DEFEAT' && turn < maxTurns) {
    const action = chooseAction(state, strategy, turn);
    state = executeTurn(state, action);
    turn++;
  }

  if (state.phase.type === 'VICTORY') {
    return {
      result: 'victory',
      turns: state.turn,
      playerHPRemaining: state.player.stats.health,
      monsterHPRemaining: 0,
    };
  }

  if (state.phase.type === 'DEFEAT') {
    return {
      result: 'defeat',
      turns: state.turn,
      playerHPRemaining: 0,
      monsterHPRemaining: state.enemies[0]?.stats.health ?? 0,
    };
  }

  // Draw — hit max turns
  return {
    result: 'draw',
    turns: state.turn,
    playerHPRemaining: state.player.stats.health,
    monsterHPRemaining: state.enemies[0]?.stats.health ?? 0,
  };
}

/** Simple AI for simulation player actions */
function chooseAction(
  state: BattleState,
  strategy: 'attack-only' | 'spell-first' | 'mixed',
  turn: number,
): import('@dendrovia/shared').Action {
  if (strategy === 'attack-only') {
    return { type: 'ATTACK', targetIndex: 0 };
  }

  if (strategy === 'spell-first') {
    // Try to use first available spell
    const spell = state.player.spells.find((spellId) => {
      const cd = state.player.cooldowns[spellId] ?? 0;
      return cd <= 0 && state.player.stats.mana >= 15; // rough mana check
    });
    if (spell) {
      return { type: 'CAST_SPELL', spellId: spell, targetIndex: 0 };
    }
    return { type: 'ATTACK', targetIndex: 0 };
  }

  // Mixed: alternate attacks and spells
  if (turn % 3 === 0 && state.player.stats.mana >= 20) {
    const spell = state.player.spells.find((spellId) => {
      const cd = state.player.cooldowns[spellId] ?? 0;
      return cd <= 0;
    });
    if (spell) {
      return { type: 'CAST_SPELL', spellId: spell, targetIndex: 0 };
    }
  }

  if (turn % 5 === 0 && state.player.stats.health < state.player.stats.maxHealth * 0.3) {
    return { type: 'DEFEND' };
  }

  return { type: 'ATTACK', targetIndex: 0 };
}

// ─── Matchup Simulation ────────────────────────────────────

/** Run N trials of a single matchup */
export function simulateMatchup(
  playerClass: CharacterClass,
  playerLevel: number,
  monsterType: BugType,
  monsterSeverity: 1 | 2 | 3 | 4 | 5,
  monsterComplexity: number = 0,
  config: SimulationConfig = DEFAULT_SIM_CONFIG,
): MatchupResult {
  let victories = 0;
  let defeats = 0;
  let draws = 0;
  let totalTurns = 0;
  let totalPlayerHP = 0;
  let totalMonsterHP = 0;
  const turnCounts: number[] = [];

  for (let i = 0; i < config.trials; i++) {
    const seed = config.baseSeed + i * 7919; // Prime step for good distribution
    const player = createCharacter(playerClass, `Sim-${playerClass}`, playerLevel);
    const rng = createRngState(seed);
    const [monster] = createMonster(monsterType, monsterSeverity, monsterComplexity, rng);

    const outcome = simulateBattle(player, monster, seed, config.maxTurns, 'mixed');

    switch (outcome.result) {
      case 'victory':
        victories++;
        break;
      case 'defeat':
        defeats++;
        break;
      case 'draw':
        draws++;
        break;
    }

    totalTurns += outcome.turns;
    totalPlayerHP += outcome.playerHPRemaining;
    totalMonsterHP += outcome.monsterHPRemaining;
    turnCounts.push(outcome.turns);
  }

  const winRate = victories / config.trials;
  const avgTurns = totalTurns / config.trials;
  const avgPlayerHP = totalPlayerHP / config.trials;
  const avgMonsterHP = totalMonsterHP / config.trials;

  // Median turns
  turnCounts.sort((a, b) => a - b);
  const medianTurns = turnCounts[Math.floor(turnCounts.length / 2)];

  // Flag check
  let flag: MatchupResult['flag'] = 'ok';
  if (draws / config.trials > 0.1) flag = 'draw-heavy';
  else if (winRate < config.lowWinThreshold) flag = 'too-hard';
  else if (winRate > config.highWinThreshold) flag = 'too-easy';

  const balanced = flag === 'ok';

  return {
    playerClass,
    playerLevel,
    monsterType,
    monsterSeverity,
    monsterComplexity,
    trials: config.trials,
    victories,
    defeats,
    draws,
    winRate,
    avgTurns,
    avgPlayerHPRemaining: avgPlayerHP,
    avgMonsterHPRemaining: avgMonsterHP,
    medianTurns,
    balanced,
    flag,
  };
}

// ─── Full Simulation Suite ──────────────────────────────────

const ALL_CLASSES: CharacterClass[] = ['tank', 'healer', 'dps'];
const ALL_BUG_TYPES: BugType[] = ['null-pointer', 'memory-leak', 'race-condition', 'off-by-one'];

/** Run simulation across all class vs monster matchups at a given level/severity */
export function runFullSimulation(
  playerLevel: number = 5,
  monsterSeverity: 1 | 2 | 3 | 4 | 5 = 2,
  monsterComplexity: number = 0,
  config: SimulationConfig = DEFAULT_SIM_CONFIG,
): SimulationReport {
  const start = Date.now();
  const matchups: MatchupResult[] = [];

  for (const charClass of ALL_CLASSES) {
    for (const bugType of ALL_BUG_TYPES) {
      const result = simulateMatchup(charClass, playerLevel, bugType, monsterSeverity, monsterComplexity, config);
      matchups.push(result);
    }
  }

  const totalTrials = matchups.reduce((sum, m) => sum + m.trials, 0);
  const totalWins = matchups.reduce((sum, m) => sum + m.victories, 0);
  const flaggedMatchups = matchups.filter((m) => !m.balanced);

  return {
    config,
    matchups,
    totalTrials,
    overallWinRate: totalWins / totalTrials,
    flaggedMatchups,
    durationMs: Date.now() - start,
  };
}

/** Run a level progression simulation (same class vs escalating severity) */
export function runProgressionSimulation(
  charClass: CharacterClass,
  levels: number[] = [1, 5, 10, 15, 20, 25, 30],
  severities: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5],
  config: SimulationConfig = DEFAULT_SIM_CONFIG,
): MatchupResult[] {
  const results: MatchupResult[] = [];

  for (const level of levels) {
    for (const severity of severities) {
      // Use null-pointer as baseline enemy
      const result = simulateMatchup(charClass, level, 'null-pointer', severity, 0, config);
      results.push(result);
    }
  }

  return results;
}

// ─── Report Formatting ──────────────────────────────────────

/** Format a simulation report as a human-readable string */
export function formatReport(report: SimulationReport): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════');
  lines.push('  LUDUS BALANCE REPORT — Monte Carlo Simulation');
  lines.push('═══════════════════════════════════════════════════');
  lines.push(`  Trials per matchup: ${report.config.trials}`);
  lines.push(`  Total trials: ${report.totalTrials}`);
  lines.push(`  Overall win rate: ${(report.overallWinRate * 100).toFixed(1)}%`);
  lines.push(`  Duration: ${report.durationMs}ms`);
  lines.push('');

  // Table header
  lines.push('  Class     vs Monster          | Win%  | Avg Turns | Flag');
  lines.push('  ─────────────────────────────-+───────+───────────+──────');

  for (const m of report.matchups) {
    const classStr = m.playerClass.padEnd(8);
    const monsterStr = `${m.monsterType} (S${m.monsterSeverity})`.padEnd(22);
    const winPct = (m.winRate * 100).toFixed(1).padStart(5);
    const turns = m.avgTurns.toFixed(1).padStart(9);
    const flag = m.flag === 'ok' ? '  ✓' : ` ⚠ ${m.flag}`;
    lines.push(`  ${classStr} ${monsterStr}| ${winPct}% | ${turns} | ${flag}`);
  }

  if (report.flaggedMatchups.length > 0) {
    lines.push('');
    lines.push(`  ⚠ ${report.flaggedMatchups.length} matchup(s) flagged for review`);
  } else {
    lines.push('');
    lines.push('  All matchups within target range.');
  }

  lines.push('═══════════════════════════════════════════════════');
  return lines.join('\n');
}

/** Format matchup results as a CSV string */
export function formatCSV(results: MatchupResult[]): string {
  const header = 'class,level,monster,severity,complexity,trials,wins,losses,draws,winRate,avgTurns,medianTurns,flag';
  const rows = results.map(
    (m) =>
      `${m.playerClass},${m.playerLevel},${m.monsterType},${m.monsterSeverity},${m.monsterComplexity},${m.trials},${m.victories},${m.defeats},${m.draws},${m.winRate.toFixed(4)},${m.avgTurns.toFixed(1)},${m.medianTurns},${m.flag}`,
  );
  return [header, ...rows].join('\n');
}
