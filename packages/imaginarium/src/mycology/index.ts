/**
 * Mycology system — barrel exports.
 */

// Types
export type {
  FungalDivision,
  FungalClass,
  FungalOrder,
  FungalFamily,
  FungalGenus,
  FungalTaxonomy,
  CapShape,
  GillAttachment,
  StemForm,
  SporePrintColor,
  BioluminescenceLevel,
  SizeClass,
  MushroomMorphology,
  MycorrhizalType,
  SignalType,
  MycelialNode,
  MycelialEdge,
  HyphalCluster,
  MycelialNetwork,
  LoreTier,
  MushroomLore,
  SubstrateType,
  MushroomPlacement,
  FungalSpecimen,
  MushroomArchetype,
  MycologyManifest,
  MycologyCatalogedEvent,
} from './types.js';

// Genus classification
export { classifyGenus, buildTaxonomy, buildFileContext, buildCoChurnMap } from './GenusMapper.js';
export type { FileContext } from './GenusMapper.js';

// Morphology
export { generateMorphology } from './MorphologyGenerator.js';

// Network
export { buildNetwork } from './MycelialNetwork.js';

// Lore
export { generateLore } from './LoreGenerator.js';

// Catalog
export { catalogize } from './SpecimenCatalog.js';

// Assets
export { generateSvg, generateSvgBatch } from './assets/SvgTemplates.js';
export { MushroomSprite } from './assets/MushroomSprite.js';
export type { MushroomSpriteProps } from './assets/MushroomSprite.js';
export { generateMeshData } from './assets/MeshGenerator.js';
export type { MushroomMeshData, InstanceData, LODConfig } from './assets/MeshGenerator.js';

// Pipeline
export { distillMycology } from './MycologyPipeline.js';
