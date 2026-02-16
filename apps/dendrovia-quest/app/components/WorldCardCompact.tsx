'use client';

/**
 * WorldCardCompact — Streamlined world entry card.
 *
 * Compact single-row layout: tincture pip + name + owner/repo,
 * one-line description, inline stats, magnitude symbol.
 * Links to /worlds/{slug}.
 */

interface WorldCardCompactProps {
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
  index: number;
}

const STATUS_DOT: Record<string, string> = {
  playable: '#6dffaa',
  analyzing: '#ffaa44',
  pending: '#666',
};

export function WorldCardCompact({
  slug,
  name,
  owner,
  repo,
  description,
  status,
  stats,
  magnitude,
  tincture,
  index,
}: WorldCardCompactProps) {
  const staggerDelay = `${index * 80}ms`;
  const dotColor = STATUS_DOT[status] ?? '#666';

  return (
    <a
      href={`/worlds/${slug}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        padding: '14px 18px',
        borderRadius: '10px',
        border: `1px solid ${tincture.hex}20`,
        background: `${tincture.hex}06`,
        transition: 'border-color 200ms, transform 200ms',
        animation: `oculus-slide-up 300ms ${staggerDelay} both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${tincture.hex}55`;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${tincture.hex}20`;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Row 1: Name + owner/repo + magnitude + status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        {/* Tincture pip */}
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: tincture.hex,
            flexShrink: 0,
          }}
        />

        {/* Name */}
        <span
          style={{
            fontWeight: 700,
            fontSize: '1rem',
            color: tincture.hex,
          }}
        >
          {name}
        </span>

        {/* owner/repo */}
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.75rem',
            opacity: 0.35,
          }}
        >
          {owner}/{repo}
        </span>

        {/* Spacer */}
        <span style={{ flex: 1 }} />

        {/* Magnitude symbol */}
        <span
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.8rem',
            color: tincture.hex,
            opacity: 0.7,
          }}
        >
          {magnitude.symbol}
        </span>

        {/* Status dot */}
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
          }}
        />
      </div>

      {/* Row 2: Description */}
      <p
        style={{
          margin: '6px 0 0 18px',
          fontSize: '0.8rem',
          opacity: 0.45,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {description}
      </p>

      {/* Row 3: Compact stats line */}
      <div
        style={{
          marginTop: '8px',
          marginLeft: '18px',
          fontFamily: 'var(--font-geist-mono), monospace',
          fontSize: '0.7rem',
          opacity: 0.3,
          display: 'flex',
          gap: '6px',
        }}
      >
        <span>{stats.fileCount.toLocaleString()} files</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>{stats.commitCount} commits</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>{stats.languages.length} languages</span>
      </div>
    </a>
  );
}
