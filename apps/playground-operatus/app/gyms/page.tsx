import Link from "next/link";

const PAGES = [
  {
    name: "Cache Inspector",
    href: "/gyms/cache-inspector",
    desc: "Live view of all cached entries across memory, OPFS, and IndexedDB tiers",
    icon: "🔍",
  },
  {
    name: "Persistence Sandbox",
    href: "/gyms/persistence-sandbox",
    desc: "Full save/load/export/import cycle with live state inspection",
    icon: "💾",
  },
  {
    name: "Event Stream",
    href: "/gyms/event-stream",
    desc: "Real-time scrolling log of all EventBus emissions across pillars",
    icon: "📡",
  },
  {
    name: "Dendrite Observatory",
    href: "/gyms/dendrite",
    desc: "Interactive 2D flow visualization of the OPERATUS pipeline",
    icon: "🌿",
  },
];

export default function GymsPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; OPERATUS Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏋️</span> Gyms
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Interactive sandbox (G modality) — Live infrastructure experimentation</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
          marginTop: "2rem",
        }}
      >
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
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{p.icon}</div>
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{p.name}</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.5 }}>{p.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
