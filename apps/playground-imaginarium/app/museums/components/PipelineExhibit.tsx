'use client';

import { OrnateFrame } from '@dendrovia/oculus';
import { PIPELINE_STAGES } from '../museum-fixtures';

export default function PipelineExhibit() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {PIPELINE_STAGES.map((stage, i) => (
        <div key={stage.name} style={{ width: '100%', maxWidth: 600 }}>
          {/* Connecting line from previous stage */}
          {i > 0 && (
            <div
              style={{
                width: 2,
                height: 32,
                background: 'var(--pillar-accent)',
                opacity: 0.2,
                margin: '0 auto',
              }}
            />
          )}

          {/* Stage card */}
          <OrnateFrame
            pillar="imaginarium"
            variant="compact"
            style={{
              background: '#111',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{stage.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>{stage.name}</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                  background: '#222',
                  opacity: 0.6,
                  marginLeft: 'auto',
                }}
              >
                {i + 1}/{PIPELINE_STAGES.length}
              </span>
            </div>

            {/* Input -> Output */}
            <div
              style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '0.75rem',
                marginBottom: '0.5rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#888' }}>{stage.input}</span>
              <span style={{ color: 'var(--pillar-accent)' }}>{'\u2192'}</span>
              <span style={{ color: '#ededed' }}>{stage.output}</span>
            </div>

            {/* Description */}
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6, lineHeight: 1.5 }}>
              {stage.description}
            </p>
          </OrnateFrame>
        </div>
      ))}
    </div>
  );
}
