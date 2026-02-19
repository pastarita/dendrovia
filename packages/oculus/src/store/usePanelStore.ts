'use client';

/**
 * Panel Store — Zustand store for panel window management
 *
 * Manages panel registry, visibility, geometry, z-ordering, and locking.
 * Separate from useOculusStore to avoid re-renders of game-state subscribers.
 * Bidirectional bridge keeps activePanel in sync for backwards compat.
 */

import { create } from 'zustand';
import type {
  PanelConfig,
  PanelGeometry,
  PanelStoreState,
  LayoutSnapshot,
  DisplayMode,
} from './panel-types';
import { getDefaultPanelMap } from './default-layouts';

// ── Actions ───────────────────────────────────────────

export interface PanelStoreActions {
  // Registration
  registerPanel: (config: PanelConfig) => void;
  unregisterPanel: (id: string) => void;
  registerDefaults: () => void;

  // Visibility
  showPanel: (id: string) => void;
  hidePanel: (id: string) => void;
  toggleVisibility: (id: string) => void;

  // Minimize
  minimizePanel: (id: string) => void;
  restorePanel: (id: string) => void;

  // Geometry
  movePanel: (id: string, x: number, y: number) => void;
  resizePanel: (id: string, width: number, height: number) => void;
  resetGeometry: (id: string) => void;
  resetAllGeometry: () => void;

  // Locking
  toggleLock: (id: string) => void;
  lockAll: () => void;
  unlockAll: () => void;

  // Z-order
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  // Mode
  setActiveMode: (mode: DisplayMode) => void;

  // Serialization
  exportLayout: () => LayoutSnapshot;
  loadLayout: (snapshot: LayoutSnapshot) => void;
}

export type PanelStore = PanelStoreState & PanelStoreActions;

