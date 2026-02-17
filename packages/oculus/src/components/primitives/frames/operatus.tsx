/**
 * OPERATUS ornaments — Gear tooth notches, pipeline connector dots
 */

import type { CornerProps, DefsProps, EdgeProps, FrameOrnamentSet } from './types';

function Corner({ id, x, y, size, mirror, palette }: CornerProps) {
  const [flipX, flipY] = mirror;
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  const tooth = size * 0.2;

  return (
    <g transform={`translate(${x},${y}) scale(${sx},${sy})`}>
      {/* Gear-tooth notched corner */}
      <path
        d={`M ${size} 0 L ${tooth} 0 L ${tooth} ${tooth} L 0 ${tooth} L 0 ${size}`}
        fill="none"
        stroke={palette.primary}
        strokeWidth="1.5"
        strokeLinejoin="miter"
      />
      {/* Inner gear pip */}
      <rect x={tooth * 0.6} y={tooth * 0.6} width={3} height={3} fill={palette.secondary} opacity="0.5" />
    </g>
  );
}

function EdgeH({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;
  const dots = Math.max(2, Math.floor(length / 30));
  const gap = length / (dots + 1);

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Pipeline connector dots */}
      {Array.from({ length: dots }, (_, i) => (
        <circle key={i} cx={(i + 1) * gap} cy={0} r={1.5} fill={palette.primary} opacity="0.3" />
      ))}
    </g>
  );
}

function EdgeV({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;
  const dots = Math.max(2, Math.floor(length / 30));
  const gap = length / (dots + 1);

  return (
    <g transform={`translate(${x},${y})`}>
      {Array.from({ length: dots }, (_, i) => (
        <circle key={i} cx={0} cy={(i + 1) * gap} r={1.5} fill={palette.primary} opacity="0.3" />
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

export const operatus: FrameOrnamentSet = { Corner, EdgeH, EdgeV, Defs };
