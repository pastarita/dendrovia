'use client';

import { ELEMENT_TABLE, getAllSpells } from '@dendrovia/ludus';
import type { Element } from '@dendrovia/shared';
import { useMemo } from 'react';

const ELEMENTS: Element[] = ['fire', 'water', 'earth', 'air', 'none'];

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#EF4444',
  water: '#3B82F6',
  earth: '#A16207',
  air: '#06B6D4',
  none: '#6B7280',
};

const ELEMENT_DESCRIPTIONS: Record<string, { theme: string; strengths: string; weakness: string }> = {
  fire: {
    theme: 'Aggressive, explosive attacks. Associated with DPS spells like SQL Injection, Fork Bomb, and Zero Day.',
    strengths: 'Super effective against Earth',
    weakness: 'Resisted by Fire and Water',
  },
  water: {
    theme: 'Healing, restoration, and cleansing. Associated with Healer spells like Try-Catch, Rollback, and Patch.',
    strengths: 'Super effective against Fire',
    weakness: 'Resisted by Water and Air',
  },
  earth: {
    theme:
      'Defensive, shielding, persistent. Associated with Tank spells like Mutex Lock, Docker Compose, and Terraform.',
    strengths: 'Super effective against Water and Air',
    weakness: 'Resisted by Earth and vulnerable to Fire',
  },
  air: {
    theme: 'Utility, debuffs, status effects. Associated with Garbage Collect, Chaos Monkey, and DDoS.',
    strengths: 'Super effective against Water',
    weakness: 'Resisted by Earth and Air',
  },
  none: {
    theme: 'Neutral element. No strengths or weaknesses. Used by basic attacks and neutral spells like Load Balancer.',
    strengths: 'No super-effective matchups',
    weakness: 'No resistances either — always 1.0x',
  },
};

function multColor(mult: number): string {
  if (mult > 1) return '#22C55E';
  if (mult < 1) return '#EF4444';
  return '#6B7280';
}

function multBg(mult: number): string {
  if (mult > 1) return '#0a2a0a';
  if (mult < 1) return '#2a0a0a';
  return 'transparent';
}

export default function ElementsHall(): React.JSX.Element {
  const spellsByElement = useMemo(() => {
    const all = getAllSpells();
    const grouped: Record<string, string[]> = {};
    for (const el of ELEMENTS) grouped[el] = [];
    for (const spell of all) {
      grouped[spell.element]?.push(spell.name);
    }
    return grouped;
  }, []);

  return (
    <div>
      {/* Effectiveness Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Element Effectiveness Grid</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderBottom: '1px solid #333',
                    fontSize: '0.7rem',
                    opacity: 0.5,
                  }}
                >
                  ATK \ DEF
                </th>
                {ELEMENTS.map((el) => (
                  <th
                    key={el}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderBottom: '1px solid #333',
                      fontSize: '0.8rem',
                      color: ELEMENT_COLORS[el],
                      fontWeight: 700,
                    }}
                  >
                    {el}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ELEMENTS.map((atkEl) => (
                <tr key={atkEl}>
                  <td
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      color: ELEMENT_COLORS[atkEl],
                      borderBottom: '1px solid #1a1a1a',
                    }}
                  >
                    {atkEl}
                  </td>
                  {ELEMENTS.map((defEl) => {
                    const mult = ELEMENT_TABLE[atkEl][defEl];
                    return (
                      <td
                        key={defEl}
                        style={{
                          padding: '0.5rem 0.75rem',
                          textAlign: 'center',
                          fontFamily: 'var(--font-geist-mono)',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: multColor(mult),
                          background: multBg(mult),
                          borderBottom: '1px solid #1a1a1a',
                        }}
                      >
                        {mult}x
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.6 }}>
          <span>
            <span style={{ color: '#22C55E' }}>Green</span> = super effective (1.5x)
          </span>
          <span>
            <span style={{ color: '#EF4444' }}>Red</span> = resisted (0.5x)
          </span>
          <span>
            <span style={{ color: '#6B7280' }}>Gray</span> = neutral (1.0x)
          </span>
        </div>
      </div>

      {/* Element Cards */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {ELEMENTS.map((el) => {
          const desc = ELEMENT_DESCRIPTIONS[el];
          return (
            <div
              key={el}
              style={{
                padding: '1.25rem',
                border: '1px solid #222',
                borderRadius: '8px',
                background: '#111',
                borderLeft: `3px solid ${ELEMENT_COLORS[el]}`,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: ELEMENT_COLORS[el],
                  marginBottom: '0.35rem',
                  textTransform: 'capitalize',
                }}
              >
                {el}
              </div>
              <div style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '0.5rem' }}>{desc.theme}</div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ color: '#22C55E' }}>Strengths:</span> {desc.strengths}
                </div>
                <div>
                  <span style={{ color: '#EF4444' }}>Weakness:</span> {desc.weakness}
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', opacity: 0.4, marginBottom: '0.15rem' }}>Spells with this element:</div>
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                {spellsByElement[el].slice(0, 8).map((name) => (
                  <span
                    key={name}
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '3px',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                    }}
                  >
                    {name}
                  </span>
                ))}
                {spellsByElement[el].length > 8 && (
                  <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>+{spellsByElement[el].length - 8} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
