/**
 * WorldHeader — Compact panel showing world name, repo info, and performance stats.
 *
 * Replaces the removed ARCHITECTUS debug HUD overlay.
 */

import React from 'react';
import { useOculusStore } from '../store/useOculusStore';
import { Panel } from './primitives/Panel';
import { StatLabel } from './primitives/StatLabel';

export function WorldHeader() {
  const worldMeta = useOculusStore((s) => s.worldMeta);
  const fps = useOculusStore((s) => s.fps);
  const qualityTier = useOculusStore((s) => s.qualityTier);
  const cameraMode = useOculusStore((s) => s.cameraMode);

  return (
    <Panel compact aria-label="World info" style={{ marginBottom: 'var(--oculus-space-sm)' }}>
      {/* World name */}
      <div
        className="oculus-heading"
        style={{
          margin: 0,
          marginBottom: worldMeta ? 2 : 0,
          fontSize: 'var(--oculus-font-sm)',
        }}
      >
        {worldMeta?.name ?? 'DENDROVIA'}
      </div>

      {/* Owner / repo */}
      {worldMeta && (
        <div
          style={{
            fontSize: 'var(--oculus-font-xs)',
            color: 'var(--oculus-text-muted)',
            fontFamily: 'var(--oculus-font-code)',
            marginBottom: 'var(--oculus-space-xs)',
          }}
        >
          {worldMeta.owner}/{worldMeta.repo}
        </div>
      )}

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--oculus-space-md)',
          fontSize: 'var(--oculus-font-xs)',
          color: 'var(--oculus-text-muted)',
        }}
      >
        <span>{fps > 0 ? `${fps} FPS` : '...'}</span>
        <span>{qualityTier.toUpperCase()}</span>
        <span>{cameraMode === 'falcon' ? 'FALCON' : 'PLAYER'}</span>
      </div>
    </Panel>
  );
}
