'use client';

/**
 * Battle Arena Gym — Client component.
 *
 * Full combat simulation. Start a mock encounter, cast spells,
 * watch battle log populate, see enemy HP decrease, and experience
 * victory/defeat flows — all via the EventBus -> Zustand pipeline.
 * Uses GymShell for layout, wiretap, and state dashboard.
 */

import { useState, useCallback } from 'react';
import { GameEvents } from '@dendrovia/shared';
import type { EventBus } from '@dendrovia/shared';
import { HUD, useOculusStore } from '@dendrovia/oculus';
import { GymShell, GymControlPanel } from '../_gym-kit';
import type { GymPageConfig } from '../_gym-kit';
import { MOCK_QUESTS, MOCK_TOPOLOGY, MOCK_HOTSPOTS } from '../../../_providers/mock-data';

const CONFIG: GymPageConfig = {
  title: 'Battle Arena',
  subtitle: 'Start mock combat, cast spells, watch the battle log, and experience victory or defeat.',
  icon: '',
  backHref: '/',
  backLabel: 'OCULUS',
  viewportGradient: 'linear-gradient(135deg, #1a0a0a 0%, #2e1a1a 50%, #0a0a0a 100%)',
  viewportWatermark: '\u2694\uFE0F',
  watchedState: ['health', 'maxHealth', 'mana', 'maxMana', 'level', 'activePanel'],
};

const ENEMY_NAMES = ['NullPointerBug', 'MemoryLeakWorm', 'RaceConditionWraith', 'OffByOneGoblin'];
const ELEMENTS = ['fire', 'water', 'earth', 'air', 'none'] as const;

function arenaSeed() {
  const s = useOculusStore.getState();
  s.setQuests(MOCK_QUESTS);
  s.setTopology(MOCK_TOPOLOGY);
  s.setHotspots(MOCK_HOTSPOTS);
  s.setHealth(100, 100);
  s.setMana(50, 60);
}

// ── Controls ────────────────────────────────────────────

