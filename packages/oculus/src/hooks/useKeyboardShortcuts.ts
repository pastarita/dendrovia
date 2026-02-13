/**
 * Keyboard Shortcuts — Global shortcut handler for OCULUS panels
 *
 * Q: Toggle quest log
 * M: Toggle Miller Columns
 * Esc: Close active panel
 */

import { useEffect } from 'react';
import { useOculusStore } from '../store/useOculusStore';

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
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, activePanel, togglePanel, setActivePanel, closeCodeReader]);
}
