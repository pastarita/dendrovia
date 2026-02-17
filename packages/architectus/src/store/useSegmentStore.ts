/**
 * Segment Store — tracks per-segment load state, placement, and camera distance.
 *
 * The render loop queries this to decide what LOD to use for each segment.
 * The load manager uses this to decide which segments to load/evict.
 *
 * Load state progression: unloaded → loading → hull → branches → full
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  PrecomputedPlacement,
  WorldIndex,
  ChunkedManifest,
  TopologyChunk,
  ProceduralPalette,
  LSystemRule,
  NoiseFunction,
  FungalSpecimen,
} from '@dendrovia/shared';

/** Load state progression for a single segment. */
export type SegmentLoadState = 'unloaded' | 'loading' | 'hull' | 'branches' | 'full';

/** Per-segment data that arrives from loadSegmentData(). */
export interface SegmentData {
  topology: TopologyChunk | null;
  specimens: FungalSpecimen[] | null;
  palette: ProceduralPalette | null;
  lsystem: LSystemRule | null;
  noise: NoiseFunction | null;
}

/** Per-segment state tracked in the store. */
export interface SegmentState {
  id: string;
  placement: PrecomputedPlacement;
  loadState: SegmentLoadState;
  data: SegmentData | null;
  distanceToCamera: number;
  /** Opacity for fade-in transitions (0-1). */
  opacity: number;
}

interface SegmentStoreState {
  /** All segment states, keyed by segment ID. */
  segments: Map<string, SegmentState>;
  /** The currently active (closest) segment ID. */
  activeSegmentId: string | null;
  /** World-level data from Stage 1 loading. */
  worldIndex: WorldIndex | null;
  /** Chunked manifest for loading segment data. */
  manifest: ChunkedManifest | null;
  /** Manifest path for resolving relative URLs. */
  manifestPath: string | null;
  /** Whether Stage 1 (world index) has loaded. */
  worldReady: boolean;

  // Actions
  /** Initialize segments from a loaded WorldIndex. */
  initFromWorldIndex: (
    worldIndex: WorldIndex,
    manifest: ChunkedManifest,
    manifestPath: string,
  ) => void;
  /** Update a segment's load state. */
  setSegmentLoadState: (segmentId: string, state: SegmentLoadState) => void;
  /** Store loaded segment data. */
  setSegmentData: (segmentId: string, data: SegmentData) => void;
  /** Evict segment data (transition back to hull). */
  evictSegment: (segmentId: string) => void;
  /** Batch-update camera distances for all segments. */
  updateDistances: (cameraPosition: [number, number, number]) => void;
  /** Set the active segment. */
  setActiveSegment: (segmentId: string | null) => void;
  /** Update segment opacity (for fade transitions). */
  setSegmentOpacity: (segmentId: string, opacity: number) => void;
}

export const useSegmentStore = create<SegmentStoreState>()(
  subscribeWithSelector((set, get) => ({
    segments: new Map(),
    activeSegmentId: null,
    worldIndex: null,
    manifest: null,
    manifestPath: null,
    worldReady: false,

    initFromWorldIndex: (worldIndex, manifest, manifestPath) => {
      const segments = new Map<string, SegmentState>();
      for (const placement of worldIndex.placements) {
        segments.set(placement.segmentId, {
          id: placement.segmentId,
          placement,
          loadState: 'hull',
          data: null,
          distanceToCamera: Infinity,
          opacity: 1,
        });
      }
      set({
        segments,
        worldIndex,
        manifest,
        manifestPath,
        worldReady: true,
      });
    },

    setSegmentLoadState: (segmentId, state) => {
      const segments = new Map(get().segments);
      const seg = segments.get(segmentId);
      if (seg) {
        segments.set(segmentId, { ...seg, loadState: state });
        set({ segments });
      }
    },

    setSegmentData: (segmentId, data) => {
      const segments = new Map(get().segments);
      const seg = segments.get(segmentId);
      if (seg) {
        segments.set(segmentId, {
          ...seg,
          data,
          loadState: data.specimens ? 'full' : 'branches',
        });
        set({ segments });
      }
    },

    evictSegment: (segmentId) => {
      const segments = new Map(get().segments);
      const seg = segments.get(segmentId);
      if (seg) {
        segments.set(segmentId, {
          ...seg,
          data: null,
          loadState: 'hull',
          opacity: 1,
        });
        set({ segments });
      }
    },

    updateDistances: (cameraPosition) => {
      const segments = new Map(get().segments);
      let closestId: string | null = null;
      let closestDist = Infinity;

      for (const [id, seg] of segments) {
        const c = seg.placement.centroid;
        const dx = cameraPosition[0] - c[0];
        const dy = cameraPosition[1] - c[1];
        const dz = cameraPosition[2] - c[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist !== seg.distanceToCamera) {
          segments.set(id, { ...seg, distanceToCamera: dist });
        }

        if (dist < closestDist) {
          closestDist = dist;
          closestId = id;
        }
      }

      set({ segments, activeSegmentId: closestId });
    },

    setActiveSegment: (segmentId) => {
      set({ activeSegmentId: segmentId });
    },

    setSegmentOpacity: (segmentId, opacity) => {
      const segments = new Map(get().segments);
      const seg = segments.get(segmentId);
      if (seg) {
        segments.set(segmentId, { ...seg, opacity });
        set({ segments });
      }
    },
  })),
);

/** Get all segment states as an array without subscribing (for useFrame loops). */
export function getSegmentStates(): SegmentState[] {
  return Array.from(useSegmentStore.getState().segments.values());
}

/** Get a single segment's state without subscribing. */
export function getSegmentState(segmentId: string): SegmentState | undefined {
  return useSegmentStore.getState().segments.get(segmentId);
}
