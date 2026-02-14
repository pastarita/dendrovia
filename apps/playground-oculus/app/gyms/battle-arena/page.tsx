'use client';

/**
 * Gym: Battle Arena
 *
 * Full combat simulation. Start a mock encounter, cast spells,
 * watch battle log populate, see enemy HP decrease, and experience
 * victory/defeat flows — all via the EventBus → Zustand pipeline.
 */

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { EventBus, GameEvents } from '@dendrovia/shared';
import type {
  CombatStartedEvent,
  CombatEndedEvent,
  DamageDealtEvent,
  HealthChangedEvent,
  CombatTurnEvent,
  SpellResolvedEvent,
} from '@dendrovia/shared';
import { OculusProvider, HUD, useOculusStore } from '@dendrovia/oculus';
import { MOCK_QUESTS, MOCK_TOPOLOGY, MOCK_HOTSPOTS } from '../../components/mock-data';

const ENEMY_NAMES = ['NullPointerBug', 'MemoryLeakWorm', 'RaceConditionWraith', 'OffByOneGoblin'];
const ELEMENTS = ['fire', 'water', 'earth', 'air', 'none'] as const;

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
    const name = ENEMY_NAMES[Math.floor(Math.random() * ENEMY_NAMES.length)];
    eventBus.emit<CombatStartedEvent>(GameEvents.COMBAT_STARTED, {
      monsterId: 'arena-enemy',
      monsterName: name,
      monsterType: 'null-pointer',
      severity: 3,
    });
    eventBus.emit<HealthChangedEvent>(GameEvents.HEALTH_CHANGED, {
      entityId: 'player', current: 100, max: 100, delta: 0,
    });
  }, [eventBus]);

  const playerAttack = useCallback(() => {
    const newTurn = turn + 1;
    setTurn(newTurn);

    // Player turn
    eventBus.emit<CombatTurnEvent>(GameEvents.COMBAT_TURN_START, { turn: newTurn, phase: 'player' });
    const dmg = 10 + Math.floor(Math.random() * 15);
    const crit = Math.random() < 0.2;
    const el = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
    eventBus.emit<DamageDealtEvent>(GameEvents.DAMAGE_DEALT, {
      attackerId: 'player', targetId: 'arena-enemy', damage: crit ? dmg * 2 : dmg, isCritical: crit, element: el,
    });
    const newEnemyHp = Math.max(0, enemyHp - (crit ? dmg * 2 : dmg));
    setEnemyHp(newEnemyHp);

    if (newEnemyHp <= 0) {
      eventBus.emit<CombatEndedEvent>(GameEvents.COMBAT_ENDED, { outcome: 'victory', turns: newTurn, xpGained: 50 });
      setInCombat(false);
      return;
    }

    // Enemy turn
    eventBus.emit<CombatTurnEvent>(GameEvents.COMBAT_TURN_START, { turn: newTurn, phase: 'enemy' });
    const eDmg = 5 + Math.floor(Math.random() * 10);
    eventBus.emit<DamageDealtEvent>(GameEvents.DAMAGE_DEALT, {
      attackerId: 'arena-enemy', targetId: 'player', damage: eDmg, isCritical: false, element: 'none',
    });
    const newPlayerHp = Math.max(0, playerHp - eDmg);
    setPlayerHp(newPlayerHp);
    eventBus.emit<HealthChangedEvent>(GameEvents.HEALTH_CHANGED, {
      entityId: 'player', current: newPlayerHp, max: 100, delta: -eDmg,
    });

    if (newPlayerHp <= 0) {
      eventBus.emit<CombatEndedEvent>(GameEvents.COMBAT_ENDED, { outcome: 'defeat', turns: newTurn });
      setInCombat(false);
    }

    eventBus.emit<CombatTurnEvent>(GameEvents.COMBAT_TURN_END, { turn: newTurn, phase: 'enemy' });
  }, [eventBus, turn, enemyHp, playerHp]);

  const castSpell = useCallback(() => {
    const newTurn = turn + 1;
    setTurn(newTurn);

    eventBus.emit<CombatTurnEvent>(GameEvents.COMBAT_TURN_START, { turn: newTurn, phase: 'player' });
    eventBus.emit<SpellResolvedEvent>(GameEvents.SPELL_RESOLVED, {
      spellId: 'git-bisect', casterId: 'player', targetId: 'arena-enemy', effectType: 'damage', value: 30,
    });

    const newEnemyHp = Math.max(0, enemyHp - 30);
    setEnemyHp(newEnemyHp);

    if (newEnemyHp <= 0) {
      eventBus.emit<CombatEndedEvent>(GameEvents.COMBAT_ENDED, { outcome: 'victory', turns: newTurn, xpGained: 75 });
      setInCombat(false);
      return;
    }

    // Enemy retaliates
    eventBus.emit<CombatTurnEvent>(GameEvents.COMBAT_TURN_START, { turn: newTurn, phase: 'enemy' });
    const eDmg = 8 + Math.floor(Math.random() * 8);
    eventBus.emit<DamageDealtEvent>(GameEvents.DAMAGE_DEALT, {
      attackerId: 'arena-enemy', targetId: 'player', damage: eDmg, isCritical: false, element: 'none',
    });
    const newPlayerHp = Math.max(0, playerHp - eDmg);
    setPlayerHp(newPlayerHp);
    eventBus.emit<HealthChangedEvent>(GameEvents.HEALTH_CHANGED, {
      entityId: 'player', current: newPlayerHp, max: 100, delta: -eDmg,
    });

    if (newPlayerHp <= 0) {
      eventBus.emit<CombatEndedEvent>(GameEvents.COMBAT_ENDED, { outcome: 'defeat', turns: newTurn });
      setInCombat(false);
    }

    eventBus.emit<CombatTurnEvent>(GameEvents.COMBAT_TURN_END, { turn: newTurn, phase: 'enemy' });
  }, [eventBus, turn, enemyHp, playerHp]);

  const btnStyle = { padding: '0.5rem 1rem', border: '1px solid #444', borderRadius: 4, background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '0.85rem' } as const;
  const btnDisabled = { ...btnStyle, opacity: 0.3, cursor: 'not-allowed' } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: '#111', borderRadius: 8, border: '1px solid #222' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Arena Controls</h3>
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
    </div>
  );
}

