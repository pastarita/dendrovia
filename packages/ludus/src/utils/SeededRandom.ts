/**
 * Seeded PRNG — sfc32 (Small Fast Chaotic 32-bit)
 *
 * 128-bit state, >2^128 period, passes PractRand.
 * State is stored as { a, b, c, d } and returned after each call
 * so it can live inside BattleState for deterministic replay.
 *
 * RULE: Never call Math.random() anywhere in LUDUS. Use this instead.
 */

import type { RngState } from '@dendrovia/shared';

/** Advance sfc32 state by one step, return [value in [0,1), newState] */
export function rngNext(state: RngState): [number, RngState] {
  let { a, b, c, d } = state;
  a |= 0;
  b |= 0;
  c |= 0;
  d |= 0;

  const t = (((a + b) | 0) + d) | 0;
  d = (d + 1) | 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) | 0;
  c = (c << 21) | (c >>> 11);
  c = (c + t) | 0;

  const value = (t >>> 0) / 4294967296;
  return [value, { a, b, c, d }];
}

/** Create initial RNG state from a single seed number */
export function createRngState(seed: number): RngState {
  // Hash the seed into 4 distinct values using a simple mixing function
  const s = seed | 0;
  const a = hashMix(s, 0x9e3779b9);
  const b = hashMix(s, 0x85ebca6b);
  const c = hashMix(s, 0xc2b2ae35);
  const d = hashMix(s, 0x27d4eb2f);

  // Warm up the generator with 12 rounds to mix state
  let state: RngState = { a, b, c, d };
  for (let i = 0; i < 12; i++) {
    [, state] = rngNext(state);
  }
  return state;
}

function hashMix(seed: number, constant: number): number {
  let h = (seed + constant) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
  return (h ^ (h >>> 16)) | 0;
}

/**
 * Stateful wrapper for convenience in non-reducer contexts (simulations, tests).
 * For the battle reducer, use rngNext/rngRange directly with state passing.
 */
export class SeededRandom {
  private state: RngState;

  constructor(seed: number) {
    this.state = createRngState(seed);
  }

  /** Get current state (for snapshotting) */
  getState(): RngState {
    return { ...this.state };
  }

  /** Restore from snapshot */
  setState(state: RngState): void {
    this.state = { ...state };
  }

  /** Returns a float in [0, 1) */
  next(): number {
    const [value, newState] = rngNext(this.state);
    this.state = newState;
    return value;
  }

  /** Returns an integer in [min, max] (inclusive) */
  range(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Returns true with the given probability (0-1) */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /** Pick a random element from an array */
  pick<T>(array: readonly T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  /** Shuffle an array in-place (Fisher-Yates) */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// --- Pure functional helpers for use inside the reducer ---

/** Random integer in [min, max] with state passing */
export function rngRange(state: RngState, min: number, max: number): [number, RngState] {
  const [value, newState] = rngNext(state);
  return [min + Math.floor(value * (max - min + 1)), newState];
}

/** Random boolean with given probability, with state passing */
export function rngChance(state: RngState, probability: number): [boolean, RngState] {
  const [value, newState] = rngNext(state);
  return [value < probability, newState];
}

/** Pick random element from array, with state passing */
export function rngPick<T>(state: RngState, array: readonly T[]): [T, RngState] {
  const [value, newState] = rngNext(state);
  return [array[Math.floor(value * array.length)], newState];
}
