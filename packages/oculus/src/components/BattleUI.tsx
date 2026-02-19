'use client';

/**
 * BattleUI — Turn-based combat interface
 *
 * Triggered by COMBAT_STARTED, hidden by COMBAT_ENDED.
 * User clicks emit SPELL_CAST events → LUDUS handles logic.
 *
 * Thin wrapper: reads store + emits events, delegates rendering
 * to the slot-based EncounterPanel.
 */

import React, { useRef, useEffect } from 'react';
import { useOculusStore } from '../store/useOculusStore';
import { useOculus } from '../OculusProvider';
import { GameEvents } from '@dendrovia/shared';
import { EncounterPanel } from './EncounterPanel';
import { ProgressBar } from './primitives/ProgressBar';
import { IconBadge } from './primitives/IconBadge';

const bugIcons: Record<string, string> = {
  'null-pointer': '\u{1F4A5}',
  'memory-leak': '\u{1F4A7}',
  'race-condition': '\u{26A1}',
  'off-by-one': '\u{1F522}',
};

const bugColors: Record<string, string> = {
  'null-pointer': 'var(--oculus-bug-null)',
  'memory-leak': 'var(--oculus-bug-memory)',
  'race-condition': 'var(--oculus-bug-race)',
  'off-by-one': 'var(--oculus-bug-offbyone)',
};

export function BattleUI() {
  const battle = useOculusStore((s) => s.battle);
  const mana = useOculusStore((s) => s.mana);
  const playerSpells = useOculusStore((s) => s.playerSpells);
  const { eventBus } = useOculus();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battle.log.length]);

  if (!battle.active || !battle.enemy) return null;

  const { enemy, log } = battle;
  const bugIcon = bugIcons[enemy.type] || '\u{1F41B}';
  const bugColor = bugColors[enemy.type] || 'var(--oculus-danger)';

  const handleAttack = () => {
    eventBus.emit(GameEvents.SPELL_CAST, {
      spellId: 'basic-attack',
      targetId: enemy.id,
      casterId: 'player',
    });
  };

  const handleSpell = (spellId: string) => {
    eventBus.emit(GameEvents.SPELL_CAST, {
      spellId,
      targetId: enemy.id,
      casterId: 'player',
    });
  };

  return (
    <EncounterPanel
      type="combat"
      active={battle.active}
      slots={{
        portrait: (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--oculus-space-sm)', marginBottom: 'var(--oculus-space-sm)' }}>
            <IconBadge icon={bugIcon} label={enemy.type} color={bugColor} size="lg" />
            <div>
              <div style={{ fontWeight: 600, color: bugColor, textTransform: 'capitalize' }}>
                {enemy.type.replace(/-/g, ' ')}
              </div>
              <div style={{ fontSize: 'var(--oculus-font-xs)', color: 'var(--oculus-text-muted)' }}>
                Severity {enemy.severity}/5
              </div>
            </div>
          </div>
        ),

        status: (
          <ProgressBar value={enemy.health} max={enemy.health} variant="health" height={10} showLabel flash />
        ),

        actions: (
          <>
            <button className="oculus-button oculus-button--primary" onClick={handleAttack}>
              Attack
            </button>
            {playerSpells.map((spell) => (
              <button
                key={spell.id}
                className="oculus-button"
                onClick={() => handleSpell(spell.id)}
                disabled={mana < spell.manaCost}
                title={spell.description}
                aria-label={`${spell.name} - ${spell.manaCost} mana`}
              >
                {spell.name}
                <span style={{
                  fontSize: 'var(--oculus-font-xs)',
                  color: 'var(--oculus-mana)',
                  marginLeft: 'var(--oculus-space-xs)',
                }}>
                  {spell.manaCost}
                </span>
              </button>
            ))}
          </>
        ),

        feedback: (
          <>
            <div className="oculus-heading" style={{ fontSize: 'var(--oculus-font-xs)' }}>Battle Log</div>
            {log.map((entry, i) => (
              <div
                key={i}
                style={{
                  fontSize: 'var(--oculus-font-xs)',
                  color: 'var(--oculus-text-muted)',
                  lineHeight: 1.6,
                  animation: 'oculus-slide-up var(--oculus-transition-fast)',
                }}
              >
                {entry}
              </div>
            ))}
            <div ref={logEndRef} />
          </>
        ),
      }}
    />
  );
}
