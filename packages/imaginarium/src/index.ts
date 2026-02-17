/**
 * IMAGINARIUM - The Compiler
 *
 * Entry point for the AI -> Shader distillation pipeline.
 * Exports all public modules for consumption by other pillars.
 */

// --- Cache ---
export { DeterministicCache } from './cache/DeterministicCache';
// --- Distillation ---
export { extractFilePalette, extractPalette } from './distillation/ColorExtractor';
export { compile as compileLSystem, expandLSystem } from './distillation/LSystemCompiler';
export { generate as generateNoise } from './distillation/NoiseGenerator';
export { compile as compileSDF, type SDFCompileConfig } from './distillation/SDFCompiler';
export { interpret as interpretTurtle, type TurtleSegment } from './distillation/TurtleInterpreter';
// --- Fallbacks ---
export { DEFAULT_PALETTES, getDefaultPalette, getLanguageHue, LANGUAGE_HUES } from './fallback/DefaultPalettes';
export { DEFAULT_SDFS, getDefaultSDF, type SDFTier } from './fallback/DefaultSDFs';
// --- Generation ---
export { type ArtGenOptions, type ArtGenResult, type ArtProvider, generate as generateArt } from './generation/ArtGen';
export { buildPrompt } from './generation/PromptBuilder';
export type {
  AsyncMeshOp,
  FlatMeshData,
  HalfEdgeMesh,
  HEFace,
  HEHalfEdge,
  HEVertex,
  MeshGenerationResult,
  MeshGenerationStats,
  MeshOp,
  PipelineStep,
  SerializeOptions,
} from './mesh/index';
// --- Mesh Pipeline ---
export {
  applyPipelineToCylinder,
  applyPipelineToProfile,
  buildFromCylinder,
  // Data structure
  buildFromIndexed,
  buildFromProfile,
  cylinderToHalfEdge,
  DEFAULT_PIPELINE,
  deserializeToFlat,
  deserializeToHalfEdge,
  deserializeWithFallback,
  displaceByField,
  displaceByFunction,
  displaceByNoise,
  displaceNormal,
  faceVertices,
  fallbackMeshFromCylinder,
  fallbackMeshFromProfile,
  // Mesh asset generation
  generateMeshAssets,
  // Genus pipelines
  genusPipeline,
  halfedgeFrom,
  isBoundaryVertex,
  laplacianSmoothOnce,
  loopSubdivideOnce,
  MeshPipeline,
  meshStats,
  // Pipeline
  pipe,
  pipeAsync,
  // Adapters (bridge MeshGenerator ↔ HalfEdgeMesh)
  profileToHalfEdge,
  repeat,
  STEM_PIPELINE,
  // Serialization (OPERATUS-compatible)
  serialize,
  smooth,
  specimenToHalfEdge,
  // Operations
  subdivide,
  taubinSmooth,
  toFlatArrays,
  vertexFaces,
  vertexNeighbors,
  when,
} from './mesh/index';
export type {
  FileContext,
  FungalGenus,
  FungalSpecimen,
  FungalTaxonomy,
  MushroomLore,
  MushroomMeshData,
  MushroomMorphology,
  MushroomSpriteProps,
  MycelialNetwork,
  MycologyCatalogedEvent,
  MycologyManifest,
} from './mycology/index';
// --- Mycology ---
export {
  buildCoChurnMap,
  buildFileContext,
  // Network
  buildNetwork,
  buildTaxonomy,
  // Catalog
  catalogize,
  // Classification
  classifyGenus,
  // Pipeline
  distillMycology,
  // Lore
  generateLore,
  // Mesh
  generateMeshData,
  // Morphology
  generateMorphology,
  // SVG
  generateSvg,
  generateSvgBatch,
  // TSX
  MushroomSprite,
} from './mycology/index';
// --- Pipeline ---
export { distill } from './pipeline/DistillationPipeline';
export { generateManifest, type ManifestInput } from './pipeline/ManifestGenerator';
export { generateMockTopology } from './pipeline/MockTopology';
export { distillSegments } from './pipeline/SegmentPipeline';
export { readTopology } from './pipeline/TopologyReader';
export { generateVariants } from './pipeline/VariantGenerator';
// --- Shader Assembly ---
export {
  type AssembledShader,
  type AssemblerConfig,
  assembleShader,
  buildColorParameters,
} from './shaders/ShaderAssembler';
// --- Story Arc ---
export {
  assignPhases,
  computeTension,
  deriveStoryArc,
  mapMood,
  type PhaseAssignment,
  type RawSegment,
  sliceSegments,
} from './storyarc/index';
// --- Utilities ---
export {
  blendColors,
  colorTemperature,
  type HarmonyScheme,
  harmonize,
  hexToOklch,
  hexToRgb,
  hslToHex,
  type OklchColor,
  oklchToHex,
  oklchToRgb,
  type RgbColor,
  rgbToHex,
  rgbToOklch,
} from './utils/color';
export {
  countInstructions,
  type GLSLValidationResult,
  glslFloat,
  glslFunction,
  glslUniform,
  glslVec3,
  glslVec3FromHex,
  validateGLSL,
} from './utils/glsl';
export { hashFiles, hashObject, hashString } from './utils/hash';
