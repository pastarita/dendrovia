import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import { useRendererStore } from '../store/useRendererStore';
import { useCameraEditorStore } from '../store/useCameraEditorStore';
import { deriveDimensions } from '../systems/PlatformConfig';
import type { PlatformDimensions } from '../systems/PlatformConfig';

/**
 * PLAYER THIRD-PERSON
 *
 * Chase camera that follows behind and above the player on branch surfaces.
 * Reuses the same branch-walking physics as PlayerFirstPerson (SurfaceCamera),
 * but places the camera at an offset behind + above the player position.
 *
 * Mouse orbit: click canvas to enter pointer lock, mouse controls orbit
 * azimuth/elevation around the player. WASD moves the player relative
 * to the camera's horizontal facing direction.
 */

// Chase params moved to useCameraEditorStore.authoredParams.player3p
// Kept as module-scope temp for per-frame offset computation
const _chaseOffsetVec = new THREE.Vector3();
const MOVE_EMIT_THRESHOLD = 0.5;

/** Min/max elevation angle (radians) — prevents flipping over/under */
const MIN_ELEVATION = 0.1;
const MAX_ELEVATION = Math.PI * 0.45;

// Reusable vectors for zero per-frame allocation
const _axisDir = new THREE.Vector3();
const _toCamera = new THREE.Vector3();
const _tangent = new THREE.Vector3();
const _normal = new THREE.Vector3();
const _surfacePos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _movement = new THREE.Vector3();
const _chasePos = new THREE.Vector3();
const _playerWorldPos = new THREE.Vector3();

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

/** Read dimensions from store config, with fallback */
function getDimensions(): PlatformDimensions | null {
  const config = useRendererStore.getState().platformConfig;
  if (!config) return null;
  return deriveDimensions(config);
}

