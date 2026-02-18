'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { PillarId, FrameVariant } from '@dendrovia/oculus';
import { ALL_SPECIMENS, PILLAR_LABELS, PILLAR_EMOJIS } from './mock-upstream';
import { FrameSpecimen } from './FrameSpecimen';

const PILLARS: PillarId[] = ['chronos', 'imaginarium', 'architectus', 'ludus', 'oculus', 'operatus'];
const VARIANTS: FrameVariant[] = ['modal', 'panel', 'compact', 'tooltip'];

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '0.4rem 0.75rem',
  borderRadius: '6px',
  border: active ? '1px solid rgba(245,169,127,0.6)' : '1px solid #333',
  background: active ? 'rgba(245,169,127,0.15)' : 'transparent',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontWeight: active ? 600 : 400,
  transition: 'all 0.2s',
});

export function FrameZooClient() {
  const [pillarFilter, setPillarFilter] = useState<PillarId | 'all'>('all');
  const [variantFilter, setVariantFilter] = useState<FrameVariant | 'all'>('all');

  const filtered = useMemo(() => {
    return ALL_SPECIMENS.filter((s) => {
      if (pillarFilter !== 'all' && s.pillar !== pillarFilter) return false;
      if (variantFilter !== 'all' && s.variant !== variantFilter) return false;
      return true;
    });
  }, [pillarFilter, variantFilter]);

  return (
    <div>
      <Link href="/" style={{ fontSize: '0.85rem', opacity: 0.5 }}>&larr; OCULUS</Link>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>{'\u{1F5BC}'}</span> Ornate Frames
      </h1>
      <p style={{ opacity: 0.5, marginTop: '0.5rem', marginBottom: '1.5rem' }}>
        Every OrnateFrame pillar &times; variant with upstream data specimens from @dendrovia/shared
      </p>

      {/* Pillar tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
        <button
          type="button"
          style={tabStyle(pillarFilter === 'all')}
          onClick={() => setPillarFilter('all')}
        >
          All
        </button>
        {PILLARS.map((p) => (
          <button
            key={p}
            type="button"
            style={tabStyle(pillarFilter === p)}
            onClick={() => setPillarFilter(p)}
          >
            {PILLAR_EMOJIS[p]} {PILLAR_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Variant filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <button
          type="button"
          style={tabStyle(variantFilter === 'all')}
          onClick={() => setVariantFilter('all')}
        >
          All
        </button>
        {VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            style={tabStyle(variantFilter === v)}
            onClick={() => setVariantFilter(v)}
          >
            {v}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.4 }}>
          {filtered.length} specimen{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Dense grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
      }}>
        {filtered.map((specimen) => (
          <FrameSpecimen key={specimen.id} specimen={specimen} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.4 }}>
          No specimens match the current filters
        </div>
      )}
    </div>
  );
}
