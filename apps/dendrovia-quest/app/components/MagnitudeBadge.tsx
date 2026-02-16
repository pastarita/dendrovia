'use client';

/**
 * MagnitudeBadge — Small pill badge showing tier name + numeric score,
 * tinted by the world's tincture color.
 */

interface MagnitudeBadgeProps {
  tier: string;
  score: number;
  symbol: string;
  tintColor: string;
}

export function MagnitudeBadge({ tier, score, symbol, tintColor }: MagnitudeBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontFamily: 'var(--font-geist-mono), monospace',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        border: `1px solid ${tintColor}44`,
        background: `${tintColor}15`,
        color: tintColor,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{symbol}</span>
      <span>{tier}</span>
      <span style={{ opacity: 0.6 }}>{score}</span>
    </span>
  );
}
