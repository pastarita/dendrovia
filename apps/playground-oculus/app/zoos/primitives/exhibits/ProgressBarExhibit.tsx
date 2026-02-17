'use client';

import { ProgressBar } from '@dendrovia/oculus';
import type { ExhibitRenderProps } from '../../_zoo-kit/types';

const VARIANTS = ['health', 'mana', 'xp', 'quest', 'custom'] as const;

export function ProgressBarExhibit({ controlValues, isInspecting }: ExhibitRenderProps) {
  const value = controlValues.value as number;
  const max = controlValues.max as number;
  const variant = controlValues.variant as string;
  const height = controlValues.height as number;
  const flash = controlValues.flash as boolean;

  if (isInspecting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Live preview */}
        <ProgressBar
          value={value}
          max={max}
          variant={variant as (typeof VARIANTS)[number]}
          showLabel
          height={height}
          flash={flash}
        />

        {/* All 5 variants */}
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          All Variants
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {VARIANTS.map((v) => (
            <div key={v}>
              <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.2rem' }}>{v}</div>
              <ProgressBar value={65} max={100} variant={v} showLabel height={height} />
            </div>
          ))}
        </div>

        {/* Edge cases */}
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Edge Cases
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.2rem' }}>0%</div>
            <ProgressBar value={0} max={100} variant="health" showLabel height={height} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.2rem' }}>100%</div>
            <ProgressBar value={100} max={100} variant="health" showLabel height={height} />
          </div>
        </div>
      </div>
    );
  }

  // Card preview: stacked bars
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <ProgressBar value={75} max={100} variant="health" showLabel height={6} />
      <ProgressBar value={40} max={50} variant="mana" showLabel height={6} />
      <ProgressBar value={65} max={100} variant="xp" showLabel height={6} />
    </div>
  );
}
