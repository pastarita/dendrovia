/**
 * IMAGINARIUM - The Compiler
 *
 * Entry point for the AI -> Shader distillation pipeline.
 * Exports all public modules for consumption by other pillars.
 */

// --- Distillation ---
export { extractPalette, extractFilePalette } from './distillation/ColorExtractor';
export { compile as compileSDF, type SDFCompileConfig } from './distillation/SDFCompiler';
export { compile as compileLSystem, expandLSystem } from './distillation/LSystemCompiler';
export { generate as generateNoise } from './distillation/NoiseGenerator';
export { interpret as interpretTurtle, type TurtleSegment } from './distillation/TurtleInterpreter';

// --- Generation ---
export { generate as generateArt, type ArtGenResult, type ArtGenOptions, type ArtProvider } from './generation/ArtGen';
export { buildPrompt } from './generation/PromptBuilder';

// --- Shader Assembly ---
export { assembleShader, buildColorParameters, type AssemblerConfig, type AssembledShader } from './shaders/ShaderAssembler';

// --- Cache ---
export { DeterministicCache } from './cache/DeterministicCache';

// --- Fallbacks ---
export { DEFAULT_PALETTES, getDefaultPalette, getLanguageHue, LANGUAGE_HUES } from './fallback/DefaultPalettes';
export { DEFAULT_SDFS, getDefaultSDF, type SDFTier } from './fallback/DefaultSDFs';

// --- Pipeline ---
export { distill } from './pipeline/DistillationPipeline';
export { generateVariants } from './pipeline/VariantGenerator';
export { generateManifest, type ManifestInput } from './pipeline/ManifestGenerator';
export { readTopology } from './pipeline/TopologyReader';
export { generateMockTopology } from './pipeline/MockTopology';
export { distillSegments, MOOD_STRATEGIES } from './pipeline/SegmentPipeline';
export { chunkTopology } from './pipeline/TopologyChunker';
export { precomputePlacements } from './pipeline/SegmentPlacementPrecomputer';

// --- Pipeline Types ---
export type { GlobalGenerationContext, SegmentGenerationContext, MoodStrategy, VersionedArtifact } from './pipeline/types';
export { IMAGINARIUM_SCHEMA_VERSION } from './pipeline/types';

// --- Story Arc ---
export {
  deriveStoryArc,
  sliceSegments, type RawSegment,
  mapMood,
  assignPhases, computeTension, type PhaseAssignment,
} from './storyarc/index';

// --- Utilities ---
export {
  rgbToOklch, oklchToRgb, oklchToHex, hexToRgb, rgbToHex, hexToOklch,
  harmonize, colorTemperature, blendColors, hslToHex,
  type OklchColor, type RgbColor, type HarmonyScheme,
} from './utils/color';
export { hashString, hashObject, hashFiles } from './utils/hash';
export {
  glslFloat, glslVec3, glslVec3FromHex, glslUniform, glslFunction,
  validateGLSL, countInstructions, type GLSLValidationResult,
} from './utils/glsl';

// --- Mycology ---
export {
  // Pipeline
  distillMycology,
  // Catalog
  catalogize,
  // Classification
  classifyGenus, buildTaxonomy, buildFileContext, buildCoChurnMap,
  // Morphology
  generateMorphology,
  // Network
  buildNetwork,
  // Lore
  generateLore,
  // SVG
  generateSvg, generateSvgBatch,
  // Mesh
  generateMeshData,
  // TSX
  MushroomSprite,
} from './mycology/index';
export type {
  FungalSpecimen, FungalTaxonomy, FungalGenus,
  MushroomMorphology, MushroomLore, MycelialNetwork,
  MycologyManifest, MycologyCatalogedEvent,
  MushroomMeshData, MushroomSpriteProps,
  FileContext,
} from './mycology/index';

// --- Mesh Pipeline ---
export {
  // Data structure
  buildFromIndexed, buildFromProfile, buildFromCylinder,
  vertexNeighbors, vertexFaces, faceVertices, halfedgeFrom,
  isBoundaryVertex, meshStats, toFlatArrays,
  // Pipeline
  pipe, pipeAsync, when, repeat, MeshPipeline,
  // Operations
  subdivide, loopSubdivideOnce,
  smooth, taubinSmooth, laplacianSmoothOnce,
  displaceNormal, displaceByFunction, displaceByField, displaceByNoise,
  // Serialization (OPERATUS-compatible)
  serialize, deserializeToHalfEdge, deserializeToFlat, deserializeWithFallback,
  // Adapters (bridge MeshGenerator ↔ HalfEdgeMesh)
  profileToHalfEdge, cylinderToHalfEdge, specimenToHalfEdge,
  fallbackMeshFromProfile, fallbackMeshFromCylinder,
  applyPipelineToProfile, applyPipelineToCylinder,
  // Genus pipelines
  genusPipeline, DEFAULT_PIPELINE, STEM_PIPELINE,
  // Mesh asset generation
  generateMeshAssets,
} from './mesh/index';
export type {
  HEVertex, HEHalfEdge, HEFace, HalfEdgeMesh, FlatMeshData,
  MeshOp, AsyncMeshOp, PipelineStep, SerializeOptions,
  MeshGenerationResult, MeshGenerationStats,
} from './mesh/index';
