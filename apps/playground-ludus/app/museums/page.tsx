import Link from "next/link";
import MuseumsClient from "./MuseumsClient";

export default function MuseumsPage(): React.JSX.Element {
  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; LUDUS Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏛️</span> Museums — Game Design Exhibitions
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Explore stats, formulas, progression curves, and balance analysis.</p>
      <div style={{ marginTop: "1.5rem" }}>
        <MuseumsClient />
      </div>
    </div>
  );
}
