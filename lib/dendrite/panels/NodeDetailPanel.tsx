'use client';

import type { StoreApi } from 'zustand';
import { useStore } from 'zustand';
import { DT, PILLAR_COLORS, STATUS_COLORS } from '../design-tokens';
import type { RuntimeStoreState } from '../store/runtime-store';
import type { DendriteState, SourceNode } from '../types';
import { LiveMetricsSection } from './LiveMetricsSection';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  width: 280,
  height: '100%',
  backgroundColor: DT.panel,
  borderLeftWidth: '1px',
  borderLeftStyle: 'solid',
  borderLeftColor: DT.panelBorder,
  padding: '1rem',
  overflowY: 'auto',
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  fontSize: '0.78rem',
  color: DT.text,
};

const closeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 10,
  background: 'none',
  border: 'none',
  color: DT.textMuted,
  fontSize: '1.1rem',
  cursor: 'pointer',
  lineHeight: 1,
};

function badge(bg: string, text: string, label: string): React.ReactNode {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.45rem',
        borderRadius: 4,
        backgroundColor: bg,
        color: text,
        fontSize: '0.68rem',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface NodeDetailPanelProps {
  store: StoreApi<DendriteState>;
  runtimeStore?: StoreApi<RuntimeStoreState>;
}

export function NodeDetailPanel({ store, runtimeStore }: NodeDetailPanelProps) {
  const selectedNodeId = useStore(store, (s) => s.selectedNodeId);
  const activeFixtureId = useStore(store, (s) => s.activeFixtureId);
  const fixtures = useStore(store, (s) => s.fixtures);
  const clearSelection = useStore(store, (s) => s.clearSelection);

  if (!selectedNodeId) return null;

  const diagram = fixtures[activeFixtureId];
  if (!diagram) return null;

  const node: SourceNode | undefined = diagram.nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const statusColor = STATUS_COLORS[node.status] ?? STATUS_COLORS.scaffold;
  const pillarColor = PILLAR_COLORS[node.domain] ?? PILLAR_COLORS.shared;
  const children = node.children ? diagram.nodes.filter((n) => node.children!.includes(n.id)) : [];

  return (
    <div style={panelStyle}>
      <button style={closeBtnStyle} onClick={clearSelection} title="Close">
        ×
      </button>

      {/* Label */}
      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{node.label}</div>

      {/* Badges row */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {badge(DT.surface, DT.textMuted, node.kind)}
        {badge(statusColor.fill, statusColor.text, node.status)}
        {badge(pillarColor.fill, pillarColor.text, node.domain)}
      </div>

      {/* Description */}
      {node.description && (
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: '0.7rem',
              color: DT.textMuted,
              marginBottom: '0.25rem',
            }}
          >
            Description
          </div>
          <div style={{ color: DT.textMuted, lineHeight: 1.5 }}>{node.description}</div>
        </div>
      )}

      {/* Children */}
      {children.length > 0 && (
        <div>
          <div
            style={{
              fontWeight: 600,
              fontSize: '0.7rem',
              color: DT.textMuted,
              marginBottom: '0.25rem',
            }}
          >
            Children ({children.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {children.map((c) => {
              const cs = STATUS_COLORS[c.status] ?? STATUS_COLORS.scaffold;
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      backgroundColor: cs.fill,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.72rem' }}>{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Runtime metrics */}
      {runtimeStore && <LiveMetricsSection nodeId={selectedNodeId} runtimeStore={runtimeStore} />}

      {/* ID */}
      <div
        style={{
          fontSize: '0.65rem',
          color: DT.textDim,
          marginTop: 'auto',
          paddingTop: '0.5rem',
        }}
      >
        ID: {node.id}
      </div>
    </div>
  );
}
