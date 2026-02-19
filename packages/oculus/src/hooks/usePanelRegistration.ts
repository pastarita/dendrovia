'use client';

/**
 * usePanelRegistration — Register/unregister panels on mount/unmount
 *
 * Ensures panels are tracked in the panel store for the lifetime
 * of their React component.
 */

import { useEffect } from 'react';
import { usePanelStore } from '../store/usePanelStore';
import type { PanelConfig } from '../store/panel-types';

export function usePanelRegistration(config: PanelConfig) {
  const registerPanel = usePanelStore((s) => s.registerPanel);
  const unregisterPanel = usePanelStore((s) => s.unregisterPanel);

  useEffect(() => {
    registerPanel(config);
    return () => {
      unregisterPanel(config.id);
    };
    // Only re-register if the panel id changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.id, registerPanel, unregisterPanel]);
}
