'use client';

/**
 * Museum: Cross-Pillar Interface Map
 *
 * Shows OCULUS's position in the 6-pillar architecture graph.
 * Upstream providers, downstream consumers, and data flow arrows.
 */

import { useState } from 'react';
import Link from 'next/link';

interface PillarInfo {
  name: string;
  role: string;
  color: string;
  tincture: string;
  emoji: string;
  packages: string[];
}

const PILLARS: PillarInfo[] = [
  { name: 'CHRONOS', role: 'Git History + AST Parsing', color: '#c77b3f', tincture: 'Amber', emoji: '📜', packages: ['packages/chronos'] },
  { name: 'IMAGINARIUM', role: 'Procedural Art Generation', color: '#A855F7', tincture: 'Purpure', emoji: '🎨', packages: ['packages/imaginarium'] },
  { name: 'ARCHITECTUS', role: '3D Rendering Engine', color: '#3B82F6', tincture: 'Azure', emoji: '🏛️', packages: ['packages/architectus', 'packages/dendrovia-engine'] },
  { name: 'LUDUS', role: 'Game Mechanics + Rules', color: '#EF4444', tincture: 'Gules', emoji: '🎮', packages: ['packages/ludus'] },
  { name: 'OCULUS', role: 'UI + Navigation', color: '#22C55E', tincture: 'Vert', emoji: '👁️', packages: ['packages/oculus', 'packages/ui'] },
  { name: 'OPERATUS', role: 'Infrastructure + Persistence', color: '#1F2937', tincture: 'Sable', emoji: '💾', packages: ['packages/operatus'] },
];

interface DataFlow {
  from: string;
  to: string;
  label: string;
  events: string[];
}

const FLOWS: DataFlow[] = [
  { from: 'CHRONOS', to: 'IMAGINARIUM', label: 'Topology + AST data', events: ['PARSE_COMPLETE', 'TOPOLOGY_GENERATED'] },
  { from: 'IMAGINARIUM', to: 'ARCHITECTUS', label: 'Shaders + palettes + specimens', events: ['SHADERS_COMPILED', 'PALETTE_GENERATED', 'MYCOLOGY_CATALOGED'] },
  { from: 'ARCHITECTUS', to: 'LUDUS', label: 'Spatial events', events: ['PLAYER_MOVED', 'BRANCH_ENTERED', 'NODE_CLICKED', 'COLLISION_DETECTED'] },
  { from: 'LUDUS', to: 'ARCHITECTUS', label: 'Feedback events', events: ['ENCOUNTER_TRIGGERED', 'DAMAGE_DEALT'] },
  { from: 'LUDUS', to: 'OCULUS', label: 'UI updates (state)', events: ['HEALTH_CHANGED', 'MANA_CHANGED', 'QUEST_UPDATED', 'COMBAT_STARTED', 'COMBAT_ENDED', 'COMBAT_TURN_START', 'COMBAT_TURN_END', 'SPELL_RESOLVED', 'EXPERIENCE_GAINED', 'LEVEL_UP'] },
  { from: 'OCULUS', to: 'LUDUS', label: 'User actions', events: ['SPELL_CAST', 'ITEM_USED'] },
  { from: 'CHRONOS', to: 'OCULUS', label: 'Topology for navigation', events: ['TOPOLOGY_GENERATED'] },
  { from: 'ARCHITECTUS', to: 'OCULUS', label: 'Node clicks', events: ['NODE_CLICKED', 'PLAYER_MOVED'] },
  { from: 'OPERATUS', to: 'ALL', label: 'Infrastructure', events: ['ASSETS_LOADED', 'STATE_PERSISTED', 'CACHE_UPDATED'] },
];

const OCULUS_READS = [
  { pillar: 'LUDUS', data: 'Character stats, quest state, combat state', events: 12 },
  { pillar: 'CHRONOS', data: 'File topology, hotspots', events: 1 },
  { pillar: 'ARCHITECTUS', data: 'Player position, node clicks', events: 2 },
];

const OCULUS_EMITS = [
  { pillar: 'LUDUS', data: 'Spell casts, item usage', events: 2 },
];

