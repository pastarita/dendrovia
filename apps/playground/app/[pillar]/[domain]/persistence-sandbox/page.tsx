import { PersistenceSandboxClient } from "./PersistenceSandboxClient";

export default function PersistenceSandboxPage() {
  return (
    <div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>💾</span> Persistence Sandbox
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Save/load/export/import cycle with live state inspection</p>
      <PersistenceSandboxClient />
    </div>
  );
}
