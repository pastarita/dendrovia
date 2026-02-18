'use client';

/**
 * Minimap — SVG spatial awareness widget
 *
 * Shows player position in the file tree topology.
 * Yellow = current, grey = visited, white = unvisited, red glow = hotspot.
 */

import React, { useMemo } from 'react';
import { useOculusStore } from '../store/useOculusStore';
import { useOculus } from '../OculusProvider';
import { GameEvents } from '@dendrovia/shared';
import type { FileTreeNode, Hotspot } from '@dendrovia/shared';
import { Panel } from './primitives/Panel';

interface MinimapNode {
  id: string;
  x: number;
  y: number;
  visited: boolean;
  isHotspot: boolean;
  isDirectory: boolean;
  name: string;
}

function flattenTree(
  node: FileTreeNode,
  hotspotPaths: Set<string>,
  visited: string[],
  depth = 0,
  index = 0
): MinimapNode[] {
  const nodes: MinimapNode[] = [];
  // Simple radial layout: depth → radius, index → angle
  const angle = (index * 137.5 * Math.PI) / 180; // golden angle
  const radius = 15 + depth * 12;
  const x = 50 + radius * Math.cos(angle);
  const y = 50 + radius * Math.sin(angle);

  nodes.push({
    id: node.path,
    x: Math.max(5, Math.min(95, x)),
    y: Math.max(5, Math.min(95, y)),
    visited: visited.includes(node.path),
    isHotspot: hotspotPaths.has(node.path),
    isDirectory: node.type === 'directory',
    name: node.name,
  });

  if (node.children) {
    node.children.forEach((child, i) => {
      nodes.push(...flattenTree(child, hotspotPaths, visited, depth + 1, index * 10 + i));
    });
  }

  return nodes;
}

export function Minimap() {
  const topology = useOculusStore((s) => s.topology);
  const hotspots = useOculusStore((s) => s.hotspots);
  const visitedNodes = useOculusStore((s) => s.visitedNodes);
  const playerPosition = useOculusStore((s) => s.playerPosition);
  const { eventBus } = useOculus();

  const hotspotPaths = useMemo(
    () => new Set(hotspots.map((h: Hotspot) => h.path)),
    [hotspots]
  );

  const nodes = useMemo(() => {
    if (!topology) return [];
    return flattenTree(topology, hotspotPaths, visitedNodes);
  }, [topology, hotspotPaths, visitedNodes]);

  const handleNodeClick = (nodeId: string) => {
    eventBus.emit(GameEvents.NODE_CLICKED, {
      nodeId,
      filePath: nodeId,
      position: [0, 0, 0] as [number, number, number],
    });
  };

  return (
    <Panel compact noPadding className="oculus-minimap" aria-label="Minimap">
      <svg
        viewBox="0 0 100 100"
        width="120"
        height="120"
        style={{ display: 'block' }}
        role="img"
        aria-label="File tree minimap"
      >
        {/* Circular border */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="var(--oculus-border)" strokeWidth="0.5" />

        {/* Grid rings */}
        <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(245,169,127,0.1)" strokeWidth="0.3" />
        <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(245,169,127,0.1)" strokeWidth="0.3" />

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            {/* Hotspot glow */}
            {node.isHotspot && (
              <circle
                cx={node.x}
                cy={node.y}
                r={3}
                fill="none"
                stroke="var(--oculus-danger)"
                strokeWidth="0.5"
                opacity="0.6"
                style={{ animation: 'oculus-pulse-glow 2s infinite' }}
              />
            )}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.isDirectory ? 1.5 : 1}
              fill={
                node.isHotspot
                  ? 'var(--oculus-danger)'
                  : node.visited
                    ? 'var(--oculus-text-muted)'
                    : 'var(--oculus-text)'
              }
              style={{ cursor: 'pointer' }}
              onClick={() => handleNodeClick(node.id)}
            >
              <title>{node.name}</title>
            </circle>
          </g>
        ))}

        {/* Player position indicator */}
        <circle cx="50" cy="50" r="2" fill="var(--oculus-xp)" />
        <circle cx="50" cy="50" r="4" fill="none" stroke="var(--oculus-xp)" strokeWidth="0.5" opacity="0.5" />
      </svg>
    </Panel>
  );
}
