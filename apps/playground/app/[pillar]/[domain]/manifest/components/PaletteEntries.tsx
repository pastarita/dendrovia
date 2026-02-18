'use client';

export function PaletteEntries({ palettes }: { palettes: Record<string, string> }) {
  const entries = Object.entries(palettes);

  return (
    <div style={{ marginBottom: "1rem" }}>
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
        Palettes ({entries.length})
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "0.5rem",
      }}>
        {entries.map(([id, path]) => (
          <div
            key={id}
            style={{
              padding: "0.75rem 1rem",
              border: "1px solid #222",
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{id}</div>
              <div style={{ fontFamily: "var(--font-geist-mono)", fontSize: "0.75rem", opacity: 0.4, marginTop: "0.15rem" }}>{path}</div>
            </div>
            <span style={{
              fontSize: "0.65rem",
              padding: "0.15rem 0.4rem",
              borderRadius: "3px",
              background: "#1e3b1e",
              color: "#86efac",
            }}>
              .json
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
