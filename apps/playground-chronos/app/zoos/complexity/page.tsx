import Link from "next/link";
import { loadTopologyData } from "../../../lib/load-data";
import { ComplexityDrilldown } from "./complexity-drilldown";

export default async function ComplexityPage() {
  const data = await loadTopologyData();
  const files = data.complexity?.files ?? [];

  const totalFunctions = files.reduce((s, f) => s + f.functions.length, 0);

  return (
    <div>
      <Link href="/zoos" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; Zoos</Link>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "1rem" }}>🧬 Complexity</h1>
      <p style={{ opacity: 0.5, marginTop: "0.25rem", fontSize: "0.85rem" }}>
        {files.length} files with complexity data, {totalFunctions} functions analyzed
      </p>

      <ComplexityDrilldown files={files} />
    </div>
  );
}
