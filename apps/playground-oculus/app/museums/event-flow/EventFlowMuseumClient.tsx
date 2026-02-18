'use client';

/**
 * Event Flow Museum — Client component.
 *
 * Interactive catalog of all 29 GameEvents with payload inspection.
 * Uses MuseumShell for layout, filtering, search, and detail panel.
 */

import { MuseumShell } from '../_museum-kit';
import type { MuseumPageConfig, MuseumExhibitDescriptor, MuseumGroup, MuseumFilter } from '../_museum-kit';

// ── Data ────────────────────────────────────────────────

interface EventInfo {
  name: string;
  key: string;
  emitter: string;
  subscribers: string[];
  payload: string;
  oculusHandled: boolean;
}

const PILLAR_COLORS: Record<string, string> = {
  CHRONOS: '#c77b3f',
  IMAGINARIUM: '#A855F7',
  ARCHITECTUS: '#3B82F6',
  LUDUS: '#EF4444',
  OCULUS: '#22C55E',
  OPERATUS: '#1F2937',
  ALL: '#888',
};

const EVENTS: EventInfo[] = [
  // ARCHITECTUS -> LUDUS
  { name: 'PLAYER_MOVED', key: 'player:moved', emitter: 'ARCHITECTUS', subscribers: ['LUDUS', 'OCULUS'], payload: 'PlayerMovedEvent { position, branchId, velocity }', oculusHandled: true },
  { name: 'BRANCH_ENTERED', key: 'branch:entered', emitter: 'ARCHITECTUS', subscribers: ['LUDUS'], payload: 'BranchEnteredEvent { branchId, filePath, depth }', oculusHandled: false },
  { name: 'NODE_CLICKED', key: 'node:clicked', emitter: 'ARCHITECTUS', subscribers: ['LUDUS', 'OCULUS'], payload: 'NodeClickedEvent { nodeId, filePath, position }', oculusHandled: true },
  { name: 'COLLISION_DETECTED', key: 'collision:detected', emitter: 'ARCHITECTUS', subscribers: ['LUDUS', 'OCULUS'], payload: 'CollisionDetectedEvent { entityId, collidedWith, position }', oculusHandled: true },

  // LUDUS -> ARCHITECTUS
  { name: 'ENCOUNTER_TRIGGERED', key: 'encounter:triggered', emitter: 'LUDUS', subscribers: ['ARCHITECTUS', 'OCULUS'], payload: 'EncounterTriggeredEvent { type, severity, position }', oculusHandled: true },
  { name: 'DAMAGE_DEALT', key: 'damage:dealt', emitter: 'LUDUS', subscribers: ['ARCHITECTUS', 'OCULUS'], payload: 'DamageDealtEvent { attackerId, targetId, damage, isCritical, element }', oculusHandled: true },

  // LUDUS -> OCULUS
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

  // OCULUS -> LUDUS
  { name: 'SPELL_CAST', key: 'spell:cast', emitter: 'OCULUS', subscribers: ['LUDUS'], payload: 'SpellCastEvent { spellId, targetId?, casterId }', oculusHandled: false },
  { name: 'ITEM_USED', key: 'item:used', emitter: 'OCULUS', subscribers: ['LUDUS', 'OCULUS'], payload: 'ItemUsedEvent { itemId, characterId? }', oculusHandled: true },

  // CHRONOS -> IMAGINARIUM
  { name: 'PARSE_COMPLETE', key: 'parse:complete', emitter: 'CHRONOS', subscribers: ['IMAGINARIUM'], payload: '{ topology, fileCount, commitCount }', oculusHandled: false },
  { name: 'TOPOLOGY_GENERATED', key: 'topology:generated', emitter: 'CHRONOS', subscribers: ['OCULUS', 'ARCHITECTUS'], payload: 'TopologyGeneratedEvent { tree, hotspots, deepwiki? }', oculusHandled: true },

  // IMAGINARIUM -> ARCHITECTUS
  { name: 'SHADERS_COMPILED', key: 'shaders:compiled', emitter: 'IMAGINARIUM', subscribers: ['ARCHITECTUS'], payload: '{ shaderIds[] }', oculusHandled: false },
  { name: 'PALETTE_GENERATED', key: 'palette:generated', emitter: 'IMAGINARIUM', subscribers: ['ARCHITECTUS'], payload: 'ProceduralPalette', oculusHandled: false },
  { name: 'MYCOLOGY_CATALOGED', key: 'mycology:cataloged', emitter: 'IMAGINARIUM', subscribers: ['ARCHITECTUS'], payload: 'MycologyCatalogedEvent { specimenCount, ... }', oculusHandled: false },

  // OPERATUS -> All
  { name: 'ASSETS_LOADED', key: 'assets:loaded', emitter: 'OPERATUS', subscribers: ['ALL'], payload: 'AssetManifest', oculusHandled: false },
  { name: 'STATE_PERSISTED', key: 'state:persisted', emitter: 'OPERATUS', subscribers: ['ALL'], payload: '{ timestamp }', oculusHandled: false },
  { name: 'CACHE_UPDATED', key: 'cache:updated', emitter: 'OPERATUS', subscribers: ['ALL'], payload: '{ key, size }', oculusHandled: false },
];

