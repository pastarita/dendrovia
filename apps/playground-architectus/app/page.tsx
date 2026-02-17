'use client';

import { PillarDashboard } from '@repo/ui/pillar-dashboard';

export default function ArchitectusDashboard() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>{'\u{1F3DB}\uFE0F'}</span>
          <span style={{ color: 'var(--pillar-accent)' }}>ARCHITECTUS</span>
        </h1>
        <p style={{ opacity: 0.6, marginTop: '0.5rem', fontSize: '1.1rem' }}>The Renderer — 3D Rendering Engine</p>
        <p style={{ opacity: 0.4, marginTop: '0.25rem', fontSize: '0.85rem' }}>Port 3011 · Azure</p>
      </div>

      <PillarDashboard pillar="ARCHITECTUS" pillarHex="#3B82F6" />
    </div>
  );
}
