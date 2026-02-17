/**
 * Frame ornament registry — maps PillarId to FrameOrnamentSet
 */

import { architectus } from './architectus';
import { chronos } from './chronos';
import { imaginarium } from './imaginarium';
import { ludus } from './ludus';
import { oculus } from './oculus';
import { operatus } from './operatus';
import type { FrameOrnamentSet, PillarId } from './types';

export const FRAME_ORNAMENTS: Record<PillarId, FrameOrnamentSet> = {
  oculus,
  chronos,
  architectus,
  ludus,
  imaginarium,
  operatus,
};

export { PILLAR_PALETTES } from './palettes';
export type { PillarSpec, VariantSpec } from './registry';
export { FRAME_REGISTRY, PILLAR_SPECS, VARIANT_SPECS } from './registry';
export type {
  CornerProps,
  DefsProps,
  EdgeProps,
  FrameOrnamentSet,
  FrameVariant,
  PillarId,
  PillarPalette,
} from './types';
