'use client';

import { useMemo } from 'react';
import { computeStatsAtLevel, createCharacter } from '@dendrovia/ludus';
import type { CharacterClass } from '@dendrovia/shared';

const CLASSES: { cls: CharacterClass; label: string }[] = [
  { cls: 'tank', label: 'Tank (Infrastructure)' },
  { cls: 'healer', label: 'Healer (Bug Fixer)' },
  { cls: 'dps', label: 'DPS (Feature Dev)' },
];

const LEVELS = [1, 5, 10, 15, 20, 25, 30];

export default function ClassComparison() {
  const data = useMemo(() => {
    return CLASSES.map(({ cls, label }) => {
      const levels = LEVELS.map(lv => ({
        level: lv,
        stats: computeStatsAtLevel(cls, lv),
        spells: createCharacter(cls, 'test', lv).spells,
      }));
      return { cls, label, levels };
    });
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      {data.map(({ cls, label, levels }) => (
        <div key={cls} style={{ padding: '1rem', border: '1px solid #222', borderRadius: '8px', background: '#111' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>{label}</div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '0.3rem', opacity: 0.5 }}>Lv</th>
                <th style={{ textAlign: 'right', padding: '0.3rem', opacity: 0.5 }}>HP</th>
                <th style={{ textAlign: 'right', padding: '0.3rem', opacity: 0.5 }}>MP</th>
                <th style={{ textAlign: 'right', padding: '0.3rem', opacity: 0.5 }}>ATK</th>
                <th style={{ textAlign: 'right', padding: '0.3rem', opacity: 0.5 }}>DEF</th>
                <th style={{ textAlign: 'right', padding: '0.3rem', opacity: 0.5 }}>SPD</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(({ level, stats }) => (
                <tr key={level} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '0.3rem', fontWeight: 600 }}>{level}</td>
                  <td style={{ padding: '0.3rem', textAlign: 'right', fontFamily: 'var(--font-geist-mono)', color: '#EF4444' }}>{stats.maxHealth}</td>
                  <td style={{ padding: '0.3rem', textAlign: 'right', fontFamily: 'var(--font-geist-mono)', color: '#3B82F6' }}>{stats.maxMana}</td>
                  <td style={{ padding: '0.3rem', textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>{stats.attack}</td>
                  <td style={{ padding: '0.3rem', textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>{stats.defense}</td>
                  <td style={{ padding: '0.3rem', textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>{stats.speed}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.35rem', textTransform: 'uppercase' }}>Spell Unlocks</div>
            {levels.map(({ level, spells }) => {
              const prevSpells = level === 1 ? [] : levels.find(l => l.level === LEVELS[LEVELS.indexOf(level) - 1])?.spells ?? [];
              const newSpells = spells.filter(s => !prevSpells.includes(s));
              if (newSpells.length === 0 && level !== 1) return null;
              const showSpells = level === 1 ? spells : newSpells;
              return (
                <div key={level} style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                  <span style={{ opacity: 0.5 }}>Lv {level}:</span>{' '}
                  {showSpells.map(s => s.replace('spell-', '')).join(', ')}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
