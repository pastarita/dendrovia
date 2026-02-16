/**
 * Foundry Registry — Frame System Metadata
 *
 * OWNERSHIP CONTRAST:
 * The Foundry lives in OCULUS (playground-oculus) because OCULUS owns the
 * design system. Other pillars (LUDUS, CHRONOS, etc.) consume OrnateFrame
 * as a dependency but do not own the ornamental vocabulary. Visual QA of
 * frame rendering is a design-system concern, not a game-mechanics or
 * parsing concern.
 *
 * UPSTREAM DATA FLOWS (future):
 * - IMAGINARIUM -> Foundry: Procedural palettes (extractPalette()) could
 *   generate stress-test color schemes beyond the static PILLAR_PALETTES.
 *   ProceduralPalette shape differs from PillarPalette; an adapter would
 *   map { primary, secondary, accent, background, glow, mood } ->
 *   { primary, secondary, accent, glow }.
 *
 * - CHRONOS -> Foundry: CodeTopology hotspots could identify which frame
 *   component files have high churn, prioritizing visual regression testing.
 *   Hotspot.riskScore on frame/*.tsx files -> Foundry test priority.
 *
 * OPERATUS INTEGRATION:
 * This registry is the externalized API surface for DevOps tooling.
 * OPERATUS can import FRAME_REGISTRY to:
 * - Enumerate all 24 frame combinations for screenshot validation
 * - Track palette assets in the AssetManifest
 * - Build health-check endpoints that verify frame rendering
 */

import type { FrameVariant, PillarId, PillarPalette } from './types';
import { PILLAR_PALETTES } from './palettes';

export interface VariantSpec {
  cornerSize: number;
  showEdges: boolean;
  showGlow: boolean;
  description: string;
}

export interface PillarSpec {
  id: PillarId;
  name: string;
  emoji: string;
  color: string;
  tincture: string;
  palette: PillarPalette;
}

export const VARIANT_SPECS: Record<FrameVariant, VariantSpec> = {
  modal: {
    cornerSize: 32,
    showEdges: true,
    showGlow: true,
    description: 'Largest — corner ornaments + edge ornaments + glow',
  },
  panel: {
    cornerSize: 24,
    showEdges: true,
    showGlow: false,
    description: 'Standard — corner ornaments + edge ornaments',
  },
  compact: {
    cornerSize: 16,
    showEdges: false,
    showGlow: false,
    description: 'Tight — small corners, no edges',
  },
  tooltip: {
    cornerSize: 8,
    showEdges: false,
    showGlow: false,
    description: 'Minimal — tiny corners, no edges',
  },
};

export const PILLAR_SPECS: Record<PillarId, PillarSpec> = {
  chronos: {
    id: 'chronos',
    name: 'CHRONOS',
    emoji: '\u{1F4DC}',
    color: '#c77b3f',
    tincture: 'Amber',
    palette: PILLAR_PALETTES.chronos,
  },
  imaginarium: {
    id: 'imaginarium',
    name: 'IMAGINARIUM',
    emoji: '\u{1F3A8}',
    color: '#A855F7',
    tincture: 'Purpure',
    palette: PILLAR_PALETTES.imaginarium,
  },
  architectus: {
    id: 'architectus',
    name: 'ARCHITECTUS',
    emoji: '\u{1F3DB}\uFE0F',
    color: '#3B82F6',
    tincture: 'Azure',
    palette: PILLAR_PALETTES.architectus,
  },
  ludus: {
    id: 'ludus',
    name: 'LUDUS',
    emoji: '\u{1F3AE}',
    color: '#EF4444',
    tincture: 'Gules',
    palette: PILLAR_PALETTES.ludus,
  },
  oculus: {
    id: 'oculus',
    name: 'OCULUS',
    emoji: '\u{1F441}\uFE0F',
    color: '#22C55E',
    tincture: 'Vert',
    palette: PILLAR_PALETTES.oculus,
  },
  operatus: {
    id: 'operatus',
    name: 'OPERATUS',
    emoji: '\u{1F4BE}',
    color: '#1F2937',
    tincture: 'Sable',
    palette: PILLAR_PALETTES.operatus,
  },
};

export const FRAME_REGISTRY = {
  pillars: PILLAR_SPECS,
  variants: VARIANT_SPECS,
  totalCombinations: (Object.keys(PILLAR_SPECS).length *
    Object.keys(VARIANT_SPECS).length) as 24,
} as const;
