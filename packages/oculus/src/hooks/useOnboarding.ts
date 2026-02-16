/**
 * useOnboarding — Onboarding state with localStorage persistence
 *
 * Manages welcome screen, contextual hints, and completion tracking.
 * Uses localStorage directly (OPERATUS is not wired in the browser bundle).
 */

import { useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────

export type OnboardingPhase = 'welcome' | 'exploring' | 'complete';

export interface OnboardingState {
  phase: OnboardingPhase;
  hintsShown: Record<string, boolean>;
}

export interface UseOnboardingReturn {
  phase: OnboardingPhase;
  isComplete: boolean;
  dismissWelcome: () => void;
  markHintShown: (id: string) => void;
  isHintShown: (id: string) => boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

// ── Constants ──────────────────────────────────────────

const STORAGE_KEY = 'dendrovia-onboarding-v1';

const DEFAULT_STATE: OnboardingState = {
  phase: 'welcome',
  hintsShown: {},
};

// ── Helpers ────────────────────────────────────────────

function readState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be full or unavailable — silently degrade
  }
}

// ── Hook ───────────────────────────────────────────────

export function useOnboarding(): UseOnboardingReturn {
  const [state, setState] = useState<OnboardingState>(readState);

  const persist = useCallback((next: OnboardingState) => {
    setState(next);
    writeState(next);
  }, []);

  const dismissWelcome = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'welcome') return prev;
      const next = { ...prev, phase: 'exploring' as const };
      writeState(next);
      return next;
    });
  }, []);

  const markHintShown = useCallback((id: string) => {
    setState((prev) => {
      if (prev.hintsShown[id]) return prev;
      const next = {
        ...prev,
        hintsShown: { ...prev.hintsShown, [id]: true },
      };
      writeState(next);
      return next;
    });
  }, []);

  const isHintShown = useCallback(
    (id: string) => !!state.hintsShown[id],
    [state.hintsShown],
  );

  const completeOnboarding = useCallback(() => {
    setState((prev) => {
      if (prev.phase === 'complete') return prev;
      const next = { ...prev, phase: 'complete' as const };
      writeState(next);
      return next;
    });
  }, []);

  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(DEFAULT_STATE);
  }, []);

  return {
    phase: state.phase,
    isComplete: state.phase === 'complete',
    dismissWelcome,
    markHintShown,
    isHintShown,
    completeOnboarding,
    resetOnboarding,
  };
}
