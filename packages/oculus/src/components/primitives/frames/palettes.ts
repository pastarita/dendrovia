/**
 * Pillar color palettes for OrnateFrame ornaments
 *
 * Sourced from PILLAR_THEMATIC_SCHEMA.md and pillar tincture assignments.
 */

import type { PillarId, PillarPalette } from './types';

export const PILLAR_PALETTES: Record<PillarId, PillarPalette> = {
  oculus: {
    primary: '#f5a97f',
    secondary: '#d88957',
    accent: '#ffd4b8',
    glow: 'rgba(245,169,127,0.3)',
  },
  chronos: {
    primary: '#d4a574',
    secondary: '#8b7355',
    accent: '#e8d7c3',
    glow: 'rgba(212,165,116,0.3)',
  },
  architectus: {
    primary: '#3B82F6',
    secondary: '#60a5fa',
    accent: '#93c5fd',
    glow: 'rgba(59,130,246,0.3)',
  },
  ludus: {
    primary: '#EF4444',
    secondary: '#f87171',
    accent: '#fca5a5',
    glow: 'rgba(239,68,68,0.3)',
  },
  imaginarium: {
    primary: '#A855F7',
    secondary: '#c084fc',
    accent: '#d8b4fe',
    glow: 'rgba(168,85,247,0.3)',
  },
  operatus: {
    primary: '#6B7280',
    secondary: '#9CA3AF',
    accent: '#D1D5DB',
    glow: 'rgba(107,114,128,0.3)',
  },
};
