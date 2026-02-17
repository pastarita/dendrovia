'use client';

/**
 * Cross-Pillar Interface Map — Client component.
 *
 * Shows OCULUS's position in the 6-pillar architecture graph.
 * Uses MuseumShell for header/filter/search/detail, with custom
 * detail rendering showing pillar info + related data flows.
 */

import type { MuseumExhibitDescriptor, MuseumFilter, MuseumGroup, MuseumPageConfig } from '../_museum-kit';
import { MuseumShell } from '../_museum-kit';

// ── Data ────────────────────────────────────────────────

interface PillarInfo {
  name: string;
  role: string;
  color: string;
  tincture: string;
  emoji: string;
  packages: string[];
}

interface DataFlow {
  from: string;
  to: string;
  label: string;
  events: string[];
}

const PILLARS: PillarInfo[] = [
  {
    name: 'CHRONOS',
    role: 'Git History + AST Parsing',
    color: '#c77b3f',
    tincture: 'Amber',
    emoji: '\u{1F4DC}',
    packages: ['packages/chronos'],
  },
  {
    name: 'IMAGINARIUM',
    role: 'Procedural Art Generation',
    color: '#A855F7',
    tincture: 'Purpure',
    emoji: '\u{1F3A8}',
    packages: ['packages/imaginarium'],
  },
  {
    name: 'ARCHITECTUS',
    role: '3D Rendering Engine',
    color: '#3B82F6',
    tincture: 'Azure',
    emoji: '\u{1F3DB}\uFE0F',
    packages: ['packages/architectus', 'packages/dendrovia-engine'],
  },
  {
    name: 'LUDUS',
    role: 'Game Mechanics + Rules',
    color: '#EF4444',
    tincture: 'Gules',
    emoji: '\u{1F3AE}',
    packages: ['packages/ludus'],
  },
  {
    name: 'OCULUS',
    role: 'UI + Navigation',
    color: '#22C55E',
    tincture: 'Vert',
    emoji: '\u{1F441}\uFE0F',
    packages: ['packages/oculus', 'packages/ui'],
  },
  {
    name: 'OPERATUS',
    role: 'Infrastructure + Persistence',
    color: '#1F2937',
    tincture: 'Sable',
    emoji: '\u{1F4BE}',
    packages: ['packages/operatus'],
  },
];

const FLOWS: DataFlow[] = [
  {
    from: 'CHRONOS',
    to: 'IMAGINARIUM',
    label: 'Topology + AST data',
    events: ['PARSE_COMPLETE', 'TOPOLOGY_GENERATED'],
  },
  {
    from: 'IMAGINARIUM',
    to: 'ARCHITECTUS',
    label: 'Shaders + palettes + specimens',
    events: ['SHADERS_COMPILED', 'PALETTE_GENERATED', 'MYCOLOGY_CATALOGED'],
  },
  {
    from: 'ARCHITECTUS',
    to: 'LUDUS',
    label: 'Spatial events',
    events: ['PLAYER_MOVED', 'BRANCH_ENTERED', 'NODE_CLICKED', 'COLLISION_DETECTED'],
  },
  { from: 'LUDUS', to: 'ARCHITECTUS', label: 'Feedback events', events: ['ENCOUNTER_TRIGGERED', 'DAMAGE_DEALT'] },
  {
    from: 'LUDUS',
    to: 'OCULUS',
    label: 'UI updates (state)',
    events: [
      'HEALTH_CHANGED',
      'MANA_CHANGED',
      'QUEST_UPDATED',
      'COMBAT_STARTED',
      'COMBAT_ENDED',
      'COMBAT_TURN_START',
      'COMBAT_TURN_END',
      'SPELL_RESOLVED',
      'EXPERIENCE_GAINED',
      'LEVEL_UP',
    ],
  },
  { from: 'OCULUS', to: 'LUDUS', label: 'User actions', events: ['SPELL_CAST', 'ITEM_USED'] },
  { from: 'CHRONOS', to: 'OCULUS', label: 'Topology for navigation', events: ['TOPOLOGY_GENERATED'] },
  { from: 'ARCHITECTUS', to: 'OCULUS', label: 'Node clicks', events: ['NODE_CLICKED', 'PLAYER_MOVED'] },
  {
    from: 'OPERATUS',
    to: 'ALL',
    label: 'Infrastructure',
    events: ['ASSETS_LOADED', 'STATE_PERSISTED', 'CACHE_UPDATED'],
  },
];

// ── Combined exhibit type ───────────────────────────────

type ExhibitPayload = { kind: 'pillar'; pillar: PillarInfo } | { kind: 'flow'; flow: DataFlow };

// ── Groups ──────────────────────────────────────────────

const GROUPS: MuseumGroup[] = [
  { id: 'pillars', label: 'Pillars' },
  { id: 'flows', label: 'Data Flows' },
];

// ── Build exhibits ──────────────────────────────────────

const PILLAR_EXHIBITS: MuseumExhibitDescriptor<ExhibitPayload>[] = PILLARS.map((p) => ({
  id: `pillar-${p.name}`,
  name: `${p.emoji} ${p.name}`,
  group: 'pillars',
  dotColor: p.color,
  searchText: `${p.name} ${p.role} ${p.tincture} ${p.packages.join(' ')}`,
  badges: [{ label: p.tincture, color: p.color }],
  data: { kind: 'pillar' as const, pillar: p },
}));

