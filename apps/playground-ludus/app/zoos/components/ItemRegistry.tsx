'use client';

import { getAllItems } from '@dendrovia/ludus';
import { useMemo } from 'react';

const EFFECT_COLORS: Record<string, string> = {
  'heal-hp': '#EF4444',
  'heal-mana': '#3B82F6',
  'buff-attack': '#F97316',
  'buff-defense': '#6366F1',
  cleanse: '#22C55E',
  'full-restore': '#EAB308',
};

export default function ItemRegistry(): React.JSX.Element {
  const items = useMemo(() => getAllItems(), []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            padding: '1rem',
            border: '1px solid #222',
            borderRadius: '8px',
            background: '#111',
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '0.1rem 0.35rem',
                borderRadius: '3px',
                background: EFFECT_COLORS[item.effect.type] ?? '#333',
                color: '#fff',
              }}
            >
              {item.effect.type}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.35rem' }}>{item.description}</div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-geist-mono)', opacity: 0.5 }}>
            Value: {item.effect.value}
            {item.effect.duration != null && <span> · Duration: {item.effect.duration}t</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
