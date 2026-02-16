'use client';

/**
 * WorldExplorer — Client wrapper that mounts the full DendroviaQuest
 * 3D experience for a given world. Shows a class selection screen first,
 * then renders a full-viewport scene with a back button once selected.
 */

import { useState } from 'react';
import { DendroviaQuest, type WorldMeta } from '../../../components/DendroviaQuest';
import { DendriteIcon } from '../../../components/DendriteIcon';
import { OrnateFrame } from '@dendrovia/oculus';
import type { CharacterClass } from '@dendrovia/shared';

interface WorldExplorerProps {
  slug: string;
  topologyPath: string;
  manifestPath: string;
  worldMeta: WorldMeta;
}

// ─── Class Definitions ───────────────────────────────────────

const CLASSES: Array<{
  id: CharacterClass;
  name: string;
  subtitle: string;
  description: string;
  stats: string;
}> = [
  {
    id: 'dps',
    name: 'Explorer',
    subtitle: 'Feature Developer',
    description: 'High attack, discovers new code regions quickly. Glass cannon.',
    stats: 'ATK 15 / DEF 5 / HP 80',
  },
  {
    id: 'tank',
    name: 'Sentinel',
    subtitle: 'Infrastructure Dev',
    description: 'High defense and health. Survives deep dives into complex modules.',
    stats: 'ATK 5 / DEF 15 / HP 150',
  },
  {
    id: 'healer',
    name: 'Mender',
    subtitle: 'Bug Fixer',
    description: 'Balanced with high mana. Restores codebase health and patches issues.',
    stats: 'ATK 3 / DEF 8 / HP 100',
  },
];

// ─── Class Selection Screen ──────────────────────────────────

function ClassSelect({
  worldMeta,
  onSelect,
}: {
  worldMeta: WorldMeta;
  onSelect: (cls: CharacterClass) => void;
}) {
  const [hovered, setHovered] = useState<CharacterClass | null>(null);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        color: '#ededed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-geist-sans), sans-serif',
        position: 'relative',
      }}
    >
      {/* Shader background */}
      <div className="shader-bg" />

      {/* Back */}
      <a
        href="/"
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          zIndex: 2,
          padding: '6px 14px',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(10,10,10,0.8)',
          backdropFilter: 'blur(8px)',
          color: '#ededed',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.75rem',
          textDecoration: 'none',
          opacity: 0.6,
        }}
      >
        &larr; Back
      </a>

      {/* Content above shader-bg */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        {/* DendriteIcon */}
        <DendriteIcon size={48} />

        {/* World name */}
        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: worldMeta.tincture.hex,
            marginTop: '0.75rem',
            marginBottom: '0.25rem',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
        >
          {worldMeta.name}
        </h1>
        <p
          style={{
            fontSize: '0.8rem',
            opacity: 0.4,
            fontFamily: 'var(--font-geist-mono), monospace',
            marginBottom: '2.5rem',
          }}
        >
          Choose your class
        </p>

        {/* Class cards */}
        <div
          className="oculus-stagger"
          style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          {CLASSES.map((cls) => {
            const isHovered = hovered === cls.id;
            return (
              <OrnateFrame key={cls.id} variant="compact" pillar="oculus">
                <button
                  onClick={() => onSelect(cls.id)}
                  onMouseEnter={() => setHovered(cls.id)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    width: '200px',
                    padding: '20px 16px',
                    background: isHovered ? worldMeta.tincture.hex + '10' : 'rgba(20, 20, 20, 0.6)',
                    color: '#ededed',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 200ms, transform 200ms',
                    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    border: 'none',
                    borderRadius: '0',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: worldMeta.tincture.hex,
                      marginBottom: '2px',
                    }}
                  >
                    {cls.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      opacity: 0.5,
                      fontFamily: 'var(--font-geist-mono), monospace',
                      marginBottom: '10px',
                    }}
                  >
                    {cls.subtitle}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6, lineHeight: 1.4, marginBottom: '12px' }}>
                    {cls.description}
                  </div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-geist-mono), monospace',
                      opacity: 0.35,
                    }}
                  >
                    {cls.stats}
                  </div>
                </button>
              </OrnateFrame>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function WorldExplorer({ slug, topologyPath, manifestPath, worldMeta }: WorldExplorerProps) {
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);

  if (!selectedClass) {
    return <ClassSelect worldMeta={worldMeta} onSelect={setSelectedClass} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#0a0a0a' }}>
      {/* Back button overlay */}
      <a
        href="/"
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          zIndex: 100,
          padding: '6px 14px',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(10,10,10,0.8)',
          backdropFilter: 'blur(8px)',
          color: '#ededed',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.75rem',
          textDecoration: 'none',
          opacity: 0.6,
          transition: 'opacity 200ms',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
      >
        &larr; Back
      </a>

      <DendroviaQuest
        topologyPath={topologyPath}
        manifestPath={manifestPath}
        worldMeta={worldMeta}
        characterClass={selectedClass}
      />
    </div>
  );
}
