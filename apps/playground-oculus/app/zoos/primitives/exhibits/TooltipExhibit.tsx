'use client';

import { Tooltip } from '@dendrovia/oculus';
import type { ExhibitRenderProps } from '../../_zoo-kit/types';

const POSITIONS = ['top', 'bottom', 'left', 'right'] as const;

const btnStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  border: '1px solid #444',
  borderRadius: '4px',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: '0.8rem',
};

export function TooltipExhibit({ controlValues, isInspecting }: ExhibitRenderProps) {
  const content = controlValues.content as string;
  const position = controlValues.position as (typeof POSITIONS)[number];

  if (isInspecting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Live preview */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
          <Tooltip content={content} position={position}>
            <button type="button" style={btnStyle}>
              Hover me ({position})
            </button>
          </Tooltip>
        </div>

        {/* All 4 positions showcase */}
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          All Positions
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
            padding: '1.5rem 0',
            justifyItems: 'center',
          }}
        >
          {POSITIONS.map((pos) => (
            <Tooltip key={pos} content={`Appears ${pos}`} position={pos}>
              <button type="button" style={btnStyle}>
                {pos}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  // Card preview
  return (
    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', padding: '0.5rem 0' }}>
      <Tooltip content="Tooltip!" position="top">
        <button type="button" style={btnStyle}>
          Hover
        </button>
      </Tooltip>
    </div>
  );
}
