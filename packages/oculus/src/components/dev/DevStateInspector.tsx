'use client';

/**
 * DevStateInspector — Live Zustand key-value display
 *
 * Shows live state from both useOculusStore and usePanelStore.
 */

import React, { useState } from 'react';
import { useOculusStore } from '../../store/useOculusStore';
import { usePanelStore } from '../../store/usePanelStore';
import { ManagedPanel } from '../ManagedPanel';

type StoreTab = 'oculus' | 'panels';

function formatValue(val: unknown): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'boolean' || typeof val === 'number') return String(val);
  if (Array.isArray(val)) return `[${val.length}]`;
  if (typeof val === 'object') {
    const keys = Object.keys(val as Record<string, unknown>);
    return `{${keys.length}}`;
  }
  return String(val);
}

function StateEntries({ entries }: { entries: [string, unknown][] }) {
  return (
    <div style={{ fontFamily: 'var(--oculus-font-code)', fontSize: 'var(--oculus-font-xs)' }}>
      {entries.map(([key, val]) => (
        <div
          key={key}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '2px 0',
            borderBottom: '1px solid rgba(255,255,255,0.03)',
          }}
        >
          <span style={{ color: 'var(--oculus-mana)' }}>{key}</span>
          <span style={{ color: 'var(--oculus-text-muted)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {formatValue(val)}
          </span>
        </div>
      ))}
    </div>
  );
}

function DevStateInspectorContent() {
  const [tab, setTab] = useState<StoreTab>('oculus');

  // Subscribe to full store state for live updates
  const oculusState = useOculusStore((s) => s);
  const panelState = usePanelStore((s) => s);

  const oculusEntries = Object.entries(oculusState).filter(
    ([, v]) => typeof v !== 'function',
  );
  const panelEntries = Object.entries(panelState).filter(
    ([, v]) => typeof v !== 'function',
  );

  const entries = tab === 'oculus' ? oculusEntries : panelEntries;

  return (
    <div style={{ fontSize: 'var(--oculus-font-xs)' }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 'var(--oculus-space-xs)', marginBottom: 'var(--oculus-space-sm)' }}>
        <button
          className={`oculus-button ${tab === 'oculus' ? 'oculus-button--primary' : ''}`}
          onClick={() => setTab('oculus')}
          style={{ flex: 1 }}
        >
          Oculus ({oculusEntries.length})
        </button>
        <button
          className={`oculus-button ${tab === 'panels' ? 'oculus-button--primary' : ''}`}
          onClick={() => setTab('panels')}
          style={{ flex: 1 }}
        >
          Panels ({panelEntries.length})
        </button>
      </div>

      <StateEntries entries={entries} />
    </div>
  );
}

export function DevStateInspector() {
  return (
    <ManagedPanel panelId="state-inspector">
      <DevStateInspectorContent />
    </ManagedPanel>
  );
}
