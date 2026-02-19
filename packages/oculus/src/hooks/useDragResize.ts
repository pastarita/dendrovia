'use client';

/**
 * useDragResize — Pointer-event-based drag and resize with rAF throttling
 *
 * Uses CSS transform for drag (avoids layout reflow).
 * Native pointer events + setPointerCapture for smooth tracking.
 */

import { useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import { usePanelStore } from '../store/usePanelStore';

type DragMode = 'move' | 'resize' | null;

interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  originW: number;
  originH: number;
  rafId: number | null;
}

export function useDragResize(panelId: string) {
  const dragRef = useRef<DragState>({
    mode: null,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    originW: 0,
    originH: 0,
    rafId: null,
  });

  const onDragStart = useCallback(
    (e: ReactPointerEvent<HTMLElement>, mode: 'move' | 'resize') => {
      const panel = usePanelStore.getState().panels[panelId];
      if (!panel || panel.locked) return;

      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      dragRef.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        originX: panel.geometry.x,
        originY: panel.geometry.y,
        originW: panel.geometry.width,
        originH: panel.geometry.height,
        rafId: null,
      };

      usePanelStore.getState().bringToFront(panelId);
    },
    [panelId],
  );

  const onDragMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const d = dragRef.current;
      if (!d.mode) return;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      if (d.rafId !== null) cancelAnimationFrame(d.rafId);

      d.rafId = requestAnimationFrame(() => {
        if (d.mode === 'move') {
          usePanelStore.getState().movePanel(panelId, d.originX + dx, d.originY + dy);
        } else if (d.mode === 'resize') {
          usePanelStore.getState().resizePanel(panelId, d.originW + dx, d.originH + dy);
        }
        d.rafId = null;
      });
    },
    [panelId],
  );

  const onDragEnd = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const d = dragRef.current;
      if (d.rafId !== null) cancelAnimationFrame(d.rafId);
      d.mode = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [],
  );

  return {
    onTitlePointerDown: (e: ReactPointerEvent<HTMLElement>) => onDragStart(e, 'move'),
    onGripPointerDown: (e: ReactPointerEvent<HTMLElement>) => onDragStart(e, 'resize'),
    onPointerMove: onDragMove,
    onPointerUp: onDragEnd,
  };
}
