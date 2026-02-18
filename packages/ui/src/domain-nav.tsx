"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ALL_PILLARS } from "./pillar-nav";
import {
  ALL_DOMAINS,
  PILLAR_DOMAIN_AFFINITY,
  getPillarsForDomain,
  type PillarName,
  type DomainSlug,
} from "./domain-registry";
import { DomainIcon, PillarIcon } from "./icons";
import { devUrl } from "./dev-urls";
import { usePillarMaybe } from "./pillar-context";
import { useSidebarMaybe } from "./sidebar-provider";

const STORAGE_KEY = "domainnav-expanded";

function readExpanded(): string | null {
  try { return sessionStorage.getItem(STORAGE_KEY); } catch { return null; }
}

export function DomainNav({ currentPillar }: { currentPillar: string }) {
  const [expanded, setExpandedRaw] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const pillarCtx = usePillarMaybe();
  const sidebar = useSidebarMaybe();
  const collapsed = sidebar?.collapsed ?? false;
  const unified = pillarCtx?.unifiedMode ?? false;

  // Restore from sessionStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    const stored = readExpanded();
    if (stored) setExpandedRaw(stored);
  }, []);

  const setExpanded = useCallback((v: string | null) => {
    setExpandedRaw(v);
    try {
      if (v) sessionStorage.setItem(STORAGE_KEY, v);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* SSR / private browsing */ }
  }, []);

  // Sort domains by this pillar's affinity (highest first)
  const sorted = useMemo(() => {
    const affinities = PILLAR_DOMAIN_AFFINITY[currentPillar as PillarName];
    if (!affinities) return ALL_DOMAINS;
    return [...ALL_DOMAINS].sort(
      (a, b) => (affinities[b.slug] ?? 0) - (affinities[a.slug] ?? 0)
    );
  }, [currentPillar]);

  const filtered = search
    ? sorted.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase())
      )
    : sorted;

  function domainHref(domainPath: string, pillarPort: number, isCurrent: boolean): string {
    if (unified) {
      const pillarSlug = currentPillar.toLowerCase();
      return `/${pillarSlug}${domainPath}`;
    }
    return isCurrent ? domainPath : devUrl(pillarPort, domainPath);
  }

  // ── Collapsed mode: icon rail ──
  if (collapsed) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
        {sorted.map((d) => {
          const affinity = PILLAR_DOMAIN_AFFINITY[currentPillar as PillarName]?.[d.slug] ?? 0;
          const isHero = affinity >= 5;
          return (
            <a
              key={d.path}
              href={domainHref(d.path, 0, true)}
              data-tooltip={d.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.45rem",
                borderRadius: "4px",
                opacity: isHero ? 1 : 0.6,
                position: "relative",
              }}
            >
              <DomainIcon domain={d.slug} size={20} />
            </a>
          );
        })}
      </div>
    );
  }

  // ── Expanded mode: full domain nav ──
  return (
    <div>
      <div
        style={{
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          opacity: 0.4,
          marginBottom: "0.5rem",
        }}
      >
        SpacePark Domains
      </div>

      <input
        type="text"
        placeholder="Search domains..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "0.35rem 0.5rem",
          marginBottom: "0.5rem",
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "4px",
          color: "#ccc",
          fontSize: "0.8rem",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {filtered.map((d) => {
        const isExpanded = expanded === d.path;
        const affinity =
          PILLAR_DOMAIN_AFFINITY[currentPillar as PillarName]?.[d.slug] ?? 0;
        const isHero = affinity >= 5;

        // Sort pillar sub-links by affinity for this domain
        const rankedPillars = getPillarsForDomain(d.slug as DomainSlug);

        return (
          <div key={d.path}>
            <button
              onClick={() => setExpanded(isExpanded ? null : d.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.9rem",
                width: "100%",
                background: "transparent",
                border: "none",
                color: "inherit",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: isHero ? 600 : 400,
              }}
            >
              <DomainIcon domain={d.slug} size={18} />
              <span>{d.name}</span>
              {isHero && (
                <span
                  style={{ fontSize: "0.55rem", opacity: 0.4, letterSpacing: "0.05em" }}
                >
                  PRIMARY
                </span>
              )}
              <span
                style={{ marginLeft: "auto", fontSize: "0.7rem", opacity: 0.5 }}
              >
                {isExpanded ? "\u25BE" : "\u25B8"}
              </span>
            </button>

            {isExpanded && (
              <div style={{ paddingLeft: "0.75rem" }}>
                {rankedPillars.map(({ pillar, affinity: pAffinity }) => {
                  const p = ALL_PILLARS.find((x) => x.name === pillar);
                  if (!p) return null;
                  const isCurrent = p.name === currentPillar;
                  const isTopForDomain = pAffinity >= 5;

                  return (
                    <a
                      key={p.name}
                      href={domainHref(d.path, p.port, isCurrent)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.3rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        borderLeft: isCurrent
                          ? `3px solid ${p.hex}`
                          : "3px solid transparent",
                        background: isCurrent ? `${p.hex}15` : "transparent",
                        opacity: isCurrent ? 1 : pAffinity >= 4 ? 0.8 : 0.5,
                        fontWeight: isCurrent ? 600 : 400,
                      }}
                    >
                      <PillarIcon pillar={p.name} size={14} />
                      <span>{p.name}</span>
                      {isTopForDomain && !isCurrent && (
                        <span style={{ fontSize: "0.6rem", opacity: 0.6 }}>
                          {"\u2605"}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "0.65rem",
                          opacity: 0.5,
                          marginLeft: "auto",
                        }}
                      >
                        {isCurrent ? "(you)" : unified ? "" : `:${p.port}`}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
