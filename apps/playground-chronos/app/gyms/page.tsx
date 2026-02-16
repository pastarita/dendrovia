import Link from "next/link";
import AnalyzeClient from "./AnalyzeClient";

export default function GymsPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; CHRONOS Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏋️</span> Gyms — Analysis Pipeline
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>
        Interactive sandbox (G modality) — Analyze any public GitHub repository
      </p>

      <div style={{ marginTop: "1.5rem" }}>
        <AnalyzeClient />
      </div>
    </div>
  );
}