function ArenaControls({ eventBus }: { eventBus: EventBus }) {
  const [turn, setTurn] = useState(0);
  const [enemyHp, setEnemyHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [inCombat, setInCombat] = useState(false);

  const startFight = useCallback(() => {
    setInCombat(true);
    setTurn(0);
    setEnemyHp(100);
    setPlayerHp(100);
    const name = ENEMY_NAMES[Math.floor(Math.random() * ENEMY_NAMES.length)] ?? 'NullPointerBug';
    eventBus.emit(GameEvents.COMBAT_STARTED, {
      monsterId: 'arena-enemy', monsterName: name, monsterType: 'null-pointer', severity: 3,
    });
    eventBus.emit(GameEvents.HEALTH_CHANGED, {
      entityId: 'player', current: 100, max: 100, delta: 0,
    });
  }, [eventBus]);

  const playerAttack = useCallback(() => {
    const newTurn = turn + 1;
    setTurn(newTurn);

    eventBus.emit(GameEvents.COMBAT_TURN_START, { turn: newTurn, phase: 'player' });
    const dmg = 10 + Math.floor(Math.random() * 15);
    const crit = Math.random() < 0.2;
    const el = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)] ?? 'none';
    eventBus.emit(GameEvents.DAMAGE_DEALT, {
      attackerId: 'player', targetId: 'arena-enemy', damage: crit ? dmg * 2 : dmg, isCritical: crit, element: el,
    });
    const newEnemyHp = Math.max(0, enemyHp - (crit ? dmg * 2 : dmg));
    setEnemyHp(newEnemyHp);

    if (newEnemyHp <= 0) {
      eventBus.emit(GameEvents.COMBAT_ENDED, { outcome: 'victory', turns: newTurn, xpGained: 50 });
      setInCombat(false);
      return;
    }

    eventBus.emit(GameEvents.COMBAT_TURN_START, { turn: newTurn, phase: 'enemy' });
    const eDmg = 5 + Math.floor(Math.random() * 10);
    eventBus.emit(GameEvents.DAMAGE_DEALT, {
      attackerId: 'arena-enemy', targetId: 'player', damage: eDmg, isCritical: false, element: 'none',
    });
    const newPlayerHp = Math.max(0, playerHp - eDmg);
    setPlayerHp(newPlayerHp);
    eventBus.emit(GameEvents.HEALTH_CHANGED, {
      entityId: 'player', current: newPlayerHp, max: 100, delta: -eDmg,
    });

    if (newPlayerHp <= 0) {
      eventBus.emit(GameEvents.COMBAT_ENDED, { outcome: 'defeat', turns: newTurn });
      setInCombat(false);
    }

    eventBus.emit(GameEvents.COMBAT_TURN_END, { turn: newTurn, phase: 'enemy' });
  }, [eventBus, turn, enemyHp, playerHp]);

  const castSpell = useCallback(() => {
    const newTurn = turn + 1;
    setTurn(newTurn);

    eventBus.emit(GameEvents.COMBAT_TURN_START, { turn: newTurn, phase: 'player' });
    eventBus.emit(GameEvents.SPELL_RESOLVED, {
      spellId: 'git-bisect', casterId: 'player', targetId: 'arena-enemy', effectType: 'damage', value: 30,
    });

    const newEnemyHp = Math.max(0, enemyHp - 30);
    setEnemyHp(newEnemyHp);

    if (newEnemyHp <= 0) {
      eventBus.emit(GameEvents.COMBAT_ENDED, { outcome: 'victory', turns: newTurn, xpGained: 75 });
      setInCombat(false);
      return;
    }

    eventBus.emit(GameEvents.COMBAT_TURN_START, { turn: newTurn, phase: 'enemy' });
    const eDmg = 8 + Math.floor(Math.random() * 8);
    eventBus.emit(GameEvents.DAMAGE_DEALT, {
      attackerId: 'arena-enemy', targetId: 'player', damage: eDmg, isCritical: false, element: 'none',
    });
    const newPlayerHp = Math.max(0, playerHp - eDmg);
    setPlayerHp(newPlayerHp);
    eventBus.emit(GameEvents.HEALTH_CHANGED, {
      entityId: 'player', current: newPlayerHp, max: 100, delta: -eDmg,
    });

    if (newPlayerHp <= 0) {
      eventBus.emit(GameEvents.COMBAT_ENDED, { outcome: 'defeat', turns: newTurn });
      setInCombat(false);
    }

    eventBus.emit(GameEvents.COMBAT_TURN_END, { turn: newTurn, phase: 'enemy' });
  }, [eventBus, turn, enemyHp, playerHp]);

  const btnStyle = { padding: '0.5rem 1rem', border: '1px solid #444', borderRadius: 4, background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '0.85rem' } as const;
  const btnDisabled = { ...btnStyle, opacity: 0.3, cursor: 'not-allowed' } as const;

  return (
    <GymControlPanel title="Arena Controls">
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.85rem' }}>
        <span>Turn: {turn}</span>
        <span>Enemy HP: {enemyHp}</span>
        <span>Player HP: {playerHp}</span>
        <span style={{ color: inCombat ? '#22c55e' : '#666' }}>{inCombat ? 'IN COMBAT' : 'IDLE'}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button style={inCombat ? btnDisabled : btnStyle} onClick={startFight} disabled={inCombat}>
          Start Fight
        </button>
        <button style={!inCombat ? btnDisabled : btnStyle} onClick={playerAttack} disabled={!inCombat}>
          Attack
        </button>
        <button style={!inCombat ? btnDisabled : btnStyle} onClick={castSpell} disabled={!inCombat}>
          Cast Git Bisect (30 dmg)
        </button>
      </div>
    </GymControlPanel>
  );
}

// ── Exported Gym Component ──────────────────────────────

export function BattleArenaGym() {
  return (
    <GymShell config={CONFIG} seed={arenaSeed}>
      {({ eventBus }) => ({
        controls: <ArenaControls eventBus={eventBus} />,
        viewport: <HUD />,
      })}
    </GymShell>
  );
}
