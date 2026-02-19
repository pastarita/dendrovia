'use client';

/**
 * Panel Window Manager — Type definitions
 *
 * Types for the panel layout system: panel configs, geometry,
 * display modes, and serializable layout snapshots.
 */

// ── Display Modes ─────────────────────────────────────

export type DisplayMode = 'falcon' | 'player' | 'combat' | 'dev' | 'all';

export type PanelCategory = 'hud' | 'navigation' | 'combat' | 'dev' | 'overlay';

// ── Geometry ──────────────────────────────────────────

export interface PanelGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PanelMinSize {
  width: number;
  height: number;
}

// ── Panel Configuration ───────────────────────────────

export interface PanelConfig {
  id: string;
  title: string;
  visible: boolean;
  minimized: boolean;
  locked: boolean;
  geometry: PanelGeometry;
  defaultGeometry: PanelGeometry;
  minSize: PanelMinSize;
  modes: DisplayMode[];
  category: PanelCategory;
  exclusive: boolean;
}

// ── Layout Snapshot (serializable) ────────────────────

export interface PanelSnapshot {
  geometry: PanelGeometry;
  visible: boolean;
  minimized: boolean;
  locked: boolean;
}

export interface LayoutSnapshot {
  version: 1;
  timestamp: string;
  panels: Record<string, PanelSnapshot>;
}

// ── Store Shape ───────────────────────────────────────

export interface PanelStoreState {
  panels: Record<string, PanelConfig>;
  focusOrder: string[];
  activeMode: DisplayMode;
}
