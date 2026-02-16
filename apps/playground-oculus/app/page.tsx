'use client';

import { PillarDashboard } from "@repo/ui/pillar-dashboard";

export default function OculusDashboard() {
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>{"\u{1F441}\uFE0F"}</span>
          <span style={{ color: "var(--pillar-accent)" }}>OCULUS</span>
        </h1>
        <p style={{ opacity: 0.6, marginTop: "0.5rem", fontSize: "1.1rem" }}>
          The Seer — UI + Navigation
        </p>
        <p style={{ opacity: 0.4, marginTop: "0.25rem", fontSize: "0.85rem" }}>
          Port 3015 · Vert
        </p>
      </div>

      <PillarDashboard pillar="OCULUS" pillarHex="#22C55E" />
    </div>
  );
}
