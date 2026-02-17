import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { PlayerMovedEvent } from '@dendrovia/shared';
import { useRendererStore } from '../store/useRendererStore';
import { useCameraEditorStore } from '../store/useCameraEditorStore';
import { falconOrbitPosition, falconPathPoints } from '../systems/NestConfig';
import type { NestConfig } from '../systems/NestConfig';
import type { PlatformConfig } from '../systems/PlatformConfig';

/**
 * FALCON AUTO-ORBIT (Interactive)
 *
 * Automated camera that follows an orbital path as a **guide**, not a rail.
 *
 * User interaction model:
 *   - WASD nudges the camera off the orbit path (velocity-based offset)
 *   - When user stops input, camera drifts back toward the guide position
 *   - Orbit time continues advancing — the guide never stops
 *   - Scroll wheel adjusts orbit distance (zoom in/out)
 *
 * Two flight phases:
 *   1. Orbit: elliptical path around nest (~1.5 laps)
 *   2. Approach: smooth bezier fly-in toward nest bowl
 *
 * When approach completes, signals 'arrived' → auto-transition to player mode.
 * When devMode is active, renders the full flight path as a visible line.
 */

interface FalconAutoOrbitProps {
  nestConfig: NestConfig;
  platformConfig: PlatformConfig;
}

// Constants moved to useCameraEditorStore.authoredParams.falcon
// Kept as local fallbacks only for reference:
// GUIDE_PULL = 0.015, OFFSET_DECAY = 0.97, NUDGE_SPEED = 8.0
// ZOOM_SPEED = 0.001, ZOOM_MIN = 0.3, ZOOM_MAX = 3.0

const MOVE_EMIT_THRESHOLD = 0.5;

// Module-scope temps for zero per-frame allocation
const _guidePos = new THREE.Vector3();
const _guideLook = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _nudge = new THREE.Vector3();

export function FalconAutoOrbit({ nestConfig, platformConfig }: FalconAutoOrbitProps) {
  const { camera, clock } = useThree();
  const lastEmittedPos = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));
  const devMode = useRendererStore((s) => s.devMode);

  // Track phase transitions
  const lastPhase = useRef<string>('orbit');

  // Orbit start time (relative timing)
  const startTime = useRef(clock.elapsedTime);

  // User interaction state
  const keys = useRef({ w: false, s: false, a: false, d: false });
  const userOffset = useRef(new THREE.Vector3()); // accumulated offset from guide
  const zoomFactor = useRef(1.0); // distance multiplier (1 = default orbit radius)
  const hasUserInput = useRef(false);

  useEffect(() => {
    startTime.current = clock.elapsedTime;
    useRendererStore.getState().setFalconPhase('orbit');
  }, [clock]);

  // Keyboard listeners for falcon-mode input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.w = true;
      if (key === 's' || key === 'arrowdown') keys.current.s = true;
      if (key === 'a' || key === 'arrowleft') keys.current.a = true;
      if (key === 'd' || key === 'arrowright') keys.current.d = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.w = false;
      if (key === 's' || key === 'arrowdown') keys.current.s = false;
      if (key === 'a' || key === 'arrowleft') keys.current.a = false;
      if (key === 'd' || key === 'arrowright') keys.current.d = false;
    };

    const handleWheel = (e: WheelEvent) => {
      const fp = useCameraEditorStore.getState().authoredParams.falcon;
      const d = e.deltaY * fp.zoomSpeed;
      zoomFactor.current = Math.max(fp.zoomMin, Math.min(fp.zoomMax, zoomFactor.current + d));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const relativeTime = clock.elapsedTime - startTime.current;

    // Read authored params (zero-subscription via getState)
    const fp = useCameraEditorStore.getState().authoredParams.falcon;

    const { position: guidePosition, target: guideTarget, phase } = falconOrbitPosition(
      relativeTime,
      nestConfig,
      platformConfig,
    );

    // Apply zoom: scale guide position relative to nest center
    const nestCenter = nestConfig.nestPosition;
    _guidePos.copy(guidePosition).sub(nestCenter).multiplyScalar(zoomFactor.current).add(nestCenter);
    _guideLook.copy(guideTarget);

    // --- User input: compute nudge velocity ---
    const k = keys.current;
    const anyInput = k.w || k.s || k.a || k.d;
    hasUserInput.current = anyInput;

    if (anyInput) {
      // Camera-relative forward/right (flattened to XZ plane)
      _forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      _forward.y = 0;
      _forward.normalize();
      _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      _right.y = 0;
      _right.normalize();

      _nudge.set(0, 0, 0);
      if (k.w) _nudge.addScaledVector(_forward, fp.nudgeSpeed * dt);
      if (k.s) _nudge.addScaledVector(_forward, -fp.nudgeSpeed * dt);
      if (k.d) _nudge.addScaledVector(_right, fp.nudgeSpeed * dt);
      if (k.a) _nudge.addScaledVector(_right, -fp.nudgeSpeed * dt);

      userOffset.current.add(_nudge);
    } else {
      // Decay offset when no input — drift back toward guide
      userOffset.current.multiplyScalar(fp.offsetDecay);
      // Snap to zero if very small
      if (userOffset.current.lengthSq() < 0.0001) {
        userOffset.current.set(0, 0, 0);
      }
    }

    // Final camera target = guide position + user offset
    _guidePos.add(userOffset.current);

    // Soft pull toward guide (interpolation, not hard set)
    camera.position.lerp(_guidePos, fp.guidePull + (anyInput ? 0.04 : 0));
    camera.lookAt(_guideLook);

    // Update store phase on transitions
    if (phase !== lastPhase.current) {
      lastPhase.current = phase;
      useRendererStore.getState().setFalconPhase(phase);

      if (phase === 'arrived') {
        useRendererStore.getState().setCameraMode('player-1p');
      }
    }

    // Emit PLAYER_MOVED when camera moves past threshold
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

  // --- Dev mode: render flight path as a visible Line ---
  const pathLine = useMemo(() => {
    if (!devMode) return null;
    const points = falconPathPoints(nestConfig, platformConfig, 64);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    return new THREE.Line(geo, mat);
  }, [devMode, nestConfig, platformConfig]);

  if (!devMode || !pathLine) return null;

  return (
    <group name="falcon-path-viz">
      <primitive object={pathLine} />
    </group>
  );
}
