'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { OrnateFrame, type PillarId, type FrameVariant } from '@dendrovia/oculus';

const VARIANTS: { id: FrameVariant; label: string; desc: string }[] = [
  { id: 'modal', label: 'Modal', desc: 'Largest — corner ornaments + edge ornaments + glow' },
  { id: 'panel', label: 'Panel', desc: 'Standard — corner ornaments + edge ornaments' },
  { id: 'compact', label: 'Compact', desc: 'Tight — small corners, no edges' },
  { id: 'tooltip', label: 'Tooltip', desc: 'Minimal — tiny corners, no edges' },
];

const PILLARS: { id: PillarId; name: string; emoji: string; color: string; tincture: string }[] = [
  { id: 'chronos', name: 'CHRONOS', emoji: '📜', color: '#c77b3f', tincture: 'Amber' },
  { id: 'imaginarium', name: 'IMAGINARIUM', emoji: '🎨', color: '#A855F7', tincture: 'Purpure' },
  { id: 'architectus', name: 'ARCHITECTUS', emoji: '🏛️', color: '#3B82F6', tincture: 'Azure' },
  { id: 'ludus', name: 'LUDUS', emoji: '🎮', color: '#EF4444', tincture: 'Gules' },
  { id: 'oculus', name: 'OCULUS', emoji: '👁️', color: '#22C55E', tincture: 'Vert' },
  { id: 'operatus', name: 'OPERATUS', emoji: '💾', color: '#1F2937', tincture: 'Sable' },
];

export default function FrameMatrixPage() {
  return (
    <div>
      <Link href="/foundry" style={{ fontSize: '0.85rem', opacity: 0.5 }}>&larr; Foundry</Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
        Frame Matrix
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '2rem' }}>
        6 pillars &times; 4 variants — all 24 OrnateFrame combinations
      </p>

      {/* Grid: label column + 4 variant columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px repeat(4, 1fr)',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Header row */}
        <div />
        {VARIANTS.map((v) => (
          <div key={v.id} style={{ textAlign: 'center', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 600 }}>{v.label}</div>
            <div style={{ opacity: 0.4, fontSize: '0.7rem', marginTop: '0.15rem' }}>{v.desc}</div>
          </div>
        ))}

        {/* One row per pillar */}
        {PILLARS.map((p) => (
          <Fragment key={p.id}>
            {/* Row label */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                paddingRight: '0.5rem',
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: p.color }}>
                {p.emoji} {p.name}
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>{p.tincture}</div>
            </div>

            {/* One cell per variant */}
            {VARIANTS.map((v) => (
              <div key={`${p.id}-${v.id}`}>
                <OrnateFrame pillar={p.id} variant={v.id}>
                  <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 600, color: p.color }}>{p.name}</div>
                    <div style={{ opacity: 0.5, fontSize: '0.7rem', marginTop: '0.25rem' }}>{v.label}</div>
                  </div>
                </OrnateFrame>
              </div>
            ))}
          </Fragment>
        ))}
      </div>

      {/* Legend */}
      <div style={{ marginTop: '2.5rem', padding: '1rem', border: '1px solid #222', borderRadius: 8, fontSize: '0.8rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Legend</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', opacity: 0.6 }}>
          <div><strong>Modal / Panel:</strong> Corner + edge ornaments visible</div>
          <div><strong>Compact:</strong> Small corners only, no edge ornaments</div>
          <div><strong>Tooltip:</strong> Minimal corners, no edge ornaments</div>
        </div>
        <div style={{ marginTop: '0.75rem', opacity: 0.4 }}>
          {PILLARS.length} pillars &times; {VARIANTS.length} variants = {PILLARS.length * VARIANTS.length} combinations
        </div>
      </div>
    </div>
  );
}
