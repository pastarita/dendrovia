/**
 * OCULUS ornaments — Eyelid curves, hex iris cells, focus ring arcs
 */

import type { CornerProps, DefsProps, EdgeProps, FrameOrnamentSet } from './types';

function Corner({ id, x, y, size, mirror, palette }: CornerProps) {
  const [flipX, flipY] = mirror;
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;

  return (
    <g transform={`translate(${x},${y}) scale(${sx},${sy})`}>
      {/* Eyelid curve bracket */}
      <path
        d={`M 0 ${size} Q 0 0 ${size} 0`}
        fill="none"
        stroke={palette.primary}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Inner eyelid echo */}
      <path
        d={`M 2 ${size * 0.7} Q 2 2 ${size * 0.7} 2`}
        fill="none"
        stroke={palette.secondary}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Hex iris cell */}
      <circle
        cx={size * 0.22}
        cy={size * 0.22}
        r={size * 0.12}
        fill="none"
        stroke={palette.accent}
        strokeWidth="1"
        opacity="0.5"
      />
      <circle cx={size * 0.22} cy={size * 0.22} r={size * 0.05} fill={palette.primary} opacity="0.4" />
    </g>
  );
}

function EdgeH({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;
  const segments = Math.max(2, Math.floor(length / 40));
  const gap = length / segments;

  return (
    <g transform={`translate(${x},${y})`}>
      {Array.from({ length: segments }, (_, i) => (
        <path
          key={i}
          d={`M ${i * gap + gap * 0.15} 0 A ${gap * 0.35} 4 0 0 1 ${i * gap + gap * 0.85} 0`}
          fill="none"
          stroke={palette.primary}
          strokeWidth="1"
          opacity={0.15 + 0.15 * Math.sin((i / segments) * Math.PI)}
        />
      ))}
    </g>
  );
}

function EdgeV({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;
  const segments = Math.max(2, Math.floor(length / 40));
  const gap = length / segments;

  return (
    <g transform={`translate(${x},${y})`}>
      {Array.from({ length: segments }, (_, i) => (
        <path
          key={i}
          d={`M 0 ${i * gap + gap * 0.15} A 4 ${gap * 0.35} 0 0 1 0 ${i * gap + gap * 0.85}`}
          fill="none"
          stroke={palette.primary}
          strokeWidth="1"
          opacity={0.15 + 0.15 * Math.sin((i / segments) * Math.PI)}
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
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );
}

export const oculus: FrameOrnamentSet = { Corner, EdgeH, EdgeV, Defs };
