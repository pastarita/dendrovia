/**
 * Tests for useOnboarding localStorage persistence logic
 *
 * Tests the read/write cycle and state transitions without rendering React.
 * The hook's internal logic is thin wrapper around these transitions.
 */

import { describe, it, expect, beforeEach } from 'bun:test';

const STORAGE_KEY = 'dendrovia-onboarding-v1';

// ── localStorage mock ─────────────────────────────────

let store: Record<string, string> = {};

const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { store = {}; },
  get length() { return Object.keys(store).length; },
  key: (index: number) => Object.keys(store)[index] ?? null,
};

// ── Replicate the hook's state logic for testing ──────

interface OnboardingState {
  phase: 'welcome' | 'exploring' | 'complete';
  hintsShown: Record<string, boolean>;
}

const DEFAULT_STATE: OnboardingState = {
  phase: 'welcome',
  hintsShown: {},
};

function readState(): OnboardingState {
  try {
    const raw = mockLocalStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.phase === 'string') {
      return parsed as OnboardingState;
    }
    return DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function writeState(state: OnboardingState): void {
  mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function dismissWelcome(state: OnboardingState): OnboardingState {
  if (state.phase !== 'welcome') return state;
  const next = { ...state, phase: 'exploring' as const };
  writeState(next);
  return next;
}

function markHintShown(state: OnboardingState, id: string): OnboardingState {
  if (state.hintsShown[id]) return state;
  const next = {
    ...state,
    hintsShown: { ...state.hintsShown, [id]: true },
  };
  writeState(next);
  return next;
}

function completeOnboarding(state: OnboardingState): OnboardingState {
  if (state.phase === 'complete') return state;
  const next = { ...state, phase: 'complete' as const };
  writeState(next);
  return next;
}

function resetOnboarding(): OnboardingState {
  mockLocalStorage.removeItem(STORAGE_KEY);
  return DEFAULT_STATE;
}

// ── Tests ─────────────────────────────────────────────

describe('useOnboarding', () => {
  beforeEach(() => {
    store = {};
  });

  describe('initial state', () => {
    it('returns phase "welcome" when localStorage is empty', () => {
      const state = readState();
      expect(state.phase).toBe('welcome');
      expect(state.hintsShown).toEqual({});
    });

    it('returns phase "welcome" when localStorage has invalid JSON', () => {
      store[STORAGE_KEY] = 'not-valid-json!!!';
      const state = readState();
      expect(state.phase).toBe('welcome');
    });

    it('returns phase "welcome" when localStorage has missing phase', () => {
      store[STORAGE_KEY] = JSON.stringify({ hintsShown: {} });
      const state = readState();
      expect(state.phase).toBe('welcome');
    });

    it('restores "complete" phase from localStorage', () => {
      store[STORAGE_KEY] = JSON.stringify({
        phase: 'complete',
        hintsShown: { orbit: true, 'node-click': true },
      });
      const state = readState();
      expect(state.phase).toBe('complete');
      expect(state.hintsShown.orbit).toBe(true);
      expect(state.hintsShown['node-click']).toBe(true);
    });

    it('restores "exploring" phase from localStorage', () => {
      store[STORAGE_KEY] = JSON.stringify({
        phase: 'exploring',
        hintsShown: { orbit: true },
      });
      const state = readState();
      expect(state.phase).toBe('exploring');
      expect(state.hintsShown.orbit).toBe(true);
    });
  });

  describe('dismissWelcome', () => {
    it('transitions from "welcome" to "exploring"', () => {
      let state = readState();
      state = dismissWelcome(state);
      expect(state.phase).toBe('exploring');
    });

    it('persists to localStorage', () => {
      let state = readState();
      state = dismissWelcome(state);
      const persisted = JSON.parse(store[STORAGE_KEY]);
      expect(persisted.phase).toBe('exploring');
    });

    it('is a no-op when not in "welcome" phase', () => {
      let state = readState();
      state = dismissWelcome(state);
      expect(state.phase).toBe('exploring');

      const before = state;
      state = dismissWelcome(state);
      expect(state).toBe(before); // same reference = no change
    });
  });

  describe('markHintShown', () => {
    it('records a hint and persists', () => {
      let state = readState();
      state = dismissWelcome(state);
      state = markHintShown(state, 'orbit');

      expect(state.hintsShown.orbit).toBe(true);
      expect(state.hintsShown['node-click']).toBeUndefined();

      const persisted = JSON.parse(store[STORAGE_KEY]);
      expect(persisted.hintsShown.orbit).toBe(true);
    });

    it('is idempotent (same reference returned)', () => {
      let state = readState();
      state = markHintShown(state, 'orbit');
      const before = state;
      state = markHintShown(state, 'orbit');
      expect(state).toBe(before);
    });

    it('tracks multiple hints independently', () => {
      let state = readState();
      state = markHintShown(state, 'orbit');
      state = markHintShown(state, 'node-click');
      state = markHintShown(state, 'code-reader');

      expect(state.hintsShown.orbit).toBe(true);
      expect(state.hintsShown['node-click']).toBe(true);
      expect(state.hintsShown['code-reader']).toBe(true);
      expect(state.hintsShown['quest-log']).toBeUndefined();
    });
  });

  describe('completeOnboarding', () => {
    it('transitions to "complete" and persists', () => {
      let state = readState();
      state = dismissWelcome(state);
      state = completeOnboarding(state);

      expect(state.phase).toBe('complete');

      const persisted = JSON.parse(store[STORAGE_KEY]);
      expect(persisted.phase).toBe('complete');
    });

    it('is idempotent', () => {
      let state = readState();
      state = completeOnboarding(state);
      const before = state;
      state = completeOnboarding(state);
      expect(state).toBe(before);
    });

    it('preserves hints when completing', () => {
      let state = readState();
      state = markHintShown(state, 'orbit');
      state = markHintShown(state, 'node-click');
      state = completeOnboarding(state);

      expect(state.phase).toBe('complete');
      expect(state.hintsShown.orbit).toBe(true);
      expect(state.hintsShown['node-click']).toBe(true);
    });
  });

  describe('resetOnboarding', () => {
    it('clears localStorage and returns default state', () => {
      let state = readState();
      state = dismissWelcome(state);
      state = markHintShown(state, 'orbit');
      state = completeOnboarding(state);

      expect(state.phase).toBe('complete');
      expect(store[STORAGE_KEY]).toBeDefined();

      state = resetOnboarding();
      expect(state.phase).toBe('welcome');
      expect(state.hintsShown).toEqual({});
      expect(store[STORAGE_KEY]).toBeUndefined();
    });

    it('after reset, readState returns fresh welcome', () => {
      let state = readState();
      state = completeOnboarding(state);
      resetOnboarding();

      const fresh = readState();
      expect(fresh.phase).toBe('welcome');
    });
  });

  describe('full lifecycle', () => {
    it('welcome → exploring → hints → complete → reload skips', () => {
      // First visit
      let state = readState();
      expect(state.phase).toBe('welcome');

      // User clicks "Enter the Forest"
      state = dismissWelcome(state);
      expect(state.phase).toBe('exploring');

      // Hints play through
      state = markHintShown(state, 'orbit');
      state = markHintShown(state, 'node-click');
      state = markHintShown(state, 'code-reader');
      state = markHintShown(state, 'quest-log');
      state = markHintShown(state, 'complete');

      // Onboarding completes
      state = completeOnboarding(state);
      expect(state.phase).toBe('complete');

      // "Reload" — read from localStorage
      const reloaded = readState();
      expect(reloaded.phase).toBe('complete');
      expect(reloaded.hintsShown.orbit).toBe(true);
      expect(reloaded.hintsShown.complete).toBe(true);
    });
  });
});
