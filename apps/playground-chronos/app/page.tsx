'use client';

import { PillarDashboard } from '@repo/ui/pillar-dashboard';

export default function ChronosDashboard() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{'\u{1F4DC}'}</span>
          <span style={{ color: 'var(--pillar-accent)' }}>CHRONOS</span>
        </h1>
        <p style={{ opacity: 0.6, marginTop: '0.5rem', fontSize: '1.1rem' }}>
          The Chronicler — Git History + AST Parsing
        </p>
        <p style={{ opacity: 0.4, marginTop: '0.25rem', fontSize: '0.85rem' }}>Port 3012 · Amber</p>
      </div>

      <PillarDashboard pillar="CHRONOS" pillarHex="#c77b3f" />
    </div>
  );
}