// ── Groups (by emitter -> subscriber route) ─────────────

function inferGroup(e: EventInfo): string {
  const subs = e.subscribers.filter((s) => s !== 'ALL' && s !== e.emitter);
  const primary = subs[0] ?? 'ALL';
  return `${e.emitter}-${primary}`;
}

const GROUP_ORDER = [
  'ARCHITECTUS-LUDUS',
  'LUDUS-ARCHITECTUS',
  'LUDUS-OCULUS',
  'OCULUS-LUDUS',
  'CHRONOS-IMAGINARIUM',
  'IMAGINARIUM-ARCHITECTUS',
  'OPERATUS-ALL',
];

const GROUPS: MuseumGroup[] = GROUP_ORDER.map((id) => {
  const [from, to] = id.split('-');
  return { id, label: `${from} \u2192 ${to}` };
});

// ── Build exhibit descriptors ───────────────────────────

const EXHIBITS: MuseumExhibitDescriptor<EventInfo>[] = EVENTS.map((e) => ({
  id: e.name,
  name: e.name,
  group: inferGroup(e),
  dotColor: PILLAR_COLORS[e.emitter] ?? '#666',
  searchText: `${e.name} ${e.key} ${e.emitter} ${e.subscribers.join(' ')} ${e.payload}`,
  badges: e.oculusHandled ? [{ label: 'OCULUS', color: '#22c55e' }] : [],
  data: e,
}));

// ── Filters ─────────────────────────────────────────────

const FILTERS: MuseumFilter[] = [
  { id: 'all', label: 'All Events', predicate: () => true },
  { id: 'oculus', label: 'OCULUS Handled', predicate: (item) => (item as MuseumExhibitDescriptor<EventInfo>).data.oculusHandled },
];

// ── Detail Renderer ─────────────────────────────────────

function renderDetail(item: MuseumExhibitDescriptor<EventInfo>) {
  const e = item.data;
  return (
    <div>
      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', fontFamily: 'var(--font-geist-mono)' }}>{e.name}</h3>
      <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div>
          <span style={{ opacity: 0.5 }}>Key: </span>
          <code style={{ color: 'var(--pillar-accent)' }}>{e.key}</code>
        </div>
        <div>
          <span style={{ opacity: 0.5 }}>Emitter: </span>
          <span style={{ color: PILLAR_COLORS[e.emitter] }}>{e.emitter}</span>
        </div>
        <div>
          <span style={{ opacity: 0.5 }}>Subscribers: </span>
          {e.subscribers.map((s) => (
            <span key={s} style={{ color: PILLAR_COLORS[s] ?? '#888', marginRight: '0.5rem' }}>{s}</span>
          ))}
        </div>
        <div>
          <span style={{ opacity: 0.5 }}>OCULUS Handled: </span>
          <span style={{ color: e.oculusHandled ? '#22c55e' : '#666' }}>
            {e.oculusHandled ? 'Yes' : 'No'}
          </span>
        </div>
        <div style={{ marginTop: '0.5rem' }}>
          <span style={{ opacity: 0.5, display: 'block', marginBottom: '0.25rem' }}>Payload:</span>
          <code style={{
            display: 'block', padding: '0.75rem', background: '#0a0a0a',
            borderRadius: 4, fontSize: '0.8rem', fontFamily: 'var(--font-geist-mono)',
            whiteSpace: 'pre-wrap', border: '1px solid #222',
          }}>
            {e.payload}
          </code>
        </div>
      </div>
    </div>
  );
}

// ── Page Config ─────────────────────────────────────────

const CONFIG: MuseumPageConfig<EventInfo> = {
  title: 'Event Flow Exhibition',
  subtitle: `All ${EVENTS.length} GameEvents in the Dendrovia EventBus. Click any event to inspect its payload.`,
  icon: '',
  backHref: '/',
  backLabel: 'OCULUS',
  groups: GROUPS,
  filters: FILTERS,
  exhibits: EXHIBITS,
  renderDetail,
};

export function EventFlowMuseumClient() {
  return <MuseumShell config={CONFIG} />;
}