const FLOW_EXHIBITS: MuseumExhibitDescriptor<ExhibitPayload>[] = FLOWS.map((f, i) => {
  const fromPillar = PILLARS.find((p) => p.name === f.from);
  return {
    id: `flow-${i}`,
    name: `${f.from} \u2192 ${f.to}`,
    group: 'flows',
    dotColor: fromPillar?.color ?? '#666',
    searchText: `${f.from} ${f.to} ${f.label} ${f.events.join(' ')}`,
    badges: [{ label: `${f.events.length} events` }],
    data: { kind: 'flow' as const, flow: f },
  };
});

const ALL_EXHIBITS = [...PILLAR_EXHIBITS, ...FLOW_EXHIBITS];

// ── Filters ─────────────────────────────────────────────

const FILTERS: MuseumFilter[] = [
  { id: 'all', label: 'All', predicate: () => true },
  {
    id: 'pillars',
    label: 'Pillars',
    predicate: (item) => (item as MuseumExhibitDescriptor<ExhibitPayload>).data.kind === 'pillar',
  },
  {
    id: 'flows',
    label: 'Data Flows',
    predicate: (item) => (item as MuseumExhibitDescriptor<ExhibitPayload>).data.kind === 'flow',
  },
];

// ── Detail Renderers ────────────────────────────────────

function renderDetail(item: MuseumExhibitDescriptor<ExhibitPayload>) {
  const d = item.data;

  if (d.kind === 'pillar') {
    const p = d.pillar;
    const relatedFlows = FLOWS.filter((f) => f.from === p.name || f.to === p.name || f.to === 'ALL');
    return (
      <div>
        <div
          style={{
            padding: '0.75rem',
            border: `1px solid ${p.color}40`,
            borderRadius: 8,
            background: `${p.color}08`,
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: p.color }}>
            {p.emoji} {p.name}
          </h3>
          <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.25rem' }}>{p.role}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.4, marginTop: '0.25rem' }}>
            Tincture: {p.tincture} | Packages: {p.packages.join(', ')}
          </div>
        </div>

        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Related Flows</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {relatedFlows.map((f, i) => {
            const fromColor = PILLARS.find((pi) => pi.name === f.from)?.color ?? '#666';
            const toColor = f.to === 'ALL' ? '#888' : (PILLARS.find((pi) => pi.name === f.to)?.color ?? '#666');
            return (
              <div
                key={i}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #222', borderRadius: 4, fontSize: '0.8rem' }}
              >
                <span style={{ color: fromColor, fontWeight: 600 }}>{f.from}</span>
                <span style={{ opacity: 0.3, margin: '0 0.5rem' }}>{'\u2192'}</span>
                <span style={{ color: toColor, fontWeight: 600 }}>{f.to}</span>
                <span style={{ opacity: 0.5, marginLeft: '0.5rem', fontSize: '0.7rem' }}>{f.events.length} events</span>
                <div style={{ opacity: 0.5, fontSize: '0.75rem', marginTop: '0.15rem' }}>{f.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Flow detail
  const f = d.flow;
  const fromColor = PILLARS.find((p) => p.name === f.from)?.color ?? '#666';
  const toColor = f.to === 'ALL' ? '#888' : (PILLARS.find((p) => p.name === f.to)?.color ?? '#666');
  return (
    <div>
      <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem' }}>
        <span style={{ color: fromColor }}>{f.from}</span>
        <span style={{ opacity: 0.3, margin: '0 0.5rem' }}>{'\u2192'}</span>
        <span style={{ color: toColor }}>{f.to}</span>
      </h3>
      <div style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.75rem' }}>{f.label}</div>
      <h4 style={{ fontSize: '0.8rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Events ({f.events.length})</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {f.events.map((e) => (
          <span
            key={e}
            style={{
              fontSize: '0.7rem',
              padding: '0.1rem 0.4rem',
              background: '#222',
              borderRadius: 3,
              fontFamily: 'var(--font-geist-mono)',
            }}
          >
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Footer: Build Pipeline Diagram ──────────────────────

function renderDetailFooter(item: MuseumExhibitDescriptor<ExhibitPayload>) {
  if (item.data.kind !== 'pillar') return null;

  return (
    <div>
      <h4 style={{ fontSize: '0.8rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Build-to-Runtime Pipeline</h4>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '0.75rem',
          background: '#0a0a0a',
          borderRadius: 6,
          border: '1px solid #1a1a1a',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center',
            fontSize: '0.75rem',
          }}
        >
          {PILLARS.slice(0, 3).map((p, i) => (
            <span key={p.name}>
              <span style={{ color: p.color, fontWeight: 600 }}>
                {p.emoji} {p.name}
              </span>
              {i < 2 && <span style={{ opacity: 0.3, margin: '0 0.25rem' }}>{'\u2192'}</span>}
            </span>
          ))}
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', fontSize: '0.75rem' }}
        >
          {PILLARS.slice(3).map((p) => (
            <span key={p.name} style={{ color: p.color, fontWeight: 600 }}>
              {p.emoji} {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page Config ─────────────────────────────────────────

const CONFIG: MuseumPageConfig<ExhibitPayload> = {
  title: 'Cross-Pillar Interface Map',
  subtitle: 'OCULUS in the six-pillar architecture. Browse pillars and data flows.',
  icon: '',
  backHref: '/museums',
  backLabel: 'Museums',
  groups: GROUPS,
  filters: FILTERS,
  exhibits: ALL_EXHIBITS,
  renderDetail,
  renderDetailFooter,
};

export function CrossPillarMuseumClient() {
  return <MuseumShell config={CONFIG} />;
}
