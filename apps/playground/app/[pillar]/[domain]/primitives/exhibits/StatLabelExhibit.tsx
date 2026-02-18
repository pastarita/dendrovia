'use client';

import { StatLabel, Panel } from '@dendrovia/oculus';
import type { ExhibitRenderProps } from '../../_zoo-kit/types';

const COLOR_VARIATIONS = [
  { label: 'Attack', value: 42, color: '#ef4444' },
  { label: 'Defense', value: 28, color: '#3b82f6' },
  { label: 'Speed', value: 15, color: '#22c55e' },
  { label: 'Magic', value: 33, color: '#a855f7' },
  { label: 'Luck', value: 7, color: '#eab308' },
];

export function StatLabelExhibit({ controlValues, isInspecting }: ExhibitRenderProps) {
  const label = controlValues.label as string;
  const value = controlValues.value as string;
  const color = controlValues.color as string;

  if (isInspecting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Live preview */}
        <StatLabel label={label} value={value} color={color} />

        {/* Dense stats panel */}
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Dense Stats Panel
        </div>
        <Panel compact aria-label="Stats" style={{ maxWidth: 220 }}>
          <StatLabel label="Level" value={5} />
          <StatLabel label="HP" value="120 / 120" color="#ef4444" />
          <StatLabel label="MP" value="45 / 50" color="#60a5fa" />
          <StatLabel label="XP" value="650 / 1000" color="#eab308" />
        </Panel>

        {/* Color variations */}
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Color Variations
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {COLOR_VARIATIONS.map((cv) => (
            <StatLabel key={cv.label} label={cv.label} value={cv.value} color={cv.color} />
          ))}
        </div>
      </div>
    );
  }

  // Card preview
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', maxWidth: 160 }}>
      <StatLabel label="Level" value={5} />
      <StatLabel label="Attack" value={42} color="#ef4444" />
      <StatLabel label="Defense" value={28} color="#3b82f6" />
    </div>
  );
}
