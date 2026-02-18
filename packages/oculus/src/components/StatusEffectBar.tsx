'use client';

/**
 * StatusEffectBar — Horizontal row of active buff/debuff badges
 *
 * Displayed below player stats in the HUD. Each effect shows an
 * emoji icon mapped from effectType and a remaining-turns counter.
 */

import React from 'react';
import { useOculusStore } from '../store/useOculusStore';
import { IconBadge } from './primitives/IconBadge';

const effectIcons: Record<string, string> = {
  poison: '\u{1F480}',   // skull
  shield: '\u{1F6E1}',   // shield
  regen: '\u{2728}',     // sparkles
  burn: '\u{1F525}',     // fire
  slow: '\u{1F40C}',     // snail
  stun: '\u{1F4AB}',     // dizzy
  bleed: '\u{1FA78}',    // drop of blood
};

const effectColors: Record<string, string> = {
  poison: 'var(--oculus-danger)',
  shield: 'var(--oculus-mana)',
  regen: 'var(--oculus-health)',
  burn: 'var(--oculus-amber)',
  slow: 'var(--oculus-text-muted)',
  stun: 'var(--oculus-peach)',
  bleed: 'var(--oculus-danger)',
};

export function StatusEffectBar() {
  const effects = useOculusStore((s) => s.statusEffects);

  if (effects.length === 0) return null;

  return (
    <div
      className="oculus-status-effects"
      style={{
        display: 'flex',
        gap: 'var(--oculus-space-xs)',
        marginTop: 'var(--oculus-space-xs)',
        flexWrap: 'wrap',
      }}
      role="status"
      aria-label="Active status effects"
    >
      {effects.map((effect) => {
        const icon = effectIcons[effect.effectType] || '\u{2B50}'; // fallback: star
        const color = effectColors[effect.effectType] || 'var(--oculus-amber)';

        return (
          <div
            key={effect.effectId}
            style={{
              position: 'relative',
              animation: 'oculus-fade-in var(--oculus-transition-fast)',
            }}
            title={`${effect.effectType} (${effect.remainingTurns} turns)`}
          >
            <IconBadge
              icon={icon}
              label={effect.effectType}
              color={color}
              size="sm"
            />
            <span
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                fontSize: 8,
                fontWeight: 700,
                color: 'var(--oculus-text)',
                background: 'var(--oculus-panel-bg)',
                borderRadius: '50%',
                width: 12,
                height: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--oculus-border)',
                lineHeight: 1,
              }}
              aria-label={`${effect.remainingTurns} turns remaining`}
            >
              {effect.remainingTurns}
            </span>
          </div>
        );
      })}
    </div>
  );
}
