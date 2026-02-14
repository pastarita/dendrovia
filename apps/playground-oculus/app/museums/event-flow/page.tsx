'use client';

/**
 * Museum: Event Flow Exhibition
 *
 * Interactive diagram showing all GameEvents, which pillar emits each,
 * which subscribes, and the payload type. Click an event to see its
 * TypeScript interface.
 */

import { useState } from 'react';
import Link from 'next/link';

interface EventInfo {
  name: string;
  key: string;
  emitter: string;
  subscribers: string[];
  payload: string;
  oculusHandled: boolean;
}

const EVENTS: EventInfo[] = [
  // ARCHITECTUS → LUDUS
  { name: 'PLAYER_MOVED', key: 'player:moved', emitter: 'ARCHITECTUS', subscribers: ['LUDUS', 'OCULUS'], payload: 'PlayerMovedEvent { position, branchId, velocity }', oculusHandled: true },
  { name: 'BRANCH_ENTERED', key: 'branch:entered', emitter: 'ARCHITECTUS', subscribers: ['LUDUS'], payload: 'BranchEnteredEvent { branchId, filePath, depth }', oculusHandled: false },
  { name: 'NODE_CLICKED', key: 'node:clicked', emitter: 'ARCHITECTUS', subscribers: ['LUDUS', 'OCULUS'], payload: 'NodeClickedEvent { nodeId, filePath, position }', oculusHandled: true },
  { name: 'COLLISION_DETECTED', key: 'collision:detected', emitter: 'ARCHITECTUS', subscribers: ['LUDUS'], payload: '{ entityA, entityB, point }', oculusHandled: false },

  // LUDUS → ARCHITECTUS
  { name: 'ENCOUNTER_TRIGGERED', key: 'encounter:triggered', emitter: 'LUDUS', subscribers: ['ARCHITECTUS'], payload: 'EncounterTriggeredEvent { type, severity, position }', oculusHandled: false },
  { name: 'DAMAGE_DEALT', key: 'damage:dealt', emitter: 'LUDUS', subscribers: ['ARCHITECTUS', 'OCULUS'], payload: 'DamageDealtEvent { attackerId, targetId, damage, isCritical, element }', oculusHandled: true },

  // LUDUS → OCULUS
  { name: 'HEALTH_CHANGED', key: 'health:changed', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'HealthChangedEvent { entityId, current, max, delta }', oculusHandled: true },
  { name: 'MANA_CHANGED', key: 'mana:changed', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'ManaChangedEvent { entityId, current, max, delta }', oculusHandled: true },
  { name: 'QUEST_UPDATED', key: 'quest:updated', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'QuestUpdatedEvent { questId, status, title, description }', oculusHandled: true },
  { name: 'COMBAT_STARTED', key: 'combat:started', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'CombatStartedEvent { monsterId, monsterName, monsterType, severity }', oculusHandled: true },
  { name: 'COMBAT_ENDED', key: 'combat:ended', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'CombatEndedEvent { outcome, turns, xpGained? }', oculusHandled: true },

  // LUDUS combat granularity
  { name: 'COMBAT_TURN_START', key: 'combat:turn:start', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'CombatTurnEvent { turn, phase }', oculusHandled: true },
  { name: 'COMBAT_TURN_END', key: 'combat:turn:end', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'CombatTurnEvent { turn, phase }', oculusHandled: true },
  { name: 'SPELL_RESOLVED', key: 'spell:resolved', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'SpellResolvedEvent { spellId, casterId, targetId, effectType, value }', oculusHandled: true },
  { name: 'STATUS_EFFECT_APPLIED', key: 'status:applied', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'StatusEffectEvent { targetId, effectId, effectType, remainingTurns }', oculusHandled: false },
  { name: 'STATUS_EFFECT_EXPIRED', key: 'status:expired', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'StatusEffectEvent { ... }', oculusHandled: false },
  { name: 'EXPERIENCE_GAINED', key: 'experience:gained', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'ExperienceGainedEvent { characterId, amount, totalExperience }', oculusHandled: true },
  { name: 'LEVEL_UP', key: 'level:up', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'LevelUpEvent { characterId, newLevel, statChanges }', oculusHandled: true },
  { name: 'LOOT_DROPPED', key: 'loot:dropped', emitter: 'LUDUS', subscribers: ['OCULUS'], payload: 'LootDroppedEvent { monsterId, items[] }', oculusHandled: false },

  // OCULUS → LUDUS
  { name: 'SPELL_CAST', key: 'spell:cast', emitter: 'OCULUS', subscribers: ['LUDUS'], payload: 'SpellCastEvent { spellId, targetId?, casterId }', oculusHandled: false },
  { name: 'ITEM_USED', key: 'item:used', emitter: 'OCULUS', subscribers: ['LUDUS'], payload: '{ itemId, targetId }', oculusHandled: false },

  // CHRONOS → IMAGINARIUM
  { name: 'PARSE_COMPLETE', key: 'parse:complete', emitter: 'CHRONOS', subscribers: ['IMAGINARIUM'], payload: '{ topology, fileCount, commitCount }', oculusHandled: false },
  { name: 'TOPOLOGY_GENERATED', key: 'topology:generated', emitter: 'CHRONOS', subscribers: ['OCULUS', 'ARCHITECTUS'], payload: 'TopologyGeneratedEvent { tree, hotspots }', oculusHandled: true },

  // IMAGINARIUM → ARCHITECTUS
  { name: 'SHADERS_COMPILED', key: 'shaders:compiled', emitter: 'IMAGINARIUM', subscribers: ['ARCHITECTUS'], payload: '{ shaderIds[] }', oculusHandled: false },
  { name: 'PALETTE_GENERATED', key: 'palette:generated', emitter: 'IMAGINARIUM', subscribers: ['ARCHITECTUS'], payload: 'ProceduralPalette', oculusHandled: false },
  { name: 'MYCOLOGY_CATALOGED', key: 'mycology:cataloged', emitter: 'IMAGINARIUM', subscribers: ['ARCHITECTUS'], payload: 'MycologyCatalogedEvent { specimenCount, ... }', oculusHandled: false },

  // OPERATUS → All
  { name: 'ASSETS_LOADED', key: 'assets:loaded', emitter: 'OPERATUS', subscribers: ['ALL'], payload: 'AssetManifest', oculusHandled: false },
  { name: 'STATE_PERSISTED', key: 'state:persisted', emitter: 'OPERATUS', subscribers: ['ALL'], payload: '{ timestamp }', oculusHandled: false },
  { name: 'CACHE_UPDATED', key: 'cache:updated', emitter: 'OPERATUS', subscribers: ['ALL'], payload: '{ key, size }', oculusHandled: false },
];

