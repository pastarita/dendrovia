import type React from 'react';
import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import { useRendererStore } from '../store/useRendererStore';
import { useCameraEditorStore } from '../store/useCameraEditorStore';
import { deriveDimensions } from '../systems/PlatformConfig';
import type { PlatformDimensions } from '../systems/PlatformConfig';
import { falconOrbitPosition } from '../systems/NestConfig';
import { validateCameraView } from '../systems/ViewQualityValidator';
import { FalconAutoOrbit } from './FalconAutoOrbit';
import { PlayerThirdPerson } from './PlayerThirdPerson';
import { SpectatorCamera } from './SpectatorCamera';

/**
 * CAMERA RIG (D4)
 *
 * Three modes with smooth transition:
 *
 * Falcon Mode (Overview):
 *   - Automated elliptical orbit around nest center
 *   - Smooth cinematic camera movement
 *
 * Player First-Person (Exploration) — "Ant on a Manifold":
 *   - Surface-locked to nearest branch cylinder
 *   - Character scale proportional to trunk radius
 *   - Platform detection: flat-ground physics when on platform
 *
 * Player Third-Person (Chase):
 *   - Chase camera behind + above player
 *   - Same branch-walking physics as first-person
 *
 * All positioning and physics values are topology-derived via PlatformConfig.
 */

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

// Transition durations moved to useCameraEditorStore.authoredParams.transition
// Read via getState() at transition start
const MOVE_EMIT_THRESHOLD = 0.5;

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

/** Max pitch angle (radians) — prevents flipping */
const MAX_PITCH = Math.PI * 0.45;

/**
 * PLAYER FIRST-PERSON CAMERA (D4)
 *
 * Renders nothing — manipulates camera position each frame.
 * Physics values scale with topology via PlatformDimensions.
 *
 * Mouse look: click canvas to enter pointer lock, mouse controls yaw/pitch.
 * WASD moves relative to camera facing direction.
 * Escape releases pointer lock.
 */
function PlayerFirstPerson() {
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

  // Mouse look state — euler angles for free look (right-click drag)
  const lookRef = useRef({
    yaw: 0,    // horizontal rotation (radians)
    pitch: 0,  // vertical rotation (radians)
    isRightDragging: false,
    initialized: false,
  });

  // Right-click drag for mouse look (WoW/Google Earth style)
  useEffect(() => {
    const canvas = gl.domElement;

    const preventContext = (e: Event) => e.preventDefault();
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) lookRef.current.isRightDragging = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) lookRef.current.isRightDragging = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (!lookRef.current.isRightDragging) return;
      const sensitivity = useCameraEditorStore.getState().authoredParams.player1p.mouseSensitivity;
      const look = lookRef.current;
      look.yaw -= e.movementX * sensitivity;
      look.pitch -= e.movementY * sensitivity;
      look.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, look.pitch));
    };

    canvas.addEventListener('contextmenu', preventContext);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('contextmenu', preventContext);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
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

  // Apply yaw/pitch euler rotation to camera
  const applyMouseLook = useCallback(() => {
    const look = lookRef.current;
    const euler = new THREE.Euler(look.pitch, look.yaw, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);
  }, [camera]);

  // Initialize yaw from camera's current facing on first frame
  const initializeLookDirection = useCallback(() => {
    if (lookRef.current.initialized) return;
    // Extract yaw from current camera direction
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    lookRef.current.yaw = Math.atan2(-dir.x, -dir.z);
    lookRef.current.pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
    lookRef.current.initialized = true;
  }, [camera]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const spatialIndex = useRendererStore.getState().spatialIndex;
    const physics = physicsRef.current;
    const k = keys.current;

    // Initialize look direction from camera's post-transition orientation
    initializeLookDirection();

    // Read topology-derived physics values
    const dim = getDimensions();
    const ph = dim ?? FALLBACK_PHYSICS;
    const config = useRendererStore.getState().platformConfig;
    const oy = config?.origin[1] ?? 0;

    // --- Platform detection ---
    const pos = camera.position;
    const dxSq = (pos.x - (config?.origin[0] ?? 0)) ** 2;
    const dzSq = (pos.z - (config?.origin[2] ?? 0)) ** 2;
    const onPlatform = dxSq + dzSq < ph.platformRadiusSq && pos.y <= ph.platformYThreshold + 0.5;
    const wasOnPlatform = useRendererStore.getState().isOnPlatform;
    if (onPlatform !== wasOnPlatform) {
      useRendererStore.getState().setOnPlatform(onPlatform);
    }

    if (onPlatform) {
      // Apply mouse look rotation (user controls where they look)
      applyMouseLook();

      let moveX = 0;
      let moveZ = 0;
      if (k.w) moveZ -= ph.moveSpeed * dt;
      if (k.s) moveZ += ph.moveSpeed * dt;
      if (k.a) moveX -= ph.moveSpeed * dt;
      if (k.d) moveX += ph.moveSpeed * dt;

      // Movement relative to camera yaw (ignore pitch for ground movement)
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

    // Apply mouse look — user controls where they look on the branch
    applyMouseLook();
  });

  return null;
}

