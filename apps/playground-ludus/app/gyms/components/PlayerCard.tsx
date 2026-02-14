'use client';

import type { Character } from '@dendrovia/shared';
import StatBar from './StatBar';

interface PlayerCardProps {
  player: Character;
}

const CLASS_LABELS: Record<string, string> = {
  tank: 'Tank (Infrastructure)',
  healer: 'Healer (Bug Fixer)',
  dps: 'DPS (Feature Dev)',
};

export default function PlayerCard({ player }: PlayerCardProps) {
  return (
    <div style={{ padding: '1.25rem', border: '1px solid #222', borderRadius: '8px', background: '#111', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{player.name}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{CLASS_LABELS[player.class] ?? player.class}</div>
        </div>
        <div style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', border: '1px solid #333', borderRadius: '4px' }}>
          Lv {player.level}
        </div>
      </div>

      <StatBar label="HP" current={player.stats.health} max={player.stats.maxHealth} color="#EF4444" />
      <StatBar label="MP" current={player.stats.mana} max={player.stats.maxMana} color="#3B82F6" />

      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.6 }}>
        <span>ATK {player.stats.attack}</span>
        <span>DEF {player.stats.defense}</span>
        <span>SPD {player.stats.speed}</span>
      </div>

      {player.statusEffects.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {player.statusEffects.map((fx, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.7rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '3px',
                background: fx.type === 'shield' ? '#1e3a5f' : fx.type === 'regen' ? '#166534' : fx.type.includes('up') ? '#3c6b63' : '#5f1e1e',
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
