import Link from "next/link";
import HallsClient from "./HallsClient";

export default function HallsPage(): React.JSX.Element {
  return (
    <div>
      <Link href="/" style={{ fontSize: "0.85rem", opacity: 0.5 }}>&larr; LUDUS Dashboard</Link>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏰</span> Halls — Reference Documentation
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Combat rules, elements, class guides, and monster reference.</p>
      <div style={{ marginTop: "1.5rem" }}>
        <HallsClient />
      </div>
    </div>
  );
}
