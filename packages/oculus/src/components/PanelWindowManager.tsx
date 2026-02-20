'use client';

/**
 * PanelWindowManager — Absolute-positioned container layer
 *
 * Renders all visible ManagedPanels and the MinimizedDock.
 * Sits as a layer on top of the existing HUD grid.
 */

import React, { type ReactNode } from 'react';
import { MinimizedDock } from './MinimizedDock';

export interface PanelWindowManagerProps {
  children: ReactNode;
}

export function PanelWindowManager({ children }: PanelWindowManagerProps) {
  return (
    <div
      className="oculus-panel-wm"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {children}
      <MinimizedDock />
    </div>
  );
}
