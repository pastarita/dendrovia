'use client';

import { useState, useMemo } from 'react';
import {
  DEFENSE_CONSTANT,
  BASE_CRIT_CHANCE,
  CRIT_MULTIPLIER,
  MAX_CRIT_CHANCE,
  CRIT_PER_SPEED,
  VARIANCE_MIN,
  VARIANCE_RANGE,
  ELEMENT_TABLE,
  getElementMultiplier,
} from '@dendrovia/ludus';
import type { Element } from '@dendrovia/shared';

const ELEMENTS: Element[] = ['fire', 'water', 'earth', 'air', 'none'];

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#EF4444',
  water: '#3B82F6',
  earth: '#A16207',
  air: '#06B6D4',
  none: '#6B7280',
};

function multColor(mult: number): string {
  if (mult > 1) return '#22C55E';
  if (mult < 1) return '#EF4444';
  return '#6B7280';
}

export default function DamageFormulaExhibit(): React.JSX.Element {
  const [atk, setAtk] = useState(15);
  const [spd, setSpd] = useState(7);
  const [def, setDef] = useState(8);
  const [spellPower, setSpellPower] = useState(40);
  const [atkElement, setAtkElement] = useState<Element>('fire');
  const [defElement, setDefElement] = useState<Element>('earth');

  const calc = useMemo(() => {
    const rawPower = spellPower + atk;
    const defReduction = DEFENSE_CONSTANT / (DEFENSE_CONSTANT + def);
    const baseDamage = rawPower * defReduction;
    const elementMult = getElementMultiplier(atkElement, defElement);
    const critChance = Math.min(BASE_CRIT_CHANCE + spd * CRIT_PER_SPEED, MAX_CRIT_CHANCE);
    const minDmg = Math.floor(baseDamage * 1.0 * elementMult * VARIANCE_MIN);
    const maxDmg = Math.floor(baseDamage * CRIT_MULTIPLIER * elementMult * (VARIANCE_MIN + VARIANCE_RANGE));
    return { rawPower, defReduction, baseDamage, elementMult, critChance, minDmg, maxDmg };
  }, [atk, spd, def, spellPower, atkElement, defElement]);

  const inputStyle: React.CSSProperties = {
    padding: '0.4rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#ededed',
    fontSize: '0.85rem',
    width: '70px',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    width: 'auto',
  };

  return (
    <div>
      {/* Formula Display */}
      <div style={{ padding: '1.25rem', border: '1px solid #222', borderRadius: '8px', background: '#111', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Damage Formula</div>
        <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.85rem', lineHeight: 1.8 }}>
          <div>BaseDamage = (SpellPower + ATK) * (C / (C + DEF))</div>
          <div>FinalDamage = floor(BaseDamage * CritMult * ElementMult * Variance)</div>
          <div>FinalDamage = max(FinalDamage, 1)</div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Spell Power</div>
          <input type="number" value={spellPower} onChange={e => setSpellPower(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Attacker ATK</div>
          <input type="number" value={atk} onChange={e => setAtk(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Attacker SPD</div>
          <input type="number" value={spd} onChange={e => setSpd(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Defender DEF</div>
          <input type="number" value={def} onChange={e => setDef(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Atk Element</div>
          <select value={atkElement} onChange={e => setAtkElement(e.target.value as Element)} style={selectStyle}>
            {ELEMENTS.map(el => <option key={el} value={el}>{el}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.25rem' }}>Def Element</div>
          <select value={defElement} onChange={e => setDefElement(e.target.value as Element)} style={selectStyle}>
            {ELEMENTS.map(el => <option key={el} value={el}>{el}</option>)}
          </select>
        </div>
      </div>

      {/* Calculation Breakdown */}
      <div style={{ padding: '1.25rem', border: '1px solid #222', borderRadius: '8px', background: '#111', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Calculation Breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>
          <div><span style={{ opacity: 0.5 }}>Raw Power:</span> {calc.rawPower}</div>
          <div><span style={{ opacity: 0.5 }}>DEF Reduction:</span> {(calc.defReduction * 100).toFixed(1)}%</div>
          <div><span style={{ opacity: 0.5 }}>Base Damage:</span> {calc.baseDamage.toFixed(1)}</div>
          <div><span style={{ opacity: 0.5 }}>Element Mult:</span> <span style={{ color: multColor(calc.elementMult) }}>{calc.elementMult}x</span></div>
          <div><span style={{ opacity: 0.5 }}>Crit Chance:</span> {(calc.critChance * 100).toFixed(1)}%</div>
          <div><span style={{ opacity: 0.5 }}>Variance:</span> [{VARIANCE_MIN}, {VARIANCE_MIN + VARIANCE_RANGE}]</div>
          <div><span style={{ opacity: 0.5 }}>Damage Range:</span> <span style={{ color: 'var(--pillar-accent)' }}>{calc.minDmg} — {calc.maxDmg}</span></div>
        </div>
      </div>

      {/* Constants */}
      <div style={{ padding: '1.25rem', border: '1px solid #222', borderRadius: '8px', background: '#111', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.7rem', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Constants</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.35rem', fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem' }}>
          <div><span style={{ opacity: 0.5 }}>DEFENSE_CONSTANT:</span> {DEFENSE_CONSTANT}</div>
          <div><span style={{ opacity: 0.5 }}>BASE_CRIT_CHANCE:</span> {BASE_CRIT_CHANCE}</div>
          <div><span style={{ opacity: 0.5 }}>CRIT_MULTIPLIER:</span> {CRIT_MULTIPLIER}x</div>
          <div><span style={{ opacity: 0.5 }}>MAX_CRIT_CHANCE:</span> {MAX_CRIT_CHANCE}</div>
          <div><span style={{ opacity: 0.5 }}>CRIT_PER_SPEED:</span> {CRIT_PER_SPEED}</div>
          <div><span style={{ opacity: 0.5 }}>VARIANCE:</span> [{VARIANCE_MIN}, {(VARIANCE_MIN + VARIANCE_RANGE).toFixed(2)}]</div>
        </div>
      </div>

      {/* Element Table */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Element Effectiveness</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid #333', fontSize: '0.7rem', opacity: 0.5 }}>ATK \ DEF</th>
                {ELEMENTS.map(el => (
                  <th key={el} style={{ padding: '0.4rem 0.6rem', borderBottom: '1px solid #333', fontSize: '0.75rem', color: ELEMENT_COLORS[el] }}>{el}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ELEMENTS.map(atkEl => (
                <tr key={atkEl}>
                  <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600, fontSize: '0.75rem', color: ELEMENT_COLORS[atkEl], borderBottom: '1px solid #1a1a1a' }}>{atkEl}</td>
                  {ELEMENTS.map(defEl => {
                    const mult = ELEMENT_TABLE[atkEl][defEl];
                    return (
                      <td
                        key={defEl}
                        style={{
                          padding: '0.4rem 0.6rem',
                          textAlign: 'center',
                          fontFamily: 'var(--font-geist-mono)',
                          fontSize: '0.8rem',
                          color: multColor(mult),
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
      </div>
    </div>
  );
}
