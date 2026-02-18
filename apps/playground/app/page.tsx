"use client";

import { PillarIcon, DendroviaIcon } from "@repo/ui/icons";
import { PILLAR_META } from "@repo/ui/pillar-data";
import type { PillarName } from "@repo/ui/domain-registry";

const PILLARS: PillarName[] = [
  "ARCHITECTUS",
  "CHRONOS",
  "IMAGINARIUM",
  "LUDUS",
  "OCULUS",
  "OPERATUS",
];

export default function PillarPicker() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <DendroviaIcon size={48} />
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            marginTop: "1rem",
            letterSpacing: "-0.02em",
          }}
        >
          Dendrovia Playground
        </h1>
        <p style={{ opacity: 0.5, marginTop: "0.5rem", fontSize: "1.1rem" }}>
          Choose a pillar to explore
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(200px, 280px))",
          gap: "1.25rem",
          maxWidth: "920px",
          width: "100%",
        }}
      >
        {PILLARS.map((name) => {
          const meta = PILLAR_META[name];
          return (
            <a
              key={name}
              href={`/${name.toLowerCase()}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
                padding: "2rem 1.5rem",
                border: `1px solid ${meta.hex}33`,
                borderRadius: "12px",
                background: `${meta.hex}08`,
                transition: "border-color 0.2s, background 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${meta.hex}88`;
                e.currentTarget.style.background = `${meta.hex}15`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${meta.hex}33`;
                e.currentTarget.style.background = `${meta.hex}08`;
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <PillarIcon pillar={name} size={40} />
              <div style={{ fontWeight: 600, fontSize: "1.1rem", color: meta.hex }}>
                {name}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  opacity: 0.5,
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {meta.subtitle}
              </div>
              <div style={{ fontSize: "0.7rem", opacity: 0.3 }}>
                {meta.tincture} · :{meta.port}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
