import { loadTopologyData } from "../../../../lib/chronos/load-data";

const ARCHETYPE_EMOJI: Record<string, string> = {
  guardian: "🛡️",
  healer: "💚",
  striker: "⚔️",
  sage: "📚",
  ranger: "🏹",
  artificer: "🔧",
  berserker: "💥",
  adventurer: "🗺️",
};

export default async function ContributorsPage() {
  const data = await loadTopologyData();
  const contributors = data.contributors?.contributors ?? [];

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "1rem" }}>🧙 Contributors</h1>
      <p style={{ opacity: 0.5, marginTop: "0.25rem", fontSize: "0.85rem" }}>
        {contributors.length} NPC profiles with archetype classifications
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "1rem",
        marginTop: "1.5rem",
      }}>
        {contributors.map((c) => (
          <div
            key={c.name}
            style={{
              padding: "1.25rem",
              border: "1px solid #333",
              borderRadius: "8px",
              background: "#111",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.5rem" }}>{ARCHETYPE_EMOJI[c.archetype] || "🧙"}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.5 }}>
                  {c.archetype} / {c.characterClass} / {c.timeArchetype}
                </div>
              </div>
              <span style={{
                marginLeft: "auto",
                fontSize: "0.8rem",
                padding: "0.2rem 0.5rem",
                borderRadius: "10px",
                background: "#c77b3f22",
                color: "#c77b3f",
                fontWeight: 600,
              }}>
                {c.commitCount} commits
              </span>
            </div>

            {/* Stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.3rem",
              fontSize: "0.75rem",
              opacity: 0.6,
              marginBottom: "0.75rem",
            }}>
              <span>Files touched: {c.uniqueFilesTouched}</span>
              <span>Peak hour: {c.peakHour}:00</span>
              <span>First: {new Date(c.firstCommit).toLocaleDateString()}</span>
              <span>Last: {new Date(c.lastCommit).toLocaleDateString()}</span>
            </div>

            {/* Facets */}
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.4, marginBottom: "0.4rem" }}>Facets</div>
              {Object.entries(c.facets).map(([facet, value]) => (
                <div key={facet} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                  <span style={{ width: "90px", fontSize: "0.75rem", opacity: 0.5, textTransform: "capitalize" }}>
                    {facet}
                  </span>
                  <div style={{ flex: 1, height: "6px", background: "#1a1a1a", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      width: `${value}%`,
                      height: "100%",
                      background: "#c77b3f",
                      borderRadius: "3px",
                    }} />
                  </div>
                  <span style={{ width: "30px", fontSize: "0.7rem", textAlign: "right", opacity: 0.4 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Type Distribution */}
            {c.typeDistribution && Object.keys(c.typeDistribution).length > 0 && (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.4, marginBottom: "0.3rem" }}>Commit Types</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                  {Object.entries(c.typeDistribution)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([type, count]) => (
                      <span key={type} style={{
                        fontSize: "0.65rem",
                        padding: "0.1rem 0.35rem",
                        borderRadius: "6px",
                        background: "#222",
                        opacity: 0.7,
                      }}>
                        {type}: {count as number}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