function ArenaContent({ eventBus }: { eventBus: EventBus }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <ArenaControls eventBus={eventBus} />
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '60vh',
          minHeight: 400,
          background: 'linear-gradient(135deg, #1a0a0a 0%, #2e1a1a 50%, #0a0a0a 100%)',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #333',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          opacity: 0.1, fontSize: '8rem', userSelect: 'none', pointerEvents: 'none',
        }}>
          ⚔️
        </div>
        <HUD />
      </div>
    </div>
  );
}

function ArenaWrapper() {
  const eventBus = useMemo(() => new EventBus(true), []);

  useMemo(() => {
    const s = useOculusStore.getState();
    s.setQuests(MOCK_QUESTS);
    s.setTopology(MOCK_TOPOLOGY);
    s.setHotspots(MOCK_HOTSPOTS);
    s.setHealth(100, 100);
    s.setMana(50, 60);
  }, []);

  return (
    <OculusProvider eventBus={eventBus}>
      <ArenaContent eventBus={eventBus} />
    </OculusProvider>
  );
}

export default function BattleArenaPage() {
  return (
    <div>
      <Link href="/gyms" style={{ fontSize: '0.85rem', opacity: 0.5 }}>&larr; Gyms</Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
        Battle Arena
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '2rem' }}>
        Start mock combat, cast spells, watch the battle log, and experience victory or defeat.
      </p>
      <ArenaWrapper />
    </div>
  );
}
