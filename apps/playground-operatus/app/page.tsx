'use client';

import { PillarDashboard } from '@repo/ui/pillar-dashboard';

export default function OperatusDashboard() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{'\u{1F4BE}'}</span>
          <span style={{ color: 'var(--pillar-accent)' }}>OPERATUS</span>
        </h1>
        <p style={{ opacity: 0.6, marginTop: '0.5rem', fontSize: '1.1rem' }}>
          The Keeper — Infrastructure + Persistence
        </p>
        <p style={{ opacity: 0.4, marginTop: '0.25rem', fontSize: '0.85rem' }}>Port 3016 · Sable</p>
      </div>

      <PillarDashboard pillar="OPERATUS" pillarHex="#6B7280" />
    </div>
  );
}
