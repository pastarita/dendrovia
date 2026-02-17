/**
 * Encounter System — Spatial/File Events → Battle Triggers
 *
 * Determines when the player should face a monster based on:
 *   - File complexity (boss encounters)
 *   - Hotspot risk (miniboss encounters)
 *   - Bug-fix commits (regular bug encounters)
 *   - Random encounters while exploring
 *
 * All decisions use the seeded PRNG for deterministic replay.
 */

import type {
  Encounter,
  Monster,
  ParsedFile,
  ParsedCommit,
  Hotspot,
  RngState,
} from '@dendrovia/shared';
import {
  generateBugMonster,
  generateBoss,
  generateMiniboss,
} from '../combat/MonsterFactory';
import { rngNext, rngChance } from '../utils/SeededRandom';
import { DEFAULT_BALANCE_CONFIG } from '../config/BalanceConfig';

// ─── Configuration ──────────────────────────────────────────

export interface EncounterConfig {
  /** Minimum file complexity to trigger a boss encounter */
  bossComplexityThreshold: number;
  /** Minimum hotspot risk score to trigger a miniboss */
  minibossRiskThreshold: number;
  /** Base random encounter chance per check (0-1) */
  randomEncounterChance: number;
  /** Minimum steps between encounters to prevent spam */
  encounterCooldown: number;
}

export const DEFAULT_CONFIG: EncounterConfig = DEFAULT_BALANCE_CONFIG.encounters;

// ─── Encounter State ────────────────────────────────────────

export interface EncounterState {
  /** Steps since last encounter */
  stepsSinceLastEncounter: number;
  /** Set of file paths where boss has been defeated */
  defeatedBosses: Set<string>;
  /** Set of hotspot paths where miniboss has been defeated */
  defeatedMinibosses: Set<string>;
  /** Set of commit hashes where bug has been defeated */
  defeatedBugs: Set<string>;
}

export function createEncounterState(): EncounterState {
  return {
    stepsSinceLastEncounter: 0,
    defeatedBosses: new Set(),
    defeatedMinibosses: new Set(),
    defeatedBugs: new Set(),
  };
}

// ─── Core Encounter Check ───────────────────────────────────

export interface EncounterCheckResult {
  encounter: Encounter | null;
  state: EncounterState;
  rng: RngState;
}

/**
 * Check if a file/position triggers an encounter.
 * Called when the player navigates to a new node in the code tree.
 */
export function checkEncounter(
  file: ParsedFile,
  commits: ParsedCommit[],
  hotspots: Hotspot[],
  encounterState: EncounterState,
  rng: RngState,
  config: EncounterConfig = DEFAULT_CONFIG,
): EncounterCheckResult {
  // Increment step counter
  let state: EncounterState = {
    ...encounterState,
    stepsSinceLastEncounter: encounterState.stepsSinceLastEncounter + 1,
  };

  // Enforce cooldown
  if (state.stepsSinceLastEncounter < config.encounterCooldown) {
    return { encounter: null, state, rng };
  }

  // Priority 1: Boss encounter (high complexity file)
  if (file.complexity > config.bossComplexityThreshold && !state.defeatedBosses.has(file.path)) {
    const [monster, rng1] = generateBoss(file, rng);
    const encounter: Encounter = {
      type: 'boss',
      monster,
      triggerCondition: { complexity: file.complexity },
    };
    return {
      encounter,
      state: { ...state, stepsSinceLastEncounter: 0 },
      rng: rng1,
    };
  }

  // Priority 2: Miniboss encounter (hotspot)
  const hotspot = hotspots.find(
    h => h.path === file.path && h.riskScore >= config.minibossRiskThreshold && !state.defeatedMinibosses.has(h.path),
  );
  if (hotspot) {
    const [monster, rng1] = generateMiniboss(hotspot, rng);
    const encounter: Encounter = {
      type: 'miniboss',
      monster,
      triggerCondition: { complexity: hotspot.complexity },
    };
    return {
      encounter,
      state: { ...state, stepsSinceLastEncounter: 0 },
      rng: rng1,
    };
  }

  // Priority 3: Bug encounter (bug-fix commits touching this file)
  const bugCommit = commits.find(
    c => c.isBugFix && c.filesChanged.includes(file.path) && !state.defeatedBugs.has(c.hash),
  );
  if (bugCommit) {
    const [monster, rng1] = generateBugMonster(bugCommit, rng);
    const encounter: Encounter = {
      type: 'bug',
      monster,
      triggerCondition: { commitType: 'bug-fix', filePattern: file.path },
    };
    return {
      encounter,
      state: { ...state, stepsSinceLastEncounter: 0 },
      rng: rng1,
    };
  }

  // Priority 4: Random encounter
  const [isRandom, rng1] = rngChance(rng, config.randomEncounterChance);
  if (isRandom) {
    // Generate a random bug from the most recent commit
    const anyCommit = commits.length > 0 ? commits[0] : null;
    if (anyCommit) {
      const [monster, rng2] = generateBugMonster(anyCommit, rng1, 1); // severity 1 for random
      const encounter: Encounter = {
        type: 'bug',
        monster,
        triggerCondition: { filePattern: file.path },
      };
      return {
        encounter,
        state: { ...state, stepsSinceLastEncounter: 0 },
        rng: rng2,
      };
    }
  }

  return { encounter: null, state, rng: rng1 };
}

