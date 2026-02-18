'use client';

import { useMemo } from 'react';
import { totalXPForLevel, xpToNextLevel, computeStatsAtLevel, createCharacter } from '@dendrovia/ludus';
import type { CharacterClass } from '@dendrovia/shared';

const CLASSES: CharacterClass[] = ['tank', 'healer', 'dps'];
const KEY_LEVELS = [1, 5, 10, 15, 20, 25, 30];

const CLASS_COLORS: Record<string, string> = {
  tank: '#3B82F6',
  healer: '#22C55E',
  dps: '#EF4444',
};

const CLASS_LABELS: Record<string, string> = {
  tank: 'Tank (Infrastructure)',
  healer: 'Healer (Bug Fixer)',
  dps: 'DPS (Feature Dev)',
};

export default function ProgressionExhibit(): React.JSX.Element {
  // XP table
  const xpTable = useMemo(() => {
    const rows: Array<{ level: number; totalXP: number; toNext: number }> = [];
    for (let level = 1; level <= 30; level++) {
      rows.push({
        level,
        totalXP: totalXPForLevel(level),
        toNext: level < 30 ? xpToNextLevel(level) : 0,
      });
    }
    return rows;
  }, []);

  // Stat growth per class
  const statGrowth = useMemo(() => {
    const data: Record<string, Array<{ level: number; health: number; mana: number; attack: number; defense: number; speed: number }>> = {};
    for (const cls of CLASSES) {
      data[cls] = KEY_LEVELS.map(level => {
        const stats = computeStatsAtLevel(cls, level);
        return { level, health: stats.maxHealth, mana: stats.maxMana, attack: stats.attack, defense: stats.defense, speed: stats.speed };
      });
    }
    return data;
  }, []);

  // Spell unlocks per class
  const spellUnlocks = useMemo(() => {
    const data: Record<string, Array<{ level: number; spells: string[] }>> = {};
    for (const cls of CLASSES) {
      const unlocks: Array<{ level: number; spells: string[] }> = [];
      let prevSpells: string[] = [];
      for (const level of KEY_LEVELS) {
        const char = createCharacter(cls, 'test', level);
        const newSpells = char.spells.filter(s => !prevSpells.includes(s));
        if (newSpells.length > 0) {
          unlocks.push({ level, spells: newSpells });
        }
        prevSpells = [...char.spells];
      }
      data[cls] = unlocks;
    }
    return data;
  }, []);

  const thStyle: React.CSSProperties = { textAlign: 'right', padding: '0.3rem 0.5rem', borderBottom: '1px solid #333', fontSize: '0.7rem', opacity: 0.5 };
  const tdStyle: React.CSSProperties = { textAlign: 'right', padding: '0.25rem 0.5rem', fontFamily: 'var(--font-geist-mono)', fontSize: '0.75rem', borderBottom: '1px solid #1a1a1a' };

  return (
    <div>
      {/* XP Curve Table */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>XP Curve</h3>
        <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.5rem' }}>
          Formula: totalXP(level) = 50 * level^2
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left' }}>Level</th>
                <th style={thStyle}>Total XP</th>
                <th style={thStyle}>To Next</th>
              </tr>
            </thead>
            <tbody>
              {xpTable.map(row => (
                <tr key={row.level}>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>{row.level}</td>
                  <td style={tdStyle}>{row.totalXP.toLocaleString()}</td>
                  <td style={tdStyle}>{row.toNext > 0 ? row.toNext.toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stat Growth Per Class */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Stat Growth per Class</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {CLASSES.map(cls => (
            <div key={cls}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: CLASS_COLORS[cls], marginBottom: '0.35rem' }}>
                {CLASS_LABELS[cls]}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, textAlign: 'left' }}>Lv</th>
                      <th style={thStyle}>HP</th>
                      <th style={thStyle}>Mana</th>
                      <th style={thStyle}>ATK</th>
                      <th style={thStyle}>DEF</th>
                      <th style={thStyle}>SPD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statGrowth[cls].map(row => (
                      <tr key={row.level}>
                        <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>{row.level}</td>
                        <td style={tdStyle}>{row.health}</td>
                        <td style={tdStyle}>{row.mana}</td>
                        <td style={tdStyle}>{row.attack}</td>
                        <td style={tdStyle}>{row.defense}</td>
                        <td style={tdStyle}>{row.speed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spell Unlock Timeline */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Spell Unlock Timeline</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {CLASSES.map(cls => (
            <div key={cls}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: CLASS_COLORS[cls], marginBottom: '0.35rem' }}>
                {CLASS_LABELS[cls]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {spellUnlocks[cls].map(unlock => (
                  <div key={unlock.level} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-geist-mono)', opacity: 0.5, minWidth: '40px' }}>Lv{unlock.level}</span>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {unlock.spells.map(s => (
                        <span key={s} style={{ padding: '0.15rem 0.4rem', borderRadius: '3px', background: '#1a1a1a', border: '1px solid #333', fontSize: '0.75rem' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
