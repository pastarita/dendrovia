/**
 * genusPipelines — per-genus MeshOp pipeline definitions.
 *
 * Maps each of the 20 FungalGenus values to a composable MeshOp pipeline
 * that transforms the base ProfileGeometry/CylinderGeometry into an
 * enriched half-edge mesh with genus-appropriate detail.
 *
 * Tiered approach keeps GPU instruction budgets sane:
 *   Tier 1 (12 genera): basic smoothing — pipe(subdivide(1), smooth(2))
 *   Tier 2 (5 genera):  organic detail — pipe(subdivide(2), smooth(3), displaceByNoise(0.02, 6))
 *   Tier 3 (3 genera):  custom per-genus pipelines
 */

import type { FungalGenus } from '../mycology/types';
import type { MeshOp } from './pipeline';
import { pipe } from './pipeline';
import { subdivide } from './ops/subdivide';
import { smooth } from './ops/smooth';
import { displaceByNoise, displaceNormal } from './ops/displace';

// ---------------------------------------------------------------------------
// Default fallback pipeline (unknown genera)
// ---------------------------------------------------------------------------

export const DEFAULT_PIPELINE: MeshOp = pipe(subdivide(1), smooth(2));

// ---------------------------------------------------------------------------
// Tier definitions
// ---------------------------------------------------------------------------

/** Tier 1: 12 simple genera — basic smoothing */
const TIER_1_GENERA: readonly FungalGenus[] = [
  'Amanita',
  'Agaricus',
  'Boletus',
  'Cantharellus',
  'Russula',
  'Coprinus',
  'Mycena',
  'Ganoderma',
  'Pleurotus',
  'Psilocybe',
  'Clavaria',
  'Tuber',
] as const;

/** Tier 2: 5 organic genera — more complex detail */
const TIER_2_GENERA: readonly FungalGenus[] = [
  'Lactarius',
  'Armillaria',
  'Cordyceps',
  'Xylaria',
  'Phallus',
] as const;

const TIER_1_PIPELINE: MeshOp = pipe(subdivide(1), smooth(2));
const TIER_2_PIPELINE: MeshOp = pipe(subdivide(2), smooth(3), displaceByNoise(0.02, 6));

// ---------------------------------------------------------------------------
// Tier 3: custom per-genus pipelines
// ---------------------------------------------------------------------------

/** Morchella: aggressive noise for pitted/honeycombed cap surface */
const MORCHELLA_PIPELINE: MeshOp = pipe(subdivide(2), smooth(2), displaceByNoise(0.04, 12));

/** Hericium: simple base — spines are instanced separately by ARCHITECTUS */
const HERICIUM_PIPELINE: MeshOp = pipe(subdivide(1));

/** Trametes: slight normal inflation for bracket fungus thickness */
const TRAMETES_PIPELINE: MeshOp = pipe(subdivide(1), displaceNormal(0.02));

// ---------------------------------------------------------------------------
// Stem pipeline (shared across all genera — stems are simpler)
// ---------------------------------------------------------------------------

export const STEM_PIPELINE: MeshOp = pipe(subdivide(1), smooth(1));

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

const pipelineMap = new Map<FungalGenus, MeshOp>();

for (const g of TIER_1_GENERA) {
  pipelineMap.set(g, TIER_1_PIPELINE);
}
for (const g of TIER_2_GENERA) {
  pipelineMap.set(g, TIER_2_PIPELINE);
}
pipelineMap.set('Morchella', MORCHELLA_PIPELINE);
pipelineMap.set('Hericium', HERICIUM_PIPELINE);
pipelineMap.set('Trametes', TRAMETES_PIPELINE);

/**
 * Get the MeshOp pipeline for a given fungal genus.
 * Returns DEFAULT_PIPELINE for unknown genera.
 */
export function genusPipeline(genus: string): MeshOp {
  return pipelineMap.get(genus as FungalGenus) ?? DEFAULT_PIPELINE;
}
