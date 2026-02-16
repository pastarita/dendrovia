/**
 * Frame ornament registry — maps PillarId to FrameOrnamentSet
 */

import type { PillarId, FrameOrnamentSet } from './types';
import { oculus } from './oculus';
import { chronos } from './chronos';
import { architectus } from './architectus';
import { ludus } from './ludus';
import { imaginarium } from './imaginarium';
import { operatus } from './operatus';

export const FRAME_ORNAMENTS: Record<PillarId, FrameOrnamentSet> = {
  oculus,
  chronos,
  architectus,
  ludus,
  imaginarium,
  operatus,
};

export { PILLAR_PALETTES } from './palettes';
export type {
  PillarId,
  FrameVariant,
  PillarPalette,
  FrameOrnamentSet,
  CornerProps,
  EdgeProps,
  DefsProps,
} from './types';
