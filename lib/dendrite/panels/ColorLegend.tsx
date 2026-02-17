'use client';

import type { StoreApi } from 'zustand';
import { useStore } from 'zustand';
import { DT, FIDELITY_COLORS, PILLAR_COLORS, RUNTIME_HEALTH_COLORS, STATUS_COLORS } from '../design-tokens';
import type { ColorMode, DendriteState } from '../types';

// ---------------------------------------------------------------------------
// Legend entries per color mode
// ---------------------------------------------------------------------------

function getStatusEntries() {
  return (Object.entries(STATUS_COLORS) as [string, { fill: string }][]).map(([key, val]) => ({
    label: key,
    color: val.fill,
  }));
}

function getDomainEntries() {
  return (Object.entries(PILLAR_COLORS) as [string, { fill: string }][]).map(([key, val]) => ({
    label: key,
    color: val.fill,
  }));
}

function getFidelityEntries() {
  return (Object.entries(FIDELITY_COLORS) as [string, { fill: string }][]).map(([key, val]) => ({
    label: key,
    color: val.fill,
  }));
}

function getRuntimeEntries() {
  return (Object.entries(RUNTIME_HEALTH_COLORS) as [string, { fill: string }][]).map(([key, val]) => ({
    label: key,
    color: val.fill,
  }));
}

const ENTRIES: Record<ColorMode, () => { label: string; color: string }[]> = {
  status: getStatusEntries,
  domain: getDomainEntries,
  fidelity: getFidelityEntries,
  runtime: getRuntimeEntries,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ColorLegendProps {
  store: StoreApi<DendriteState>;
}

export function ColorLegend({ store }: ColorLegendProps) {
  const colorMode = useStore(store, (s) => s.colorMode);
  const entries = ENTRIES[colorMode]();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: DT.panel,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: DT.panelBorder,
        borderRadius: '6px',
        padding: '0.5rem 0.65rem',
        fontSize: '0.68rem',
        color: DT.textMuted,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
        maxHeight: '200px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: '0.7rem',
          color: DT.text,
          marginBottom: '0.15rem',
          textTransform: 'capitalize',
        }}
      >
        {colorMode}
      </div>
      {entries.map((e) => (
        <div key={e.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: e.color,
              flexShrink: 0,
            }}
          />
          <span>{e.label}</span>
        </div>
      ))}
    </div>
  );
}
