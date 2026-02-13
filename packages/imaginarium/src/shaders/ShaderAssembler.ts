/**
 * Shader template assembler.
 * Reads GLSL template files, substitutes placeholders, validates output.
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ProceduralPalette } from '@dendrovia/shared';
import { glslVec3FromHex, glslUniform } from '../utils/glsl.js';
import { validateGLSL, countInstructions } from '../utils/glsl.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load templates lazily and cache them
let sdfLibraryTemplate: string | null = null;
let lightingTemplate: string | null = null;
let raymarcherTemplate: string | null = null;

async function loadTemplate(name: string): Promise<string> {
  const path = join(__dirname, 'templates', name);
  return Bun.file(path).text();
}

async function getSdfLibrary(): Promise<string> {
  if (!sdfLibraryTemplate) sdfLibraryTemplate = await loadTemplate('sdf-library.glsl');
  return sdfLibraryTemplate;
}

async function getLighting(): Promise<string> {
  if (!lightingTemplate) lightingTemplate = await loadTemplate('lighting.glsl');
  return lightingTemplate;
}

async function getRaymarcher(): Promise<string> {
  if (!raymarcherTemplate) raymarcherTemplate = await loadTemplate('raymarcher.glsl');
  return raymarcherTemplate;
}

export interface AssemblerConfig {
  sceneSDF: string;
  palette: ProceduralPalette;
  seed: string;
  variantId: string;
}

export interface AssembledShader {
  source: string;
  instructionCount: number;
  valid: boolean;
  errors: string[];
}

export async function assembleShader(config: AssemblerConfig): Promise<AssembledShader> {
  const [sdfLib, lighting, template] = await Promise.all([
    getSdfLibrary(),
    getLighting(),
    getRaymarcher(),
  ]);

  const colorUniforms = [
    glslUniform('u_color1', 'vec3'),
    glslUniform('u_color2', 'vec3'),
    glslUniform('u_color3', 'vec3'),
    glslUniform('u_glow', 'vec3'),
    glslUniform('u_background', 'vec3'),
  ].join('\n');

  let source = template
    .replace('{{SEED}}', config.seed)
    .replace('{{VARIANT_ID}}', config.variantId)
    .replace('{{COLOR_UNIFORMS}}', colorUniforms)
    .replace('{{SDF_LIBRARY}}', sdfLib)
    .replace('{{SCENE_SDF}}', config.sceneSDF)
    .replace('{{LIGHTING}}', lighting);

  const validation = validateGLSL(source);
  const instructionCount = countInstructions(source);

  return {
    source,
    instructionCount,
    valid: validation.valid,
    errors: validation.errors,
  };
}

export function buildColorParameters(palette: ProceduralPalette): Record<string, number> {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.substring(0, 2), 16) / 255,
      g: parseInt(h.substring(2, 4), 16) / 255,
      b: parseInt(h.substring(4, 6), 16) / 255,
    };
  };

  const c1 = parse(palette.primary);
  const c2 = parse(palette.secondary);
  const c3 = parse(palette.accent);
  const glow = parse(palette.glow);
  const bg = parse(palette.background);

  return {
    'u_color1.r': c1.r, 'u_color1.g': c1.g, 'u_color1.b': c1.b,
    'u_color2.r': c2.r, 'u_color2.g': c2.g, 'u_color2.b': c2.b,
    'u_color3.r': c3.r, 'u_color3.g': c3.g, 'u_color3.b': c3.b,
    'u_glow.r': glow.r, 'u_glow.g': glow.g, 'u_glow.b': glow.b,
    'u_background.r': bg.r, 'u_background.g': bg.g, 'u_background.b': bg.b,
  };
}
