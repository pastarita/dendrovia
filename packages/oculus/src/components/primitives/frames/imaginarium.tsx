/**
 * IMAGINARIUM ornaments — Prism facets, spectrum gradient band
 */

import React from 'react';
import type { CornerProps, EdgeProps, DefsProps, FrameOrnamentSet } from './types';

function Corner({ id, x, y, size, mirror, palette }: CornerProps) {
  const [flipX, flipY] = mirror;
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;

  return (
    <g transform={`translate(${x},${y}) scale(${sx},${sy})`}>
      {/* Prism facet — triangular shard */}
      <path
        d={`M 0 ${size} L 0 0 L ${size} 0`}
        fill="none"
        stroke={palette.primary}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Inner facet refraction line */}
      <path
        d={`M ${size * 0.15} ${size * 0.6} L ${size * 0.15} ${size * 0.15} L ${size * 0.6} ${size * 0.15}`}
        fill="none"
        stroke={palette.secondary}
        strokeWidth="1"
        opacity="0.5"
      />
      {/* Spectrum dot */}
      <circle
        cx={size * 0.25}
        cy={size * 0.25}
        r={size * 0.08}
        fill={`url(#${id}-grad)`}
        opacity="0.6"
      />
    </g>
  );
}

function EdgeH({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Spectrum gradient band */}
      <line
        x1={0} y1={0}
        x2={length} y2={0}
        stroke={`url(#${id}-grad)`}
        strokeWidth="1.5"
        opacity="0.3"
      />
      {/* Refraction scatter dots */}
      {Array.from({ length: Math.max(2, Math.floor(length / 50)) }, (_, i) => {
        const cx = ((i + 1) / (Math.floor(length / 50) + 1)) * length;
        return (
          <circle
            key={i}
            cx={cx}
            cy={0}
            r={1.5}
            fill={palette.accent}
            opacity={0.2 + 0.15 * (i % 2)}
          />
        );
      })}
    </g>
  );
}

function EdgeV({ id, x, y, length, palette }: EdgeProps) {
  if (length <= 0) return null;

  return (
    <g transform={`translate(${x},${y})`}>
      <line
        x1={0} y1={0}
        x2={0} y2={length}
        stroke={`url(#${id}-grad)`}
        strokeWidth="1.5"
        opacity="0.3"
      />
      {Array.from({ length: Math.max(2, Math.floor(length / 50)) }, (_, i) => {
        const cy = ((i + 1) / (Math.floor(length / 50) + 1)) * length;
        return (
          <circle
            key={i}
            cx={0}
            cy={cy}
            r={1.5}
            fill={palette.accent}
            opacity={0.2 + 0.15 * (i % 2)}
          />
        );
      })}
    </g>
  );
}

function Defs({ id, palette }: DefsProps) {
  return (
    <defs>
      <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={palette.primary} />
        <stop offset="50%" stopColor={palette.secondary} />
        <stop offset="100%" stopColor={palette.accent} />
      </linearGradient>
      <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  );
}

export const imaginarium: FrameOrnamentSet = { Corner, EdgeH, EdgeV, Defs };
