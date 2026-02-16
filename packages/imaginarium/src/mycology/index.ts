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
} from './types';

// Genus classification
export { classifyGenus, buildTaxonomy, buildFileContext, buildCoChurnMap } from './GenusMapper';
export type { FileContext } from './GenusMapper';

// Morphology
export { generateMorphology } from './MorphologyGenerator';

// Network
export { buildNetwork } from './MycelialNetwork';

// Lore
export { generateLore } from './LoreGenerator';

// Catalog
export { catalogize } from './SpecimenCatalog';

// Assets
export { generateSvg, generateSvgBatch } from './assets/SvgTemplates';
export { MushroomSprite } from './assets/MushroomSprite';
export type { MushroomSpriteProps } from './assets/MushroomSprite';
export { generateMeshData } from './assets/MeshGenerator';
export type { MushroomMeshData, InstanceData, LODConfig } from './assets/MeshGenerator';

// Pipeline
export { distillMycology } from './MycologyPipeline';