export function PlayerThirdPerson() {
  const { camera, gl } = useThree();

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

  // Orbit state — spherical coordinates around the player (right-click drag)
  const orbitRef = useRef({
    azimuth: Math.PI,   // horizontal angle (radians), PI = behind player
    elevation: 0.4,     // vertical angle (radians), ~23°
    isRightDragging: false,
    initialized: false,
  });

  /** Chase distance override from scroll wheel — lazy-initialized from chaseOffset magnitude */
  const chaseDistanceRef = useRef<number | null>(null);

  const lastEmittedPos = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));

  // Right-click drag for orbit + scroll wheel for zoom (WoW/Google Earth style)
  useEffect(() => {
    const canvas = gl.domElement;

    const preventContext = (e: Event) => e.preventDefault();
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) orbitRef.current.isRightDragging = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) orbitRef.current.isRightDragging = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!orbitRef.current.isRightDragging) return;
      const sensitivity = useCameraEditorStore.getState().authoredParams.player3p.orbitSensitivity;
      const orbit = orbitRef.current;
      orbit.azimuth -= e.movementX * sensitivity;
      orbit.elevation += e.movementY * sensitivity;
      orbit.elevation = Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, orbit.elevation));
    };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p3p = useCameraEditorStore.getState().authoredParams.player3p;
      // Lazy-init chase distance from chaseOffset magnitude
      if (chaseDistanceRef.current === null) {
        const off = p3p.chaseOffset;
        chaseDistanceRef.current = Math.sqrt(off[0] * off[0] + off[1] * off[1]);
      }
      const delta = e.deltaY * 0.01;
      chaseDistanceRef.current = Math.max(
        p3p.minDistance,
        Math.min(p3p.maxDistance, chaseDistanceRef.current + delta),
      );
    };

    canvas.addEventListener('contextmenu', preventContext);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('contextmenu', preventContext);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [gl]);

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

    // Read authored params (zero-subscription via getState)
    const p3p = useCameraEditorStore.getState().authoredParams.player3p;
    _chaseOffsetVec.set(p3p.chaseOffset[0], p3p.chaseOffset[1], p3p.chaseOffset[2]);

    const dim = getDimensions();
    const ph = dim ?? FALLBACK_PHYSICS;
    const config = useRendererStore.getState().platformConfig;
    const oy = config?.origin[1] ?? 0;

    // --- Platform detection (flat ground) ---
    const pos = _playerWorldPos.copy(physics.smoothPosition);
    const dxSq = (pos.x - (config?.origin[0] ?? 0)) ** 2;
    const dzSq = (pos.z - (config?.origin[2] ?? 0)) ** 2;
    const onPlatform = dxSq + dzSq < ph.platformRadiusSq && pos.y < ph.platformYThreshold + 2;
    const wasOnPlatform = useRendererStore.getState().isOnPlatform;
    if (onPlatform !== wasOnPlatform) {
      useRendererStore.getState().setOnPlatform(onPlatform);
    }

    // Initialize orbit azimuth from camera's current position relative to player
    const orbit = orbitRef.current;
    if (!orbit.initialized) {
      const dx = camera.position.x - physics.smoothPosition.x;
      const dz = camera.position.z - physics.smoothPosition.z;
      const dy = camera.position.y - physics.smoothPosition.y;
      const horizDist = Math.sqrt(dx * dx + dz * dz);
      orbit.azimuth = Math.atan2(dx, dz);
      orbit.elevation = Math.atan2(dy, horizDist);
      orbit.elevation = Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, orbit.elevation));
      orbit.initialized = true;
    }

    // Use scroll-wheel distance if set, otherwise compute from authored offset
    if (chaseDistanceRef.current === null) {
      chaseDistanceRef.current = Math.sqrt(
        _chaseOffsetVec.x * _chaseOffsetVec.x + _chaseOffsetVec.y * _chaseOffsetVec.y,
      );
    }
    const chaseDistance = chaseDistanceRef.current;

    if (onPlatform) {
      let moveX = 0;
      let moveZ = 0;
      if (k.w) moveZ -= ph.moveSpeed * dt;
      if (k.s) moveZ += ph.moveSpeed * dt;
      if (k.a) moveX -= ph.moveSpeed * dt;
      if (k.d) moveX += ph.moveSpeed * dt;

      // Movement relative to camera azimuth (orbit-based direction)
      const sinAz = Math.sin(orbit.azimuth);
      const cosAz = Math.cos(orbit.azimuth);
      // Forward = direction from camera toward player (negative orbit direction)
      _movement.set(
        -sinAz * (-moveZ) + cosAz * moveX,
        0,
        -cosAz * (-moveZ) + (-sinAz) * moveX,
      );

      // Player position (ground level)
      _playerWorldPos.add(_movement);

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

      _playerWorldPos.y = oy + ph.playerHeight + physics.heightOffset;
      physics.smoothPosition.lerp(_playerWorldPos, 1 - Math.pow(ph.surfaceDamping, dt));

      // Chase camera: spherical orbit around player using mouse-controlled angles
      const cosEl = Math.cos(orbit.elevation);
      _chasePos.set(
        physics.smoothPosition.x + Math.sin(orbit.azimuth) * cosEl * chaseDistance,
        physics.smoothPosition.y + Math.sin(orbit.elevation) * chaseDistance,
        physics.smoothPosition.z + Math.cos(orbit.azimuth) * cosEl * chaseDistance,
      );

      camera.position.lerp(_chasePos, p3p.chaseLag);
      camera.lookAt(physics.smoothPosition);
      emitMoveIfNeeded(camera, lastEmittedPos);
      return;
    }

    // --- Branch surface-lock physics (same as PlayerFirstPerson) ---
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
    _playerWorldPos
      .copy(axisPoint)
      .addScaledVector(_movement, totalHeight);

    physics.smoothPosition.lerp(_playerWorldPos, 1 - Math.pow(ph.surfaceDamping, dt));

    // Chase camera: spherical orbit around player using mouse-controlled angles
    const cosEl = Math.cos(orbit.elevation);
    _chasePos.set(
      physics.smoothPosition.x + Math.sin(orbit.azimuth) * cosEl * chaseDistance,
      physics.smoothPosition.y + Math.sin(orbit.elevation) * chaseDistance,
      physics.smoothPosition.z + Math.cos(orbit.azimuth) * cosEl * chaseDistance,
    );

    camera.position.lerp(_chasePos, p3p.chaseLag);
    camera.lookAt(physics.smoothPosition);

    emitMoveIfNeeded(camera, lastEmittedPos);
  });

  return null;
}

function emitMoveIfNeeded(
  camera: THREE.Camera,
  lastEmittedPos: React.MutableRefObject<THREE.Vector3>,
) {
  const dist = camera.position.distanceTo(lastEmittedPos.current);
  if (dist >= MOVE_EMIT_THRESHOLD) {
    lastEmittedPos.current.copy(camera.position);
    const branchId = useRendererStore.getState().playerBranchId;
    getEventBus().emit(GameEvents.PLAYER_MOVED, {
      position: camera.position.toArray() as [number, number, number],
      branchId: branchId ?? 'root',
      velocity: [0, 0, 0],
    });
  }
}
