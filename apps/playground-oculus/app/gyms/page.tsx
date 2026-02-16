import Link from "next/link";

const PAGES = [
  { name: "Dendrite Observatory", href: "/gyms/dendrite", desc: "Interactive 2D flow visualization of the OCULUS pipeline" },
  { name: "HUD Sandbox", href: "/gyms/hud-sandbox", desc: "Sliders and buttons fire real EventBus events — watch the HUD respond" },
  { name: "Battle Arena", href: "/gyms/battle-arena", desc: "Start mock combat, cast spells, watch battle log populate, experience victory/defeat" },
];

export default function GymsPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; OCULUS Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏋️</span> Gyms
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem", marginBottom: "2rem" }}>
        Interactive sandbox (G modality) — Live manipulation of OCULUS component state
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            style={{
              display: "block",
              padding: "1.25rem",
              border: "1px solid #222",
              borderRadius: "8px",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{p.name}</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.5 }}>{p.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
