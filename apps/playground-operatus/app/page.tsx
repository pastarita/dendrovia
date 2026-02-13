export default function OperatusDashboard() {
  const DOMAINS = [
    { name: "Museums", href: "/museums", icon: "🏛️", desc: "Exhibition mode — infrastructure exhibitions" },
    { name: "Zoos", href: "/zoos", icon: "🦁", desc: "Catalog mode — asset & config catalogs" },
    { name: "Halls", href: "/halls", icon: "🏰", desc: "Reference mode — infrastructure docs" },
    { name: "Gyms", href: "/gyms", icon: "🏋️", desc: "Interactive sandbox — live infrastructure experimentation" },
    { name: "Generators", href: "/generators", icon: "⚡", desc: "Creation tools — manifest & config generators" },
    { name: "Spatial Docs", href: "/spatial-docs", icon: "📐", desc: "Documentation surfaces — OPERATUS API reference" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>💾</span>
          <span style={{ color: "var(--pillar-accent)" }}>OPERATUS</span>
        </h1>
        <p style={{ opacity: 0.6, marginTop: "0.5rem", fontSize: "1.1rem" }}>
          The Keeper — Infrastructure + Persistence
        </p>
        <p style={{ opacity: 0.4, marginTop: "0.25rem", fontSize: "0.85rem" }}>
          Port 3015 · Sable · GMZ: G Z
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {DOMAINS.map((d) => (
          <a
            key={d.href}
            href={d.href}
            style={{
              display: "block",
              padding: "1.25rem",
              border: "1px solid #222",
              borderRadius: "8px",
              transition: "border-color 0.2s",
            }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{d.icon}</div>
            <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{d.name}</div>
            <div style={{ fontSize: "0.85rem", opacity: 0.5 }}>{d.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
