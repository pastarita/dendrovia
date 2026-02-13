/**
 * IMAGINARIUM - The Compiler
 *
 * Entry point for the AI -> Shader distillation pipeline.
 * Exports all public modules for consumption by other pillars.
 */

// --- Distillation ---
export { extractPalette, extractFilePalette } from './distillation/ColorExtractor.js';
export { compile as compileSDF, type SDFCompileConfig } from './distillation/SDFCompiler.js';
export { compile as compileLSystem, expandLSystem } from './distillation/LSystemCompiler.js';
export { generate as generateNoise } from './distillation/NoiseGenerator.js';
export { interpret as interpretTurtle, type TurtleSegment } from './distillation/TurtleInterpreter.js';

// --- Generation ---
export { generate as generateArt, type ArtGenResult, type ArtGenOptions, type ArtProvider } from './generation/ArtGen.js';
export { buildPrompt } from './generation/PromptBuilder.js';

// --- Shader Assembly ---
export { assembleShader, buildColorParameters, type AssemblerConfig, type AssembledShader } from './shaders/ShaderAssembler.js';

// --- Cache ---
export { DeterministicCache } from './cache/DeterministicCache.js';

// --- Fallbacks ---
export { DEFAULT_PALETTES, getDefaultPalette, getLanguageHue, LANGUAGE_HUES } from './fallback/DefaultPalettes.js';
export { DEFAULT_SDFS, getDefaultSDF, type SDFTier } from './fallback/DefaultSDFs.js';

// --- Pipeline ---
export { distill } from './pipeline/DistillationPipeline.js';
export { generateVariants } from './pipeline/VariantGenerator.js';
export { generateManifest, type ManifestInput } from './pipeline/ManifestGenerator.js';
export { readTopology } from './pipeline/TopologyReader.js';
export { generateMockTopology } from './pipeline/MockTopology.js';

// --- Utilities ---
export {
  rgbToOklch, oklchToRgb, oklchToHex, hexToRgb, rgbToHex, hexToOklch,
  harmonize, colorTemperature, blendColors, hslToHex,
  type OklchColor, type RgbColor, type HarmonyScheme,
} from './utils/color.js';
export { hashString, hashObject, hashFiles } from './utils/hash.js';
export {
  glslFloat, glslVec3, glslVec3FromHex, glslUniform, glslFunction,
  validateGLSL, countInstructions, type GLSLValidationResult,
} from './utils/glsl.js';

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
} from './mycology/index.js';
export type {
  FungalSpecimen, FungalTaxonomy, FungalGenus,
  MushroomMorphology, MushroomLore, MycelialNetwork,
  MycologyManifest, MycologyCatalogedEvent,
  MushroomMeshData, MushroomSpriteProps,
  FileContext,
} from './mycology/index.js';
