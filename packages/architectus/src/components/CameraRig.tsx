import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { PlayerMovedEvent } from '@dendrovia/shared';
import { useRendererStore } from '../store/useRendererStore';

type OrbitControlsImpl = {
  target: THREE.Vector3;
  update: () => void;
};

/**
 * CAMERA RIG
 *
 * Two modes with smooth transition:
 *
 * Falcon Mode (Overview):
 *   - Orbital controls, free-floating
 *   - For pattern recognition, hotspot detection
 *   - MinDistance: 10, MaxDistance: 100
 *
 * Player Mode (Exploration):
 *   - Surface-locked "ant on a manifold"
 *   - Third-person, gravity toward branch axis
 *   - For code reading, quest interaction
 *
 * Transition: Smooth SLERP camera rotation + LERP position over 1.5s.
 */

const FALCON_DEFAULTS = {
  position: new THREE.Vector3(10, 14, -16),
  target: new THREE.Vector3(-2, 5, 3),
  minDistance: 5,
  maxDistance: 100,
  dampingFactor: 0.05,
};

const TRANSITION_DURATION = 1.5; // seconds

/** Minimum distance (in world units) the camera must move before emitting PLAYER_MOVED */
const MOVE_EMIT_THRESHOLD = 0.5;

export function CameraRig() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const cameraMode = useRendererStore((s) => s.cameraMode);
  const transitioning = useRendererStore((s) => s.cameraTransitioning);
  const playerPosition = useRendererStore((s) => s.playerPosition);
  const isUiHovered = useRendererStore((s) => s.isUiHovered);
  const { camera } = useThree();

  // Track last emitted position for PLAYER_MOVED debouncing
  const lastEmittedPos = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));

  // Transition state
  const transitionRef = useRef({
    active: false,
    elapsed: 0,
    startPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endPosition: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
  });

  // Start transition when camera mode changes
  useEffect(() => {
    if (!transitioning) return;

    const t = transitionRef.current;
    t.active = true;
    t.elapsed = 0;
    t.startPosition.copy(camera.position);

    if (controlsRef.current) {
      t.startTarget.copy(controlsRef.current.target);
    }

    if (cameraMode === 'falcon') {
      t.endPosition.copy(FALCON_DEFAULTS.position);
      t.endTarget.copy(FALCON_DEFAULTS.target);
    } else {
      // Player mode: position behind and above the player
      const [px, py, pz] = playerPosition;
      t.endPosition.set(px, py + 3, pz - 5);
      t.endTarget.set(px, py, pz);
    }
  }, [cameraMode, transitioning, camera, playerPosition]);

  // Animate transition
  useFrame((_, delta) => {
    const t = transitionRef.current;
    if (!t.active) return;

    t.elapsed += delta;
    const progress = Math.min(t.elapsed / TRANSITION_DURATION, 1);

    // Smooth ease-in-out
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    camera.position.lerpVectors(t.startPosition, t.endPosition, ease);

    if (controlsRef.current) {
      controlsRef.current.target.lerpVectors(
        t.startTarget,
        t.endTarget,
        ease
      );
    }

    if (progress >= 1) {
      t.active = false;
      useRendererStore.setState({ cameraTransitioning: false });
    }
  });

  // Emit PLAYER_MOVED when camera moves more than MOVE_EMIT_THRESHOLD units
  useFrame(() => {
    const dist = camera.position.distanceTo(lastEmittedPos.current);
    if (dist >= MOVE_EMIT_THRESHOLD) {
      lastEmittedPos.current.copy(camera.position);

      const branchId = useRendererStore.getState().playerBranchId;

      getEventBus().emit<PlayerMovedEvent>(GameEvents.PLAYER_MOVED, {
        position: camera.position.toArray() as [number, number, number],
        branchId: branchId ?? 'root',
        velocity: [0, 0, 0],
      });
    }
  });

  // Falcon mode: orbital controls
  if (cameraMode === 'falcon') {
    return (
      <OrbitControls
        ref={controlsRef}
        enabled={!isUiHovered}
        enableDamping
        dampingFactor={FALCON_DEFAULTS.dampingFactor}
        minDistance={FALCON_DEFAULTS.minDistance}
        maxDistance={FALCON_DEFAULTS.maxDistance}
        maxPolarAngle={Math.PI * 0.85}
        makeDefault
      />
    );
  }

  // Player mode: restricted orbital (will evolve to surface-locked)
  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!isUiHovered}
      enableDamping
      dampingFactor={0.1}
      minDistance={2}
      maxDistance={15}
      maxPolarAngle={Math.PI * 0.7}
      enablePan={false}
      makeDefault
    />
  );
}
