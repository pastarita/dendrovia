'use client';

/**
 * WorldCard — Displays an analyzed codebase as a playable world card.
 * Wrapped in an OrnateFrame with pillar-specific ornaments.
 */

import { OrnateFrame } from '@dendrovia/oculus/src/components/primitives/OrnateFrame';
import type { PillarId } from '@dendrovia/oculus/src/components/primitives/frames';
import { MagnitudeBadge } from './MagnitudeBadge';
import { LanguageBar } from './LanguageBar';

interface WorldCardProps {
  slug: string;
  name: string;
  owner: string;
  repo: string;
  description: string;
  status: 'playable' | 'analyzing' | 'pending';
  stats: {
    fileCount: number;
    commitCount: number;
    hotspotCount: number;
    contributorCount: number;
    languages: Array<{ language: string; fileCount: number; percentage: number }>;
  };
  magnitude: { score: number; tier: string; symbol: string };
  tincture: { hex: string; name: string };
  framePillar: string;
  /** Animation stagger index */
  index: number;
}

const STATUS_COLORS: Record<string, string> = {
  playable: '#6dffaa',
  analyzing: '#ffaa44',
  pending: '#666',
};

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        minWidth: '60px',
      }}
    >
      <span
        style={{
          fontSize: '14px',
          fontFamily: 'var(--font-geist-mono), monospace',
          color: '#ededed',
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      <span
        style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          opacity: 0.4,
          marginTop: '2px',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function WorldCard({
  slug,
  name,
  owner,
  repo,
  description,
  status,
  stats,
  magnitude,
  tincture,
  framePillar,
  index,
}: WorldCardProps) {
  const statusColor = STATUS_COLORS[status] ?? '#666';
  const staggerDelay = `${index * 80}ms`;

  return (
    <a
      href={`/worlds/${slug}`}
      style={{
        display: 'block',
        animation: `oculus-slide-up 300ms ${staggerDelay} both`,
        transition: 'transform 200ms ease-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <OrnateFrame pillar={framePillar as PillarId} variant="panel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-geist-mono), monospace',
                fontSize: '12px',
                opacity: 0.4,
              }}
            >
              {owner}/{repo}
            </span>
            <MagnitudeBadge
              tier={magnitude.tier}
              score={magnitude.score}
              symbol={magnitude.symbol}
              tintColor={tincture.hex}
            />
          </div>

          {/* World name */}
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: tincture.hex,
              margin: 0,
              fontFamily: 'var(--font-geist-sans), sans-serif',
            }}
          >
            {name}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: '0.85rem',
              opacity: 0.6,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>

          {/* Language bar */}
          <LanguageBar languages={stats.languages} />

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <StatPill label="files" value={stats.fileCount} />
            <StatPill label="commits" value={stats.commitCount} />
            <StatPill label="hotspots" value={stats.hotspotCount} />
            <StatPill label="contributors" value={stats.contributorCount} />
          </div>

          {/* Footer: status + CTA */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '4px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: statusColor,
                fontFamily: 'var(--font-geist-mono), monospace',
              }}
            >
              {status}
            </span>
            <span
              className="world-card-cta"
              style={{
                fontSize: '13px',
                opacity: 0.35,
                transition: 'opacity 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.35';
              }}
            >
              Enter World &rarr;
            </span>
          </div>
        </div>
      </OrnateFrame>
    </a>
  );
}
