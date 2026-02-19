/**
 * Tests for the OCULUS Panel Store
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { usePanelStore } from '../store/usePanelStore';
import type { PanelConfig, LayoutSnapshot } from '../store/panel-types';

function makePanel(overrides: Partial<PanelConfig> = {}): PanelConfig {
  const id = overrides.id ?? 'test-panel';
  const geo = overrides.geometry ?? { x: 100, y: 100, width: 400, height: 300 };
  return {
    id,
    title: overrides.title ?? 'Test Panel',
    visible: overrides.visible ?? false,
    minimized: overrides.minimized ?? false,
    locked: overrides.locked ?? false,
    geometry: geo,
    defaultGeometry: overrides.defaultGeometry ?? { ...geo },
    minSize: overrides.minSize ?? { width: 200, height: 150 },
    modes: overrides.modes ?? ['all'],
    category: overrides.category ?? 'dev',
    exclusive: overrides.exclusive ?? false,
  };
}

function resetStore() {
  usePanelStore.setState({
    panels: {},
    focusOrder: [],
    activeMode: 'all',
  });
}

describe('usePanelStore', () => {
  beforeEach(resetStore);

  // ── Registration ──────────────────────────────────

  describe('registration', () => {
    it('registers a panel', () => {
      const panel = makePanel({ id: 'p1' });
      usePanelStore.getState().registerPanel(panel);
      expect(usePanelStore.getState().panels['p1']).toBeDefined();
      expect(usePanelStore.getState().panels['p1'].title).toBe('Test Panel');
    });

    it('adds to focusOrder on register', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2' }));
      expect(usePanelStore.getState().focusOrder).toEqual(['p1', 'p2']);
    });

    it('does not duplicate on re-register', () => {
      const panel = makePanel({ id: 'p1' });
      usePanelStore.getState().registerPanel(panel);
      usePanelStore.getState().registerPanel(panel);
      expect(usePanelStore.getState().focusOrder).toEqual(['p1']);
    });

    it('unregisters a panel', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2' }));
      usePanelStore.getState().unregisterPanel('p1');
      expect(usePanelStore.getState().panels['p1']).toBeUndefined();
      expect(usePanelStore.getState().focusOrder).toEqual(['p2']);
    });

    it('registers defaults when store is empty', () => {
      usePanelStore.getState().registerDefaults();
      const panels = usePanelStore.getState().panels;
      expect(Object.keys(panels).length).toBeGreaterThan(0);
      expect(panels['quest-log']).toBeDefined();
      expect(panels['battle-ui']).toBeDefined();
      expect(panels['layout-exporter']).toBeDefined();
    });

    it('does not overwrite existing panels on registerDefaults', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'quest-log', title: 'Custom' }));
      usePanelStore.getState().registerDefaults();
      expect(usePanelStore.getState().panels['quest-log'].title).toBe('Custom');
    });
  });

  // ── Visibility ────────────────────────────────────

  describe('visibility', () => {
    it('shows a panel', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().showPanel('p1');
      expect(usePanelStore.getState().panels['p1'].visible).toBe(true);
    });

    it('hides a panel', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1', visible: true }));
      usePanelStore.getState().hidePanel('p1');
      expect(usePanelStore.getState().panels['p1'].visible).toBe(false);
    });

    it('toggles visibility', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().toggleVisibility('p1');
      expect(usePanelStore.getState().panels['p1'].visible).toBe(true);
      usePanelStore.getState().toggleVisibility('p1');
      expect(usePanelStore.getState().panels['p1'].visible).toBe(false);
    });

    it('showing an exclusive panel hides other exclusive panels', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1', exclusive: true, visible: true }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2', exclusive: true }));
      usePanelStore.getState().showPanel('p2');
      expect(usePanelStore.getState().panels['p1'].visible).toBe(false);
      expect(usePanelStore.getState().panels['p2'].visible).toBe(true);
    });

    it('showing an exclusive panel does not hide non-exclusive panels', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'dev', exclusive: false, visible: true }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1', exclusive: true }));
      usePanelStore.getState().showPanel('p1');
      expect(usePanelStore.getState().panels['dev'].visible).toBe(true);
      expect(usePanelStore.getState().panels['p1'].visible).toBe(true);
    });

    it('showing a panel restores it from minimized', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1', minimized: true }));
      usePanelStore.getState().showPanel('p1');
      expect(usePanelStore.getState().panels['p1'].minimized).toBe(false);
    });

    it('no-ops on unknown panel id', () => {
      usePanelStore.getState().showPanel('nonexistent');
      usePanelStore.getState().hidePanel('nonexistent');
      usePanelStore.getState().toggleVisibility('nonexistent');
      // Should not throw
      expect(Object.keys(usePanelStore.getState().panels)).toHaveLength(0);
    });
  });

  // ── Minimize ──────────────────────────────────────

  describe('minimize', () => {
    it('minimizes a panel', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1', visible: true }));
      usePanelStore.getState().minimizePanel('p1');
      expect(usePanelStore.getState().panels['p1'].minimized).toBe(true);
    });

    it('restores a panel and brings to front', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1', minimized: true }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2' }));
      usePanelStore.getState().restorePanel('p1');
      expect(usePanelStore.getState().panels['p1'].minimized).toBe(false);
      const fo = usePanelStore.getState().focusOrder;
      expect(fo[fo.length - 1]).toBe('p1');
    });
  });

  // ── Geometry ──────────────────────────────────────

  describe('geometry', () => {
    it('moves a panel', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().movePanel('p1', 200, 300);
      const geo = usePanelStore.getState().panels['p1'].geometry;
      expect(geo.x).toBe(200);
      expect(geo.y).toBe(300);
    });

    it('does not move a locked panel', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1', locked: true }));
      usePanelStore.getState().movePanel('p1', 999, 999);
      const geo = usePanelStore.getState().panels['p1'].geometry;
      expect(geo.x).toBe(100);
      expect(geo.y).toBe(100);
    });

    it('resizes a panel', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().resizePanel('p1', 500, 400);
      const geo = usePanelStore.getState().panels['p1'].geometry;
      expect(geo.width).toBe(500);
      expect(geo.height).toBe(400);
    });

    it('clamps resize to minSize', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1', minSize: { width: 200, height: 150 } }));
      usePanelStore.getState().resizePanel('p1', 50, 50);
      const geo = usePanelStore.getState().panels['p1'].geometry;
      expect(geo.width).toBe(200);
      expect(geo.height).toBe(150);
    });

    it('does not resize a locked panel', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1', locked: true }));
      usePanelStore.getState().resizePanel('p1', 999, 999);
      const geo = usePanelStore.getState().panels['p1'].geometry;
      expect(geo.width).toBe(400);
      expect(geo.height).toBe(300);
    });

    it('resets geometry to defaults', () => {
      usePanelStore.getState().registerPanel(makePanel({
        id: 'p1',
        geometry: { x: 100, y: 100, width: 400, height: 300 },
        defaultGeometry: { x: 100, y: 100, width: 400, height: 300 },
      }));
      usePanelStore.getState().movePanel('p1', 999, 999);
      usePanelStore.getState().resetGeometry('p1');
      const geo = usePanelStore.getState().panels['p1'].geometry;
      expect(geo.x).toBe(100);
      expect(geo.y).toBe(100);
    });

    it('resets all geometry', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2' }));
      usePanelStore.getState().movePanel('p1', 999, 999);
      usePanelStore.getState().movePanel('p2', 888, 888);
      usePanelStore.getState().resetAllGeometry();
      expect(usePanelStore.getState().panels['p1'].geometry.x).toBe(100);
      expect(usePanelStore.getState().panels['p2'].geometry.x).toBe(100);
    });
  });

  // ── Locking ───────────────────────────────────────

  describe('locking', () => {
    it('toggles lock', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().toggleLock('p1');
      expect(usePanelStore.getState().panels['p1'].locked).toBe(true);
      usePanelStore.getState().toggleLock('p1');
      expect(usePanelStore.getState().panels['p1'].locked).toBe(false);
    });

    it('locks all panels', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2' }));
      usePanelStore.getState().lockAll();
      expect(usePanelStore.getState().panels['p1'].locked).toBe(true);
      expect(usePanelStore.getState().panels['p2'].locked).toBe(true);
    });

    it('unlocks all panels', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1', locked: true }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2', locked: true }));
      usePanelStore.getState().unlockAll();
      expect(usePanelStore.getState().panels['p1'].locked).toBe(false);
      expect(usePanelStore.getState().panels['p2'].locked).toBe(false);
    });
  });

  // ── Z-Order ───────────────────────────────────────

  describe('z-order', () => {
    it('brings panel to front', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2' }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p3' }));
      usePanelStore.getState().bringToFront('p1');
      const fo = usePanelStore.getState().focusOrder;
      expect(fo[fo.length - 1]).toBe('p1');
    });

    it('sends panel to back', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2' }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p3' }));
      usePanelStore.getState().sendToBack('p3');
      expect(usePanelStore.getState().focusOrder[0]).toBe('p3');
    });

    it('showPanel brings to front', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2' }));
      usePanelStore.getState().showPanel('p1');
      const fo = usePanelStore.getState().focusOrder;
      expect(fo[fo.length - 1]).toBe('p1');
    });
  });

  // ── Mode ──────────────────────────────────────────

  describe('mode', () => {
    it('sets active mode', () => {
      usePanelStore.getState().setActiveMode('combat');
      expect(usePanelStore.getState().activeMode).toBe('combat');
    });
  });

  // ── Export / Import ───────────────────────────────

  describe('export/import', () => {
    it('exports layout snapshot', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1', visible: true }));
      usePanelStore.getState().movePanel('p1', 200, 300);
      const snapshot = usePanelStore.getState().exportLayout();
      expect(snapshot.version).toBe(1);
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.panels['p1'].geometry.x).toBe(200);
      expect(snapshot.panels['p1'].visible).toBe(true);
    });

    it('loads layout snapshot', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      const snapshot: LayoutSnapshot = {
        version: 1,
        timestamp: '2026-02-18T00:00:00.000Z',
        panels: {
          p1: {
            geometry: { x: 500, y: 600, width: 300, height: 200 },
            visible: true,
            minimized: false,
            locked: true,
          },
        },
      };
      usePanelStore.getState().loadLayout(snapshot);
      const p1 = usePanelStore.getState().panels['p1'];
      expect(p1.geometry.x).toBe(500);
      expect(p1.visible).toBe(true);
      expect(p1.locked).toBe(true);
    });

    it('ignores unknown panel ids in snapshot', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      const snapshot: LayoutSnapshot = {
        version: 1,
        timestamp: '2026-02-18T00:00:00.000Z',
        panels: {
          unknown: {
            geometry: { x: 0, y: 0, width: 100, height: 100 },
            visible: true,
            minimized: false,
            locked: false,
          },
        },
      };
      usePanelStore.getState().loadLayout(snapshot);
      expect(usePanelStore.getState().panels['unknown']).toBeUndefined();
    });

    it('roundtrips export → import', () => {
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2' }));
      usePanelStore.getState().showPanel('p1');
      usePanelStore.getState().movePanel('p1', 300, 400);
      usePanelStore.getState().toggleLock('p2');

      const snapshot = usePanelStore.getState().exportLayout();

      // Reset and reload
      resetStore();
      usePanelStore.getState().registerPanel(makePanel({ id: 'p1' }));
      usePanelStore.getState().registerPanel(makePanel({ id: 'p2' }));
      usePanelStore.getState().loadLayout(snapshot);

      expect(usePanelStore.getState().panels['p1'].geometry.x).toBe(300);
      expect(usePanelStore.getState().panels['p1'].visible).toBe(true);
      expect(usePanelStore.getState().panels['p2'].locked).toBe(true);
    });
  });
});
