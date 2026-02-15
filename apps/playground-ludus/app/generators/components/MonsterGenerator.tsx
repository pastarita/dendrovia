'use client';

import { useState, useMemo } from 'react';
import { createMonster, createRngState } from '@dendrovia/ludus';
import type { BugType } from '@dendrovia/shared';

const BUG_TYPES: BugType[] = ['null-pointer', 'memory-leak', 'race-condition', 'off-by-one'];
const SEVERITIES: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#EF4444',
  water: '#3B82F6',
  earth: '#A16207',
  air: '#06B6D4',
  none: '#6B7280',
};

export default function MonsterGenerator() {
  const [bugType, setBugType] = useState<BugType>('null-pointer');
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [complexity, setComplexity] = useState(5);
  const [seed, setSeed] = useState(42);

  const monster = useMemo(() => {
    const rng = createRngState(seed);
    const [m] = createMonster(bugType, severity, complexity, rng);
    return m;
  }, [bugType, severity, complexity, seed]);

  const selectStyle: React.CSSProperties = {
    padding: '0.4rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#ededed',
    fontSize: '0.85rem',
  };

  const inputStyle: React.CSSProperties = {
    ...selectStyle,
    width: '80px',
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Bug Type</div>
          <select value={bugType} onChange={e => setBugType(e.target.value as BugType)} style={selectStyle}>
            {BUG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Severity</div>
          <select value={severity} onChange={e => setSeverity(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)} style={selectStyle}>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Complexity (0-30)</div>
          <input
            type="range"
            min={0}
            max={30}
            value={complexity}
            onChange={e => setComplexity(Number(e.target.value))}
            style={{ width: '120px', verticalAlign: 'middle' }}
          />
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-geist-mono)', marginLeft: '0.5rem' }}>{complexity}</span>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Seed</div>
          <input
            type="number"
            value={seed}
            onChange={e => setSeed(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
        <button
          onClick={() => setSeed(Math.floor(Math.random() * 99999))}
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
          Randomize
        </button>
      </div>

      {/* Monster Card */}
      <div style={{ padding: '1.25rem', border: '1px solid #222', borderRadius: '8px', background: '#111', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{monster.name}</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: ELEMENT_COLORS[monster.element], fontSize: '0.8rem' }}>{monster.element}</span>
            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '3px', border: '1px solid #333' }}>
              S{monster.severity}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>HP</span> <span style={{ color: '#EF4444' }}>{monster.stats.maxHealth}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>ATK</span> <span style={{ color: '#F97316' }}>{monster.stats.attack}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>DEF</span> <span style={{ color: '#6366F1' }}>{monster.stats.defense}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>
            <span style={{ opacity: 0.5 }}>SPD</span> <span style={{ color: '#06B6D4' }}>{monster.stats.speed}</span>
          </div>
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.25rem' }}>Spells</div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {monster.spells.map(s => (
              <span key={s} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '3px', background: '#1a1a1a', border: '1px solid #333' }}>{s}</span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.25rem' }}>Loot Table</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem', fontFamily: 'var(--font-geist-mono)' }}>
            {monster.lootTable.map(l => (
              <span key={l.itemId} style={{ opacity: 0.7 }}>{l.itemId} ({(l.chance * 100).toFixed(0)}%)</span>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-geist-mono)', color: '#22C55E' }}>
          XP Reward: {monster.xpReward}
        </div>
      </div>
    </div>
  );
}
