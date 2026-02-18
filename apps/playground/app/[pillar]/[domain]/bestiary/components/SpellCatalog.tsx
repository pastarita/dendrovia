'use client';

import { useState, useMemo } from 'react';
import { getAllSpells } from '@dendrovia/ludus';
import type { Element } from '@dendrovia/shared';
import { OrnateFrame } from '@dendrovia/oculus';

const ELEMENTS: (Element | 'all')[] = ['all', 'fire', 'water', 'earth', 'air', 'none'];
const EFFECT_TYPES = ['all', 'damage', 'heal', 'shield', 'buff', 'debuff', 'dot', 'aoe-damage', 'cleanse', 'taunt', 'revive'];

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#EF4444',
  water: '#3B82F6',
  earth: '#A16207',
  air: '#06B6D4',
  none: '#6B7280',
};

const selectStyle: React.CSSProperties = {
  padding: '0.35rem 0.5rem',
  borderRadius: '4px',
  border: '1px solid #333',
  background: '#1a1a1a',
  color: '#ededed',
  fontSize: '0.8rem',
};

export default function SpellCatalog(): React.JSX.Element {
  const [elementFilter, setElementFilter] = useState<string>('all');
  const [effectFilter, setEffectFilter] = useState<string>('all');

  const allSpells = useMemo(() => getAllSpells(), []);

  const filtered = useMemo(() => {
    return allSpells.filter(s => {
      if (elementFilter !== 'all' && s.element !== elementFilter) return false;
      if (effectFilter !== 'all' && s.effect.type !== effectFilter) return false;
      return true;
    });
  }, [allSpells, elementFilter, effectFilter]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Element:</label>
        <select style={selectStyle} value={elementFilter} onChange={e => setElementFilter(e.target.value)}>
          {ELEMENTS.map(e => <option key={e} value={e}>{e === 'all' ? 'All' : e}</option>)}
        </select>
        <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Effect:</label>
        <select style={selectStyle} value={effectFilter} onChange={e => setEffectFilter(e.target.value)}>
          {EFFECT_TYPES.map(e => <option key={e} value={e}>{e === 'all' ? 'All' : e}</option>)}
        </select>
        <span style={{ fontSize: '0.75rem', opacity: 0.4, marginLeft: 'auto' }}>{filtered.length} spells</span>
      </div>

      <OrnateFrame pillar="ludus" variant="panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ textAlign: 'left', padding: '0.5rem', opacity: 0.6 }}>Name</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', opacity: 0.6 }}>Element</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', opacity: 0.6 }}>Effect</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', opacity: 0.6 }}>Target</th>
              <th style={{ textAlign: 'right', padding: '0.5rem', opacity: 0.6 }}>Power</th>
              <th style={{ textAlign: 'right', padding: '0.5rem', opacity: 0.6 }}>Mana</th>
              <th style={{ textAlign: 'right', padding: '0.5rem', opacity: 0.6 }}>CD</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(spell => (
              <tr key={spell.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>{spell.name}</td>
                <td style={{ padding: '0.4rem 0.5rem' }}>
                  <span style={{ color: ELEMENT_COLORS[spell.element] ?? '#ededed' }}>{spell.element}</span>
                </td>
                <td style={{ padding: '0.4rem 0.5rem', opacity: 0.8 }}>{spell.effect.type}</td>
                <td style={{ padding: '0.4rem 0.5rem', opacity: 0.6, fontSize: '0.75rem' }}>{spell.effect.target}</td>
                <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontFamily: 'var(--font-geist-mono)' }}>{spell.effect.value}</td>
                <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontFamily: 'var(--font-geist-mono)', color: '#3B82F6' }}>{spell.manaCost}</td>
                <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontFamily: 'var(--font-geist-mono)', opacity: 0.5 }}>{spell.cooldown}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </OrnateFrame>
    </div>
  );
}
