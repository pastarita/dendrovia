'use client';

/**
 * ManagedPanel — Draggable, resizable panel wrapper
 *
 * Wraps the Panel primitive with a title bar (drag handle),
 * close/minimize/lock controls, and a resize grip.
 * Position via CSS transform to avoid layout reflow.
 */

import React, { type ReactNode } from 'react';
import { usePanelStore } from '../store/usePanelStore';
import { useDragResize } from '../hooks/useDragResize';
import { useInputCapture } from '../hooks/useInputCapture';

export interface ManagedPanelProps {
  panelId: string;
  children: ReactNode;
  className?: string;
}

export function ManagedPanel({ panelId, children, className = '' }: ManagedPanelProps) {
  const panel = usePanelStore((s) => s.panels[panelId]);
  const zIndex = usePanelStore((s) => s.focusOrder.indexOf(panelId));
  const hidePanel = usePanelStore((s) => s.hidePanel);
  const minimizePanel = usePanelStore((s) => s.minimizePanel);
  const toggleLock = usePanelStore((s) => s.toggleLock);
  const bringToFront = usePanelStore((s) => s.bringToFront);

  const { onTitlePointerDown, onGripPointerDown, onPointerMove, onPointerUp } = useDragResize(panelId);
  const { onPointerEnter, onPointerLeave } = useInputCapture();

  if (!panel || !panel.visible || panel.minimized) return null;

  const { geometry, locked, title } = panel;

  return (
    <div
      className={`managed-panel ${locked ? 'managed-panel--locked' : ''} ${className}`}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate(${geometry.x}px, ${geometry.y}px)`,
        width: geometry.width,
        height: geometry.height,
        zIndex: zIndex + 100,
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerDown={() => bringToFront(panelId)}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      role="region"
      aria-label={title}
    >
      {/* Title bar (drag handle) */}
      <div
        className="managed-panel__titlebar"
        onPointerDown={onTitlePointerDown}
      >
        <span className="managed-panel__title">{title}</span>
        <div className="managed-panel__controls">
          <button
            className="managed-panel__btn"
            onClick={() => toggleLock(panelId)}
            title={locked ? 'Unlock' : 'Lock'}
            aria-label={locked ? 'Unlock panel' : 'Lock panel'}
          >
            {locked ? '\u{1F512}' : '\u{1F513}'}
          </button>
          <button
            className="managed-panel__btn"
            onClick={() => minimizePanel(panelId)}
            title="Minimize"
            aria-label="Minimize panel"
          >
            _
          </button>
          <button
            className="managed-panel__btn managed-panel__btn--close"
            onClick={() => hidePanel(panelId)}
            title="Close"
            aria-label="Close panel"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="managed-panel__content oculus-scrollable">
        {children}
      </div>

      {/* Resize grip */}
      {!locked && (
        <div
          className="managed-panel__grip"
          onPointerDown={onGripPointerDown}
          aria-hidden
        />
      )}
    </div>
  );
}
