'use client';

import { useMemo } from 'react';
import { BASE_STATS, GROWTH_RATES, computeStatsAtLevel, createCharacter, getSpell } from '@dendrovia/ludus';
import type { CharacterClass } from '@dendrovia/shared';

const CLASSES: CharacterClass[] = ['tank', 'healer', 'dps'];
const KEY_LEVELS = [1, 10, 20, 30];

const CLASS_META: Record<string, { label: string; role: string; archetype: string; color: string }> = {
  tank: { label: 'Tank', role: 'Absorb damage, protect team', archetype: 'Infrastructure Developer — DevOps, Platform Maintainer', color: '#3B82F6' },
  healer: { label: 'Healer', role: 'Restore HP, remove debuffs', archetype: 'Bug Fixer — Debugger, QA Engineer', color: '#22C55E' },
  dps: { label: 'DPS', role: 'Deal damage, eliminate threats', archetype: 'Feature Developer — Full-stack Dev, Feature Lead', color: '#EF4444' },
};

const thStyle: React.CSSProperties = { textAlign: 'right', padding: '0.3rem 0.5rem', borderBottom: '1px solid #333', fontSize: '0.7rem', opacity: 0.5 };
const tdStyle: React.CSSProperties = { textAlign: 'right', padding: '0.25rem 0.5rem', fontFamily: 'var(--font-geist-mono)', fontSize: '0.75rem', borderBottom: '1px solid #1a1a1a' };

export default function ClassGuideHall(): React.JSX.Element {
  const classData = useMemo(() => {
    return CLASSES.map(cls => {
      const meta = CLASS_META[cls];
      const base = BASE_STATS[cls];
      const growth = GROWTH_RATES[cls];

      // Stats at key levels
      const statTable = KEY_LEVELS.map(level => {
        const stats = computeStatsAtLevel(cls, level);
        return { level, ...stats };
      });

      // Spells with details
      const char30 = createCharacter(cls, 'guide', 30);
      const spellDetails = char30.spells.map(id => {
        const spell = getSpell(id);
        return spell ? { ...spell, id } : null;
      }).filter(Boolean);

      return { cls, meta, base, growth, statTable, spellDetails };
    });
  }, []);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* Side-by-side Stat Comparison */}
      <div style={{ padding: '1.25rem', border: '1px solid #222', borderRadius: '8px', background: '#111' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Stat Comparison at Key Levels</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left' }}>Class</th>
                <th style={thStyle}>Lv</th>
                <th style={thStyle}>HP</th>
                <th style={thStyle}>Mana</th>
                <th style={thStyle}>ATK</th>
                <th style={thStyle}>DEF</th>
                <th style={thStyle}>SPD</th>
              </tr>
            </thead>
            <tbody>
              {classData.flatMap(cd =>
                cd.statTable.map((row, i) => (
                  <tr key={`${cd.cls}-${row.level}`} style={{ borderTop: i === 0 ? '1px solid #333' : undefined }}>
                    {i === 0 && (
                      <td rowSpan={KEY_LEVELS.length} style={{ ...tdStyle, textAlign: 'left', fontWeight: 700, color: cd.meta.color, verticalAlign: 'top' }}>
                        {cd.meta.label}
                      </td>
                    )}
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{row.level}</td>
                    <td style={tdStyle}>{row.maxHealth}</td>
                    <td style={tdStyle}>{row.maxMana}</td>
                    <td style={tdStyle}>{row.attack}</td>
                    <td style={tdStyle}>{row.defense}</td>
                    <td style={tdStyle}>{row.speed}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Class Cards */}
      {classData.map(cd => (
        <div
          key={cd.cls}
          style={{
            padding: '1.25rem',
            border: '1px solid #222',
            borderRadius: '8px',
            background: '#111',
            borderLeft: `3px solid ${cd.meta.color}`,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: cd.meta.color, marginBottom: '0.25rem' }}>{cd.meta.label}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.15rem' }}>{cd.meta.role}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.4, marginBottom: '0.75rem' }}>{cd.meta.archetype}</div>

          {/* Growth Rates */}
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.25rem' }}>Growth Rates (per level)</div>
            <div style={{ display: 'flex', gap: '0.75rem', fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>
              <span>HP +{cd.growth.hp}</span>
              <span>Mana +{cd.growth.mana}</span>
              <span>ATK +{cd.growth.attack}</span>
              <span>DEF +{cd.growth.defense}</span>
              <span>SPD +{cd.growth.speed}</span>
            </div>
          </div>

          {/* Spell List */}
          <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.35rem' }}>Spells ({cd.spellDetails.length})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' }}>
            {cd.spellDetails.map((spell: any) => (
              <div key={spell.id} style={{ padding: '0.5rem 0.75rem', border: '1px solid #222', borderRadius: '6px', background: '#0a0a0a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{spell.name}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.4, fontFamily: 'var(--font-geist-mono)' }}>{spell.element}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.7rem', opacity: 0.6 }}>
                  Cost: {spell.manaCost} | Power: {spell.effect.value} | CD: {spell.cooldown}t | {spell.effect.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
