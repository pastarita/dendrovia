/**
 * SDFCompiler — the core shader generator.
 *
 * Combines palette + L-system + noise into complete GLSL raymarching shaders.
 * Pipeline:
 *   1. Execute L-system string via TurtleInterpreter -> TurtleSegment[]
 *   2. Apply instruction budget: prune deepest branches first
 *   3. Each segment -> sdCapsule GLSL call
 *   4. Combine with opSmoothUnion chain
 *   5. Optional domain twist for hotspot branches
 *   6. Feed into ShaderAssembler with palette uniforms and lighting
 */

import type { CodeTopology, ProceduralPalette, SDFShader, LSystemRule, NoiseFunction } from '@dendrovia/shared';
import { interpret, type TurtleSegment } from './TurtleInterpreter.js';
import { expandLSystem } from './LSystemCompiler.js';
import { assembleShader, buildColorParameters } from '../shaders/ShaderAssembler.js';
import { getDefaultSDF } from '../fallback/DefaultSDFs.js';
import { hashString } from '../utils/hash.js';
import { glslFloat } from '../utils/glsl.js';

const INSTRUCTION_BUDGET = 100;
const INSTRUCTIONS_PER_SEGMENT = 5; // sdCapsule ≈ 5 instructions
const INSTRUCTIONS_PER_BLEND = 3;   // opSmoothUnion ≈ 3

export interface SDFCompileConfig {
  topology: CodeTopology;
  palette: ProceduralPalette;
  lsystem: LSystemRule;
  noise: NoiseFunction;
  seed: string;
  variantId?: string;
}

export async function compile(config: SDFCompileConfig): Promise<SDFShader> {
  const { topology, palette, lsystem, noise, seed, variantId = 'global' } = config;

  try {
    // 1. Expand L-system and interpret as 3D turtle segments
    const expanded = expandLSystem(lsystem);
    let segments = interpret(expanded, lsystem.angle);

    // 2. Apply instruction budget — prune deepest branches first
    segments = applyBudget(segments, INSTRUCTION_BUDGET);

    // 3. Generate scene SDF GLSL from segments
    const sceneSDF = generateSceneSDF(segments, noise);

    // 4. Assemble full shader
    const assembled = await assembleShader({
      sceneSDF,
      palette,
      seed,
      variantId,
    });

    // 5. Build parameter map
    const parameters = buildColorParameters(palette);
    parameters['time'] = 0;

    return {
      id: `sdf-${variantId}-${seed.substring(0, 8)}`,
      glsl: assembled.source,
      parameters,
      complexity: assembled.instructionCount,
    };
  } catch {
    // Fallback to default SDF
    const avgComplexity = topology.files.length > 0
      ? topology.files.reduce((s, f) => s + f.complexity, 0) / topology.files.length
      : 5;
    const fallback = getDefaultSDF(avgComplexity);
    const assembled = await assembleShader({
      sceneSDF: fallback.glsl,
      palette,
      seed,
      variantId,
    });

    return {
      id: `sdf-fallback-${variantId}`,
      glsl: assembled.source,
      parameters: buildColorParameters(palette),
      complexity: assembled.instructionCount,
    };
  }
}

function applyBudget(segments: TurtleSegment[], budget: number): TurtleSegment[] {
  const maxSegments = Math.floor(
    (budget - 10) / (INSTRUCTIONS_PER_SEGMENT + INSTRUCTIONS_PER_BLEND),
  );

  if (segments.length <= maxSegments) return segments;

  // Sort by depth descending — prune deepest branches first
  const sorted = [...segments].sort((a, b) => b.depth - a.depth);
  return sorted.slice(sorted.length - maxSegments);
}

function generateSceneSDF(segments: TurtleSegment[], noise: NoiseFunction): string {
  if (segments.length === 0) {
    return `
float scene(vec3 p) {
  return sdCapsule(p, vec3(0.0, 0.0, 0.0), vec3(0.0, 4.0, 0.0), 0.3);
}
`;
  }

  const lines: string[] = [];
  lines.push('float scene(vec3 p) {');

  // Add noise displacement comment
  lines.push(`  // Noise: ${noise.type}, octaves=${noise.octaves}, freq=${glslFloat(noise.frequency)}`);
  lines.push(`  // Displacement applied in applyLighting via surface normal`);
  lines.push('');

  // First segment
  const s0 = segments[0];
  const p0 = formatPoint(s0);
  if (s0.isHotspot) {
    lines.push(`  vec3 tp = opTwist(p, 0.3);`);
    lines.push(`  float d = sdCapsule(tp, ${p0.start}, ${p0.end}, ${glslFloat(s0.radius)});`);
  } else {
    lines.push(`  float d = sdCapsule(p, ${p0.start}, ${p0.end}, ${glslFloat(s0.radius)});`);
  }

  // Remaining segments
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const pts = formatPoint(seg);
    const k = glslFloat(Math.max(0.1, 0.35 - seg.depth * 0.05));

    if (seg.isHotspot) {
      lines.push(`  d = opSmoothUnion(d, sdCapsule(opTwist(p, 0.3), ${pts.start}, ${pts.end}, ${glslFloat(seg.radius)}), ${k});`);
    } else {
      lines.push(`  d = opSmoothUnion(d, sdCapsule(p, ${pts.start}, ${pts.end}, ${glslFloat(seg.radius)}), ${k});`);
    }
  }

  lines.push('  return d;');
  lines.push('}');

  return lines.join('\n');
}

function formatPoint(seg: TurtleSegment): { start: string; end: string } {
  const fmt = (v: [number, number, number]) =>
    `vec3(${glslFloat(round(v[0]))}, ${glslFloat(round(v[1]))}, ${glslFloat(round(v[2]))})`;
  return { start: fmt(seg.start), end: fmt(seg.end) };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
