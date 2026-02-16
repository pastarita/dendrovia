"use client";

import { useState } from "react";
import {
  getDomainsForPillar,
  type PillarName,
  type AffinityTier,
  type RankedDomain,
} from "./domain-registry";
import { AffinityMap } from "./affinity-map";

interface PillarDashboardProps {
  pillar: PillarName;
  pillarHex: string;
}

const TIER_LABELS: Record<AffinityTier, string> = {
  hero: "Primary Domain",
  featured: "Featured",
  reference: "Reference",
};

function DomainCard({
  domain,
  pillarHex,
}: {
  domain: RankedDomain;
  pillarHex: string;
}) {
  const isHero = domain.tier === "hero";
  const isFeatured = domain.tier === "featured";

  return (
    <a
      href={domain.path}
      style={{
        display: "block",
        padding: isHero ? "1.5rem" : "1.25rem",
        border: isHero
          ? `2px solid ${pillarHex}55`
          : isFeatured
            ? "1px solid #333"
            : "1px solid #222",
        borderRadius: isHero ? "10px" : "8px",
        background: isHero ? `${pillarHex}08` : "transparent",
        transition: "border-color 0.2s, background 0.2s",
        gridColumn: isHero ? "1 / -1" : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = pillarHex;
        if (!isHero) e.currentTarget.style.background = `${pillarHex}08`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isHero
          ? `${pillarHex}55`
          : isFeatured
            ? "#333"
            : "#222";
        if (!isHero) e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        style={{
          display: isHero ? "flex" : "block",
          alignItems: "center",
          gap: isHero ? "1rem" : undefined,
        }}
      >
        <div
          style={{
            fontSize: isHero ? "2rem" : "1.5rem",
            marginBottom: isHero ? 0 : "0.5rem",
          }}
        >
          {domain.icon}
        </div>
        <div>
          <div
            style={{
              fontWeight: 600,
              marginBottom: "0.25rem",
              fontSize: isHero ? "1.15rem" : undefined,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {domain.name}
            {isHero && (
              <span
                style={{
                  fontSize: "0.6rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  opacity: 0.5,
                  color: pillarHex,
                  fontWeight: 500,
                }}
              >
                Primary
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.85rem", opacity: 0.5 }}>{domain.desc}</div>
        </div>
      </div>
      {isHero && (
        <div
          style={{
            marginTop: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.8rem",
            opacity: 0.4,
          }}
        >
          <span style={{ color: pillarHex }}>{"\u2192"}</span>
          Enter {domain.name}
        </div>
      )}
    </a>
  );
}

export function PillarDashboard({ pillar, pillarHex }: PillarDashboardProps) {
  const [showMap, setShowMap] = useState(false);
  const ranked = getDomainsForPillar(pillar);

  const hero = ranked.filter((d) => d.tier === "hero");
  const featured = ranked.filter((d) => d.tier === "featured");
  const reference = ranked.filter((d) => d.tier === "reference");

  return (
    <div>
      {/* Hero tier */}
      {hero.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          {hero.map((d) => (
            <DomainCard key={d.slug} domain={d} pillarHex={pillarHex} />
          ))}
        </div>
      )}

      {/* Featured tier */}
      {featured.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              opacity: 0.35,
              marginBottom: "0.5rem",
            }}
          >
            {TIER_LABELS.featured}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {featured.map((d) => (
              <DomainCard key={d.slug} domain={d} pillarHex={pillarHex} />
            ))}
          </div>
        </div>
      )}

      {/* Reference tier */}
      {reference.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              opacity: 0.35,
              marginBottom: "0.5rem",
            }}
          >
            {TIER_LABELS.reference}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {reference.map((d) => (
              <DomainCard key={d.slug} domain={d} pillarHex={pillarHex} />
            ))}
          </div>
        </div>
      )}

      {/* Affinity Map toggle */}
      <div style={{ borderTop: "1px solid #222", paddingTop: "1.5rem" }}>
        <button
          onClick={() => setShowMap(!showMap)}
          style={{
            background: "transparent",
            border: "1px solid #333",
            borderRadius: "4px",
            color: "inherit",
            padding: "0.4rem 0.75rem",
            fontSize: "0.8rem",
            cursor: "pointer",
            opacity: 0.6,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          {showMap ? "\u25BE" : "\u25B8"} Affinity Map
        </button>

        {showMap && (
          <div style={{ marginTop: "1rem" }}>
            <AffinityMap currentPillar={pillar} />
          </div>
        )}
      </div>
    </div>
  );
}
