/**
 * Core type definitions for the Dendrovia engine
 */

import type { Vector3 } from 'three';

export interface GameState {
  mode: 'falcon' | 'player'; // Falcon = bird's eye, Player = third person
  timeScale: number;
  isPaused: boolean;
}

export interface InputState {
  keys: Set<string>;
  mouse: {
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    leftButton: boolean;
    rightButton: boolean;
  };
  gamepad?: Gamepad;
}

export interface CameraState {
  position: Vector3;
  target: Vector3;
  distance: number;
  pitch: number;
  yaw: number;
}

export interface WorldConfig {
  seed: number;
  size: number;
  chunkSize: number;
  renderDistance: number;
}
