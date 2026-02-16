'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { OrnateFrame, FRAME_REGISTRY, type FrameVariant } from '@dendrovia/oculus';

const { pillars, variants } = FRAME_REGISTRY;
const pillarList = Object.values(pillars);
const variantEntries = Object.entries(variants) as [FrameVariant, (typeof variants)[FrameVariant]][];

export default function FrameMatrixPage() {
  return (
    <div>
      <Link href="/foundry" style={{ fontSize: '0.85rem', opacity: 0.5 }}>&larr; Foundry</Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
        Frame Matrix
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '2rem' }}>
        {pillarList.length} pillars &times; {variantEntries.length} variants — all {FRAME_REGISTRY.totalCombinations} OrnateFrame combinations
      </p>

      {/* Grid: label column + variant columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `140px repeat(${variantEntries.length}, 1fr)`,
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Header row */}
        <div />
        {variantEntries.map(([id, spec]) => (
          <div key={id} style={{ textAlign: 'center', fontSize: '0.8rem' }}>
            <div style={{ fontWeight: 600 }}>{id.charAt(0).toUpperCase() + id.slice(1)}</div>
            <div style={{ opacity: 0.4, fontSize: '0.7rem', marginTop: '0.15rem' }}>{spec.description}</div>
          </div>
        ))}

        {/* One row per pillar */}
        {pillarList.map((p) => (
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
            {variantEntries.map(([vId]) => (
              <div key={`${p.id}-${vId}`}>
                <OrnateFrame pillar={p.id} variant={vId}>
                  <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 600, color: p.color }}>{p.name}</div>
                    <div style={{ opacity: 0.5, fontSize: '0.7rem', marginTop: '0.25rem' }}>
                      {vId.charAt(0).toUpperCase() + vId.slice(1)}
                    </div>
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
          {pillarList.length} pillars &times; {variantEntries.length} variants = {FRAME_REGISTRY.totalCombinations} combinations
        </div>
      </div>
    </div>
  );
}
