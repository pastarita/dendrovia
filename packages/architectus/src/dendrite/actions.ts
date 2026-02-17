/**
 * ARCHITECTUS Actions — Factory functions for node actions
 *
 * Each factory captures a store setter and returns NodeAction[].
 */

import type { NodeAction } from '../../../../lib/dendrite/types.js';
import type { QualityTier, CameraMode } from '../store/useRendererStore.js';

const ALL_TIERS: QualityTier[] = ['ultra', 'high', 'medium', 'low', 'potato'];

/** Cycle order for camera modes: falcon → player-1p → player-3p → falcon */
const CAMERA_CYCLE: CameraMode[] = ['falcon', 'player-1p', 'player-3p'];

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
  const currentIdx = CAMERA_CYCLE.indexOf(currentMode);
  const nextIdx = (currentIdx + 1) % CAMERA_CYCLE.length;
  const target = CAMERA_CYCLE[nextIdx]!;

  const labels: Record<CameraMode, string> = {
    'falcon': 'Falcon (auto-orbit)',
    'player-1p': 'First-person',
    'player-3p': 'Third-person',
  };

  return [
    {
      id: `camera-${target}`,
      label: `Switch to ${labels[target]}`,
      category: 'default',
      handler: () => { setCameraMode(target); },
    },
  ];
}

export function nestActions(
  toggleViewFrame: () => void,
): NodeAction[] {
  return [
    {
      id: 'toggle-view-frame',
      label: 'Toggle view frame',
      category: 'default',
      handler: () => { toggleViewFrame(); },
    },
  ];
}
