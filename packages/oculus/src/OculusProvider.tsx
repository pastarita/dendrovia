/**
 * OculusProvider — Root context wrapper for all OCULUS components
 *
 * Initializes EventBus subscriptions and provides configuration
 * to the component tree.
 */

import type { EventBus } from '@dendrovia/shared';
import React, { createContext, type ReactNode, useContext, useMemo } from 'react';
import { type CodeLoaderOptions, useCodeLoader } from './hooks/useCodeLoader';
import { useEventSubscriptions } from './hooks/useEventSubscriptions';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './styles/base.css';
import './styles/responsive.css';

export interface OculusConfig {
  /** Show minimap */
  showMinimap?: boolean;
  /** Show quest tracker in HUD corner */
  showQuestTracker?: boolean;
  /** Enable keyboard shortcuts */
  enableShortcuts?: boolean;
  /** Theme overrides (CSS custom properties) */
  themeOverrides?: Record<string, string>;
  /** Code loader options (base URL or custom fetch) */
  codeLoader?: CodeLoaderOptions;
}

const defaultConfig: OculusConfig = {
  showMinimap: true,
  showQuestTracker: true,
  enableShortcuts: true,
};

interface OculusContextValue {
  eventBus: EventBus;
  config: OculusConfig;
}

const OculusContext = createContext<OculusContextValue | null>(null);

export interface OculusProviderProps {
  eventBus: EventBus;
  config?: Partial<OculusConfig>;
  children: ReactNode;
}

export function OculusProvider({ eventBus, config, children }: OculusProviderProps) {
  const mergedConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);

  // Wire EventBus → Zustand store
  useEventSubscriptions(eventBus);

  // Global keyboard shortcuts
  useKeyboardShortcuts(mergedConfig.enableShortcuts);

  // Auto-load file content when CodeReader opens
  useCodeLoader(mergedConfig.codeLoader);

  const value = useMemo(() => ({ eventBus, config: mergedConfig }), [eventBus, mergedConfig]);

  // Apply theme overrides as CSS custom properties
  const style = mergedConfig.themeOverrides ? (mergedConfig.themeOverrides as React.CSSProperties) : undefined;

  return (
    <OculusContext.Provider value={value}>
      <div className="oculus-root" style={style}>
        {children}
      </div>
    </OculusContext.Provider>
  );
}

export function useOculus(): OculusContextValue {
  const ctx = useContext(OculusContext);
  if (!ctx) {
    throw new Error('useOculus must be used within <OculusProvider>');
  }
  return ctx;
}
