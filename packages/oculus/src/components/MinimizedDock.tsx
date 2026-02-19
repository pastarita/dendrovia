'use client';

/**
 * MinimizedDock — Bottom-center row of clickable chips for minimized panels
 */

import React from 'react';
import { usePanelStore } from '../store/usePanelStore';

export function MinimizedDock() {
  const panels = usePanelStore((s) => s.panels);
  const restorePanel = usePanelStore((s) => s.restorePanel);

  const minimized = Object.values(panels).filter((p) => p.visible && p.minimized);

  if (minimized.length === 0) return null;

  return (
    <div className="minimized-dock" role="toolbar" aria-label="Minimized panels">
      {minimized.map((p) => (
        <button
          key={p.id}
          className="minimized-dock__chip"
          onClick={() => restorePanel(p.id)}
          title={`Restore ${p.title}`}
          aria-label={`Restore ${p.title}`}
        >
          {p.title}
        </button>
      ))}
    </div>
  );
}
