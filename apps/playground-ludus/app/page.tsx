'use client';

import { PillarDashboard } from '@repo/ui/pillar-dashboard';

export default function LudusDashboard() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{'\u{1F3AE}'}</span>
          <span style={{ color: 'var(--pillar-accent)' }}>LUDUS</span>
        </h1>
        <p style={{ opacity: 0.6, marginTop: '0.5rem', fontSize: '1.1rem' }}>The Gamemaster — Game Mechanics + Rules</p>
        <p style={{ opacity: 0.4, marginTop: '0.25rem', fontSize: '0.85rem' }}>Port 3014 · Gules</p>
      </div>

      <PillarDashboard pillar="LUDUS" pillarHex="#EF4444" />
    </div>
  );
}
