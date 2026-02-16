'use client';

import type { Character } from '@dendrovia/shared';
import { OrnateFrame, ProgressBar, StatLabel, IconBadge } from '@dendrovia/oculus';

interface PlayerCardProps {
  player: Character;
}

const CLASS_LABELS: Record<string, string> = {
  tank: 'Tank (Infrastructure)',
  healer: 'Healer (Bug Fixer)',
  dps: 'DPS (Feature Dev)',
};

const STATUS_STYLE: Record<string, { icon: string; color: string }> = {
  shield: { icon: '\u{1F6E1}', color: '#3B82F6' },
  regen: { icon: '\u{1F49A}', color: '#22C55E' },
  'attack-up': { icon: '\u2694', color: '#3c6b63' },
  'defense-up': { icon: '\u{1F530}', color: '#3c6b63' },
  'speed-up': { icon: '\u26A1', color: '#3c6b63' },
};

const DEFAULT_STATUS = { icon: '\u2726', color: '#5f1e1e' };

export default function PlayerCard({ player }: PlayerCardProps): React.JSX.Element {
  return (
    <OrnateFrame pillar="ludus" variant="panel" style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{player.name}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{CLASS_LABELS[player.class] ?? player.class}</div>
        </div>
        <div style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', border: '1px solid #333', borderRadius: '4px' }}>
          Lv {player.level}
        </div>
      </div>

      <StatLabel label="HP" value={`${player.stats.health}/${player.stats.maxHealth}`} color="var(--oculus-health)" />
      <ProgressBar value={player.stats.health} max={player.stats.maxHealth} variant="health" flash />

      <div style={{ marginTop: 'var(--oculus-space-sm)' }}>
        <StatLabel label="MP" value={`${player.stats.mana}/${player.stats.maxMana}`} color="var(--oculus-mana)" />
        <ProgressBar value={player.stats.mana} max={player.stats.maxMana} variant="mana" />
      </div>

      <div style={{ marginTop: 'var(--oculus-space-sm)' }}>
        <StatLabel label="ATK" value={player.stats.attack} />
        <StatLabel label="DEF" value={player.stats.defense} />
        <StatLabel label="SPD" value={player.stats.speed} />
      </div>

      {player.statusEffects.length > 0 && (
        <div style={{ marginTop: 'var(--oculus-space-sm)', display: 'flex', gap: 'var(--oculus-space-xs)', flexWrap: 'wrap' }}>
          {player.statusEffects.map((fx, i) => {
            const info = STATUS_STYLE[fx.type] ?? DEFAULT_STATUS;
            return (
              <IconBadge key={i} icon={info.icon} label={`${fx.name} (${fx.remainingTurns}t)`} color={info.color} size="sm" />
            );
          })}
        </div>
      )}
    </OrnateFrame>
  );
}
