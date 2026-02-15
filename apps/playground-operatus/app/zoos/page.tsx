import Link from "next/link";

const PAGES = [
  {
    name: "Manifest Catalog",
    href: "/zoos/manifest",
    desc: "Browsable catalog of manifest.json entries — shaders, palettes, meshes, mycology",
    icon: "📋",
  },
];

export default function ZoosPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; OPERATUS Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🦁</span> Zoos
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Catalog mode (Z modality) — Asset &amp; config catalogs</p>

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