export default function CrossPillarPage() {
  const [selected, setSelected] = useState<string | null>('OCULUS');
  const selectedPillar = PILLARS.find((p) => p.name === selected);

  const relatedFlows = selected
    ? FLOWS.filter((f) => f.from === selected || f.to === selected || f.to === 'ALL')
    : FLOWS;

  return (
    <div>
      <Link href="/museums" style={{ fontSize: '0.85rem', opacity: 0.5 }}>&larr; Museums</Link>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>
        Cross-Pillar Interface Map
      </h1>
      <p style={{ opacity: 0.5, marginBottom: '1.5rem' }}>
        OCULUS in the six-pillar architecture. Click a pillar to see its connections.
      </p>

      {/* Pillar selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {PILLARS.map((p) => (
          <button
            key={p.name}
            onClick={() => setSelected(p.name === selected ? null : p.name)}
            style={{
              padding: '0.5rem 1rem',
              border: selected === p.name ? `2px solid ${p.color}` : '1px solid #333',
              borderRadius: 6,
              background: selected === p.name ? `${p.color}15` : 'transparent',
              color: selected === p.name ? p.color : 'inherit',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: selected === p.name ? 600 : 400,
            }}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Pipeline visualization */}
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Build-to-Runtime Pipeline</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: '#111', borderRadius: 8, border: '1px solid #222' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              <PillarBadge p={PILLARS[0]} active={selected === 'CHRONOS'} onClick={() => setSelected('CHRONOS')} />
              <Arrow />
              <PillarBadge p={PILLARS[1]} active={selected === 'IMAGINARIUM'} onClick={() => setSelected('IMAGINARIUM')} />
              <Arrow />
              <PillarBadge p={PILLARS[2]} active={selected === 'ARCHITECTUS'} onClick={() => setSelected('ARCHITECTUS')} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', paddingLeft: '40%' }}>
              <span style={{ opacity: 0.3, fontSize: '1.2rem' }}>|</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
              <PillarBadge p={PILLARS[3]} active={selected === 'LUDUS'} onClick={() => setSelected('LUDUS')} />
              <PillarBadge p={PILLARS[4]} active={selected === 'OCULUS'} onClick={() => setSelected('OCULUS')} />
              <PillarBadge p={PILLARS[5]} active={selected === 'OPERATUS'} onClick={() => setSelected('OPERATUS')} />
            </div>
          </div>

          {/* OCULUS specific info */}
          <div style={{ marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>OCULUS Data Sources</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', opacity: 0.5, margin: 0 }}>Reads from (upstream):</h3>
              {OCULUS_READS.map((r) => (
                <div key={r.pillar} style={{ padding: '0.5rem 0.75rem', border: '1px solid #222', borderRadius: 4, fontSize: '0.85rem' }}>
                  <span style={{ color: PILLARS.find((p) => p.name === r.pillar)?.color, fontWeight: 600 }}>{r.pillar}</span>
                  <span style={{ opacity: 0.5, marginLeft: '0.5rem' }}>({r.events} events)</span>
                  <div style={{ opacity: 0.5, fontSize: '0.8rem', marginTop: '0.25rem' }}>{r.data}</div>
                </div>
              ))}
              <h3 style={{ fontSize: '0.85rem', opacity: 0.5, margin: '0.5rem 0 0 0' }}>Emits to (downstream):</h3>
              {OCULUS_EMITS.map((r) => (
                <div key={r.pillar} style={{ padding: '0.5rem 0.75rem', border: '1px solid #222', borderRadius: 4, fontSize: '0.85rem' }}>
                  <span style={{ color: PILLARS.find((p) => p.name === r.pillar)?.color, fontWeight: 600 }}>{r.pillar}</span>
                  <span style={{ opacity: 0.5, marginLeft: '0.5rem' }}>({r.events} events)</span>
                  <div style={{ opacity: 0.5, fontSize: '0.8rem', marginTop: '0.25rem' }}>{r.data}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected pillar detail + flows */}
        <div>
          {selectedPillar && (
            <div style={{ padding: '1rem', border: `1px solid ${selectedPillar.color}40`, borderRadius: 8, background: `${selectedPillar.color}08`, marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: selectedPillar.color }}>
                {selectedPillar.emoji} {selectedPillar.name}
              </h2>
              <div style={{ fontSize: '0.85rem', opacity: 0.6, marginTop: '0.25rem' }}>{selectedPillar.role}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.4, marginTop: '0.25rem' }}>
                Tincture: {selectedPillar.tincture} | Packages: {selectedPillar.packages.join(', ')}
              </div>
            </div>
          )}

          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Data Flows {selected && `(${selected})`}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {relatedFlows.map((f, i) => {
              const fromColor = PILLARS.find((p) => p.name === f.from)?.color ?? '#666';
              const toColor = f.to === 'ALL' ? '#888' : (PILLARS.find((p) => p.name === f.to)?.color ?? '#666');
              return (
                <div key={i} style={{ padding: '0.6rem 0.75rem', border: '1px solid #222', borderRadius: 4, fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: fromColor, fontWeight: 600 }}>{f.from}</span>
                    <span style={{ opacity: 0.3 }}>&rarr;</span>
                    <span style={{ color: toColor, fontWeight: 600 }}>{f.to}</span>
                    <span style={{ opacity: 0.5, marginLeft: 'auto', fontSize: '0.75rem' }}>{f.events.length} events</span>
                  </div>
                  <div style={{ opacity: 0.5, fontSize: '0.8rem', marginTop: '0.25rem' }}>{f.label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {f.events.map((e) => (
                      <span key={e} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: '#222', borderRadius: 3, fontFamily: 'var(--font-geist-mono)' }}>
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PillarBadge({ p, active, onClick }: { p: PillarInfo; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.4rem 0.6rem',
        border: active ? `2px solid ${p.color}` : '1px solid #333',
        borderRadius: 6,
        background: active ? `${p.color}15` : 'transparent',
        color: active ? p.color : 'inherit',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {p.emoji} {p.name}
    </button>
  );
}

function Arrow() {
  return <span style={{ opacity: 0.3, fontSize: '1rem' }}>&rarr;</span>;
}
