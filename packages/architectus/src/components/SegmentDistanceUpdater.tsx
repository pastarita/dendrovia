import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSegmentStore } from '../store/useSegmentStore';
import { evaluateSegmentLoading } from '../loader/SegmentLoadManager';

/**
 * SEGMENT DISTANCE UPDATER
 *
 * Runs inside the R3F render loop to update per-segment camera distances.
 * Replaces BranchTracker's O(7000) node scan with an O(N) segment scan
 * where N ≤ 10 (max segments per world).
 *
 * Every 10 frames:
 *   1. Read camera position
 *   2. Update distances in segment store (O(N) where N = segment count)
 *   3. Trigger load/evict evaluation via SegmentLoadManager
 */

export function SegmentDistanceUpdater() {
  const { camera } = useThree();
  const frameCounter = useRef(0);

  useFrame(() => {
    // Only check when world is ready
    if (!useSegmentStore.getState().worldReady) return;

    frameCounter.current += 1;
    // Check every 10 frames (~6 times/sec at 60fps)
    if (frameCounter.current % 10 !== 0) return;

    const pos = camera.position;
    useSegmentStore.getState().updateDistances([pos.x, pos.y, pos.z]);

    // Evaluate which segments need loading/eviction
    evaluateSegmentLoading();
  });

  return null;
}
