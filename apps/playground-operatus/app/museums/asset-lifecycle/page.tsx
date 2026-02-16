import Link from "next/link";
import { AssetLifecycleClient } from "./AssetLifecycleClient";

export default function AssetLifecyclePage() {
  return (
    <div>
      <Link href="/museums" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; Museums</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🔄</span> Asset Lifecycle
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Animated flow diagram of the OPERATUS pipeline with live event overlay</p>
      <AssetLifecycleClient />
    </div>
  );
}
