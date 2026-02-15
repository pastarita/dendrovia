import Link from "next/link";
import { loadTopologyData } from "../../../lib/load-data";

export default async function CouplingsPage() {
  const data = await loadTopologyData();
  const couplings = data.hotspots?.temporalCouplings ?? [];

  const maxStrength = Math.max(...couplings.map((c) => c.strength), 0.001);

  return (
    <div>
      <Link href="/zoos" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; Zoos</Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "1rem" }}>🔗 Temporal Couplings</h1>
      <p style={{ opacity: 0.5, marginTop: "0.25rem", fontSize: "0.85rem" }}>
        {couplings.length} file pairs that frequently change together
      </p>

      {couplings.length === 0 ? (
        <div style={{ marginTop: "2rem", padding: "2rem", border: "1px dashed #333", borderRadius: "8px", textAlign: "center", opacity: 0.4 }}>
          No temporal couplings detected (requires enough co-changing file pairs)
        </div>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "30px 1fr 1fr 80px 80px",
            gap: "0.5rem",
            fontSize: "0.75rem",
            fontWeight: 600,
            opacity: 0.4,
            padding: "0.5rem 0",
            borderBottom: "1px solid #333",
          }}>
            <span>#</span>
            <span>File A</span>
            <span>File B</span>
            <span style={{ textAlign: "right" }}>Co-changes</span>
            <span style={{ textAlign: "right" }}>Strength</span>
          </div>

          {couplings.map((c, i) => {
            const strengthPct = (c.strength / maxStrength) * 100;
            const strengthColor =
              c.strength > 0.7 ? "#ef4444" :
              c.strength > 0.4 ? "#f59e0b" :
              "#c77b3f";

            return (
              <div
                key={`${c.fileA}:${c.fileB}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "30px 1fr 1fr 80px 80px",
                  gap: "0.5rem",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid #1a1a1a",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.75rem", opacity: 0.3 }}>{i + 1}</span>
                <span style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "0.75rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {c.fileA}
                </span>
                <span style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: "0.75rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {c.fileB}
                </span>
                <span style={{ textAlign: "right", fontSize: "0.8rem", opacity: 0.6 }}>
                  {c.coChangeCount}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", justifyContent: "flex-end" }}>
                  <div style={{
                    width: "40px",
                    height: "4px",
                    background: "#1a1a1a",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${strengthPct}%`,
                      height: "100%",
                      background: strengthColor,
                      borderRadius: "2px",
                    }} />
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: strengthColor }}>
                    {c.strength.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
