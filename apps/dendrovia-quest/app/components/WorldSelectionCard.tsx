'use client';

/**
 * WorldSelectionCard — Clickable card for cached worlds on the portal page.
 * Sets selection state (not a link). Shows SVG viewlet, metadata, language bar,
 * magnitude badge, and selection highlight.
 */

import { generateWorldViewlet } from '../lib/world-viewlet-svg';
import { LanguageBar } from './LanguageBar';
import { MagnitudeBadge } from './MagnitudeBadge';
import type { WorldEntry } from '../lib/design-tokens';

interface WorldSelectionCardProps {
  world: WorldEntry;
  selected: boolean;
  onClick: () => void;
  index: number;
}

export function WorldSelectionCard({ world, selected, onClick, index }: WorldSelectionCardProps) {
  const { name, owner, repo, description, stats, magnitude, tincture } = world;

  const svgHtml = generateWorldViewlet({
    fileCount: stats.fileCount,
    commitCount: stats.commitCount,
    hotspotCount: stats.hotspotCount,
    languages: stats.languages,
    tincture: tincture.hex,
  });

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
        width: '100%',
        textAlign: 'left',
        padding: '14px 16px',
        borderRadius: '10px',
        border: `1px solid ${selected ? tincture.hex + '66' : tincture.hex + '20'}`,
        background: selected ? tincture.hex + '12' : tincture.hex + '06',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'border-color 200ms, background 200ms, transform 200ms, box-shadow 200ms',
        animation: `oculus-slide-up 300ms ${index * 80}ms both`,
        boxShadow: selected ? `0 0 20px ${tincture.hex}18` : 'none',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = tincture.hex + '44';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = tincture.hex + '20';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* SVG viewlet thumbnail */}
      <div
        style={{
          width: 64,
          height: 64,
          flexShrink: 0,
          borderRadius: 6,
          background: '#0a0a0a',
          border: `1px solid ${tincture.hex}15`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: Name + owner/repo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: tincture.hex }}>
            {name}
          </span>
          <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.7rem', opacity: 0.35 }}>
            {owner}/{repo}
          </span>
          <span style={{ flex: 1 }} />
          <MagnitudeBadge tier={magnitude.tier} score={magnitude.score} symbol={magnitude.symbol} tintColor={tincture.hex} />
        </div>

        {/* Description */}
        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', opacity: 0.45, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {description}
        </p>

        {/* Language bar */}
        <div style={{ marginTop: 8 }}>
          <LanguageBar languages={stats.languages} />
        </div>

        {/* Compact stats */}
        <div style={{ marginTop: 6, fontFamily: 'var(--font-geist-mono), monospace', fontSize: '0.68rem', opacity: 0.3, display: 'flex', gap: 6 }}>
          <span>{stats.fileCount.toLocaleString()} files</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>{stats.commitCount} commits</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>{stats.hotspotCount} hotspots</span>
        </div>
      </div>
    </button>
  );
}
