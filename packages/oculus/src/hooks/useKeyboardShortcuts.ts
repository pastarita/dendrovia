'use client';

/**
 * Keyboard Shortcuts — Global shortcut handler for OCULUS panels
 *
 * Q: Toggle quest log
 * M: Toggle Miller Columns
 * Esc: Close active panel / close topmost managed panel
 * `: Toggle Layout Exporter dev panel
 * I: Toggle State Inspector dev panel
 * L: Toggle lock on topmost focused panel
 */

import { useEffect } from 'react';
import { useOculusStore } from '../store/useOculusStore';
import { usePanelStore } from '../store/usePanelStore';

export function useKeyboardShortcuts(enabled = true) {
  const togglePanel = useOculusStore((s) => s.togglePanel);
  const activePanel = useOculusStore((s) => s.activePanel);
  const setActivePanel = useOculusStore((s) => s.setActivePanel);
  const closeCodeReader = useOculusStore((s) => s.closeCodeReader);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'q':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            togglePanel('quest-log');
          }
          break;
        case 'm':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            togglePanel('miller-columns');
          }
          break;
        case 'escape':
          if (activePanel !== 'none') {
            e.preventDefault();
            if (activePanel === 'code-reader') {
              closeCodeReader();
            } else {
              setActivePanel('none');
            }
          } else {
            // Close topmost visible non-exclusive managed panel
            const ps = usePanelStore.getState();
            const fo = ps.focusOrder;
            for (let i = fo.length - 1; i >= 0; i--) {
              const p = ps.panels[fo[i]];
              if (p && p.visible && !p.minimized && !p.exclusive) {
                e.preventDefault();
                ps.hidePanel(fo[i]);
                break;
              }
            }
          }
          break;
        case '`':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            usePanelStore.getState().toggleVisibility('layout-exporter');
          }
          break;
        case 'i':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            usePanelStore.getState().toggleVisibility('state-inspector');
          }
          break;
        case 'l':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const ps = usePanelStore.getState();
            const fo = ps.focusOrder;
            // Toggle lock on topmost visible panel
            for (let i = fo.length - 1; i >= 0; i--) {
              const p = ps.panels[fo[i]];
              if (p && p.visible && !p.minimized) {
                ps.toggleLock(fo[i]);
                break;
              }
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, activePanel, togglePanel, setActivePanel, closeCodeReader]);
}
