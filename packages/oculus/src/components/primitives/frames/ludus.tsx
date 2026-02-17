/**
 * LUDUS ornaments — D-pad corner marks, tactical grid dashes
 */

import type { CornerProps, DefsProps, EdgeProps, FrameOrnamentSet } from './types';

function Corner({ id, x, y, size, mirror, palette }: CornerProps) {
  const [flipX, flipY] = mirror;
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;

  return (
    <g transform={`translate(${x},${y}) scale(${sx},${sy})`}>
      {/* D-pad crosshair corner */}
      <line x1={0} y1={0} x2={size} y2={0} stroke={palette.primary} strokeWidth="1.5" />
      <line x1={0} y1={0} x2={0} y2={size} stroke={palette.primary} strokeWidth="1.5" />
      {/* Center notch — skill tree node */}
      <rect
        x={2}
        y={2}
        width={size * 0.25}
        height={size * 0.25}
        fill="none"
        stroke={palette.secondary}
        strokeWidth="1"
        opacity="0.6"
      />
      {/* Tiny inner pip */}
      <rect x={size * 0.1} y={size * 0.1} width={3} height={3} fill={palette.accent} opacity="0.5" />
    </g>
  );
}

function EdgeH({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;
  const dashes = Math.max(2, Math.floor(length / 16));
  const gap = length / dashes;

  return (
    <g transform={`translate(${x},${y})`}>
      {Array.from({ length: dashes }, (_, i) =>
        i % 2 === 0 ? (
          <line
            key={i}
            x1={i * gap}
            y1={0}
            x2={i * gap + gap * 0.6}
            y2={0}
            stroke={palette.primary}
            strokeWidth="1"
            opacity="0.25"
          />
        ) : null,
      )}
    </g>
  );
}

function EdgeV({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;
  const dashes = Math.max(2, Math.floor(length / 16));
  const gap = length / dashes;

  return (
    <g transform={`translate(${x},${y})`}>
      {Array.from({ length: dashes }, (_, i) =>
        i % 2 === 0 ? (
          <line
            key={i}
            x1={0}
            y1={i * gap}
            x2={0}
            y2={i * gap + gap * 0.6}
            stroke={palette.primary}
            strokeWidth="1"
            opacity="0.25"
          />
        ) : null,
      )}
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

export const ludus: FrameOrnamentSet = { Corner, EdgeH, EdgeV, Defs };
