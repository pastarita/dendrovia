'use client';

import { createMonster, createRngState, getSpell, xpRewardForMonster } from '@dendrovia/ludus';
import type { BugType } from '@dendrovia/shared';
import { useMemo } from 'react';

const BUG_TYPES: BugType[] = ['null-pointer', 'memory-leak', 'race-condition', 'off-by-one'];
const SEVERITIES: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

const TYPE_META: Record<string, { label: string; description: string; behavior: string; color: string }> = {
  'null-pointer': {
    label: 'NullPointerException',
    description:
      'The most common bug in the codebase. Occurs when code tries to access a property of null or undefined.',
    behavior: 'Chaotic — 15% chance to crash (skip turn), 20% chance to use special spell, otherwise basic attack.',
    color: '#6B7280',
  },
  'memory-leak': {
    label: 'MemoryLeak',
    description: 'A silent destroyer that grows stronger over time as memory consumption increases unchecked.',
    behavior: 'Escalating — buffs itself every 3rd turn (Heap Growth), uses OOM Killer when low on HP.',
    color: '#A16207',
  },
  'race-condition': {
    label: 'RaceCondition',
    description: 'A fast, unpredictable bug that strikes when multiple threads compete for the same resource.',
    behavior: 'Alternating — double-attacks on even turns (Thread Swap), 30% chance to skip on odd turns.',
    color: '#06B6D4',
  },
  'off-by-one': {
    label: 'OffByOneError',
    description: 'A subtle, mischievous bug that is always slightly wrong. Sometimes helps the player by accident.',
    behavior: 'Unreliable — 10% chance to heal player instead, 15% chance to hit itself. Otherwise attacks normally.',
    color: '#A855F7',
  },
};

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#EF4444',
  water: '#3B82F6',
  earth: '#A16207',
  air: '#06B6D4',
  none: '#6B7280',
};

const thStyle: React.CSSProperties = {
  textAlign: 'right',
  padding: '0.3rem 0.5rem',
  borderBottom: '1px solid #333',
  fontSize: '0.7rem',
  opacity: 0.5,
};
const tdStyle: React.CSSProperties = {
  textAlign: 'right',
  padding: '0.25rem 0.5rem',
  fontFamily: 'var(--font-geist-mono)',
  fontSize: '0.75rem',
  borderBottom: '1px solid #1a1a1a',
};

export default function MonsterGuideHall(): React.JSX.Element {
  const monsterData = useMemo(() => {
    return BUG_TYPES.map((type) => {
      const meta = TYPE_META[type];
      const statGrid = SEVERITIES.map((sev) => {
        const rng = createRngState(42);
        const [monster] = createMonster(type, sev, 0, rng);
        return { severity: sev, monster };
      });

      // Get unique spells from highest severity monster
      const highSev = statGrid[statGrid.length - 1].monster;
      const spellDetails = highSev.spells.map((id) => getSpell(id)).filter(Boolean);

      return { type, meta, statGrid, spellDetails, lootTable: highSev.lootTable };
    });
  }, []);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* XP Formula */}
      <div style={{ padding: '1rem', border: '1px solid #222', borderRadius: '8px', background: '#111' }}>
        <div
          style={{
            fontSize: '0.7rem',
            opacity: 0.4,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '0.35rem',
          }}
        >
          XP Reward Formula
        </div>
        <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.85rem' }}>
          xpReward = floor(25 * severity^2 * (1 + 0.05 * complexity))
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-geist-mono)',
            opacity: 0.5,
            marginTop: '0.35rem',
          }}
        >
          {SEVERITIES.map((s) => (
            <span key={s}>
              S{s}: {xpRewardForMonster(s, 0)} XP
            </span>
          ))}
        </div>
      </div>

      {/* Monster Type Cards */}
      {monsterData.map((md) => (
        <div
          key={md.type}
          style={{
            padding: '1.25rem',
            border: '1px solid #222',
            borderRadius: '8px',
            background: '#111',
            borderLeft: `3px solid ${md.meta.color}`,
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}
          >
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: md.meta.color }}>{md.meta.label}</div>
            <span style={{ fontSize: '0.75rem', color: ELEMENT_COLORS[md.statGrid[0].monster.element] }}>
              {md.statGrid[0].monster.element}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.35rem' }}>{md.meta.description}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.75rem' }}>
            <strong>AI:</strong> {md.meta.behavior}
          </div>

          {/* Severity Scaling Table */}
          <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Sev</th>
                  <th style={thStyle}>HP</th>
                  <th style={thStyle}>ATK</th>
                  <th style={thStyle}>DEF</th>
                  <th style={thStyle}>SPD</th>
                  <th style={thStyle}>XP</th>
                </tr>
              </thead>
              <tbody>
                {md.statGrid.map((row) => (
                  <tr key={row.severity}>
                    <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>S{row.severity}</td>
                    <td style={tdStyle}>{row.monster.stats.maxHealth}</td>
                    <td style={tdStyle}>{row.monster.stats.attack}</td>
                    <td style={tdStyle}>{row.monster.stats.defense}</td>
                    <td style={tdStyle}>{row.monster.stats.speed}</td>
                    <td style={{ ...tdStyle, color: '#22C55E' }}>{row.monster.xpReward}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Spells */}
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.25rem' }}>Monster Spells</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {md.spellDetails.map((spell: any) => (
                <div
                  key={spell.id}
                  style={{
                    padding: '0.35rem 0.5rem',
                    border: '1px solid #222',
                    borderRadius: '4px',
                    background: '#0a0a0a',
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{spell.name}</span>
                  <span style={{ opacity: 0.5, marginLeft: '0.35rem' }}>
                    {spell.effect.type} {spell.effect.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Loot Table */}
          <div>
            <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.25rem' }}>
              Loot Table (at max severity)
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-geist-mono)',
              }}
            >
              {md.lootTable.map((l) => (
                <span key={l.itemId} style={{ opacity: 0.7 }}>
                  {l.itemId} ({(l.chance * 100).toFixed(0)}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
