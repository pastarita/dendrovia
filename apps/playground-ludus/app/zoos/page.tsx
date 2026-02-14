import Link from "next/link";
import ZooClient from "./ZooClient";

export default function ZoosPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; LUDUS Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🦁</span> Zoos — Mechanic Catalog
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Catalog mode (Z modality) — Browse all spells, monsters, classes, effects, and items.</p>
      <div style={{ marginTop: "1.5rem" }}>
        <ZooClient />
      </div>
    </div>
  );
}
