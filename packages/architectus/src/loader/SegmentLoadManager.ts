/**
 * SegmentLoadManager — manages segment loading/eviction based on camera proximity.
 *
 * Loading strategy:
 *   - Active segment (closest) → full load (topology + specimens)
 *   - 2 nearest neighbors → branch load (topology only)
 *   - Rest → evict data, keep hull
 *
 * Never throws — loading failures move segments to error state (no retry).
 */

import { useSegmentStore, type SegmentState } from '../store/useSegmentStore';
import { loadSegmentData } from './AssetBridge';

/** Set of segment IDs currently being loaded (prevents duplicate fetches). */
const loadingSet = new Set<string>();

/** Circuit breaker: stop loading after consecutive failures to prevent 404 cascades. */
let consecutiveFailures = 0;
const CIRCUIT_BREAKER_THRESHOLD = 3;
let circuitOpen = false;

/**
 * Evaluate which segments should be loaded/evicted based on current distances.
 * Called by SegmentDistanceUpdater after updating distances.
 */
export function evaluateSegmentLoading(): void {
  if (circuitOpen) return;

  const state = useSegmentStore.getState();
  if (!state.worldReady || !state.manifest || !state.manifestPath) return;

  const segments = Array.from(state.segments.values());
  if (segments.length === 0) return;

  // Sort by distance to find active + neighbors
  const sorted = [...segments].sort((a, b) => a.distanceToCamera - b.distanceToCamera);

  const activeId = sorted[0]?.id ?? null;
  const neighborIds = new Set<string>();
  for (let i = 1; i <= 2 && i < sorted.length; i++) {
    neighborIds.add(sorted[i].id);
  }

  // Process each segment
  for (const seg of sorted) {
    if (seg.id === activeId) {
      // Active segment: should be full
      if (seg.loadState === 'hull' || seg.loadState === 'unloaded') {
        triggerLoad(seg.id, 'full');
      }
    } else if (neighborIds.has(seg.id)) {
      // Neighbor: should be at least branches
      if (seg.loadState === 'hull' || seg.loadState === 'unloaded') {
        triggerLoad(seg.id, 'branches');
      }
    } else {
      // Far away: evict to hull
      if (seg.loadState === 'branches' || seg.loadState === 'full') {
        useSegmentStore.getState().evictSegment(seg.id);
      }
    }
  }
}

/**
 * Trigger async loading of a segment's data.
 */
async function triggerLoad(
  segmentId: string,
  _targetState: 'branches' | 'full',
): Promise<void> {
  // Prevent duplicate loads
  if (loadingSet.has(segmentId)) return;
  loadingSet.add(segmentId);

  const { manifest, manifestPath } = useSegmentStore.getState();
  if (!manifest || !manifestPath) {
    loadingSet.delete(segmentId);
    return;
  }

  useSegmentStore.getState().setSegmentLoadState(segmentId, 'loading');

  try {
    const result = await loadSegmentData(segmentId, manifest, manifestPath);
    if (!result) {
      // Loading failed — mark as error (prevents retry loops)
      useSegmentStore.getState().setSegmentLoadState(segmentId, 'error');
      consecutiveFailures++;
      if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
        circuitOpen = true;
        console.warn(
          `[SegmentLoadManager] Circuit breaker open after ${consecutiveFailures} consecutive failures — segment loading disabled`,
        );
      }
      return;
    }

    consecutiveFailures = 0;
    useSegmentStore.getState().setSegmentData(segmentId, {
      topology: result.topology,
      specimens: result.specimens,
      palette: result.palette,
      lsystem: result.lsystem,
      noise: result.noise,
    });
  } catch {
    useSegmentStore.getState().setSegmentLoadState(segmentId, 'error');
  } finally {
    loadingSet.delete(segmentId);
  }
}
