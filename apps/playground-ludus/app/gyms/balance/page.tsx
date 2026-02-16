import Link from "next/link";
import BalanceSimClient from "./BalanceSimClient";

export default function BalancePage(): React.JSX.Element {
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', opacity: 0.5, marginBottom: '0.5rem' }}>
        <Link href="/">&larr; Dashboard</Link>
        <span>/</span>
        <Link href="/gyms">Gyms</Link>
        <span>/</span>
        <span>Balance</span>
      </div>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span>🏋️</span> Balance Simulator
      </h1>
      <p style={{ opacity: 0.5, marginTop: "0.5rem" }}>Monte Carlo matchup analysis — Run N trials across all class/monster pairings.</p>
      <div style={{ marginTop: "1.5rem" }}>
        <BalanceSimClient />
      </div>
    </div>
  );
}