/**
 * SCENE KEYBOARD SHORTCUTS
 *
 * Global scene-level key bindings. Always mounted via CameraRig.
 * Coordinates with OCULUS shortcuts (Q, M, Escape are taken).
 *
 *   C       — Cycle camera mode (falcon → player-1p → player-3p)
 *   Tab     — Quick toggle between player-1p ↔ player-3p
 *   Shift-V — Toggle spectator mode (free orbit + camera viz)
 *   V       — Toggle view frame (diagnostic hemispheres)
 *   `       — Toggle dev mode (orbit path, debug labels)
 *   I       — Toggle inspection panel (distances, measurements)
 */
const CAMERA_CYCLE: Array<'falcon' | 'player-1p' | 'player-3p'> = ['falcon', 'player-1p', 'player-3p'];

function SceneKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      // Don't capture with Ctrl/Cmd combos (system shortcuts)
      if (e.ctrlKey || e.metaKey) return;

      const store = useRendererStore.getState();
      const key = e.key.toLowerCase();

      // Shift-C: copy camera state (spectator mode)
      if (e.shiftKey && key === 'c') {
        e.preventDefault();
        if (store.cameraMode === 'spectator') {
          const snapshot = useCameraEditorStore.getState().exportSnapshot();
          navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2)).catch(() => {});
        }
        return;
      }

      // Shift-V: toggle spectator mode (free camera + camera visualization)
      if (e.shiftKey && key === 'v') {
        e.preventDefault();
        if (store.cameraMode === 'spectator') {
          // Return to previous mode (default to falcon)
          store.setCameraMode('falcon');
        } else {
          store.setCameraMode('spectator');
        }
        return;
      }

      // Skip non-shift shortcuts when Shift is held (except Tab)
      if (e.shiftKey && key !== 'tab') return;

      switch (key) {
        case 'c': {
          e.preventDefault();
          // If in spectator, jump to falcon
          if (store.cameraMode === 'spectator') {
            store.setCameraMode('falcon');
            break;
          }
          const currentIdx = CAMERA_CYCLE.indexOf(store.cameraMode);
          const nextIdx = (currentIdx + 1) % CAMERA_CYCLE.length;
          store.setCameraMode(CAMERA_CYCLE[nextIdx]!);
          break;
        }
        case 'tab': {
          e.preventDefault();
          // Quick toggle between player-1p ↔ player-3p
          if (store.cameraMode === 'player-1p') {
            store.setCameraMode('player-3p');
          } else if (store.cameraMode === 'player-3p') {
            store.setCameraMode('player-1p');
          } else {
            // From falcon/spectator, go to player-1p
            store.setCameraMode('player-1p');
          }
          break;
        }
        case 'v':
          e.preventDefault();
          store.toggleViewFrame();
          break;
        case '`':
          e.preventDefault();
          store.toggleDevMode();
          break;
        case 'i':
          e.preventDefault();
          store.toggleInspectionMode();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
}

// Module-scope temporaries for ViewQualityMonitor
const _vqForward = new THREE.Vector3();
const _vqPlayerPos = new THREE.Vector3();

/**
 * ViewQualityMonitor — thin useFrame wrapper calling validateCameraView.
 * Runs every 15 frames (~4Hz at 60fps). Player modes only.
 */
