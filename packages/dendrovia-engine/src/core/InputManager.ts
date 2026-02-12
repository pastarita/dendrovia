/**
 * InputManager - Keyboard, Mouse, and Gamepad handling
 * Provides a unified input interface for game systems
 */

import { create } from 'zustand';
import type { InputState } from '../types';

interface InputStore extends InputState {
  // Actions
  pressKey: (key: string) => void;
  releaseKey: (key: string) => void;
  updateMouse: (x: number, y: number, deltaX: number, deltaY: number) => void;
  setMouseButton: (button: 'left' | 'right', pressed: boolean) => void;
  updateGamepad: (gamepad?: Gamepad) => void;
}

export const useInput = create<InputStore>((set) => ({
  // State
  keys: new Set<string>(),
  mouse: {
    x: 0,
    y: 0,
    deltaX: 0,
    deltaY: 0,
    leftButton: false,
    rightButton: false,
  },
  gamepad: undefined,

  // Actions
  pressKey: (key) =>
    set((state) => {
      const keys = new Set(state.keys);
      keys.add(key.toLowerCase());
      return { keys };
    }),

  releaseKey: (key) =>
    set((state) => {
      const keys = new Set(state.keys);
      keys.delete(key.toLowerCase());
      return { keys };
    }),

  updateMouse: (x, y, deltaX, deltaY) =>
    set((state) => ({
      mouse: { ...state.mouse, x, y, deltaX, deltaY },
    })),

  setMouseButton: (button, pressed) =>
    set((state) => ({
      mouse: {
        ...state.mouse,
        [button === 'left' ? 'leftButton' : 'rightButton']: pressed,
      },
    })),

  updateGamepad: (gamepad) => set({ gamepad }),
}));

// Singleton instance
export const InputManager = {
  useStore: useInput,

  isKeyPressed: (key: string): boolean => {
    return useInput.getState().keys.has(key.toLowerCase());
  },

  getMouseDelta: () => {
    const { deltaX, deltaY } = useInput.getState().mouse;
    return { deltaX, deltaY };
  },
};
