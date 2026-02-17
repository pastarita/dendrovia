'use client';

import { IconBadge, OrnateFrame, ProgressBar, StatLabel } from '@dendrovia/oculus';
import type { Monster } from '@dendrovia/shared';

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

export default function EnemyCard({ enemy }: EnemyCardProps): React.JSX.Element {
  return (
    <OrnateFrame pillar="ludus" variant="panel" style={{ flex: 1 }}>
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

      <StatLabel label="HP" value={`${enemy.stats.health}/${enemy.stats.maxHealth}`} color="#F97316" />
      <ProgressBar value={enemy.stats.health} max={enemy.stats.maxHealth} variant="custom" color="#F97316" flash />

      <div style={{ marginTop: 'var(--oculus-space-sm)' }}>
        <StatLabel label="ATK" value={enemy.stats.attack} />
        <StatLabel label="DEF" value={enemy.stats.defense} />
        <StatLabel label="SPD" value={enemy.stats.speed} />
      </div>

      {enemy.statusEffects.length > 0 && (
        <div
          style={{
            marginTop: 'var(--oculus-space-sm)',
            display: 'flex',
            gap: 'var(--oculus-space-xs)',
            flexWrap: 'wrap',
          }}
        >
          {enemy.statusEffects.map((fx, i) => (
            <IconBadge key={i} icon={'\u2726'} label={`${fx.name} (${fx.remainingTurns}t)`} color="#EF4444" size="sm" />
          ))}
        </div>
      )}
    </OrnateFrame>
  );
}
