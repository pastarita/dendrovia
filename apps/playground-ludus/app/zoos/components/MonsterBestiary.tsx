'use client';

import { createMonster, createRngState } from '@dendrovia/ludus';
import { OrnateFrame } from '@dendrovia/oculus';
import type { BugType } from '@dendrovia/shared';
import { useMemo } from 'react';

const BUG_TYPES: BugType[] = ['null-pointer', 'memory-leak', 'race-condition', 'off-by-one'];
const SEVERITIES: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#EF4444',
  water: '#3B82F6',
  earth: '#A16207',
  air: '#06B6D4',
  none: '#6B7280',
};

export default function MonsterBestiary(): React.JSX.Element {
  const monsters = useMemo(() => {
    const grid: Record<string, ReturnType<typeof createMonster>[0]> = {};
    for (const type of BUG_TYPES) {
      for (const sev of SEVERITIES) {
        const rng = createRngState(42);
        const [monster] = createMonster(type, sev, 0, rng);
        grid[`${type}-${sev}`] = monster;
      }
    }
    return grid;
  }, []);

  return (
    <div>
      {/* Header row */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '120px repeat(5, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}
      >
        <div />
        {SEVERITIES.map((s) => (
          <div key={s} style={{ textAlign: 'center', fontSize: '0.75rem', opacity: 0.5 }}>
            Severity {s}
          </div>
        ))}
      </div>

      {BUG_TYPES.map((type) => (
        <div
          key={type}
          style={{
            display: 'grid',
            gridTemplateColumns: '120px repeat(5, 1fr)',
            gap: '0.5rem',
            marginBottom: '0.5rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>{type}</div>
          {SEVERITIES.map((sev) => {
            const monster = monsters[`${type}-${sev}`];
            if (!monster) return <div key={sev} />;
            return (
              <OrnateFrame
                key={sev}
                pillar="ludus"
                variant="compact"
                style={{
                  background: '#111',
                  fontSize: '0.75rem',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.35rem' }}>{monster.name}</div>
                <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: ELEMENT_COLORS[monster.element], fontSize: '0.7rem' }}>{monster.element}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-geist-mono)', opacity: 0.7, lineHeight: 1.6 }}>
                  <div>HP {monster.stats.maxHealth}</div>
                  <div>
                    ATK {monster.stats.attack} DEF {monster.stats.defense}
                  </div>
                  <div>SPD {monster.stats.speed}</div>
                  <div style={{ color: '#22C55E' }}>XP {monster.xpReward}</div>
                </div>
              </OrnateFrame>
            );
          })}
        </div>
      ))}
    </div>
  );
}
