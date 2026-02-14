'use client';

import type { Monster } from '@dendrovia/shared';
import StatBar from './StatBar';

interface EnemyCardProps {
  enemy: Monster;
}

const SEVERITY_STARS: Record<number, string> = {
  1: '*',
  2: '**',
  3: '***',
  4: '****',
  5: '*****',
};

const ELEMENT_COLORS: Record<string, string> = {
  fire: '#EF4444',
  water: '#3B82F6',
  earth: '#A16207',
  air: '#06B6D4',
  none: '#6B7280',
};

export default function EnemyCard({ enemy }: EnemyCardProps) {
  return (
    <div style={{ padding: '1.25rem', border: '1px solid #222', borderRadius: '8px', background: '#111', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{enemy.name}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{enemy.type}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.7rem',
              padding: '0.15rem 0.4rem',
              borderRadius: '3px',
              background: ELEMENT_COLORS[enemy.element] ?? ELEMENT_COLORS.none,
              color: '#fff',
            }}
          >
            {enemy.element}
          </span>
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{SEVERITY_STARS[enemy.severity]}</span>
        </div>
      </div>

      <StatBar label="HP" current={enemy.stats.health} max={enemy.stats.maxHealth} color="#F97316" />

      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.6 }}>
        <span>ATK {enemy.stats.attack}</span>
        <span>DEF {enemy.stats.defense}</span>
        <span>SPD {enemy.stats.speed}</span>
      </div>

      {enemy.statusEffects.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {enemy.statusEffects.map((fx, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '3px',
                background: '#5f1e1e',
                border: '1px solid #333',
              }}
            >
              {fx.name} ({fx.remainingTurns}t)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
