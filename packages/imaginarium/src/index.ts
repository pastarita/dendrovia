/**
 * IMAGINARIUM - The Compiler
 *
 * Entry point for the AI → Shader distillation pipeline.
 */

export * from './generation/ArtGen.js';
export * from './distillation/ColorExtractor.js';
export * from './distillation/SDFCompiler.js';
export * from './distillation/NoiseGenerator.js';

console.log('🎨 IMAGINARIUM initialized - Ready to distill shaders');
