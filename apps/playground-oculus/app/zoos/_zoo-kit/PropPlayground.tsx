'use client';

/**
 * PropPlayground — Renders interactive controls from PropControl[] descriptors.
 *
 * Supports: boolean (checkbox), range (slider), select (dropdown),
 * text (input), color (color picker).
 */

import type { PropControl } from './types';

interface PropPlaygroundProps {
  controls: PropControl[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.8rem',
};

const inputStyle: React.CSSProperties = {
  background: '#111',
  border: '1px solid #333',
  borderRadius: '4px',
  padding: '0.25rem 0.5rem',
  color: 'inherit',
  fontSize: '0.8rem',
};

export function PropPlayground({ controls, values, onChange }: PropPlaygroundProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {controls.map((ctrl) => {
        const val = values[ctrl.key] ?? ctrl.defaultValue;

        switch (ctrl.type) {
          case 'boolean':
            return (
              <label key={ctrl.key} style={labelStyle}>
                <input
                  type="checkbox"
                  checked={val as boolean}
                  onChange={(e) => onChange(ctrl.key, e.target.checked)}
                />
                {ctrl.label}
              </label>
            );

          case 'range':
            return (
              <label key={ctrl.key} style={{ ...labelStyle, flexWrap: 'wrap' }}>
                <span style={{ minWidth: 80 }}>{ctrl.label}</span>
                <input
                  type="range"
                  min={ctrl.min}
                  max={ctrl.max}
                  step={ctrl.step ?? 1}
                  value={val as number}
                  onChange={(e) => onChange(ctrl.key, +e.target.value)}
                  style={{ flex: 1, minWidth: 80 }}
                />
                <span style={{ fontSize: '0.75rem', opacity: 0.6, minWidth: 28, textAlign: 'right' }}>
                  {val as number}
                </span>
              </label>
            );

          case 'select':
            return (
              <label key={ctrl.key} style={labelStyle}>
                <span style={{ minWidth: 80 }}>{ctrl.label}</span>
                <select
                  value={val as string}
                  onChange={(e) => onChange(ctrl.key, e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  {ctrl.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            );

          case 'text':
            return (
              <label key={ctrl.key} style={labelStyle}>
                <span style={{ minWidth: 80 }}>{ctrl.label}</span>
                <input
                  type="text"
                  value={val as string}
                  onChange={(e) => onChange(ctrl.key, e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </label>
            );

          case 'color':
            return (
              <label key={ctrl.key} style={labelStyle}>
                <input
                  type="color"
                  value={val as string}
                  onChange={(e) => onChange(ctrl.key, e.target.value)}
                  style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <span>{ctrl.label}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.5, fontFamily: 'monospace' }}>
                  {val as string}
                </span>
              </label>
            );
        }
      })}
    </div>
  );
}
