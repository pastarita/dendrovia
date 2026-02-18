"use client";

/**
 * DomainSubNav — Horizontal nav bar for sub-pages within a SpacePark domain.
 *
 * Renders at the top of each domain layout as a sticky bar.
 * Reads pillar context to build correct paths (unified or legacy mode).
 *
 * Uses `contain: layout style` to prevent style leakage — important when
 * OCULUS components are rendered as UI overlay elements.
 */

import { useEffect, useState } from "react";
import { DomainIcon } from "./icons";
import { getSubPages, type DomainSlug, type PillarName } from "./domain-registry";
import { usePillarMaybe } from "./pillar-context";

interface DomainSubNavProps {
  domain: DomainSlug;
  pillar: PillarName;
}

export function DomainSubNav({ domain, pillar }: DomainSubNavProps) {
  const [pathname, setPathname] = useState("");
  const pillarCtx = usePillarMaybe();
  const unified = pillarCtx?.unifiedMode ?? false;
  const pages = getSubPages(pillar, domain);

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  if (pages.length === 0) return null;

  const domainName =
    domain === "spatial-docs"
      ? "Spatial Docs"
      : domain.charAt(0).toUpperCase() + domain.slice(1);

  function pageHref(slug: string): string {
    if (unified) {
      return `/${pillar.toLowerCase()}/${domain}/${slug}`;
    }
    return `/${domain}/${slug}`;
  }

  const dashboardHref = unified ? `/${pillar.toLowerCase()}` : "/";

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        gap: "2px",
        padding: "6px 0",
        marginBottom: "1rem",
        borderBottom: "1px solid #1a1a1a",
        background: "var(--background, #0a0a0a)",
        contain: "layout style",
        flexWrap: "wrap",
      }}
    >
      {/* Domain badge */}
      <a
        href={dashboardHref}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 8px",
          marginRight: "4px",
          fontSize: "0.8rem",
          fontWeight: 600,
          opacity: 0.6,
          borderRadius: "4px",
          transition: "opacity 0.15s",
        }}
        title={`Back to ${pillar} Dashboard`}
      >
        <DomainIcon domain={domain} size={16} />
        <span>{domainName}</span>
      </a>

      <span style={{ opacity: 0.15, fontSize: "0.9rem", margin: "0 2px" }}>
        |
      </span>

      {/* Sub-page tabs */}
      {pages.map((page) => {
        const href = pageHref(page.slug);
        const isActive =
          pathname === href || pathname.startsWith(href + "/");

        return (
          <a
            key={page.slug}
            href={href}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "var(--pillar-accent, #22C55E)" : "inherit",
              background: isActive
                ? "rgba(var(--pillar-accent-rgb, 34,197,94), 0.1)"
                : "transparent",
              border: isActive
                ? "1px solid rgba(var(--pillar-accent-rgb, 34,197,94), 0.2)"
                : "1px solid transparent",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {page.shortName}
          </a>
        );
      })}
    </nav>
  );
}
