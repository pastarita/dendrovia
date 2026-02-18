"use client";

import { use } from "react";
import { PillarDashboard } from "@repo/ui/pillar-dashboard";
import { PILLAR_META } from "@repo/ui/pillar-data";
import type { PillarName } from "@repo/ui/domain-registry";

export default function PillarDashboardPage({
  params,
}: {
  params: Promise<{ pillar: string }>;
}) {
  const { pillar: slug } = use(params);
  const pillar = slug.toUpperCase() as PillarName;
  const meta = PILLAR_META[pillar];

  if (!meta) return null;

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>{meta.emoji}</span>
          <span style={{ color: "var(--pillar-accent)" }}>{meta.name}</span>
        </h1>
        <p style={{ opacity: 0.6, marginTop: "0.5rem", fontSize: "1.1rem" }}>
          {meta.subtitle}
        </p>
        <p style={{ opacity: 0.4, marginTop: "0.25rem", fontSize: "0.85rem" }}>
          Port {meta.port} · {meta.tincture}
        </p>
      </div>

      <PillarDashboard pillar={pillar} pillarHex={meta.hex} />
    </div>
  );
}
