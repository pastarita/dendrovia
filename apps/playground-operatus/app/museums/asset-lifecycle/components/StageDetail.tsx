'use client';

import { OrnateFrame } from '@dendrovia/oculus';
import type { Stage } from '../AssetLifecycleClient';

export function StageDetail({ stage, onClose }: { stage: Stage; onClose: () => void }) {
  return (
    <OrnateFrame pillar="operatus" variant="panel" style={{ marginTop: '1.5rem', position: 'relative' }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          background: 'none',
          border: '1px solid #333',
          borderRadius: '4px',
          color: '#ededed',
          padding: '0.15rem 0.4rem',
          cursor: 'pointer',
          fontSize: '0.75rem',
        }}
      >
        Close
      </button>

      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{stage.label}</h3>
      <span
        style={{
          fontSize: '0.65rem',
          padding: '0.1rem 0.4rem',
          borderRadius: '3px',
          background: stage.track === 'asset' ? '#1e3a5f' : '#1F2937',
          color: stage.track === 'asset' ? '#93c5fd' : '#9ca3af',
        }}
      >
        {stage.track === 'asset' ? 'Asset Track' : 'Persist Track'}
      </span>

      <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', opacity: 0.7 }}>{stage.description}</p>

      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.4, marginBottom: '0.25rem' }}>
          API Method
        </div>
        <code
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.85rem',
            padding: '0.25rem 0.5rem',
            background: '#0a0a0a',
            borderRadius: '4px',
            color: '#86efac',
          }}
        >
          {stage.api}
        </code>
      </div>
    </OrnateFrame>
  );
}
