"use client";

import type { ReactNode } from "react";
import { PillarProvider, usePillar } from "./pillar-context";
import { SidebarProvider } from "./sidebar-provider";
import { useSidebarMaybe } from "./sidebar-provider";
import { CollapsibleSidebar } from "./collapsible-sidebar";
import { PillarNav } from "./pillar-nav";
import { DomainNav } from "./domain-nav";
import { PillarIcon } from "./icons";
import type { PillarName } from "./domain-registry";

interface PlaygroundLayoutProps {
  pillar: PillarName;
  unifiedMode?: boolean;
  children: ReactNode;
}

/**
 * Shared layout for all playground apps.
 * Wraps PillarProvider + SidebarProvider + CollapsibleSidebar + <main>.
 *
 * Drop-in replacement for the copy-pasted layout.tsx sidebar in each app.
 */
export function PlaygroundLayout({
  pillar,
  unifiedMode = false,
  children,
}: PlaygroundLayoutProps) {
  return (
    <PillarProvider pillar={pillar} unifiedMode={unifiedMode}>
      <SidebarProvider>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <SidebarContent />
          <main style={{ flex: 1, padding: "2rem", overflow: "auto" }}>
            {children}
          </main>
        </div>
      </SidebarProvider>
    </PillarProvider>
  );
}

/** Inner component that reads pillar + sidebar context */
function SidebarContent() {
  const pillar = usePillar();
  const sidebar = useSidebarMaybe();
  const collapsed = sidebar?.collapsed ?? false;

  return (
    <CollapsibleSidebar pillarHex={pillar.hex}>
      {/* Pillar header */}
      <a
        href={pillar.unifiedMode ? `/${pillar.name.toLowerCase()}` : "/"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: collapsed ? 0 : "0.5rem",
          fontSize: collapsed ? "1rem" : "1.25rem",
          fontWeight: 700,
          justifyContent: collapsed ? "center" : undefined,
        }}
      >
        <PillarIcon pillar={pillar.name} size={24} />
        {!collapsed && (
          <span style={{ color: pillar.hex }}>{pillar.name}</span>
        )}
      </a>
      {!collapsed && (
        <div style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "-1rem" }}>
          :{pillar.port} · {pillar.tincture}
        </div>
      )}

      {/* Domain navigation */}
      <DomainNav currentPillar={pillar.name} />

      {/* Pillar navigation */}
      <PillarNav currentPillar={pillar.name} />
    </CollapsibleSidebar>
  );
}
