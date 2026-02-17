/**
 * ARCHITECTUS ornaments — Column capital brackets, fluted pillar lines
 */

import type { CornerProps, DefsProps, EdgeProps, FrameOrnamentSet } from './types';

function Corner({ id, x, y, size, mirror, palette }: CornerProps) {
  const [flipX, flipY] = mirror;
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;

  return (
    <g transform={`translate(${x},${y}) scale(${sx},${sy})`}>
      {/* Column capital bracket — squared L with serif */}
      <path
        d={`M ${size} 0 L 0 0 L 0 ${size}`}
        fill="none"
        stroke={palette.primary}
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />
      {/* Serif kick at horizontal end */}
      <line x1={size} y1={0} x2={size} y2={4} stroke={palette.primary} strokeWidth="1.5" />
      {/* Serif kick at vertical end */}
      <line x1={0} y1={size} x2={4} y2={size} stroke={palette.primary} strokeWidth="1.5" />
      {/* Inner capital step */}
      <path
        d={`M ${size * 0.6} 3 L 3 3 L 3 ${size * 0.6}`}
        fill="none"
        stroke={palette.secondary}
        strokeWidth="1"
        opacity="0.4"
      />
    </g>
  );
}

function EdgeH({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;
  const flutes = Math.max(2, Math.floor(length / 20));
  const gap = length / flutes;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Base line */}
      <line x1={0} y1={0} x2={length} y2={0} stroke={palette.primary} strokeWidth="1" opacity="0.25" />
      {/* Flute accents */}
      {Array.from({ length: flutes }, (_, i) => (
        <line
          key={i}
          x1={i * gap + gap * 0.5}
          y1={-2}
          x2={i * gap + gap * 0.5}
          y2={2}
          stroke={palette.secondary}
          strokeWidth="1"
          opacity="0.3"
        />
      ))}
    </g>
  );
}

function EdgeV({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;
  const flutes = Math.max(2, Math.floor(length / 20));
  const gap = length / flutes;

  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={0} y1={0} x2={0} y2={length} stroke={palette.primary} strokeWidth="1" opacity="0.25" />
      {Array.from({ length: flutes }, (_, i) => (
        <line
          key={i}
          x1={-2}
          y1={i * gap + gap * 0.5}
          x2={2}
          y2={i * gap + gap * 0.5}
          stroke={palette.secondary}
          strokeWidth="1"
          opacity="0.3"
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
        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );
}

export const architectus: FrameOrnamentSet = { Corner, EdgeH, EdgeV, Defs };
