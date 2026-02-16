/**
 * ARCHITECTUS Actions — Factory functions for node actions
 *
 * Each factory captures a store setter and returns NodeAction[].
 */

import type { NodeAction } from '../../../../lib/dendrite/types.js';
import type { QualityTier, CameraMode } from '../store/useRendererStore.js';

const ALL_TIERS: QualityTier[] = ['ultra', 'high', 'medium', 'low', 'potato'];

export function qualityActions(
  setQualityTier: (tier: QualityTier) => void,
  currentTier: QualityTier,
): NodeAction[] {
  return ALL_TIERS
    .filter(tier => tier !== currentTier)
    .slice(0, 3)
    .map(tier => ({
      id: `quality-${tier}`,
      label: `Switch to ${tier}`,
      category: 'default' as const,
      handler: () => { setQualityTier(tier); },
    }));
}

export function cameraActions(
  setCameraMode: (mode: CameraMode) => void,
  currentMode: CameraMode,
): NodeAction[] {
  const target: CameraMode = currentMode === 'falcon' ? 'player' : 'falcon';
  return [
    {
      id: `camera-${target}`,
      label: `Switch to ${target} mode`,
      category: 'default',
      handler: () => { setCameraMode(target); },
    },
  ];
}