const PILLAR_COLORS: Record<string, string> = {
  CHRONOS: '#c77b3f',
  IMAGINARIUM: '#A855F7',
  ARCHITECTUS: '#3B82F6',
  LUDUS: '#EF4444',
  OCULUS: '#22C55E',
  OPERATUS: '#1F2937',
  ALL: '#888',
};

export default function EventFlowPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'oculus'>('all');

  const filtered = filter === 'oculus' ? EVENTS.filter((e) => e.oculusHandled) : EVENTS;
  const selectedEvent = EVENTS.find((e) => e.name === selected);

  return (
    <div>
      <Link href="/museums" style={{ fontSize: '0.85rem', opacity: 0.5 }}>&larr; Museums</Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
        Event Flow Exhibition
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '1.5rem' }}>
        All {EVENTS.length} GameEvents in the Dendrovia EventBus. Click any event to inspect its payload.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setFilter('all')}
          style={{ padding: '0.4rem 0.8rem', border: filter === 'all' ? '1px solid var(--pillar-accent)' : '1px solid #333', borderRadius: 4, background: 'transparent', color: 'inherit', cursor: 'pointer' }}
        >
          All Events ({EVENTS.length})
        </button>
        <button
          onClick={() => setFilter('oculus')}
          style={{ padding: '0.4rem 0.8rem', border: filter === 'oculus' ? '1px solid var(--pillar-accent)' : '1px solid #333', borderRadius: 4, background: 'transparent', color: 'inherit', cursor: 'pointer' }}
        >
          OCULUS Handled ({EVENTS.filter((e) => e.oculusHandled).length})
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedEvent ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Event list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {filtered.map((evt) => (
            <button
              key={evt.name}
              onClick={() => setSelected(evt.name === selected ? null : evt.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem 0.75rem',
                border: selected === evt.name ? '1px solid var(--pillar-accent)' : '1px solid #222',
                borderRadius: 6,
                background: selected === evt.name ? 'rgba(34,197,94,0.08)' : 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: PILLAR_COLORS[evt.emitter] ?? '#666', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '0.8rem', flex: 1 }}>{evt.name}</span>
              {evt.oculusHandled && <span style={{ fontSize: '0.7rem', color: '#22c55e' }}>OCULUS</span>}
              <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>{evt.key}</span>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        {selectedEvent && (
          <div style={{ padding: '1.25rem', border: '1px solid #333', borderRadius: 8, background: '#111', position: 'sticky', top: '1rem', alignSelf: 'start' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', fontFamily: 'var(--font-geist-mono)' }}>{selectedEvent.name}</h3>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <span style={{ opacity: 0.5 }}>Key: </span>
                <code style={{ color: 'var(--pillar-accent)' }}>{selectedEvent.key}</code>
              </div>
              <div>
                <span style={{ opacity: 0.5 }}>Emitter: </span>
                <span style={{ color: PILLAR_COLORS[selectedEvent.emitter] }}>{selectedEvent.emitter}</span>
              </div>
              <div>
                <span style={{ opacity: 0.5 }}>Subscribers: </span>
                {selectedEvent.subscribers.map((s) => (
                  <span key={s} style={{ color: PILLAR_COLORS[s] ?? '#888', marginRight: '0.5rem' }}>{s}</span>
                ))}
              </div>
              <div>
                <span style={{ opacity: 0.5 }}>OCULUS Handled: </span>
                <span style={{ color: selectedEvent.oculusHandled ? '#22c55e' : '#666' }}>
                  {selectedEvent.oculusHandled ? 'Yes' : 'No'}
                </span>
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ opacity: 0.5, display: 'block', marginBottom: '0.25rem' }}>Payload:</span>
                <code style={{
                  display: 'block',
                  padding: '0.75rem',
                  background: '#0a0a0a',
                  borderRadius: 4,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-geist-mono)',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #222',
                }}>
                  {selectedEvent.payload}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
