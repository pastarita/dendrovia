'use client';

import { IconBadge } from '@dendrovia/oculus';
import type { ExhibitRenderProps } from '../../_zoo-kit/types';

const PILLAR_COLORS = [
  { label: 'Oculus', color: '#f5a97f' },
  { label: 'Chronos', color: '#d4a574' },
  { label: 'Architectus', color: '#3B82F6' },
  { label: 'Ludus', color: '#EF4444' },
  { label: 'Imaginarium', color: '#A855F7' },
  { label: 'Operatus', color: '#6B7280' },
];

export function IconBadgeExhibit({ controlValues, isInspecting }: ExhibitRenderProps) {
  const icon = controlValues.icon as string;
  const size = controlValues.size as 'sm' | 'md' | 'lg';
  const color = controlValues.color as string;

  if (isInspecting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Live preview */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <IconBadge icon={icon} label="Preview" size={size} color={color} />
        </div>

        {/* Size comparison row */}
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Size Comparison
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <IconBadge icon={icon} label="sm" size="sm" color={color} />
            <div style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: '0.25rem' }}>sm</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <IconBadge icon={icon} label="md" size="md" color={color} />
            <div style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: '0.25rem' }}>md</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <IconBadge icon={icon} label="lg" size="lg" color={color} />
            <div style={{ fontSize: '0.65rem', opacity: 0.4, marginTop: '0.25rem' }}>lg</div>
          </div>
        </div>

        {/* Pillar colors */}
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Pillar Colors
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {PILLAR_COLORS.map((p) => (
            <div key={p.label} style={{ textAlign: 'center' }}>
              <IconBadge icon={icon} label={p.label} size={size} color={p.color} />
              <div style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: '0.2rem' }}>{p.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Card preview
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
      <IconBadge icon="🗡️" label="Attack" size="md" />
      <IconBadge icon="🛡️" label="Defense" size="md" color="#3b82f6" />
      <IconBadge icon="⚡" label="Speed" size="md" color="#22c55e" />
    </div>
  );
}
