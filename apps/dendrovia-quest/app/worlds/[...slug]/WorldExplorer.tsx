'use client';

/**
 * WorldExplorer — Client wrapper that mounts the full DendroviaQuest
 * 3D experience for a given world. Renders directly into the scene
 * with a back button overlay (class selection happens on the home page).
 */

import { DendroviaQuest, type WorldMeta } from '../../components/DendroviaQuest';
import type { CharacterClass } from '@dendrovia/shared';

interface WorldExplorerProps {
  slug: string;
  topologyPath: string;
  manifestPath: string;
  worldMeta: WorldMeta;
  characterClass: CharacterClass;
}

export function WorldExplorer({ slug, topologyPath, manifestPath, worldMeta, characterClass }: WorldExplorerProps) {
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
        characterClass={characterClass}
      />
    </div>
  );
}
