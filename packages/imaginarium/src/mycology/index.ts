/**
 * Mycology system — barrel exports.
 */

export type { InstanceData, LODConfig, MushroomMeshData } from './assets/MeshGenerator';
export { generateMeshData } from './assets/MeshGenerator';
export type { MushroomSpriteProps } from './assets/MushroomSprite';
export { MushroomSprite } from './assets/MushroomSprite';
// Assets
export { generateSvg, generateSvgBatch } from './assets/SvgTemplates';
export type { FileContext } from './GenusMapper';
// Genus classification
export { buildCoChurnMap, buildFileContext, buildTaxonomy, classifyGenus } from './GenusMapper';
// Lore
export { generateLore } from './LoreGenerator';
// Morphology
export { generateMorphology } from './MorphologyGenerator';
// Network
export { buildNetwork } from './MycelialNetwork';
// Pipeline
export { distillMycology } from './MycologyPipeline';
// Catalog
export { catalogize } from './SpecimenCatalog';
// Types
export type {
  BioluminescenceLevel,
  CapShape,
  FungalClass,
  FungalDivision,
  FungalFamily,
  FungalGenus,
  FungalOrder,
  FungalSpecimen,
  FungalTaxonomy,
  GillAttachment,
  HyphalCluster,
  LoreTier,
  MushroomArchetype,
  MushroomLore,
  MushroomMorphology,
  MushroomPlacement,
  MycelialEdge,
  MycelialNetwork,
  MycelialNode,
  MycologyCatalogedEvent,
  MycologyManifest,
  MycorrhizalType,
  SignalType,
  SizeClass,
  SporePrintColor,
  StemForm,
  SubstrateType,
} from './types';
