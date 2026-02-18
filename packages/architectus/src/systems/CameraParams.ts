/**
 * CAMERA PARAMETER TAXONOMY
 *
 * Separates camera parameters into two categories:
 *
 * 1. AUTHORED — topology-independent design choices (tunable by artist/designer).
 *    These persist across tree changes and can be saved as presets.
 *
 * 2. COMPUTED — topology-derived values read from NestConfig/PlatformConfig.
 *    These are read-only and change when the tree changes.
 *
 * Also defines types for camera marker editing, snapshots (copy/paste),
 * presets (topology-relative saved states), and view quality validation.
 */

// ─── AUTHORED PARAMS (design choices) ────────────────────────────────────────

export interface FalconAuthoredParams {
  /** How quickly camera catches up to the guide (0 = never, 1 = instant) */
  guidePull: number;
  /** User nudge speed (world units per second) */
  nudgeSpeed: number;
  /** Zoom sensitivity (multiplier per wheel delta unit) */
  zoomSpeed: number;
  /** Minimum zoom distance multiplier */
  zoomMin: number;
  /** Maximum zoom distance multiplier */
  zoomMax: number;
  /** Per-frame offset decay when no user input */
  offsetDecay: number;
  /** Orbit angular speed (rad/s) */
  orbitSpeed: number;
  /** Number of full orbits before approach phase */
  orbitLaps: number;
  /** Duration of approach fly-in (seconds) */
  approachDuration: number;
}

export interface Player1pAuthoredParams {
  /** Mouse sensitivity (radians per pixel) */
  mouseSensitivity: number;
}

export interface Player3pAuthoredParams {
  /** Chase camera offset in player-local space [behind, above, lateral] */
  chaseOffset: [number, number, number];
  /** Chase camera interpolation lag (lerp factor per frame) */
  chaseLag: number;
  /** Orbit sensitivity (radians per pixel for right-click drag) */
  orbitSensitivity: number;
  /** Minimum chase/zoom distance */
  minDistance: number;
  /** Maximum chase/zoom distance */
  maxDistance: number;
}

export interface TransitionAuthoredParams {
  /** Duration of player↔player mode transitions (seconds) */
  transitionDuration: number;
  /** Duration of falcon→player fly-in transition (seconds) */
  flyinDuration: number;
}

export interface AuthoredCameraParams {
  falcon: FalconAuthoredParams;
  player1p: Player1pAuthoredParams;
  player3p: Player3pAuthoredParams;
  transition: TransitionAuthoredParams;
  /** Field of view (degrees) */
  fov: number;
  /** Vertical offset applied to nest rendering position */
  nestVerticalOffset: number;
}

/** Factory defaults — matches the hardcoded constants in existing components */
export const DEFAULT_AUTHORED_PARAMS: AuthoredCameraParams = {
  falcon: {
    guidePull: 0.015,
    nudgeSpeed: 8.0,
    zoomSpeed: 0.001,
    zoomMin: 0.3,
    zoomMax: 3.0,
    offsetDecay: 0.97,
    orbitSpeed: 0.15,
    orbitLaps: 1.5,
    approachDuration: 4.0,
  },
  player1p: {
    mouseSensitivity: 0.003,
  },
  player3p: {
    chaseOffset: [-2, 1.5, 0],
    chaseLag: 0.1,
    orbitSensitivity: 0.005,
    minDistance: 1.5,
    maxDistance: 15.0,
  },
  transition: {
    transitionDuration: 1.0,
    flyinDuration: 1.8,
  },
  fov: 60,
  nestVerticalOffset: 0,
};

// ─── COMPUTED PARAMS (topology-derived, read-only) ───────────────────────────

export interface ComputedCameraParams {
  /** World position of the nest center */
  nestPosition: [number, number, number];
  /** Nest bowl radius */
  nestRadius: number;
  /** Nest bowl depth */
  nestDepth: number;
  /** Inner hemisphere radius (interaction zone) */
  viewNearRadius: number;
  /** Outer hemisphere radius (LOD/draw-distance boundary) */
  viewFarRadius: number;
  /** Falcon orbit semi-major axis */
  orbitSemiMajor: number;
  /** Falcon orbit semi-minor axis */
  orbitSemiMinor: number;
  /** Base Y for orbit altitude */
  orbitBaseY: number;
  /** Player spawn point */
  spawnPoint: [number, number, number];
  /** Tree span (used for orbit sizing) */
  treeSpan: number;
  /** Tree height */
  treeHeight: number;
  /** Trunk radius */
  trunkRadius: number;
}

// ─── CAMERA MARKERS (editable positions/targets) ────────────────────────────

export interface CameraMarkerState {
  position: [number, number, number];
  target: [number, number, number];
}

export interface CameraMarkersMap {
  falcon: CameraMarkerState;
  'player-1p': CameraMarkerState;
  'player-3p': CameraMarkerState;
}

export type EditableMarkerKey = keyof CameraMarkersMap;

// ─── SNAPSHOTS (copy/paste) ─────────────────────────────────────────────────

export interface CameraStateSnapshot {
  markers: CameraMarkersMap;
  authoredParams: AuthoredCameraParams;
  timestamp: number;
  /** Optional label for identification */
  label?: string;
}

// ─── PRESETS (topology-relative saved states) ────────────────────────────────

export interface CameraPreset {
  /** Unique ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Which camera mode this preset applies to */
  mode: 'falcon' | 'player-1p' | 'player-3p';
  /** Position offset normalized by viewFarRadius */
  normalizedPositionOffset: [number, number, number];
  /** Target offset normalized by viewFarRadius */
  normalizedTargetOffset: [number, number, number];
  /** Optional authored param overrides */
  authoredOverrides?: Partial<AuthoredCameraParams>;
  /** Whether this is the starred (default) preset for this mode */
  starred: boolean;
  /** Creation timestamp */
  createdAt: number;
}

// ─── VIEW QUALITY VALIDATION ────────────────────────────────────────────────

export type ViewIssueSeverity = 'warning' | 'error';

export interface ViewIssue {
  /** Machine-readable issue ID */
  id: 'face-into-wall' | 'bad-azimuth' | 'off-platform' | 'branch-occlusion';
  /** Human-readable description */
  message: string;
  /** Severity level */
  severity: ViewIssueSeverity;
}

export interface ViewQualityReport {
  /** Score from 0 (bad) to 100 (good) */
  score: number;
  /** List of detected issues */
  issues: ViewIssue[];
  /** Whether validation is enabled */
  enabled: boolean;
}

export const EMPTY_VIEW_QUALITY: ViewQualityReport = {
  score: 100,
  issues: [],
  enabled: true,
};
