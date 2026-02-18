"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PillarName } from "./domain-registry";
import { PILLAR_META } from "./pillar-data";
import type { PillarMeta } from "./pillar-data";

// Re-export for consumers
export { PILLAR_META } from "./pillar-data";
export type { PillarMeta } from "./pillar-data";

export interface PillarInfo extends PillarMeta {
  /** When true, nav links use internal routes instead of cross-port devUrl() */
  unifiedMode: boolean;
}

const PillarContext = createContext<PillarInfo | null>(null);

export function usePillar(): PillarInfo {
  const ctx = useContext(PillarContext);
  if (!ctx) throw new Error("usePillar() must be used inside <PillarProvider>");
  return ctx;
}

export function usePillarMaybe(): PillarInfo | null {
  return useContext(PillarContext);
}

export function PillarProvider({
  pillar,
  unifiedMode = false,
  children,
}: {
  pillar: PillarName;
  unifiedMode?: boolean;
  children: ReactNode;
}) {
  const meta = PILLAR_META[pillar];
  const value: PillarInfo = { ...meta, unifiedMode };

  return (
    <PillarContext.Provider value={value}>{children}</PillarContext.Provider>
  );
}
