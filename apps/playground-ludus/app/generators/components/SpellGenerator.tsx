'use client';

import { generateSpell } from '@dendrovia/ludus';
import type { SpellSymbol } from '@dendrovia/shared';
import { useMemo, useState } from 'react';

const SHAPES: SpellSymbol['shape'][] = ['circle', 'triangle', 'square', 'star'];
const ELEMENTS: SpellSymbol['element'][] = ['fire', 'water', 'earth', 'air'];
const MODIFIERS: SpellSymbol['modifier'][] = ['swift', 'heavy', 'precise', 'chaotic'];

const EFFECT_COLORS: Record<string, string> = {
  heal: '#22C55E',
  damage: '#EF4444',
  shield: '#3B82F6',
  buff: '#F97316',
};

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#EF4444',
  water: '#3B82F6',
  earth: '#A16207',
  air: '#06B6D4',
};

export default function SpellGenerator(): React.JSX.Element {
  const [shape, setShape] = useState<SpellSymbol['shape']>('triangle');
  const [element, setElement] = useState<SpellSymbol['element']>('fire');
  const [modifier, setModifier] = useState<SpellSymbol['modifier']>('swift');
  const [generated, setGenerated] = useState<ReturnType<typeof generateSpell> | null>(null);

  const preview = useMemo(() => generateSpell({ shape, element, modifier }), [shape, element, modifier]);

  const discoveryGrid = useMemo(() => {
    const rows: Array<{ symbol: SpellSymbol; spell: ReturnType<typeof generateSpell> }> = [];
    for (const s of SHAPES) {
      for (const e of ELEMENTS) {
        for (const m of MODIFIERS) {
          rows.push({
            symbol: { shape: s, element: e, modifier: m },
            spell: generateSpell({ shape: s, element: e, modifier: m }),
          });
        }
      }
    }
    return rows;
  }, []);

  const selectStyle: React.CSSProperties = {
    padding: '0.4rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#ededed',
    fontSize: '0.85rem',
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Shape</div>
          <select value={shape} onChange={(e) => setShape(e.target.value as SpellSymbol['shape'])} style={selectStyle}>
            {SHAPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Element</div>
          <select
            value={element}
            onChange={(e) => setElement(e.target.value as SpellSymbol['element'])}
            style={selectStyle}
          >
            {ELEMENTS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Modifier</div>
          <select
            value={modifier}
            onChange={(e) => setModifier(e.target.value as SpellSymbol['modifier'])}
            style={selectStyle}
          >
            {MODIFIERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setShape(SHAPES[Math.floor(Math.random() * SHAPES.length)]!);
            setElement(ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]!);
            setModifier(MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]!);
          }}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: '4px',
            border: '1px solid #555',
            background: 'transparent',
            color: '#ededed',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          Random Symbol
        </button>
        <button
          onClick={() => setGenerated(preview)}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: '4px',
            border: '1px solid var(--pillar-accent)',
            background: 'transparent',
            color: 'var(--pillar-accent)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          Generate
        </button>
      </div>

      {/* Live Preview */}
      <div
        style={{
          padding: '1.25rem',
          border: '1px solid #222',
          borderRadius: '8px',
          background: '#111',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            fontSize: '0.7rem',
            opacity: 0.4,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.5rem',
          }}
        >
          Live Preview
        </div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.35rem' }}>{preview.name}</div>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
          <span
            style={{
              padding: '0.1rem 0.35rem',
              borderRadius: '3px',
              background: EFFECT_COLORS[preview.effect.type] ?? '#333',
              color: '#fff',
              fontSize: '0.7rem',
            }}
          >
            {preview.effect.type}
          </span>
          <span style={{ color: ELEMENT_COLORS[preview.element] ?? '#6B7280' }}>{preview.element}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem', opacity: 0.7 }}>
          Power: {preview.effect.value} | Mana: {preview.manaCost} | Cooldown: {preview.cooldown}t
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.25rem' }}>{preview.description}</div>
      </div>

      {/* Generated Card */}
      {generated && (
        <div
          style={{
            padding: '1.25rem',
            border: '1px solid var(--pillar-accent)',
            borderRadius: '8px',
            background: '#111',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              opacity: 0.4,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '0.5rem',
              color: 'var(--pillar-accent)',
            }}
          >
            Generated Spell
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.35rem' }}>{generated.name}</div>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                padding: '0.1rem 0.35rem',
                borderRadius: '3px',
                background: EFFECT_COLORS[generated.effect.type] ?? '#333',
                color: '#fff',
                fontSize: '0.7rem',
              }}
            >
              {generated.effect.type}
            </span>
            <span style={{ color: ELEMENT_COLORS[generated.element] ?? '#6B7280' }}>{generated.element}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem', opacity: 0.7 }}>
            Power: {generated.effect.value} | Mana: {generated.manaCost} | Cooldown: {generated.cooldown}t | Target:{' '}
            {generated.effect.target}
          </div>
        </div>
      )}

      {/* Discovery Grid */}
      <div
        style={{
          fontSize: '0.7rem',
          opacity: 0.4,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.5rem',
        }}
      >
        Discovery Grid (64 combinations)
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.3rem 0.5rem', borderBottom: '1px solid #333', opacity: 0.5 }}>
                Name
              </th>
              <th style={{ textAlign: 'left', padding: '0.3rem 0.5rem', borderBottom: '1px solid #333', opacity: 0.5 }}>
                Effect
              </th>
              <th
                style={{ textAlign: 'right', padding: '0.3rem 0.5rem', borderBottom: '1px solid #333', opacity: 0.5 }}
              >
                Power
              </th>
              <th
                style={{ textAlign: 'right', padding: '0.3rem 0.5rem', borderBottom: '1px solid #333', opacity: 0.5 }}
              >
                Mana
              </th>
              <th
                style={{ textAlign: 'right', padding: '0.3rem 0.5rem', borderBottom: '1px solid #333', opacity: 0.5 }}
              >
                CD
              </th>
            </tr>
          </thead>
          <tbody>
            {discoveryGrid.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '0.25rem 0.5rem', fontFamily: 'var(--font-geist-mono)' }}>{row.spell.name}</td>
                <td style={{ padding: '0.25rem 0.5rem' }}>
                  <span style={{ color: EFFECT_COLORS[row.spell.effect.type] ?? '#aaa' }}>{row.spell.effect.type}</span>
                </td>
                <td style={{ padding: '0.25rem 0.5rem', textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>
                  {row.spell.effect.value}
                </td>
                <td style={{ padding: '0.25rem 0.5rem', textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>
                  {row.spell.manaCost}
                </td>
                <td style={{ padding: '0.25rem 0.5rem', textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>
                  {row.spell.cooldown}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
