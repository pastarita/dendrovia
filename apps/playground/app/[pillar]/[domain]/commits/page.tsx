import { loadTopologyData } from "../../../../lib/chronos/load-data";
import { CommitList } from "./commit-list";

export default async function CommitsPage() {
  const data = await loadTopologyData();
  const commits = data.commits ?? [];

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "1rem" }}>📝 Commits</h1>
      <p style={{ opacity: 0.5, marginTop: "0.25rem", fontSize: "0.85rem" }}>
        {commits.length} commits — with type, scope, confidence badges
      </p>

      <CommitList commits={commits} />
    </div>
  );
}
