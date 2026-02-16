import Link from "next/link";

const PAGES = [
  { name: "Dendrite Observatory", href: "/gyms/dendrite", desc: "Interactive 2D flow visualization of the Dendrovia six-pillar pipeline" },
];

export default function GymsPage() {
  return (
    <div
      style={{
        color: 'var(--foreground, #ededed)',
        fontFamily: 'var(--font-geist-sans), sans-serif',
        padding: '1rem 0',
      }}
    >
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: 'var(--font-geist-mono), monospace', letterSpacing: '0.06em' }}>
        Gyms
      </h1>
      <p style={{ opacity: 0.4, marginTop: "0.35rem", marginBottom: "1.5rem", fontSize: '0.82rem' }}>
        Interactive sandbox (G modality) — Explore the Dendrovia pipeline
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            style={{
              display: "block",
              padding: "1.25rem",
              border: "1px solid rgba(245, 169, 127, 0.15)",
              borderRadius: "10px",
              background: "rgba(20, 20, 20, 0.4)",
              backdropFilter: "blur(8px)",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{p.name}</div>
            <div style={{ fontSize: "0.82rem", opacity: 0.5 }}>{p.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
