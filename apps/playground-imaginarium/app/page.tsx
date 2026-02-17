'use client';

import { PillarDashboard } from '@repo/ui/pillar-dashboard';

export default function ImaginariumDashboard() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{'\u{1F3A8}'}</span>
          <span style={{ color: 'var(--pillar-accent)' }}>IMAGINARIUM</span>
        </h1>
        <p style={{ opacity: 0.6, marginTop: '0.5rem', fontSize: '1.1rem' }}>
          The Artificer — Procedural Art Generation
        </p>
        <p style={{ opacity: 0.4, marginTop: '0.25rem', fontSize: '0.85rem' }}>Port 3013 · Purpure</p>
      </div>

      <PillarDashboard pillar="IMAGINARIUM" pillarHex="#A855F7" />
    </div>
  );
}