export const usePanelStore = create<PanelStore>((set, get) => ({
  // ── Initial State ───────────────────────────────────
  panels: {},
  focusOrder: [],
  activeMode: 'all',

  // ── Registration ────────────────────────────────────

  registerPanel: (config) =>
    set((s) => {
      if (s.panels[config.id]) return s;
      return {
        panels: { ...s.panels, [config.id]: config },
        focusOrder: [...s.focusOrder, config.id],
      };
    }),

  unregisterPanel: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.panels;
      return {
        panels: rest,
        focusOrder: s.focusOrder.filter((fid) => fid !== id),
      };
    }),

  registerDefaults: () =>
    set((s) => {
      if (Object.keys(s.panels).length > 0) return s;
      const defaults = getDefaultPanelMap();
      return {
        panels: defaults,
        focusOrder: Object.keys(defaults),
      };
    }),

  // ── Visibility ──────────────────────────────────────

  showPanel: (id) =>
    set((s) => {
      const panel = s.panels[id];
      if (!panel) return s;

      const updates: Record<string, PanelConfig> = {};

      // Hide other exclusive panels if this one is exclusive
      if (panel.exclusive) {
        for (const [pid, p] of Object.entries(s.panels)) {
          if (pid !== id && p.exclusive && p.visible) {
            updates[pid] = { ...p, visible: false };
          }
        }
      }

      updates[id] = { ...panel, visible: true, minimized: false };

      // Bring to front
      const focusOrder = [...s.focusOrder.filter((fid) => fid !== id), id];

      return { panels: { ...s.panels, ...updates }, focusOrder };
    }),

  hidePanel: (id) =>
    set((s) => {
      const panel = s.panels[id];
      if (!panel) return s;
      return {
        panels: { ...s.panels, [id]: { ...panel, visible: false } },
      };
    }),

  toggleVisibility: (id) => {
    const panel = get().panels[id];
    if (!panel) return;
    if (panel.visible) {
      get().hidePanel(id);
    } else {
      get().showPanel(id);
    }
  },

  // ── Minimize ────────────────────────────────────────

  minimizePanel: (id) =>
    set((s) => {
      const panel = s.panels[id];
      if (!panel) return s;
      return {
        panels: { ...s.panels, [id]: { ...panel, minimized: true } },
      };
    }),

  restorePanel: (id) =>
    set((s) => {
      const panel = s.panels[id];
      if (!panel) return s;
      const focusOrder = [...s.focusOrder.filter((fid) => fid !== id), id];
      return {
        panels: { ...s.panels, [id]: { ...panel, minimized: false } },
        focusOrder,
      };
    }),

  // ── Geometry ────────────────────────────────────────

  movePanel: (id, x, y) =>
    set((s) => {
      const panel = s.panels[id];
      if (!panel || panel.locked) return s;
      return {
        panels: {
          ...s.panels,
          [id]: { ...panel, geometry: { ...panel.geometry, x, y } },
        },
      };
    }),

  resizePanel: (id, width, height) =>
    set((s) => {
      const panel = s.panels[id];
      if (!panel || panel.locked) return s;
      const w = Math.max(width, panel.minSize.width);
      const h = Math.max(height, panel.minSize.height);
      return {
        panels: {
          ...s.panels,
          [id]: { ...panel, geometry: { ...panel.geometry, width: w, height: h } },
        },
      };
    }),

  resetGeometry: (id) =>
    set((s) => {
      const panel = s.panels[id];
      if (!panel) return s;
      return {
        panels: {
          ...s.panels,
          [id]: { ...panel, geometry: { ...panel.defaultGeometry } },
        },
      };
    }),

  resetAllGeometry: () =>
    set((s) => {
      const panels = { ...s.panels };
      for (const [id, p] of Object.entries(panels)) {
        panels[id] = { ...p, geometry: { ...p.defaultGeometry } };
      }
      return { panels };
    }),

  // ── Locking ─────────────────────────────────────────

  toggleLock: (id) =>
    set((s) => {
      const panel = s.panels[id];
      if (!panel) return s;
      return {
        panels: { ...s.panels, [id]: { ...panel, locked: !panel.locked } },
      };
    }),

  lockAll: () =>
    set((s) => {
      const panels = { ...s.panels };
      for (const [id, p] of Object.entries(panels)) {
        panels[id] = { ...p, locked: true };
      }
      return { panels };
    }),

  unlockAll: () =>
    set((s) => {
      const panels = { ...s.panels };
      for (const [id, p] of Object.entries(panels)) {
        panels[id] = { ...p, locked: false };
      }
      return { panels };
    }),

  // ── Z-Order ─────────────────────────────────────────

  bringToFront: (id) =>
    set((s) => ({
      focusOrder: [...s.focusOrder.filter((fid) => fid !== id), id],
    })),

  sendToBack: (id) =>
    set((s) => ({
      focusOrder: [id, ...s.focusOrder.filter((fid) => fid !== id)],
    })),

  // ── Mode ────────────────────────────────────────────

  setActiveMode: (mode) => set({ activeMode: mode }),

  // ── Serialization ───────────────────────────────────

  exportLayout: () => {
    const { panels } = get();
    const snapshot: LayoutSnapshot = {
      version: 1,
      timestamp: new Date().toISOString(),
      panels: {},
    };
    for (const [id, p] of Object.entries(panels)) {
      snapshot.panels[id] = {
        geometry: { ...p.geometry },
        visible: p.visible,
        minimized: p.minimized,
        locked: p.locked,
      };
    }
    return snapshot;
  },

  loadLayout: (snapshot) =>
    set((s) => {
      if (snapshot.version !== 1) return s;
      const panels = { ...s.panels };
      for (const [id, snap] of Object.entries(snapshot.panels)) {
        if (panels[id]) {
          panels[id] = {
            ...panels[id],
            geometry: { ...snap.geometry },
            visible: snap.visible,
            minimized: snap.minimized,
            locked: snap.locked,
          };
        }
      }
      return { panels };
    }),
}));
