import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { PlayerMovedEvent } from '@dendrovia/shared';
import { useRendererStore } from '../store/useRendererStore';

/**
 * CAMERA RIG (D4)
 *
 * Two modes with smooth transition:
 *
 * Falcon Mode (Overview):
 *   - Orbital controls, free-floating
 *   - For pattern recognition, hotspot detection
 *   - MinDistance: 5, MaxDistance: 100
 *
 * Player Mode (Exploration) — "Ant on a Manifold":
 *   - Surface-locked to nearest branch cylinder
 *   - Gravity vector = toward branch axis (not world-down)
 *   - Movement tangent to cylinder surface
 *   - Keyboard WASD: forward/back along branch, strafe around cylinder
 *   - Space: jump with parabolic return to surface
 *   - At branch junctions: smooth transition between segments
 *
 * Transition: Smooth cubic ease camera position + target over 1.5s.
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

/** D4: Surface camera constants */
const SURFACE_CONFIG = {
  /** Distance from branch axis to camera (cylinder radius + offset) */
  playerHeight: 1.5,
  /** Movement speed along branch axis (units/sec) */
  moveSpeed: 4.0,
  /** Movement speed around branch circumference (rad/sec) */
  strafeSpeed: 2.0,
  /** Jump impulse strength */
  jumpStrength: 5.0,
  /** Gravity strength toward surface (units/sec^2) */
  gravityStrength: 12.0,
  /** Damping for smooth surface snap */
  surfaceDamping: 0.15,
  /** Camera look-ahead distance along branch */
  lookAheadDistance: 3.0,
} as const;

// Reusable vectors to avoid per-frame allocation
const _axisDir = new THREE.Vector3();
const _toCamera = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _surfacePos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _movement = new THREE.Vector3();

/**
 * SURFACE CAMERA (D4)
 *
 * Renders nothing — just manipulates camera position each frame
 * based on surface-lock physics relative to the nearest branch segment.
 */
