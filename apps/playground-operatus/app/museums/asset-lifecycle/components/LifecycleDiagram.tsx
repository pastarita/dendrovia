'use client';

import { ASSET_STAGES, PERSIST_STAGES } from '../AssetLifecycleClient';

export function LifecycleDiagram({
  activeStages,
  selectedStage,
  onSelectStage,
}: {
  activeStages: Set<string>;
  selectedStage: string | null;
  onSelectStage: (id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Asset Track */}
      <div>
        <div
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            opacity: 0.4,
            marginBottom: '0.5rem',
            letterSpacing: '0.1em',
          }}
        >
          Asset Loading Track
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {ASSET_STAGES.map((stage, i) => (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center' }}>
              <StageBox
                id={stage.id}
                label={stage.label}
                active={activeStages.has(stage.id)}
                selected={selectedStage === stage.id}
                onClick={() => onSelectStage(stage.id)}
                color="#3B82F6"
              />
              {i < ASSET_STAGES.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
      </div>

      {/* Persist Track */}
      <div>
        <div
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            opacity: 0.4,
            marginBottom: '0.5rem',
            letterSpacing: '0.1em',
          }}
        >
          State Persistence Track
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {PERSIST_STAGES.map((stage, i) => (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center' }}>
              <StageBox
                id={stage.id}
                label={stage.label}
                active={activeStages.has(stage.id)}
                selected={selectedStage === stage.id}
                onClick={() => onSelectStage(stage.id)}
                color="#6B7280"
              />
              {i < PERSIST_STAGES.length - 1 && <Arrow />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StageBox({
  id,
  label,
  active,
  selected,
  onClick,
  color,
}: {
  id: string;
  label: string;
  active: boolean;
  selected: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.6rem 0.8rem',
        borderRadius: '6px',
        border: selected ? `2px solid ${color}` : '1px solid #333',
        background: active ? `${color}33` : '#111',
        color: active ? color : '#aaa',
        fontSize: '0.75rem',
        fontWeight: 500,
        cursor: 'pointer',
        minWidth: '90px',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        boxShadow: active ? `0 0 12px ${color}44` : 'none',
        animation: active ? 'pulse 1s ease-in-out infinite' : 'none',
      }}
    >
      {label}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </button>
  );
}

function Arrow() {
  return (
    <div
      style={{
        width: '24px',
        height: '2px',
        background: '#333',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '-3px',
          width: 0,
          height: 0,
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
          borderLeft: '6px solid #333',
        }}
      />
    </div>
  );
}
