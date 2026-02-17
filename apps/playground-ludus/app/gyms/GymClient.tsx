'use client';

import {
  computeStatsAtLevel,
  createCharacter,
  createMonster,
  createRngState,
  executeTurn,
  getAvailableActions,
  initBattle,
} from '@dendrovia/ludus';
import { OrnateFrame, ProgressBar, StatLabel } from '@dendrovia/oculus';
import type {
  BattleState,
  BugType,
  CharacterClass,
  CombatEndedEvent,
  CombatStartedEvent,
  HealthChangedEvent,
  ManaChangedEvent,
} from '@dendrovia/shared';
import { GameEvents, getEventBus } from '@dendrovia/shared';
import { useCallback, useMemo, useRef, useState } from 'react';
import ActionPanel from './components/ActionPanel';
import BattleLog from './components/BattleLog';
import EnemyCard from './components/EnemyCard';
import MockEventPanel from './components/MockEventPanel';
import PlayerCard from './components/PlayerCard';
import { useGamePersistence } from './hooks/useGamePersistence';

const CLASS_OPTIONS: { value: CharacterClass; label: string }[] = [
  { value: 'tank', label: 'Tank (Infrastructure)' },
  { value: 'healer', label: 'Healer (Bug Fixer)' },
  { value: 'dps', label: 'DPS (Feature Dev)' },
];

const BUG_OPTIONS: { value: BugType; label: string }[] = [
  { value: 'null-pointer', label: 'NullPointerException' },
  { value: 'memory-leak', label: 'MemoryLeak' },
  { value: 'race-condition', label: 'RaceCondition' },
  { value: 'off-by-one', label: 'OffByOneError' },
];

const selectStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem',
  borderRadius: '4px',
  border: '1px solid #333',
  background: '#1a1a1a',
  color: '#ededed',
  fontSize: '0.85rem',
  width: '100%',
};

const inputStyle: React.CSSProperties = {
  ...selectStyle,
};

