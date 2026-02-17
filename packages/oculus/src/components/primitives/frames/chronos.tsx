/**
 * CHRONOS ornaments — Scroll curl terminals, strata band lines
 */

import type { CornerProps, DefsProps, EdgeProps, FrameOrnamentSet } from './types';

function Corner({ id, x, y, size, mirror, palette }: CornerProps) {
  const [flipX, flipY] = mirror;
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;

  return (
    <g transform={`translate(${x},${y}) scale(${sx},${sy})`}>
      {/* Scroll curl terminal */}
      <path
        d={`M ${size} 0 L 4 0 Q 0 0 0 4 L 0 ${size}`}
        fill="none"
        stroke={palette.primary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Curl spiral inward */}
      <path d={`M 4 0 Q 8 4 6 8 Q 4 12 8 10`} fill="none" stroke={palette.secondary} strokeWidth="1" opacity="0.5" />
      {/* Strata dot */}
      <circle cx={size * 0.3} cy={size * 0.3} r={2} fill={palette.accent} opacity="0.4" />
    </g>
  );
}

function EdgeH({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;
  const bands = Math.max(1, Math.floor(length / 60));
  const gap = length / bands;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Main line */}
      <line x1={0} y1={0} x2={length} y2={0} stroke={palette.primary} strokeWidth="1" opacity="0.2" />
      {/* Strata tick marks */}
      {Array.from({ length: bands + 1 }, (_, i) => (
        <line
          key={i}
          x1={i * gap}
          y1={-3}
          x2={i * gap}
          y2={3}
          stroke={palette.secondary}
          strokeWidth="1"
          opacity={0.2 + 0.15 * (i % 2)}
        />
      ))}
    </g>
  );
}

function EdgeV({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;
  const bands = Math.max(1, Math.floor(length / 60));
  const gap = length / bands;

  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={0} y1={0} x2={0} y2={length} stroke={palette.primary} strokeWidth="1" opacity="0.2" />
      {Array.from({ length: bands + 1 }, (_, i) => (
        <line
          key={i}
          x1={-3}
          y1={i * gap}
          x2={3}
          y2={i * gap}
          stroke={palette.secondary}
          strokeWidth="1"
          opacity={0.2 + 0.15 * (i % 2)}
        />
      ))}
    </g>
  );
}

function Defs({ id, palette }: DefsProps) {
  return (
    <defs>
      <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={palette.primary} />
        <stop offset="100%" stopColor={palette.accent} />
      </linearGradient>
      <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );
}

export const chronos: FrameOrnamentSet = { Corner, EdgeH, EdgeV, Defs };