function ViewQualityMonitor() {
  const { camera } = useThree();
  const frameCount = useRef(0);
  const transitionTime = useRef(0);

  // Reset transition timer on mode change
  const cameraMode = useRendererStore((s) => s.cameraMode);
  useEffect(() => {
    transitionTime.current = 0;
  }, [cameraMode]);

  useFrame((_, delta) => {
    frameCount.current += 1;
    if (frameCount.current % 15 !== 0) return;

    const viewQuality = useCameraEditorStore.getState().viewQuality;
    if (!viewQuality.enabled) return;

    const state = useRendererStore.getState();
    const mode = state.cameraMode;
    if (mode !== 'player-1p' && mode !== 'player-3p') return;

    transitionTime.current += delta * 15; // approx seconds since last mode change

    // Camera forward direction
    camera.getWorldDirection(_vqForward);

    // Player position for 3P occlusion check
    _vqPlayerPos.set(...state.playerPosition);

    const report = validateCameraView(
      camera.position,
      _vqForward,
      state.activeNest,
      state.spatialIndex,
      mode,
      mode === 'player-3p' ? _vqPlayerPos : null,
      transitionTime.current,
    );

    useCameraEditorStore.getState().updateViewQuality(report);
  });

  return null;
}

export function CameraRig() {
  const cameraMode = useRendererStore((s) => s.cameraMode);
  const transitioning = useRendererStore((s) => s.cameraTransitioning);
  const playerPosition = useRendererStore((s) => s.playerPosition);
  const platformConfig = useRendererStore((s) => s.platformConfig);
  const activeNest = useRendererStore((s) => s.activeNest);
  const { camera } = useThree();

  const lastEmittedPos = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));
  /** Camera position saved when entering spectator mode */
  const savedSpectatorPos = useRef(new THREE.Vector3(10, 14, -16));

  const transitionRef = useRef({
    active: false,
    elapsed: 0,
    duration: 1.0, // overwritten at transition start from store
    useBezier: false,
    startPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    controlPosition: new THREE.Vector3(),
    endPosition: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
  });

  // Track previous camera mode for detecting falcon→player transitions
  const prevMode = useRef<string>(cameraMode);
  /** Ensures initial FOV is only computed once per session */
  const hasComputedFov = useRef(false);

  // Save camera position when entering spectator + init marker states
  useEffect(() => {
    if (cameraMode === 'spectator') {
      savedSpectatorPos.current.copy(camera.position);
      // Initialize editable marker states from current nest/platform
      if (activeNest && platformConfig) {
        useCameraEditorStore.getState().initMarkerStates(activeNest, platformConfig);
      }
    }
  }, [cameraMode, camera, activeNest, platformConfig]);

  // Refresh computed params whenever nest or platform changes
  useEffect(() => {
    useCameraEditorStore.getState().refreshComputedParams(activeNest, platformConfig);
    // Compute initial FOV once when platformConfig first becomes available
    if (platformConfig && !hasComputedFov.current) {
      hasComputedFov.current = true;
      useCameraEditorStore.getState().computeInitialFov(platformConfig.treeSpan);
    }
  }, [activeNest, platformConfig]);

  // Start transition when camera mode changes
  useEffect(() => {
    if (!transitioning) return;

    const t = transitionRef.current;
    const wasInFalcon = prevMode.current === 'falcon';
    prevMode.current = cameraMode;

    // Spectator transitions are instant (no animation needed)
    if (cameraMode === 'spectator') {
      useRendererStore.setState({ cameraTransitioning: false });
      return;
    }

    const transParams = useCameraEditorStore.getState().authoredParams.transition;
    t.active = true;
    t.elapsed = 0;
    t.useBezier = false;
    t.duration = transParams.transitionDuration;
    t.startPosition.copy(camera.position);
    t.startTarget.set(0, 0, 0); // default fallback

    if (cameraMode === 'falcon') {
      // Transition to falcon: use nest position as initial orbit target
      if (activeNest && platformConfig) {
        const orbit = falconOrbitPosition(0, activeNest, platformConfig);
        t.endPosition.copy(orbit.position);
        t.endTarget.copy(orbit.target);
      } else {
        const dim = getDimensions();
        if (dim) {
          t.endPosition.set(...dim.falconPosition);
          t.endTarget.set(...dim.falconTarget);
        } else {
          t.endPosition.set(10, 14, -16);
          t.endTarget.set(0, 3, 0);
        }
      }
    } else {
      // Player modes: land at nest center when available, fallback to platform spawn
      const dim = getDimensions();
      const config = useRendererStore.getState().platformConfig;
      const nestOffset = useCameraEditorStore.getState().authoredParams.nestVerticalOffset;

      if (activeNest) {
        // Land at nest center + vertical offset
        const nx = activeNest.nestPosition.x;
        const ny = activeNest.nestPosition.y + nestOffset;
        const nz = activeNest.nestPosition.z;
        t.endPosition.set(nx, ny + activeNest.depth + 1, nz);
        t.endTarget.set(nx, ny, nz);
      } else if (dim && config) {
        const [sx, sy, sz] = dim.spawnPoint;
        t.endPosition.set(sx, sy, sz);
        t.endTarget.set(
          config.origin[0],
          config.origin[1] + config.trunkLength * 0.5,
          config.origin[2],
        );
      } else {
        const [px, py, pz] = playerPosition;
        t.endPosition.set(px, py + 3, pz - 5);
        t.endTarget.set(px, py, pz);
      }

      // Falcon→player: swooping fly-in via elevated bezier control point
      if (wasInFalcon) {
        t.useBezier = true;
        t.duration = transParams.flyinDuration;
        // Control point: halfway XZ, elevated to smooth the descent arc
        const midX = (t.startPosition.x + t.endPosition.x) * 0.5;
        const midZ = (t.startPosition.z + t.endPosition.z) * 0.5;
        const maxY = Math.max(t.startPosition.y, t.endPosition.y);
        const elevate = platformConfig
          ? platformConfig.treeHeight * 0.15
          : 3;
        t.controlPosition.set(midX, maxY + elevate, midZ);
        // Reset falcon phase since we're leaving it
        useRendererStore.getState().setFalconPhase('idle');
      }

      useRendererStore.getState().setOnPlatform(true);
    }
  }, [cameraMode, transitioning, camera, playerPosition, platformConfig, activeNest]);

  // Animate transition (linear or bezier)
  useFrame((_, delta) => {
    const t = transitionRef.current;
    if (!t.active) return;

    t.elapsed += delta;
    const progress = Math.min(t.elapsed / t.duration, 1);

    // Cubic ease-in-out
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    if (t.useBezier) {
      // Quadratic bezier: P = (1-t)²·Start + 2(1-t)t·Control + t²·End
      const inv = 1 - ease;
      camera.position.set(
        inv * inv * t.startPosition.x + 2 * inv * ease * t.controlPosition.x + ease * ease * t.endPosition.x,
        inv * inv * t.startPosition.y + 2 * inv * ease * t.controlPosition.y + ease * ease * t.endPosition.y,
        inv * inv * t.startPosition.z + 2 * inv * ease * t.controlPosition.z + ease * ease * t.endPosition.z,
      );
    } else {
      camera.position.lerpVectors(t.startPosition, t.endPosition, ease);
    }

    // During transition, smoothly rotate toward target
    _lookTarget.lerpVectors(t.startTarget, t.endTarget, ease);
    camera.lookAt(_lookTarget);

    if (progress >= 1) {
      t.active = false;
      useRendererStore.setState({ cameraTransitioning: false });
    }
  });

  // Emit PLAYER_MOVED when camera moves more than threshold (shared across modes)
  useFrame(() => {
    // Skip emission during transition, falcon mode (handles its own), and spectator
    if (transitionRef.current.active) return;
    if (cameraMode === 'falcon' || cameraMode === 'spectator') return;

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
  });

  // Determine which camera sub-component to render
  let cameraChild: React.ReactNode = null;

  if (cameraMode === 'spectator') {
    cameraChild = (
      <SpectatorCamera
        nestConfig={activeNest}
        platformConfig={platformConfig}
        savedPosition={savedSpectatorPos.current}
      />
    );
  } else if (cameraMode === 'falcon') {
    if (activeNest && platformConfig) {
      cameraChild = <FalconAutoOrbit nestConfig={activeNest} platformConfig={platformConfig} />;
    }
  } else if (cameraMode === 'player-3p') {
    cameraChild = <PlayerThirdPerson />;
  } else {
    cameraChild = <PlayerFirstPerson />;
  }

  return (
    <>
      <SceneKeyboard />
      <ViewQualityMonitor />
      {cameraChild}
    </>
  );
}
