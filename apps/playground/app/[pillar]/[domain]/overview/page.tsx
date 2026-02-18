import { loadTopologyData } from "../../../../lib/chronos/load-data";
import type { RepositoryMetadata } from "@dendrovia/shared";
import { OrnateFrame } from "@dendrovia/oculus";

export default async function OverviewPage() {
  const data = await loadTopologyData();
  const topo = data.topology;

  const repo: RepositoryMetadata | null =
    topo?.repository && typeof topo.repository === "object"
      ? (topo.repository as RepositoryMetadata)
      : null;

  const langDist = topo?.languageDistribution ?? [];
  const contribSummary = topo?.contributorSummary;
  const maxLangPct = Math.max(...langDist.map((l) => l.percentage), 1);

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "1rem" }}>📊 Overview</h1>
      <p style={{ opacity: 0.5, marginTop: "0.25rem", fontSize: "0.85rem" }}>
        Repository metadata, language distribution, contributor summary
      </p>

      {/* Repository Metadata */}
      <section style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#c77b3f", marginBottom: "0.75rem" }}>
          Repository Metadata
        </h2>
        {repo ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "0.75rem",
          }}>
            {([
              ["Name", repo.name],
              ["Branch", repo.currentBranch],
              ["Branches", repo.branchCount],
              ["Files", repo.fileCount],
              ["Commits", repo.commitCount],
              ["Contributors", repo.contributorCount],
              ["HEAD", repo.headHash?.slice(0, 8)],
              ["Analyzed", new Date(repo.analyzedAt).toLocaleString()],
            ] as [string, string | number][]).map(([label, value]) => (
              <OrnateFrame key={label} pillar="chronos" variant="compact">
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.4 }}>{label}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "0.25rem" }}>{value}</div>
              </OrnateFrame>
            ))}
          </div>
        ) : (
          <div style={{ opacity: 0.4 }}>
            No repository metadata — run <code>bun run parse</code> to generate enriched data
          </div>
        )}
        {repo?.remoteUrl && repo.remoteUrl !== "unknown" && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", opacity: 0.5, wordBreak: "break-all" }}>
            Remote: {repo.remoteUrl}
          </div>
        )}
      </section>

      {/* Language Distribution */}
      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#c77b3f", marginBottom: "0.75rem" }}>
          Language Distribution
        </h2>
        {langDist.length > 0 ? (
          <OrnateFrame pillar="chronos" variant="panel">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {langDist.map((lang) => (
                <div key={lang.language} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ width: "100px", fontSize: "0.85rem", fontWeight: 500, textAlign: "right" }}>
                    {lang.language}
                  </span>
                  <div style={{ flex: 1, height: "20px", background: "#1a1a1a", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      width: `${(lang.percentage / maxLangPct) * 100}%`,
                      height: "100%",
                      background: "#c77b3f",
                      borderRadius: "4px",
                      minWidth: "2px",
                    }} />
                  </div>
                  <span style={{ width: "60px", fontSize: "0.8rem", opacity: 0.6, textAlign: "right" }}>
                    {lang.percentage}%
                  </span>
                  <span style={{ width: "60px", fontSize: "0.75rem", opacity: 0.4, textAlign: "right" }}>
                    {lang.fileCount} files
                  </span>
                  <span style={{ width: "80px", fontSize: "0.75rem", opacity: 0.4, textAlign: "right" }}>
                    {lang.locTotal.toLocaleString()} LOC
                  </span>
                </div>
              ))}
            </div>
          </OrnateFrame>
        ) : (
          <div style={{ opacity: 0.4 }}>No language distribution data available</div>
        )}
      </section>

      {/* Contributor Summary */}
      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#c77b3f", marginBottom: "0.75rem" }}>
          Contributor Summary
        </h2>
        {contribSummary ? (
          <div>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <OrnateFrame pillar="chronos" variant="compact" style={{ flex: 1 }}>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.4 }}>Total</div>
                <div style={{ fontSize: "1.3rem", fontWeight: 700, marginTop: "0.25rem" }}>{contribSummary.totalContributors}</div>
              </OrnateFrame>
              <OrnateFrame pillar="chronos" variant="compact" style={{ flex: 2 }}>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.4 }}>Top Contributor</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "0.25rem" }}>{contribSummary.topContributor}</div>
              </OrnateFrame>
            </div>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, opacity: 0.6, marginBottom: "0.5rem" }}>Archetype Distribution</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {Object.entries(contribSummary.archetypeDistribution).map(([arch, count]) => (
                <span key={arch} style={{
                  padding: "0.3rem 0.7rem",
                  border: "1px solid #c77b3f44",
                  borderRadius: "12px",
                  fontSize: "0.8rem",
                  color: "#c77b3f",
                }}>
                  {arch}: {count}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ opacity: 0.4 }}>No contributor summary available</div>
        )}
      </section>
    </div>
  );
}
