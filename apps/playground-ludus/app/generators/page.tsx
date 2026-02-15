import Link from "next/link";
import GeneratorsClient from "./GeneratorsClient";

export default function GeneratorsPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; LUDUS Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>⚡</span> Generators — Creation Tools
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Generate spells, monsters, quests, and encounters from LUDUS systems.</p>
      <div style={{ marginTop: "1.5rem" }}>
        <GeneratorsClient />
      </div>
    </div>
  );
}
