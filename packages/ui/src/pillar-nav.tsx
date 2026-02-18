"use client";

import { ReconStatusBar } from "./recon-status";
import { PillarIcon, DendroviaIcon } from "./icons";
import { devUrl } from "./dev-urls";
import { usePillarMaybe } from "./pillar-context";
import { useSidebarMaybe } from "./sidebar-provider";

export const ALL_PILLARS = [
  { name: "ARCHITECTUS", port: 3011, emoji: "\u{1F3DB}\uFE0F", tincture: "Azure", hex: "#3B82F6" },
  { name: "CHRONOS", port: 3012, emoji: "\u{1F4DC}", tincture: "Amber", hex: "#c77b3f" },
  { name: "IMAGINARIUM", port: 3013, emoji: "\u{1F3A8}", tincture: "Purpure", hex: "#A855F7" },
  { name: "LUDUS", port: 3014, emoji: "\u{1F3AE}", tincture: "Gules", hex: "#EF4444" },
  { name: "OCULUS", port: 3015, emoji: "\u{1F441}\uFE0F", tincture: "Vert", hex: "#22C55E" },
  { name: "OPERATUS", port: 3016, emoji: "\u{1F4BE}", tincture: "Sable", hex: "#6B7280" },
] as const;

export function PillarNav({ currentPillar }: { currentPillar: string }) {
  const pillarCtx = usePillarMaybe();
  const sidebar = useSidebarMaybe();
  const collapsed = sidebar?.collapsed ?? false;
  const unified = pillarCtx?.unifiedMode ?? false;

  function pillarHref(p: (typeof ALL_PILLARS)[number], isCurrent: boolean): string {
    if (isCurrent) return unified ? `/${p.name.toLowerCase()}` : "/";
    if (unified) return `/${p.name.toLowerCase()}`;
    return devUrl(p.port);
  }

  return (
    <>
      <div>
        {!collapsed && (
          <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.4, marginBottom: "0.5rem" }}>
            Pillars
          </div>
        )}
        {ALL_PILLARS.map((p) => {
          const isCurrent = p.name === currentPillar;
          return (
            <a
              key={p.name}
              href={pillarHref(p, isCurrent)}
              data-tooltip={p.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: collapsed ? 0 : "0.5rem",
                padding: collapsed ? "0.4rem" : "0.4rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.85rem",
                borderLeft: isCurrent ? `3px solid ${p.hex}` : "3px solid transparent",
                background: isCurrent ? `${p.hex}15` : "transparent",
                opacity: isCurrent ? 1 : 0.85,
                fontWeight: isCurrent ? 600 : 400,
                justifyContent: collapsed ? "center" : undefined,
                position: "relative",
              }}
            >
              <PillarIcon pillar={p.name} size={18} />
              {!collapsed && (
                <>
                  <span>{p.name}</span>
                  <span style={{ fontSize: "0.7rem", opacity: 0.4, marginLeft: "auto" }}>
                    {isCurrent ? "(you)" : unified ? "" : `:${p.port}`}
                  </span>
                </>
              )}
            </a>
          );
        })}
      </div>

      <div style={{ marginTop: "auto" }}>
        {!collapsed && <ReconStatusBar currentPillar={currentPillar} />}
        {collapsed && <ReconDot />}
        <a
          href={unified ? "/" : devUrl(3010)}
          data-tooltip="Dendrovia"
          style={{
            display: "flex",
            alignItems: "center",
            gap: collapsed ? 0 : "0.5rem",
            padding: "0.5rem",
            borderRadius: "4px",
            fontSize: "0.85rem",
            border: collapsed ? "none" : "1px solid #333",
            justifyContent: collapsed ? "center" : undefined,
          }}
        >
          <DendroviaIcon size={18} />
          {!collapsed && (
            <>
              Dendrovia Quest
              <span style={{ fontSize: "0.7rem", opacity: 0.4, marginLeft: "auto" }}>
                {unified ? "" : ":3010"}
              </span>
            </>
          )}
        </a>
        {!collapsed && !unified && (
          <a
            href={devUrl(3030)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", borderRadius: "4px", fontSize: "0.8rem", border: "1px solid #222", marginTop: "0.25rem", opacity: 0.6 }}
          >
            {"\u{1F9EA}"} Iteration 1 <span style={{ fontSize: "0.7rem", opacity: 0.4, marginLeft: "auto" }}>:3030</span>
          </a>
        )}
      </div>
    </>
  );
}

/** Compact recon indicator for collapsed sidebar — green/yellow/red dot */
function ReconDot() {
  return (
    <div
      data-tooltip="Recon"
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "0.4rem",
        marginBottom: "0.25rem",
      }}
    >
      <span style={{ fontSize: "0.5rem", color: "#22C55E" }}>{"\u25CF"}</span>
    </div>
  );
}
