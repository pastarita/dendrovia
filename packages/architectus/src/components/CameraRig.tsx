import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { PlayerMovedEvent } from '@dendrovia/shared';
import { useRendererStore } from '../store/useRendererStore';
import { deriveDimensions } from '../systems/PlatformConfig';
import type { PlatformConfig, PlatformDimensions } from '../systems/PlatformConfig';

/**
 * CAMERA RIG (D4)
 *
 * Two modes with smooth transition:
 *
 * Falcon Mode (Overview):
 *   - Orbital controls, free-floating
 *   - Position/target/distance derived from topology extent
 *
 * Player Mode (Exploration) — "Ant on a Manifold":
 *   - Surface-locked to nearest branch cylinder
 *   - Character scale proportional to trunk radius
 *   - Platform detection: flat-ground physics when on platform
 *
 * All positioning and physics values are topology-derived via PlatformConfig.
 */

/** Fallback defaults when no topology has been loaded yet */
const FALLBACK_FALCON = {
  position: new THREE.Vector3(10, 14, -16),
  target: new THREE.Vector3(0, 3, 0),
  minDistance: 5,
  maxDistance: 100,
};

/** Fallback physics when no config is available */
const FALLBACK_PHYSICS = {
  playerHeight: 1.5,
  moveSpeed: 4.0,
  strafeSpeed: 2.0,
  jumpStrength: 5.0,
  gravityStrength: 12.0,
  lookAheadDistance: 3.0,
  surfaceDamping: 0.15,
  platformRadiusSq: 9,
  platformYThreshold: 1.5,
};

const TRANSITION_DURATION = 1.5; // seconds
const MOVE_EMIT_THRESHOLD = 0.5;
const DAMPING_FACTOR = 0.05;

// Reusable vectors to avoid per-frame allocation
const _axisDir = new THREE.Vector3();
const _toCamera = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _surfacePos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _movement = new THREE.Vector3();

/** Read dimensions from store config, with fallback */
function getDimensions(): PlatformDimensions | null {
  const config = useRendererStore.getState().platformConfig;
  if (!config) return null;
  return deriveDimensions(config);
}

/**
 * SURFACE CAMERA (D4)
 *
 * Renders nothing — manipulates camera position each frame.
 * Physics values scale with topology via PlatformDimensions.
 */
