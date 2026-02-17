import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  AuthoredCameraParams,
  CameraMarkersMap,
  CameraMarkerState,
  CameraPreset,
  CameraStateSnapshot,
  ComputedCameraParams,
  EditableMarkerKey,
  ViewQualityReport,
} from '../systems/CameraParams';
import { DEFAULT_AUTHORED_PARAMS, EMPTY_VIEW_QUALITY } from '../systems/CameraParams';
import type { NestConfig } from '../systems/NestConfig';
import { registerFalconParamAccessor } from '../systems/NestConfig';
import type { PlatformConfig } from '../systems/PlatformConfig';
import { deriveDimensions } from '../systems/PlatformConfig';

/**
 * CAMERA EDITOR STORE
 *
 * Separate Zustand store for camera parameter editing, marker manipulation,
 * presets, and view quality. Kept separate from useRendererStore to avoid
 * bloating the main rendering state.
 *
 * Communication pattern: useFrame loops read via getState() (zero-subscription).
 */

const DEFAULT_MARKER: CameraMarkerState = { position: [0, 0, 0], target: [0, 0, 0] };

function defaultMarkers(): CameraMarkersMap {
  return {
    falcon: { ...DEFAULT_MARKER },
    'player-1p': { ...DEFAULT_MARKER },
    'player-3p': { ...DEFAULT_MARKER },
  };
}

interface CameraEditorState {
  // Authored params (design choices, persist across tree changes)
  authoredParams: AuthoredCameraParams;

  // Gizmo editing
  editingMarker: EditableMarkerKey | null;
  gizmoMode: 'translate' | 'rotate';

  // Editable marker positions/targets
  markerStates: CameraMarkersMap;
  markersDirty: boolean;

  // Presets
  presets: CameraPreset[];

  // View quality
  viewQuality: ViewQualityReport;

  // Computed params (topology-derived, set from outside)
  computedParams: ComputedCameraParams | null;

  // Actions: authored params
  setAuthoredParam: <K extends keyof AuthoredCameraParams>(
    group: K,
    key: keyof AuthoredCameraParams[K],
    value: number,
  ) => void;
  setFov: (fov: number) => void;
  setNestVerticalOffset: (offset: number) => void;
  computeInitialFov: (treeSpan: number) => void;
  resetAuthoredParams: () => void;

  // Actions: gizmo editing
  setEditingMarker: (marker: EditableMarkerKey | null) => void;
  setGizmoMode: (mode: 'translate' | 'rotate') => void;

  // Actions: marker states
  updateMarkerPosition: (marker: EditableMarkerKey, position: [number, number, number]) => void;
  updateMarkerTarget: (marker: EditableMarkerKey, target: [number, number, number]) => void;
  resetMarkerStates: () => void;
  initMarkerStates: (nest: NestConfig, platform: PlatformConfig) => void;

  // Actions: snapshots (copy/paste)
  exportSnapshot: () => CameraStateSnapshot;
  importSnapshot: (snapshot: CameraStateSnapshot) => void;

  // Actions: presets
  savePreset: (name: string, mode: 'falcon' | 'player-1p' | 'player-3p', viewFarRadius: number) => void;
  deletePreset: (id: string) => void;
  starPreset: (id: string) => void;
  applyPreset: (id: string, viewFarRadius: number, nestPosition: [number, number, number]) => void;

  // Actions: computed params
  refreshComputedParams: (nest: NestConfig | null, platform: PlatformConfig | null) => void;

  // Actions: view quality
  updateViewQuality: (report: ViewQualityReport) => void;
  toggleViewQuality: () => void;
}

let presetIdCounter = 0;

