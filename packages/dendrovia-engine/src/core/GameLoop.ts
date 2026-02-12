/**
 * GameLoop - Central game state and frame orchestration
 * Uses Zustand for reactive state management
 */

import { create } from 'zustand';
import type { GameState } from '../types';

interface GameLoopStore extends GameState {
  deltaTime: number;
  elapsedTime: number;
  frameCount: number;

  // Actions
  setMode: (mode: 'falcon' | 'player') => void;
  setTimeScale: (scale: number) => void;
  togglePause: () => void;
  tick: (delta: number, elapsed: number) => void;
}

export const useGameLoop = create<GameLoopStore>((set) => ({
  // State
  mode: 'falcon',
  timeScale: 1.0,
  isPaused: false,
  deltaTime: 0,
  elapsedTime: 0,
  frameCount: 0,

  // Actions
  setMode: (mode) => set({ mode }),
  setTimeScale: (timeScale) => set({ timeScale }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  tick: (delta, elapsed) =>
    set((state) => ({
      deltaTime: delta * state.timeScale,
      elapsedTime: elapsed,
      frameCount: state.frameCount + 1,
    })),
}));

export const GameLoop = {
  useStore: useGameLoop,
};
