export default function ChronosDashboard() {
  const DOMAINS = [
    { name: "Museums", href: "/museums", icon: "🏛️", desc: "Exhibition mode — historical commit exhibitions" },
    { name: "Zoos", href: "/zoos", icon: "🦁", desc: "Catalog mode — parsed artifact catalogs" },
    { name: "Halls", href: "/halls", icon: "🏰", desc: "Reference mode — parser pipeline docs" },
    { name: "Gyms", href: "/gyms", icon: "🏋️", desc: "Interactive sandbox — live parsing experiments" },
    { name: "Generators", href: "/generators", icon: "⚡", desc: "Creation tools — timeline generators" },
    { name: "Spatial Docs", href: "/spatial-docs", icon: "📐", desc: "Documentation surfaces — CHRONOS API reference" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>📜</span>
          <span style={{ color: "var(--pillar-accent)" }}>CHRONOS</span>
        </h1>
        <p style={{ opacity: 0.6, marginTop: "0.5rem", fontSize: "1.1rem" }}>
          The Chronicler — Git History + AST Parsing
        </p>
        <p style={{ opacity: 0.4, marginTop: "0.25rem", fontSize: "0.85rem" }}>
          Port 3011 · Amber · GMZ: M Z
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
