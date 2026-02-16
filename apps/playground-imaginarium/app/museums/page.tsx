import Link from "next/link";
import MuseumsClient from "./MuseumsClient";

export default function MuseumsPage() {
  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; IMAGINARIUM Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏛️</span> Museums — Procedural Art Exhibitions
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Explore palettes, shaders, pipeline stages, and mycology specimens.</p>
      <div style={{ marginTop: "1.5rem" }}>
        <MuseumsClient />
      </div>
    </div>
  );
}
