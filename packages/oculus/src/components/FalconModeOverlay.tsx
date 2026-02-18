'use client';

/**
 * FalconModeOverlay — Macro-view overlay for bird's-eye camera mode
 *
 * Shows heatmap legend, summary stats, and hotspot callouts
 * when the camera is in falcon (bird's eye) mode.
 */

import React, { useMemo } from 'react';
import { useOculusStore } from '../store/useOculusStore';
import { Panel } from './primitives/Panel';
import { StatLabel } from './primitives/StatLabel';

export function FalconModeOverlay() {
  const cameraMode = useOculusStore((s) => s.cameraMode);
  const topology = useOculusStore((s) => s.topology);
  const hotspots = useOculusStore((s) => s.hotspots);
  const visitedNodes = useOculusStore((s) => s.visitedNodes);
  const deepwiki = useOculusStore((s) => s.deepwiki);

  const stats = useMemo(() => {
    if (!topology) return null;

    let totalFiles = 0;
    let totalDirs = 0;

    function countNodes(node: typeof topology) {
      if (!node) return;
      if (node.type === 'file') totalFiles++;
      else totalDirs++;
      node.children?.forEach(countNodes);
    }
    countNodes(topology);

    const topHotspots = [...hotspots]
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5);

    return { totalFiles, totalDirs, topHotspots, visited: visitedNodes.length };
  }, [topology, hotspots, visitedNodes.length]);

  // Only show in falcon mode — early return AFTER all hooks
  if (cameraMode !== 'falcon') return null;
  if (!stats) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'var(--oculus-space-xl)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 'var(--oculus-space-md)',
        pointerEvents: 'none',
        zIndex: 'var(--oculus-z-hud)',
        animation: 'oculus-fade-in var(--oculus-transition-slow)',
      }}
      role="status"
      aria-label="Falcon mode overview"
    >
      {/* Summary Stats */}
      <Panel compact>
        <div className="oculus-heading" style={{ marginBottom: 'var(--oculus-space-xs)' }}>Overview</div>
        <StatLabel label="Files" value={stats.totalFiles} />
        <StatLabel label="Dirs" value={stats.totalDirs} />
        <StatLabel label="Visited" value={stats.visited} color="var(--oculus-success)" />
        <StatLabel label="Hotspots" value={hotspots.length} color="var(--oculus-danger)" />
      </Panel>

      {/* Heatmap Legend */}
      <Panel compact>
        <div className="oculus-heading" style={{ marginBottom: 'var(--oculus-space-xs)' }}>Risk Heatmap</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--oculus-space-xs)', fontSize: 'var(--oculus-font-xs)' }}>
          <span style={{ color: 'var(--oculus-text-muted)' }}>Low</span>
          <div style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: 'linear-gradient(to right, var(--oculus-success), var(--oculus-warning), var(--oculus-danger))',
          }} />
          <span style={{ color: 'var(--oculus-danger)' }}>High</span>
        </div>
      </Panel>

      {/* Top Hotspots */}
      {stats.topHotspots.length > 0 && (
        <Panel compact>
          <div className="oculus-heading" style={{ marginBottom: 'var(--oculus-space-xs)' }}>Top Hotspots</div>
          {stats.topHotspots.map((h) => {
            const name = h.path.split('/').pop() || h.path;
            return (
              <div
                key={h.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--oculus-space-xs)',
                  fontSize: 'var(--oculus-font-xs)',
                  lineHeight: 1.8,
                }}
              >
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--oculus-danger)',
                  flexShrink: 0,
                }} />
                <span style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--oculus-text-muted)',
                }}>
                  {name}
                </span>
                <span style={{ color: 'var(--oculus-danger)', fontVariantNumeric: 'tabular-nums' }}>
                  {h.riskScore.toFixed(1)}
                </span>
              </div>
            );
          })}
        </Panel>
      )}

      {/* DeepWiki Overview */}
      {deepwiki?.overview && (
        <Panel compact>
          <div className="oculus-heading" style={{ marginBottom: 'var(--oculus-space-xs)' }}>About This Codebase</div>
          <div style={{
            fontSize: 'var(--oculus-font-xs)',
            color: 'var(--oculus-text-muted)',
            lineHeight: 1.5,
          }}>
            {deepwiki.overview.length > 200
              ? `${deepwiki.overview.slice(0, 200)}...`
              : deepwiki.overview}
          </div>
        </Panel>
      )}
    </div>
  );
}