export const useCameraEditorStore = create<CameraEditorState>()(
  subscribeWithSelector((set, get) => ({
    authoredParams: structuredClone(DEFAULT_AUTHORED_PARAMS),

    editingMarker: null,
    gizmoMode: 'translate',

    markerStates: defaultMarkers(),
    markersDirty: false,

    presets: [],

    viewQuality: { ...EMPTY_VIEW_QUALITY },

    computedParams: null,

    // ─── Authored params ─────────────────────────────────────────────────

    setAuthoredParam: (group, key, value) => {
      set((state) => ({
        authoredParams: {
          ...state.authoredParams,
          [group]: {
            ...state.authoredParams[group],
            [key]: value,
          },
        },
      }));
    },

    setFov: (fov) => {
      set((state) => ({
        authoredParams: { ...state.authoredParams, fov },
      }));
    },

    setNestVerticalOffset: (offset) => {
      set((state) => ({
        authoredParams: { ...state.authoredParams, nestVerticalOffset: offset },
      }));
    },

    computeInitialFov: (treeSpan) => {
      const fov = Math.max(40, Math.min(90, 40 + treeSpan * 2));
      set((state) => ({
        authoredParams: { ...state.authoredParams, fov },
      }));
    },

    resetAuthoredParams: () => {
      set({ authoredParams: structuredClone(DEFAULT_AUTHORED_PARAMS) });
    },

    // ─── Gizmo editing ──────────────────────────────────────────────────

    setEditingMarker: (marker) => {
      set({ editingMarker: marker });
    },

    setGizmoMode: (mode) => {
      set({ gizmoMode: mode });
    },

    // ─── Marker states ──────────────────────────────────────────────────

    updateMarkerPosition: (marker, position) => {
      set((state) => ({
        markerStates: {
          ...state.markerStates,
          [marker]: { ...state.markerStates[marker], position },
        },
        markersDirty: true,
      }));
    },

    updateMarkerTarget: (marker, target) => {
      set((state) => ({
        markerStates: {
          ...state.markerStates,
          [marker]: { ...state.markerStates[marker], target },
        },
        markersDirty: true,
      }));
    },

    resetMarkerStates: () => {
      const computed = get().computedParams;
      if (!computed) {
        set({ markerStates: defaultMarkers(), markersDirty: false });
        return;
      }
      // Re-initialize from computed params
      const nest = computed.nestPosition;
      const p1p: [number, number, number] = [
        nest[0],
        nest[1] + computed.nestDepth + 1,
        nest[2],
      ];
      const p3p: [number, number, number] = [p1p[0] - 2, p1p[1] + 1.5, p1p[2]];

      set({
        markerStates: {
          falcon: { position: [nest[0], computed.orbitBaseY, nest[2] + computed.orbitSemiMinor], target: [...nest] },
          'player-1p': { position: p1p, target: [...nest] },
          'player-3p': { position: p3p, target: p1p },
        },
        markersDirty: false,
      });
    },

    initMarkerStates: (nest, platform) => {
      const nx = nest.nestPosition.x;
      const ny = nest.nestPosition.y;
      const nz = nest.nestPosition.z;

      const semiMajor = platform.treeSpan * 0.8;
      const semiMinor = platform.treeSpan * 0.5;
      const baseY = ny + platform.treeHeight * 0.6;

      const p1p: [number, number, number] = [nx, ny + nest.depth + 1, nz];
      const p3p: [number, number, number] = [p1p[0] - 2, p1p[1] + 1.5, p1p[2]];

      set({
        markerStates: {
          falcon: { position: [nx + semiMajor, baseY, nz], target: [nx, ny, nz] },
          'player-1p': { position: p1p, target: [nx, ny, nz] },
          'player-3p': { position: p3p, target: [...p1p] },
        },
        markersDirty: false,
      });
    },

    // ─── Snapshots ──────────────────────────────────────────────────────

    exportSnapshot: () => {
      const state = get();
      return {
        markers: structuredClone(state.markerStates),
        authoredParams: structuredClone(state.authoredParams),
        timestamp: Date.now(),
      };
    },

    importSnapshot: (snapshot) => {
      set({
        markerStates: structuredClone(snapshot.markers),
        authoredParams: structuredClone(snapshot.authoredParams),
        markersDirty: true,
      });
    },

    // ─── Presets ─────────────────────────────────────────────────────────

    savePreset: (name, mode, viewFarRadius) => {
      const state = get();
      const marker = state.markerStates[mode];
      const computed = state.computedParams;
      const nestPos = computed?.nestPosition ?? [0, 0, 0];
      const r = viewFarRadius || 1;

      const normalizedPos: [number, number, number] = [
        (marker.position[0] - nestPos[0]) / r,
        (marker.position[1] - nestPos[1]) / r,
        (marker.position[2] - nestPos[2]) / r,
      ];
      const normalizedTarget: [number, number, number] = [
        (marker.target[0] - nestPos[0]) / r,
        (marker.target[1] - nestPos[1]) / r,
        (marker.target[2] - nestPos[2]) / r,
      ];

      const id = `preset-${++presetIdCounter}-${Date.now()}`;
      const preset: CameraPreset = {
        id,
        name,
        mode,
        normalizedPositionOffset: normalizedPos,
        normalizedTargetOffset: normalizedTarget,
        starred: false,
        createdAt: Date.now(),
      };

      set((s) => ({ presets: [...s.presets, preset] }));
    },

    deletePreset: (id) => {
      set((s) => ({ presets: s.presets.filter((p) => p.id !== id) }));
    },

    starPreset: (id) => {
      set((s) => {
        const target = s.presets.find((p) => p.id === id);
        if (!target) return s;
        return {
          presets: s.presets.map((p) => {
            if (p.mode === target.mode) {
              return { ...p, starred: p.id === id };
            }
            return p;
          }),
        };
      });
    },

    applyPreset: (id, viewFarRadius, nestPosition) => {
      const state = get();
      const preset = state.presets.find((p) => p.id === id);
      if (!preset) return;

      const r = viewFarRadius || 1;
      const pos: [number, number, number] = [
        nestPosition[0] + preset.normalizedPositionOffset[0] * r,
        nestPosition[1] + preset.normalizedPositionOffset[1] * r,
        nestPosition[2] + preset.normalizedPositionOffset[2] * r,
      ];
      const target: [number, number, number] = [
        nestPosition[0] + preset.normalizedTargetOffset[0] * r,
        nestPosition[1] + preset.normalizedTargetOffset[1] * r,
        nestPosition[2] + preset.normalizedTargetOffset[2] * r,
      ];

      set((s) => ({
        markerStates: {
          ...s.markerStates,
          [preset.mode]: { position: pos, target },
        },
        markersDirty: true,
      }));

      if (preset.authoredOverrides) {
        set((s) => ({
          authoredParams: {
            ...s.authoredParams,
            ...preset.authoredOverrides,
          },
        }));
      }
    },

    // ─── Computed params ─────────────────────────────────────────────────

    refreshComputedParams: (nest, platform) => {
      if (!nest || !platform) {
        set({ computedParams: null });
        return;
      }

      const dim = deriveDimensions(platform);
      const semiMajor = platform.treeSpan * 0.8;
      const semiMinor = platform.treeSpan * 0.5;
      const baseY = nest.nestPosition.y + platform.treeHeight * 0.6;

      set({
        computedParams: {
          nestPosition: [nest.nestPosition.x, nest.nestPosition.y, nest.nestPosition.z],
          nestRadius: nest.nestRadius,
          nestDepth: nest.depth,
          viewNearRadius: nest.viewNearRadius,
          viewFarRadius: nest.viewFarRadius,
          orbitSemiMajor: semiMajor,
          orbitSemiMinor: semiMinor,
          orbitBaseY: baseY,
          spawnPoint: dim.spawnPoint,
          treeSpan: platform.treeSpan,
          treeHeight: platform.treeHeight,
          trunkRadius: platform.trunkRadius,
        },
      });
    },

    // ─── View quality ───────────────────────────────────────────────────

    updateViewQuality: (report) => {
      set({ viewQuality: report });
    },

    toggleViewQuality: () => {
      set((s) => ({
        viewQuality: {
          ...s.viewQuality,
          enabled: !s.viewQuality.enabled,
        },
      }));
    },
  }))
);

/** Read authored params without subscribing (for useFrame loops) */
export function getAuthoredParams(): AuthoredCameraParams {
  return useCameraEditorStore.getState().authoredParams;
}

/** Read FOV without subscribing (for imperative reads) */
export function getFov(): number {
  return useCameraEditorStore.getState().authoredParams.fov;
}

// Register falcon param accessor so NestConfig can read dynamic values
registerFalconParamAccessor(() => {
  const fp = useCameraEditorStore.getState().authoredParams.falcon;
  return {
    orbitSpeed: fp.orbitSpeed,
    orbitLaps: fp.orbitLaps,
    approachDuration: fp.approachDuration,
  };
});
