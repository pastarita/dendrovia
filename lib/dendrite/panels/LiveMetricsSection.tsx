'use client';

import { useState } from 'react';
import type { StoreApi } from 'zustand';
import { useStore } from 'zustand';
import { DT, RUNTIME_HEALTH_COLORS } from '../design-tokens';
import type { RuntimeStoreState } from '../store/runtime-store';
import type { NodeAction, RuntimeHealth } from '../types';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: DT.panelBorder,
  paddingTop: '0.5rem',
};

const headerStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '0.7rem',
  color: DT.textMuted,
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const metricsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.3rem',
};

const metricCell: React.CSSProperties = {
  fontSize: '0.68rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.1rem',
  padding: '0.25rem 0.35rem',
  backgroundColor: DT.surface,
  borderRadius: 3,
};

const metricKey: React.CSSProperties = {
  color: DT.textDim,
  fontSize: '0.62rem',
};

const metricValue: React.CSSProperties = {
  color: DT.text,
  fontWeight: 600,
  fontFamily: 'monospace',
};

function actionBtnStyle(category: string): React.CSSProperties {
  const base: React.CSSProperties = {
    paddingTop: '0.2rem',
    paddingBottom: '0.2rem',
    paddingLeft: '0.45rem',
    paddingRight: '0.45rem',
    borderRadius: 3,
    borderWidth: '1px',
    borderStyle: 'solid',
    fontSize: '0.66rem',
    cursor: 'pointer',
    fontWeight: 500,
  };

  switch (category) {
    case 'danger':
      return { ...base, backgroundColor: '#7f1d1d', borderColor: '#991b1b', color: '#fca5a5' };
    case 'info':
      return { ...base, backgroundColor: '#1e3a5f', borderColor: '#1e40af', color: '#93c5fd' };
    default:
      return { ...base, backgroundColor: DT.surface, borderColor: DT.border, color: DT.text };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface LiveMetricsSectionProps {
  nodeId: string;
  runtimeStore: StoreApi<RuntimeStoreState>;
}

export function LiveMetricsSection({ nodeId, runtimeStore }: LiveMetricsSectionProps) {
  const nodeState = useStore(runtimeStore, (s) => s.nodes.get(nodeId));
  const actions = useStore(runtimeStore, (s) => s.actions.get(nodeId));
  const events = useStore(runtimeStore, (s) => s.events.get(nodeId));
  const [eventsExpanded, setEventsExpanded] = useState(false);

  if (!nodeState) return null;

  const healthColor = RUNTIME_HEALTH_COLORS[nodeState.health as RuntimeHealth] ?? RUNTIME_HEALTH_COLORS.idle;
  const ago = Math.round((Date.now() - nodeState.lastUpdated) / 1000);

  return (
    <div style={sectionStyle}>
      {/* Health badge */}
      <div style={headerStyle}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: healthColor.fill,
            flexShrink: 0,
          }}
        />
        Live Status
        <span style={{ fontSize: '0.6rem', color: DT.textDim, marginLeft: 'auto' }}>{nodeState.health}</span>
      </div>

      {/* Status text */}
      {nodeState.statusText && (
        <div style={{ fontSize: '0.66rem', color: DT.accent, fontStyle: 'italic' }}>{nodeState.statusText}</div>
      )}

      {/* Metrics grid */}
      {nodeState.metrics.length > 0 && (
        <div style={metricsGrid}>
          {nodeState.metrics.map((m) => (
            <div key={m.key} style={metricCell}>
              <span style={metricKey}>{m.key}</span>
              <span style={metricValue}>
                {String(m.value)}
                {m.unit ? <span style={{ color: DT.textDim, fontWeight: 400 }}> {m.unit}</span> : null}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {actions.map((a: NodeAction) => (
            <button
              key={a.id}
              style={actionBtnStyle(a.category ?? 'default')}
              onClick={() => {
                if (a.confirm) {
                  if (window.confirm(a.confirm)) {
                    a.handler();
                  }
                } else {
                  a.handler();
                }
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Event history */}
      {events && events.length > 0 && (
        <div>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: DT.textMuted,
              fontSize: '0.66rem',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 600,
            }}
            onClick={() => setEventsExpanded(!eventsExpanded)}
          >
            {eventsExpanded ? '- ' : '+ '}Events ({events.length})
          </button>
          {eventsExpanded && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                marginTop: '0.25rem',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
            >
              {events.map((e, i) => {
                const eventAgo = Math.round((Date.now() - e.timestamp) / 1000);
                return (
                  <div
                    key={`${e.event}-${i}`}
                    style={{
                      fontSize: '0.62rem',
                      color: DT.textDim,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ color: DT.textMuted }}>{e.event}</span>
                    <span>{eventAgo}s ago</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ fontSize: '0.6rem', color: DT.textDim }}>Last updated: {ago}s ago</div>
    </div>
  );
}
