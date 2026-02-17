'use client';

import { Panel } from '@dendrovia/oculus';
import type { ExhibitRenderProps } from '../../_zoo-kit/types';

export function PanelExhibit({ controlValues, isInspecting }: ExhibitRenderProps) {
  const compact = controlValues.compact as boolean;
  const glow = controlValues.glow as boolean;
  const noPadding = controlValues.noPadding as boolean;

  if (isInspecting) {
    // Full inspector view: live preview + 2x2 boolean combination grid
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Live preview with current controls */}
        <Panel compact={compact} glow={glow} noPadding={noPadding} aria-label="Controlled panel">
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Panel with current settings</p>
        </Panel>

        {/* 2x2 boolean combination grid */}
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Boolean Combinations
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <Panel aria-label="Default">
            <p style={{ margin: 0, fontSize: '0.75rem' }}>default</p>
          </Panel>
          <Panel compact aria-label="Compact">
            <p style={{ margin: 0, fontSize: '0.75rem' }}>compact</p>
          </Panel>
          <Panel glow aria-label="Glow">
            <p style={{ margin: 0, fontSize: '0.75rem' }}>glow</p>
          </Panel>
          <Panel compact glow aria-label="Compact + Glow">
            <p style={{ margin: 0, fontSize: '0.75rem' }}>compact + glow</p>
          </Panel>
        </div>
      </div>
    );
  }

  // Card preview
  return (
    <Panel compact={compact} glow={glow} noPadding={noPadding} aria-label="Preview panel">
      <p style={{ margin: 0, fontSize: '0.8rem' }}>Glass-morphism container</p>
    </Panel>
  );
}
