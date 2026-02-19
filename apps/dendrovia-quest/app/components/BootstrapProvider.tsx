'use client';

/**
 * BootstrapProvider — React context wrapping the app bootstrap lifecycle.
 *
 * Runs the bootstrap pipeline once on mount and exposes the resulting
 * BootstrapContext to descendants. Shows a loading screen during init.
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { bootstrap, type BootstrapConfig, type BootstrapContext } from '../../lib/bootstrap';

const Ctx = createContext<BootstrapContext | null>(null);

export interface BootstrapProviderProps extends BootstrapConfig {
  children: ReactNode;
  /** Optional loading UI (default: plain text). */
  loadingScreen?: (message: string) => ReactNode;
}

export function BootstrapProvider({
  children,
  loadingScreen,
  ...config
}: BootstrapProviderProps) {
  const [ctx, setCtx] = useState<BootstrapContext | null>(null);
  const [message, setMessage] = useState('Initializing...');
  const destroyRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    bootstrap(config, (msg) => {
      if (!cancelled) setMessage(msg);
    }).then((result) => {
      if (cancelled) {
        result.destroy();
        return;
      }
      destroyRef.current = result.destroy;
      setCtx(result);
    });

    return () => {
      cancelled = true;
      destroyRef.current?.();
      destroyRef.current = null;
    };
    // Config values are primitives — stable across renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.topologyPath,
    config.manifestPath,
    config.enableOperatus,
    config.enableLudus,
    config.characterClass,
    config.characterName,
  ]);

  if (!ctx) {
    return loadingScreen ? <>{loadingScreen(message)}</> : <div>{message}</div>;
  }

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useBootstrap(): BootstrapContext {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useBootstrap must be used within <BootstrapProvider>');
  }
  return ctx;
}
