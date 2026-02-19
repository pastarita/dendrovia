'use client';

/**
 * Default Panel Layouts — Factory defaults for panel positions and sizes
 *
 * These are the initial configurations for all managed panels.
 * Designers can override these by exporting a layout JSON from
 * the LayoutExporter dev panel and pasting it here.
 */

import type { PanelConfig } from './panel-types';

function panel(overrides: Partial<PanelConfig> & Pick<PanelConfig, 'id' | 'title' | 'category'>): PanelConfig {
  const geo = overrides.geometry ?? { x: 100, y: 100, width: 400, height: 300 };
  return {
    visible: false,
    minimized: false,
    locked: false,
    minSize: { width: 200, height: 150 },
    modes: ['all'],
    exclusive: false,
    geometry: geo,
    defaultGeometry: { ...geo },
    ...overrides,
  };
}

export const DEFAULT_PANELS: PanelConfig[] = [
  // ── HUD Panels ──────────────────────────────────
  panel({
    id: 'quest-log',
    title: 'Quest Log',
    category: 'navigation',
    exclusive: true,
    modes: ['player', 'all'],
    geometry: { x: 20, y: 580, width: 420, height: 440 },
    minSize: { width: 280, height: 200 },
  }),

  panel({
    id: 'miller-columns',
    title: 'Miller Columns',
    category: 'navigation',
    exclusive: true,
    modes: ['falcon', 'all'],
    geometry: { x: 20, y: 100, width: 600, height: 500 },
    minSize: { width: 400, height: 300 },
  }),

  panel({
    id: 'code-reader',
    title: 'Code Reader',
    category: 'navigation',
    exclusive: true,
    modes: ['falcon', 'player', 'all'],
    geometry: { x: 100, y: 60, width: 700, height: 600 },
    minSize: { width: 400, height: 300 },
  }),

  panel({
    id: 'battle-ui',
    title: 'Combat',
    category: 'combat',
    exclusive: true,
    modes: ['combat', 'all'],
    geometry: { x: 200, y: 150, width: 600, height: 500 },
    minSize: { width: 400, height: 350 },
  }),

  // ── Dev Panels ──────────────────────────────────
  panel({
    id: 'layout-exporter',
    title: 'Layout Exporter',
    category: 'dev',
    exclusive: false,
    modes: ['dev', 'all'],
    geometry: { x: 20, y: 20, width: 480, height: 600 },
    minSize: { width: 360, height: 400 },
  }),

  panel({
    id: 'state-inspector',
    title: 'State Inspector',
    category: 'dev',
    exclusive: false,
    modes: ['dev', 'all'],
    geometry: { x: 520, y: 20, width: 480, height: 600 },
    minSize: { width: 320, height: 300 },
  }),
];

export function getDefaultPanelMap(): Record<string, PanelConfig> {
  const map: Record<string, PanelConfig> = {};
  for (const p of DEFAULT_PANELS) {
    map[p.id] = { ...p, geometry: { ...p.geometry }, defaultGeometry: { ...p.defaultGeometry }, minSize: { ...p.minSize } };
  }
  return map;
}