function SurfaceCamera() {
  const { camera } = useThree();

  // Input state tracked via keyboard events
  const keys = useRef({ w: false, s: false, a: false, d: false, space: false });

  // Surface physics state
  const physicsRef = useRef({
    /** Current parametric position along segment (0-1) */
    t: 0.5,
    /** Current angle around branch cylinder */
    theta: 0,
    /** Vertical velocity for jump arc */
    jumpVelocity: 0,
    /** Height offset from surface (non-zero during jump) */
    heightOffset: 0,
    /** Whether player is on surface (not jumping) */
    grounded: true,
    /** Smoothed position for damping */
    smoothPosition: new THREE.Vector3(),
    /** Index of current segment in spatial index */
    currentSegmentIndex: -1,
  });

  // Register keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.w = true;
      if (key === 's' || key === 'arrowdown') keys.current.s = true;
      if (key === 'a' || key === 'arrowleft') keys.current.a = true;
      if (key === 'd' || key === 'arrowright') keys.current.d = true;
      if (key === ' ') keys.current.space = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.w = false;
      if (key === 's' || key === 'arrowdown') keys.current.s = false;
      if (key === 'a' || key === 'arrowleft') keys.current.a = false;
      if (key === 'd' || key === 'arrowright') keys.current.d = false;
      if (key === ' ') keys.current.space = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize smooth position
  useEffect(() => {
    physicsRef.current.smoothPosition.copy(camera.position);
  }, [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1); // Clamp for tab-switch
    const spatialIndex = useRendererStore.getState().spatialIndex;
    if (!spatialIndex || spatialIndex.nodeCount === 0) return;

    const physics = physicsRef.current;
    const k = keys.current;

    // Query nearest branch segment to current camera position
    const nearest = spatialIndex.nearestSegment(camera.position);
    if (!nearest) return;

    const { segment, t: nearestT } = nearest;

    // Segment axis direction (start → end)
    _axisDir.copy(segment.end).sub(segment.start).normalize();

    // Current point on segment axis at parametric t
    const currentT = physics.currentSegmentIndex === nearest.index
      ? physics.t
      : nearestT;

    const axisPoint = _surfacePos
      .copy(segment.start)
      .lerp(segment.end, currentT);

    // Vector from axis to camera = radial direction (surface normal)
    _toCamera.copy(camera.position).sub(axisPoint);
    // Project out the axis component to get pure radial
    const axisComponent = _toCamera.dot(_axisDir);
    _toCamera.addScaledVector(_axisDir, -axisComponent);

    const radialDist = _toCamera.length();
    if (radialDist > 0.001) {
      _normal.copy(_toCamera).normalize();
    } else {
      // Camera is on axis — pick an arbitrary perpendicular
      _normal.set(0, 1, 0);
      if (Math.abs(_axisDir.dot(_normal)) > 0.9) {
        _normal.set(1, 0, 0);
      }
      _normal.crossVectors(_axisDir, _normal).normalize();
    }

    // Tangent = cross(axis, normal) — movement direction around cylinder
    _tangent.crossVectors(_axisDir, _normal).normalize();

    // --- Process input ---

    // Forward/back: move along branch axis (change t)
    let tDelta = 0;
    if (k.w) tDelta += SURFACE_CONFIG.moveSpeed * dt;
    if (k.s) tDelta -= SURFACE_CONFIG.moveSpeed * dt;

    // Convert world-space speed to parametric delta
    const segmentLength = segment.start.distanceTo(segment.end);
    if (segmentLength > 0.01) {
      physics.t += tDelta / segmentLength;
    }

    // Strafe: rotate around cylinder (change theta)
    if (k.a) physics.theta -= SURFACE_CONFIG.strafeSpeed * dt;
    if (k.d) physics.theta += SURFACE_CONFIG.strafeSpeed * dt;

    // Junction detection: if t exceeds [0, 1], find connecting segment
    if (physics.t > 1.0) {
      // Walked past segment end — snap to nearest segment from end point
      const nextNearest = spatialIndex.nearestSegment(segment.end);
      if (nextNearest && nextNearest.index !== nearest.index) {
        physics.currentSegmentIndex = nextNearest.index;
        physics.t = nextNearest.t;
      } else {
        physics.t = 1.0; // Clamp at end
      }
    } else if (physics.t < 0.0) {
      // Walked past segment start
      const prevNearest = spatialIndex.nearestSegment(segment.start);
      if (prevNearest && prevNearest.index !== nearest.index) {
        physics.currentSegmentIndex = prevNearest.index;
        physics.t = prevNearest.t;
      } else {
        physics.t = 0.0; // Clamp at start
      }
    } else {
      physics.currentSegmentIndex = nearest.index;
    }

    // Jump
    if (k.space && physics.grounded) {
      physics.jumpVelocity = SURFACE_CONFIG.jumpStrength;
      physics.grounded = false;
      keys.current.space = false; // Consume jump input
    }

    // Update jump physics
    if (!physics.grounded) {
      physics.heightOffset += physics.jumpVelocity * dt;
      physics.jumpVelocity -= SURFACE_CONFIG.gravityStrength * dt;

      if (physics.heightOffset <= 0) {
        physics.heightOffset = 0;
        physics.jumpVelocity = 0;
        physics.grounded = true;
      }
    }

    // --- Compute target position on cylinder surface ---

    // Point on axis at current t
    const clampedT = Math.max(0, Math.min(1, physics.t));
    axisPoint.copy(segment.start).lerp(segment.end, clampedT);

    // Compute radial direction at current theta
    // Rotate the initial normal around the axis by theta
    const sinT = Math.sin(physics.theta);
    const cosT = Math.cos(physics.theta);
    _movement
      .copy(_normal).multiplyScalar(cosT)
      .addScaledVector(_tangent, sinT);

    // Surface position = axis point + radius * radial + height offset * normal
    const totalHeight = SURFACE_CONFIG.playerHeight + physics.heightOffset;
    const targetPos = _surfacePos
      .copy(axisPoint)
      .addScaledVector(_movement, totalHeight);

    // Smooth camera movement (damped lerp)
    physics.smoothPosition.lerp(targetPos, 1 - Math.pow(SURFACE_CONFIG.surfaceDamping, dt));
    camera.position.copy(physics.smoothPosition);

    // Look-at target: point ahead on the branch
    const lookT = Math.min(1, clampedT + SURFACE_CONFIG.lookAheadDistance / Math.max(segmentLength, 0.01));
    _lookTarget.copy(segment.start).lerp(segment.end, lookT);
    // Offset look target slightly toward the axis (look "into" the branch)
    _lookTarget.addScaledVector(_movement, SURFACE_CONFIG.playerHeight * 0.3);
    camera.lookAt(_lookTarget);
  });

  return null;
}

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

  // Player mode: D4 surface-locked camera ("ant on a manifold")
  return <SurfaceCamera />;
}
