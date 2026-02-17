'use client';

import { OrnateFrame } from '@dendrovia/oculus';

interface Preset {
  name: string;
  axiom: string;
  rules: string;
  angle: number;
  iterations: number;
  seed: number;
}

interface ParameterPanelProps {
  axiom: string;
  setAxiom: (v: string) => void;
  rulesText: string;
  setRulesText: (v: string) => void;
  angle: number;
  setAngle: (v: number) => void;
  iterations: number;
  setIterations: (v: number) => void;
  seed: number;
  setSeed: (v: number) => void;
  paletteKey: string;
  setPaletteKey: (v: string) => void;
  paletteKeys: string[];
  presets: Preset[];
  loadPreset: (p: Preset) => void;
  stats: { branches: number; nodes: number; stringLength: number } | null;
  fps: number;
  error: string | null;
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '1.25rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  opacity: 0.5,
  marginBottom: '0.35rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.4rem 0.5rem',
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '4px',
  color: '#ededed',
  fontSize: '0.85rem',
  fontFamily: 'var(--font-geist-mono), monospace',
};

const btnStyle: React.CSSProperties = {
  padding: '0.3rem 0.55rem',
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: '4px',
  color: '#ededed',
  fontSize: '0.7rem',
  cursor: 'pointer',
};

export function ParameterPanel({
  axiom,
  setAxiom,
  rulesText,
  setRulesText,
  angle,
  setAngle,
  iterations,
  setIterations,
  seed,
  setSeed,
  paletteKey,
  setPaletteKey,
  paletteKeys,
  presets,
  loadPreset,
  stats,
  fps,
  error,
}: ParameterPanelProps) {
  return (
    <OrnateFrame
      pillar="architectus"
      variant="panel"
      style={{
        width: 300,
        overflowY: 'auto',
        flexShrink: 0,
        background: '#111',
        fontSize: '0.85rem',
      }}
    >
      <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--pillar-accent)' }}>
        L-System Parameters
      </div>

      {/* Presets */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Presets</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {presets.map((p) => (
            <button key={p.name} style={btnStyle} onClick={() => loadPreset(p)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Axiom */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Axiom</label>
        <input style={inputStyle} value={axiom} onChange={(e) => setAxiom(e.target.value)} spellCheck={false} />
      </div>

      {/* Rules */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Production Rules</label>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
          spellCheck={false}
        />
        <div style={{ fontSize: '0.65rem', opacity: 0.35, marginTop: '0.25rem' }}>
          Format: SYMBOL: REPLACEMENT (one per line)
        </div>
      </div>

      {/* Angle */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Branch Angle: {angle}&deg;</label>
        <input
          type="range"
          style={{ width: '100%', accentColor: 'var(--pillar-accent)' }}
          min={5}
          max={90}
          value={angle}
          onChange={(e) => setAngle(Number(e.target.value))}
        />
      </div>

      {/* Iterations */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Depth (Iterations): {iterations}</label>
        <input
          type="range"
          style={{ width: '100%', accentColor: 'var(--pillar-accent)' }}
          min={1}
          max={8}
          value={iterations}
          onChange={(e) => setIterations(Number(e.target.value))}
        />
      </div>

      {/* Seed */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Stochastic Seed</label>
        <input type="number" style={inputStyle} value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
      </div>

      {/* Palette */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Palette</label>
        <select
          style={{ ...inputStyle, cursor: 'pointer' }}
          value={paletteKey}
          onChange={(e) => setPaletteKey(e.target.value)}
        >
          {paletteKeys.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '0.5rem',
            background: '#3a1111',
            border: '1px solid #ff3333',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: '#ff6666',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          padding: '0.5rem',
          background: '#0a0a1e',
          border: '1px solid #1a1a3e',
          borderRadius: '4px',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.7rem',
        }}
      >
        <div
          style={{
            opacity: 0.5,
            marginBottom: '0.25rem',
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Performance
        </div>
        <div>FPS: {fps || '...'}</div>
        {stats && (
          <>
            <div>Branches: {stats.branches.toLocaleString()}</div>
            <div>Nodes: {stats.nodes.toLocaleString()}</div>
            <div>L-String: {stats.stringLength.toLocaleString()} chars</div>
          </>
        )}
      </div>
    </OrnateFrame>
  );
}