export default function GymClient(): React.JSX.Element {
  // Setup state
  const [charClass, setCharClass] = useState<CharacterClass>('tank');
  const [charLevel, setCharLevel] = useState(5);
  const [charName, setCharName] = useState('Hero');
  const [bugType, setBugType] = useState<BugType>('null-pointer');
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [seed, setSeed] = useState(42);

  // Battle state
  const [battleState, setBattleState] = useState<BattleState | null>(null);

  // Persistence
  const { hydrated, savedCharacter, saveGame, loadCharacter, exportJSON, importJSON } = useGamePersistence();
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showPersistence, setShowPersistence] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview stats
  const previewStats = useMemo(() => computeStatsAtLevel(charClass, charLevel), [charClass, charLevel]);

  // Preview monster
  const previewMonster = useMemo(() => {
    const rng = createRngState(seed);
    const [monster] = createMonster(bugType, severity, 0, rng);
    return monster;
  }, [bugType, severity, seed]);

  const startBattle = useCallback(() => {
    const player = createCharacter(charClass, charName, charLevel);
    const rng = createRngState(seed);
    const [monster] = createMonster(bugType, severity, 0, rng);
    const initial = initBattle(player, [monster], seed);
    setBattleState(initial);

    // Emit combat started event
    const bus = getEventBus();
    bus.emit<CombatStartedEvent>(GameEvents.COMBAT_STARTED, {
      monsterId: monster.id,
      monsterName: monster.name,
      monsterType: monster.type,
      severity: monster.severity,
    });
  }, [charClass, charName, charLevel, bugType, severity, seed]);

  const doAction = useCallback(
    (action: import('@dendrovia/shared').Action) => {
      if (!battleState) return;

      const newState = executeTurn(battleState, action);

      // Emit health/mana changed events
      const bus = getEventBus();
      if (newState.player.stats.health !== battleState.player.stats.health) {
        bus.emit<HealthChangedEvent>(GameEvents.HEALTH_CHANGED, {
          entityId: newState.player.id,
          current: newState.player.stats.health,
          max: newState.player.stats.maxHealth,
          delta: newState.player.stats.health - battleState.player.stats.health,
        });
      }
      if (newState.player.stats.mana !== battleState.player.stats.mana) {
        bus.emit<ManaChangedEvent>(GameEvents.MANA_CHANGED, {
          entityId: newState.player.id,
          current: newState.player.stats.mana,
          max: newState.player.stats.maxMana,
          delta: newState.player.stats.mana - battleState.player.stats.mana,
        });
      }

      // If terminal, emit combat ended
      if (newState.phase.type === 'VICTORY' || newState.phase.type === 'DEFEAT') {
        bus.emit<CombatEndedEvent>(GameEvents.COMBAT_ENDED, {
          outcome: newState.phase.type === 'VICTORY' ? 'victory' : 'defeat',
          turns: newState.turn,
          xpGained: newState.phase.type === 'VICTORY' ? newState.phase.xpGained : undefined,
        });
      }

      setBattleState(newState);
    },
    [battleState],
  );

  const resetBattle = useCallback(() => {
    setBattleState(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!battleState) return;
    setSaveStatus('Saving...');
    await saveGame(battleState.player);
    setSaveStatus('Saved');
    setTimeout(() => setSaveStatus(null), 2000);
  }, [battleState, saveGame]);

  const handleLoad = useCallback(() => {
    const char = loadCharacter();
    if (!char) return;
    setCharName(char.name);
    setCharClass(char.class);
    setCharLevel(char.level);
  }, [loadCharacter]);

  const handleExport = useCallback(async () => {
    const json = await exportJSON();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dendrovia-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportJSON]);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const json = await file.text();
      await importJSON(json);
    },
    [importJSON],
  );

  const isSetup = battleState === null;
  const isTerminal = battleState?.phase.type === 'VICTORY' || battleState?.phase.type === 'DEFEAT';
  const actions = battleState ? getAvailableActions(battleState) : null;

  return (
    <div>
      {isSetup ? (
        /* ─── SETUP PHASE ─── */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Character Setup */}
          <OrnateFrame pillar="ludus" variant="panel">
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Character</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Name</label>
              <input style={inputStyle} value={charName} onChange={(e) => setCharName(e.target.value)} />

              <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Class</label>
              <select
                style={selectStyle}
                value={charClass}
                onChange={(e) => setCharClass(e.target.value as CharacterClass)}
              >
                {CLASS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Level: {charLevel}</label>
              <input
                type="range"
                min={1}
                max={30}
                value={charLevel}
                onChange={(e) => setCharLevel(Number(e.target.value))}
              />

              <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Seed</label>
              <input style={inputStyle} type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))} />
            </div>

            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.6 }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Preview Stats</div>
              <ProgressBar
                value={previewStats.maxHealth}
                max={previewStats.maxHealth}
                variant="health"
                showLabel
                label={`HP ${previewStats.maxHealth}/${previewStats.maxHealth}`}
              />
              <div style={{ marginTop: 'var(--oculus-space-xs)' }}>
                <ProgressBar
                  value={previewStats.maxMana}
                  max={previewStats.maxMana}
                  variant="mana"
                  showLabel
                  label={`MP ${previewStats.maxMana}/${previewStats.maxMana}`}
                />
              </div>
              <div style={{ marginTop: 'var(--oculus-space-xs)' }}>
                <StatLabel label="ATK" value={previewStats.attack} />
                <StatLabel label="DEF" value={previewStats.defense} />
                <StatLabel label="SPD" value={previewStats.speed} />
              </div>
            </div>
          </OrnateFrame>

          {/* Enemy Setup */}
          <OrnateFrame pillar="ludus" variant="panel">
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Enemy</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Bug Type</label>
              <select style={selectStyle} value={bugType} onChange={(e) => setBugType(e.target.value as BugType)}>
                {BUG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Severity: {severity}</label>
              <select
                style={selectStyle}
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>
                    Severity {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', opacity: 0.6 }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Preview: {previewMonster.name}</div>
              <ProgressBar
                value={previewMonster.stats.maxHealth}
                max={previewMonster.stats.maxHealth}
                variant="custom"
                color="#F97316"
                showLabel
                label={`HP ${previewMonster.stats.maxHealth}/${previewMonster.stats.maxHealth}`}
              />
              <div style={{ marginTop: 'var(--oculus-space-xs)' }}>
                <StatLabel label="ATK" value={previewMonster.stats.attack} />
                <StatLabel label="DEF" value={previewMonster.stats.defense} />
                <StatLabel label="SPD" value={previewMonster.stats.speed} />
                <StatLabel label="XP" value={previewMonster.xpReward} color="#ffe66d" />
              </div>
            </div>
          </OrnateFrame>

          {/* Saved Character Banner */}
          {hydrated && savedCharacter && (
            <OrnateFrame pillar="ludus" variant="compact" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.15rem' }}>Saved Character</div>
                  <div style={{ fontSize: '0.9rem' }}>
                    {savedCharacter.name} — Lv {savedCharacter.level} {savedCharacter.class}
                  </div>
                </div>
                <button
                  onClick={handleLoad}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #2563EB',
                    background: 'transparent',
                    color: '#3B82F6',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Load
                </button>
              </div>
            </OrnateFrame>
          )}

          {/* Start Button */}
          <div style={{ gridColumn: '1 / -1' }}>
            <button
              onClick={startBattle}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px solid var(--pillar-accent)',
                background: 'transparent',
                color: 'var(--pillar-accent)',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Start Battle
            </button>
          </div>
        </div>
      ) : (
        /* ─── COMBAT PHASE ─── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Turn indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', opacity: 0.5 }}>
              Turn {battleState.turn} — {battleState.phase.type.replace('_', ' ')}
            </span>
            <button
              onClick={resetBattle}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                border: '1px solid #333',
                background: '#1a1a1a',
                color: '#ededed',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              New Battle
            </button>
          </div>

          {/* Arena */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <PlayerCard player={battleState.player} />
            <EnemyCard enemy={battleState.enemies[0]!} />
          </div>

          {/* Result Overlay */}
          {isTerminal && (
            <OrnateFrame
              pillar="ludus"
              variant="modal"
              header={
                <span style={{ color: battleState.phase.type === 'VICTORY' ? '#22C55E' : '#EF4444' }}>
                  {battleState.phase.type === 'VICTORY' ? 'VICTORY' : 'DEFEAT'}
                </span>
              }
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                  Completed in {battleState.turn} turns
                  {battleState.phase.type === 'VICTORY' && battleState.phase.xpGained != null && (
                    <span> — {battleState.phase.xpGained} XP earned</span>
                  )}
                </div>
                <div
                  style={{
                    marginTop: '1rem',
                    display: 'flex',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={resetBattle}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '6px',
                      border: '1px solid #333',
                      background: '#1a1a1a',
                      color: '#ededed',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    New Battle
                  </button>
                  <button
                    onClick={startBattle}
                    style={{
                      padding: '0.5rem 1.25rem',
                      borderRadius: '6px',
                      border: '1px solid var(--pillar-accent)',
                      background: 'transparent',
                      color: 'var(--pillar-accent)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                  >
                    Rematch (same seed)
                  </button>
                  {battleState.phase.type === 'VICTORY' && (
                    <button
                      onClick={handleSave}
                      disabled={saveStatus === 'Saving...'}
                      style={{
                        padding: '0.5rem 1.25rem',
                        borderRadius: '6px',
                        border: '1px solid #22C55E',
                        background: 'transparent',
                        color: '#22C55E',
                        cursor: saveStatus === 'Saving...' ? 'wait' : 'pointer',
                        fontSize: '0.85rem',
                        opacity: saveStatus === 'Saving...' ? 0.5 : 1,
                      }}
                    >
                      {saveStatus ?? 'Save Character'}
                    </button>
                  )}
                </div>
              </div>
            </OrnateFrame>
          )}

          {/* Actions */}
          {!isTerminal && actions && (
            <ActionPanel
              actions={actions}
              onAttack={() => doAction({ type: 'ATTACK', targetIndex: 0 })}
              onSpell={(spellId) => doAction({ type: 'CAST_SPELL', spellId, targetIndex: 0 })}
              onDefend={() => doAction({ type: 'DEFEND' })}
              disabled={battleState.phase.type !== 'PLAYER_TURN'}
            />
          )}

          {/* Battle Log */}
          <BattleLog log={battleState.log} />
        </div>
      )}

      {/* Mock Event Panel */}
      <MockEventPanel />

      {/* Save / Load Panel */}
      <div style={{ marginTop: '1rem', border: '1px solid #222', borderRadius: '8px', background: '#111' }}>
        <button
          onClick={() => setShowPersistence(!showPersistence)}
          style={{
            width: '100%',
            padding: '0.6rem 1rem',
            background: 'transparent',
            border: 'none',
            color: '#ededed',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
          }}
        >
          <span>Save / Load</span>
          <span style={{ opacity: 0.4 }}>{showPersistence ? '\u25B2' : '\u25BC'}</span>
        </button>

        {showPersistence && (
          <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleExport}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '4px',
                border: '1px solid #333',
                background: '#1a1a1a',
                color: '#ededed',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              Export Save (JSON)
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '4px',
                border: '1px solid #333',
                background: '#1a1a1a',
                color: '#ededed',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              Import Save
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            {hydrated && savedCharacter && (
              <span style={{ fontSize: '0.75rem', opacity: 0.4, alignSelf: 'center' }}>
                Last saved: {savedCharacter.name} Lv {savedCharacter.level}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Balance Sim link */}
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <a href="/gyms/balance" style={{ fontSize: '0.8rem', opacity: 0.5, textDecoration: 'underline' }}>
          Balance Simulator →
        </a>
      </div>
    </div>
  );
}