// ─── Post-Battle State Updates ──────────────────────────────

/** Mark a boss as defeated so it won't re-trigger */
export function markBossDefeated(state: EncounterState, filePath: string): EncounterState {
  const defeatedBosses = new Set(state.defeatedBosses);
  defeatedBosses.add(filePath);
  return { ...state, defeatedBosses };
}

/** Mark a miniboss as defeated */
export function markMinibossDefeated(state: EncounterState, hotspotPath: string): EncounterState {
  const defeatedMinibosses = new Set(state.defeatedMinibosses);
  defeatedMinibosses.add(hotspotPath);
  return { ...state, defeatedMinibosses };
}

/** Mark a bug as defeated */
export function markBugDefeated(state: EncounterState, commitHash: string): EncounterState {
  const defeatedBugs = new Set(state.defeatedBugs);
  defeatedBugs.add(commitHash);
  return { ...state, defeatedBugs };
}

// ─── Batch Encounter Scanning ───────────────────────────────

/**
 * Scan a list of files and return all possible encounters.
 * Useful for pre-computing the encounter map at game start.
 */
export function scanAllEncounters(
  files: ParsedFile[],
  commits: ParsedCommit[],
  hotspots: Hotspot[],
  rng: RngState,
  config: EncounterConfig = DEFAULT_CONFIG,
): { encounters: Array<{ file: ParsedFile; encounter: Encounter }>; rng: RngState } {
  const encounters: Array<{ file: ParsedFile; encounter: Encounter }> = [];
  let currentRng = rng;

  for (const file of files) {
    // Boss check
    if (file.complexity > config.bossComplexityThreshold) {
      const [monster, rng1] = generateBoss(file, currentRng);
      currentRng = rng1;
      encounters.push({
        file,
        encounter: {
          type: 'boss',
          monster,
          triggerCondition: { complexity: file.complexity },
        },
      });
      continue;
    }

    // Miniboss check
    const hotspot = hotspots.find(
      h => h.path === file.path && h.riskScore >= config.minibossRiskThreshold,
    );
    if (hotspot) {
      const [monster, rng1] = generateMiniboss(hotspot, currentRng);
      currentRng = rng1;
      encounters.push({
        file,
        encounter: {
          type: 'miniboss',
          monster,
          triggerCondition: { complexity: hotspot.complexity },
        },
      });
      continue;
    }

    // Bug check
    const bugCommit = commits.find(
      c => c.isBugFix && c.filesChanged.includes(file.path),
    );
    if (bugCommit) {
      const [monster, rng1] = generateBugMonster(bugCommit, currentRng);
      currentRng = rng1;
      encounters.push({
        file,
        encounter: {
          type: 'bug',
          monster,
          triggerCondition: { commitType: 'bug-fix', filePattern: file.path },
        },
      });
    }
  }

  return { encounters, rng: currentRng };
}

/**
 * Get encounter density for a region (how many encounters per N files).
 * Useful for difficulty indicators on the map.
 */
export function getEncounterDensity(
  files: ParsedFile[],
  commits: ParsedCommit[],
  hotspots: Hotspot[],
  config: EncounterConfig = DEFAULT_CONFIG,
): number {
  if (files.length === 0) return 0;

  let encounterCount = 0;
  for (const file of files) {
    if (file.complexity > config.bossComplexityThreshold) encounterCount++;
    else if (hotspots.some(h => h.path === file.path && h.riskScore >= config.minibossRiskThreshold)) encounterCount++;
    else if (commits.some(c => c.isBugFix && c.filesChanged.includes(file.path))) encounterCount++;
  }

  return encounterCount / files.length;
}