function SurfaceCamera() {
  const { camera } = useThree();

  const keys = useRef({ w: false, s: false, a: false, d: false, space: false });

  const physicsRef = useRef({
    t: 0.5,
    theta: 0,
    jumpVelocity: 0,
    heightOffset: 0,
    grounded: true,
    smoothPosition: new THREE.Vector3(),
    currentSegmentIndex: -1,
  });

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

  useEffect(() => {
    physicsRef.current.smoothPosition.copy(camera.position);
  }, [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const spatialIndex = useRendererStore.getState().spatialIndex;
    const physics = physicsRef.current;
    const k = keys.current;

    // Read topology-derived physics values
    const dim = getDimensions();
    const ph = dim ?? FALLBACK_PHYSICS;
    const config = useRendererStore.getState().platformConfig;
    const oy = config?.origin[1] ?? 0;

    // --- Platform detection ---
    const pos = camera.position;
    const dxSq = (pos.x - (config?.origin[0] ?? 0)) ** 2;
    const dzSq = (pos.z - (config?.origin[2] ?? 0)) ** 2;
    const onPlatform = dxSq + dzSq < ph.platformRadiusSq && pos.y < ph.platformYThreshold;
    const wasOnPlatform = useRendererStore.getState().isOnPlatform;
    if (onPlatform !== wasOnPlatform) {
      useRendererStore.getState().setOnPlatform(onPlatform);
    }

    if (onPlatform) {
      let moveX = 0;
      let moveZ = 0;
      if (k.w) moveZ -= ph.moveSpeed * dt;
      if (k.s) moveZ += ph.moveSpeed * dt;
      if (k.a) moveX -= ph.moveSpeed * dt;
      if (k.d) moveX += ph.moveSpeed * dt;

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();

      _movement.set(0, 0, 0);
      _movement.addScaledVector(forward, -moveZ);
      _movement.addScaledVector(right, moveX);

      const targetPos = _surfacePos.copy(pos).add(_movement);

      if (k.space && physics.grounded) {
        physics.jumpVelocity = ph.jumpStrength;
        physics.grounded = false;
        keys.current.space = false;
      }

      if (!physics.grounded) {
        physics.heightOffset += physics.jumpVelocity * dt;
        physics.jumpVelocity -= ph.gravityStrength * dt;
        if (physics.heightOffset <= 0) {
          physics.heightOffset = 0;
          physics.jumpVelocity = 0;
          physics.grounded = true;
        }
      }

      targetPos.y = oy + ph.playerHeight + physics.heightOffset;

      physics.smoothPosition.lerp(targetPos, 1 - Math.pow(ph.surfaceDamping, dt));
      camera.position.copy(physics.smoothPosition);

      // Look toward trunk center at trunk midpoint height
      const lookY = oy + (config?.trunkLength ?? 3) * 0.5;
      _lookTarget.set(config?.origin[0] ?? 0, lookY, config?.origin[2] ?? 0);
      camera.lookAt(_lookTarget);
      return;
    }

    // --- Branch surface-lock physics ---
    if (!spatialIndex || spatialIndex.nodeCount === 0) return;

    const nearest = spatialIndex.nearestSegment(camera.position);
    if (!nearest) return;

    const { segment, t: nearestT } = nearest;

    _axisDir.copy(segment.end).sub(segment.start).normalize();

    const currentT = physics.currentSegmentIndex === nearest.index
      ? physics.t
      : nearestT;

    const axisPoint = _surfacePos
      .copy(segment.start)
      .lerp(segment.end, currentT);

    _toCamera.copy(camera.position).sub(axisPoint);
    const axisComponent = _toCamera.dot(_axisDir);
    _toCamera.addScaledVector(_axisDir, -axisComponent);

    const radialDist = _toCamera.length();
    if (radialDist > 0.001) {
      _normal.copy(_toCamera).normalize();
    } else {
      _normal.set(0, 1, 0);
      if (Math.abs(_axisDir.dot(_normal)) > 0.9) {
        _normal.set(1, 0, 0);
      }
      _normal.crossVectors(_axisDir, _normal).normalize();
    }

    _tangent.crossVectors(_axisDir, _normal).normalize();

    let tDelta = 0;
    if (k.w) tDelta += ph.moveSpeed * dt;
    if (k.s) tDelta -= ph.moveSpeed * dt;

    const segmentLength = segment.start.distanceTo(segment.end);
    if (segmentLength > 0.01) {
      physics.t += tDelta / segmentLength;
    }

    if (k.a) physics.theta -= ph.strafeSpeed * dt;
    if (k.d) physics.theta += ph.strafeSpeed * dt;

    if (physics.t > 1.0) {
      const nextNearest = spatialIndex.nearestSegment(segment.end);
      if (nextNearest && nextNearest.index !== nearest.index) {
        physics.currentSegmentIndex = nextNearest.index;
        physics.t = nextNearest.t;
      } else {
        physics.t = 1.0;
      }
    } else if (physics.t < 0.0) {
      const prevNearest = spatialIndex.nearestSegment(segment.start);
      if (prevNearest && prevNearest.index !== nearest.index) {
        physics.currentSegmentIndex = prevNearest.index;
        physics.t = prevNearest.t;
      } else {
        physics.t = 0.0;
      }
    } else {
      physics.currentSegmentIndex = nearest.index;
    }

    if (k.space && physics.grounded) {
      physics.jumpVelocity = ph.jumpStrength;
      physics.grounded = false;
      keys.current.space = false;
    }

    if (!physics.grounded) {
      physics.heightOffset += physics.jumpVelocity * dt;
      physics.jumpVelocity -= ph.gravityStrength * dt;

      if (physics.heightOffset <= 0) {
        physics.heightOffset = 0;
        physics.jumpVelocity = 0;
        physics.grounded = true;
      }
    }

    const clampedT = Math.max(0, Math.min(1, physics.t));
    axisPoint.copy(segment.start).lerp(segment.end, clampedT);

    const sinT = Math.sin(physics.theta);
    const cosT = Math.cos(physics.theta);
    _movement
      .copy(_normal).multiplyScalar(cosT)
      .addScaledVector(_tangent, sinT);

    const totalHeight = ph.playerHeight + physics.heightOffset;
    const targetPos = _surfacePos
      .copy(axisPoint)
      .addScaledVector(_movement, totalHeight);

    physics.smoothPosition.lerp(targetPos, 1 - Math.pow(ph.surfaceDamping, dt));
    camera.position.copy(physics.smoothPosition);

    const lookT = Math.min(1, clampedT + ph.lookAheadDistance / Math.max(segmentLength, 0.01));
    _lookTarget.copy(segment.start).lerp(segment.end, lookT);
    _lookTarget.addScaledVector(_movement, ph.playerHeight * 0.3);
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
  const platformConfig = useRendererStore((s) => s.platformConfig);
  const { camera } = useThree();

  const lastEmittedPos = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));

  const transitionRef = useRef({
    active: false,
    elapsed: 0,
    startPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endPosition: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
  });

  // Derive falcon camera values from topology config
  const falcon = platformConfig
    ? (() => {
        const dim = deriveDimensions(platformConfig);
        return {
          position: new THREE.Vector3(...dim.falconPosition),
          target: new THREE.Vector3(...dim.falconTarget),
          minDistance: dim.falconMinDistance,
          maxDistance: dim.falconMaxDistance,
        };
      })()
    : FALLBACK_FALCON;

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
      t.endPosition.copy(falcon.position);
      t.endTarget.copy(falcon.target);
    } else {
      // Player mode: spawn on root platform
      const dim = getDimensions();
      if (dim) {
        const [sx, sy, sz] = dim.spawnPoint;
        t.endPosition.set(sx, sy, sz);
        const config = useRendererStore.getState().platformConfig!;
        t.endTarget.set(
          config.origin[0],
          config.origin[1] + config.trunkLength * 0.3,
          config.origin[2],
        );
      } else {
        const [px, py, pz] = playerPosition;
        t.endPosition.set(px, py + 3, pz - 5);
        t.endTarget.set(px, py, pz);
      }
      useRendererStore.getState().setOnPlatform(true);
    }
  }, [cameraMode, transitioning, camera, playerPosition, falcon]);

  // Animate transition
  useFrame((_, delta) => {
    const t = transitionRef.current;
    if (!t.active) return;

    t.elapsed += delta;
    const progress = Math.min(t.elapsed / TRANSITION_DURATION, 1);

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

  // Emit PLAYER_MOVED when camera moves more than threshold
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

  // Falcon mode: orbital controls with topology-derived distances
  if (cameraMode === 'falcon') {
    return (
      <OrbitControls
        ref={controlsRef}
        enabled={!isUiHovered}
        enableDamping
        dampingFactor={DAMPING_FACTOR}
        minDistance={falcon.minDistance}
        maxDistance={falcon.maxDistance}
        maxPolarAngle={Math.PI * 0.85}
        makeDefault
      />
    );
  }

  // Player mode: D4 surface-locked camera ("ant on a manifold")
  return <SurfaceCamera />;
}
