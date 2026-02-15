import Link from "next/link";
import GymClient from "./GymClient";

export default function GymsPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; LUDUS Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏋️</span> Gyms — Combat Sandbox
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Interactive sandbox (G modality) — Pick a class, pick an enemy, fight.</p>
      <div style={{ marginTop: "1.5rem" }}>
        <GymClient />
      </div>
    </div>
  );
}
