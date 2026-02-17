'use client';

import type { FrameVariant, PillarId } from '@dendrovia/oculus';
import { OrnateFrame } from '@dendrovia/oculus';
import type { ExhibitRenderProps } from '../../_zoo-kit/types';

const PILLARS: PillarId[] = ['oculus', 'chronos', 'architectus', 'ludus', 'imaginarium', 'operatus'];
const VARIANTS: FrameVariant[] = ['modal', 'panel', 'compact', 'tooltip'];

const PILLAR_LABELS: Record<PillarId, string> = {
  oculus: 'Oculus',
  chronos: 'Chronos',
  architectus: 'Architectus',
  ludus: 'Ludus',
  imaginarium: 'Imaginarium',
  operatus: 'Operatus',
};

const PILLAR_EMOJIS: Record<PillarId, string> = {
  oculus: '👁️',
  chronos: '⏳',
  architectus: '🏗️',
  ludus: '🎮',
  imaginarium: '🎨',
  operatus: '⚙️',
};

export function OrnateFrameExhibit({ controlValues, isInspecting }: ExhibitRenderProps) {
  const pillar = controlValues.pillar as PillarId;
  const variant = controlValues.variant as FrameVariant;
  const header = controlValues.header as string;

  if (isInspecting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Live preview */}
        <OrnateFrame
          pillar={pillar}
          variant={variant}
          header={variant === 'modal' ? header : undefined}
          headerIcon={variant === 'modal' ? PILLAR_EMOJIS[pillar] : undefined}
        >
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {PILLAR_EMOJIS[pillar]} {PILLAR_LABELS[pillar]} — {variant}
          </p>
        </OrnateFrame>

        {/* 6x4 pillar x variant mini-matrix */}
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pillar &times; Variant Matrix
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.4rem',
          }}
        >
          {/* Column headers */}
          {VARIANTS.map((v) => (
            <div
              key={`h-${v}`}
              style={{ textAlign: 'center', fontSize: '0.6rem', opacity: 0.5, paddingBottom: '0.2rem' }}
            >
              {v}
            </div>
          ))}

          {/* Matrix cells */}
          {PILLARS.map((p) =>
            VARIANTS.map((v) => (
              <OrnateFrame
                key={`${p}-${v}`}
                pillar={p}
                variant={v}
                header={v === 'modal' ? PILLAR_LABELS[p] : undefined}
                headerIcon={v === 'modal' ? PILLAR_EMOJIS[p] : undefined}
              >
                <div style={{ fontSize: '0.55rem', textAlign: 'center', opacity: 0.7 }}>{PILLAR_EMOJIS[p]}</div>
              </OrnateFrame>
            )),
          )}
        </div>
      </div>
    );
  }

  // Card preview
  return (
    <OrnateFrame pillar={pillar} variant="compact">
      <p style={{ margin: 0, fontSize: '0.75rem', textAlign: 'center' }}>
        {PILLAR_EMOJIS[pillar]} {PILLAR_LABELS[pillar]}
      </p>
    </OrnateFrame>
  );
}
