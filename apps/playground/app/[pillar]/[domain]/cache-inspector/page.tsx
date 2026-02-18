import { CacheInspectorClient } from "./CacheInspectorClient";

export default function CacheInspectorPage() {
  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🔍</span> Cache Inspector
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Live view of all cached entries across tiers</p>
      <CacheInspectorClient />
    </div>
  );
}
