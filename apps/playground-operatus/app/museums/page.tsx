import Link from "next/link";

const PAGES = [
  {
    name: "Asset Lifecycle",
    href: "/museums/asset-lifecycle",
    desc: "Animated flow diagram of the OPERATUS pipeline with live event overlay",
    icon: "🔄",
  },
];

export default function MuseumsPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; OPERATUS Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏛️</span> Museums
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Exhibition mode (M modality) — Infrastructure exhibitions</p>

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
