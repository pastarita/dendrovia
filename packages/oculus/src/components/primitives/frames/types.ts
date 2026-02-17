/**
 * OrnateFrame type definitions
 *
 * Pillar-specific SVG ornament system for decorative frame overlays.
 */

import type { ReactNode } from 'react';

export type PillarId = 'oculus' | 'chronos' | 'architectus' | 'ludus' | 'imaginarium' | 'operatus';

export type FrameVariant = 'modal' | 'panel' | 'compact' | 'tooltip';

export interface PillarPalette {
  /** Main stroke/fill color */
  primary: string;
  /** Supporting stroke color */
  secondary: string;
  /** Highlight / accent color */
  accent: string;
  /** Glow rgba value */
  glow: string;
}

export interface CornerProps {
  /** Unique ID prefix from useId() for gradient/filter refs */
  id: string;
  /** Corner x position */
  x: number;
  /** Corner y position */
  y: number;
  /** Corner size in px */
  size: number;
  /** [flipX, flipY] for mirroring to other corners */
  mirror: [boolean, boolean];
  palette: PillarPalette;
}

export interface EdgeProps {
  id: string;
  x: number;
  y: number;
  /** Stretched dimension (width for horizontal, height for vertical) */
  length: number;
  palette: PillarPalette;
}

export interface DefsProps {
  id: string;
  palette: PillarPalette;
}

export interface FrameOrnamentSet {
  Corner: (props: CornerProps) => ReactNode;
  EdgeH: (props: EdgeProps) => ReactNode;
  EdgeV: (props: EdgeProps) => ReactNode;
  Defs: (props: DefsProps) => ReactNode;
}
