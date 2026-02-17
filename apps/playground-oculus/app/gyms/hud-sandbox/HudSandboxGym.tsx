'use client';

/**
 * HUD Sandbox Gym — Client component.
 *
 * Interactive sandbox for manipulating HUD state. Sliders control
 * health/mana/XP, buttons trigger camera mode switches and quest updates.
 * Uses GymShell for layout, wiretap, and state dashboard.
 */

import { HUD, useOculusStore } from '@dendrovia/oculus';
import type {
  EventBus,
  ExperienceGainedEvent,
  HealthChangedEvent,
  LevelUpEvent,
  ManaChangedEvent,
  QuestUpdatedEvent,
} from '@dendrovia/shared';
import { GameEvents } from '@dendrovia/shared';
import { useCallback, useState } from 'react';
import type { GymPageConfig } from '../_gym-kit';
import { GymControlPanel, GymShell } from '../_gym-kit';

const CONFIG: GymPageConfig = {
  title: 'HUD Sandbox',
  subtitle: 'Manipulate HUD state via EventBus events. Sliders and buttons fire real events.',
  icon: '',
  backHref: '/gyms',
  backLabel: 'Gyms',
  viewportGradient: 'linear-gradient(135deg, #0a0f0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
  viewportWatermark: '\u{1F333}',
  watchedState: ['health', 'maxHealth', 'mana', 'maxMana', 'level', 'experience', 'cameraMode', 'activePanel'],
};

// ── Controls ────────────────────────────────────────────

function SandboxControls({ eventBus }: { eventBus: EventBus }) {
  const [health, setHealth] = useState(100);
  const [maxHealth] = useState(120);
  const [mana, setMana] = useState(50);
  const [maxMana] = useState(60);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  const emitHealth = useCallback(
    (val: number) => {
      setHealth(val);
      eventBus.emit<HealthChangedEvent>(GameEvents.HEALTH_CHANGED, {
        entityId: 'player',
        current: val,
        max: maxHealth,
        delta: val - health,
      });
    },
    [eventBus, health, maxHealth],
  );

  const emitMana = useCallback(
    (val: number) => {
      setMana(val);
      eventBus.emit<ManaChangedEvent>(GameEvents.MANA_CHANGED, {
        entityId: 'player',
        current: val,
        max: maxMana,
        delta: val - mana,
      });
    },
    [eventBus, mana, maxMana],
  );

  const emitXp = useCallback(
    (val: number) => {
      setXp(val);
      eventBus.emit<ExperienceGainedEvent>(GameEvents.EXPERIENCE_GAINED, {
        characterId: 'player',
        amount: val - xp,
        totalExperience: val,
      });
    },
    [eventBus, xp],
  );

  const emitLevelUp = useCallback(() => {
    const newLevel = level + 1;
    setLevel(newLevel);
    eventBus.emit<LevelUpEvent>(GameEvents.LEVEL_UP, {
      characterId: 'player',
      newLevel,
      statChanges: { health: 10, mana: 5 },
    });
  }, [eventBus, level]);

  const emitQuestComplete = useCallback(() => {
    eventBus.emit<QuestUpdatedEvent>(GameEvents.QUEST_UPDATED, {
      questId: 'q1',
      status: 'completed',
      title: 'Hunt the Null Pointer',
      description: 'Completed!',
    });
  }, [eventBus]);

  const emitDamage = useCallback(() => {
    const dmg = Math.min(health, 15);
    const newHealth = health - dmg;
    setHealth(newHealth);
    eventBus.emit<HealthChangedEvent>(GameEvents.HEALTH_CHANGED, {
      entityId: 'player',
      current: newHealth,
      max: maxHealth,
      delta: -dmg,
    });
  }, [eventBus, health, maxHealth]);

  const toggleCamera = useCallback(() => {
    const s = useOculusStore.getState();
    s.setCameraMode(s.cameraMode === 'falcon' ? 'player' : 'falcon');
  }, []);

  const controlStyle = { display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' } as const;
  const btnStyle = {
    padding: '0.4rem 0.8rem',
    border: '1px solid #444',
    borderRadius: 4,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '0.8rem',
  } as const;

  return (
    <GymControlPanel>
      <div style={controlStyle}>
        <span style={{ width: 60 }}>Health</span>
        <input
          type="range"
          min={0}
          max={maxHealth}
          value={health}
          onChange={(e) => emitHealth(+e.target.value)}
          style={{ flex: 1 }}
        />
        <span style={{ width: 40, textAlign: 'right' }}>{health}</span>
      </div>
      <div style={controlStyle}>
        <span style={{ width: 60 }}>Mana</span>
        <input
          type="range"
          min={0}
          max={maxMana}
          value={mana}
          onChange={(e) => emitMana(+e.target.value)}
          style={{ flex: 1 }}
        />
        <span style={{ width: 40, textAlign: 'right' }}>{mana}</span>
      </div>
      <div style={controlStyle}>
        <span style={{ width: 60 }}>XP</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={xp}
          onChange={(e) => emitXp(+e.target.value)}
          style={{ flex: 1 }}
        />
        <span style={{ width: 40, textAlign: 'right' }}>{xp}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button style={btnStyle} onClick={emitDamage}>
          Take 15 Damage
        </button>
        <button style={btnStyle} onClick={emitLevelUp}>
          Level Up (now {level})
        </button>
        <button style={btnStyle} onClick={emitQuestComplete}>
          Complete Quest
        </button>
        <button style={btnStyle} onClick={toggleCamera}>
          Toggle Camera Mode
        </button>
      </div>
    </GymControlPanel>
  );
}

// ── Exported Gym Component ──────────────────────────────

export function HudSandboxGym() {
  return (
    <GymShell config={CONFIG}>
      {({ eventBus }) => ({
        controls: <SandboxControls eventBus={eventBus} />,
        viewport: <HUD />,
      })}
    </GymShell>
  );
}
