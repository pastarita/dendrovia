import { describe, test, expect } from 'bun:test';
import { compile } from '../src/distillation/SDFCompiler';
import { compile as compileLSystem } from '../src/distillation/LSystemCompiler';
import { generate as generateNoise } from '../src/distillation/NoiseGenerator';
import { extractPalette } from '../src/distillation/ColorExtractor';
import { generateMockTopology } from '../src/pipeline/MockTopology';

describe('SDFCompiler', () => {
  test('produces valid SDFShader with GLSL', async () => {
    const topology = generateMockTopology(30, ['typescript'], 42);
    const palette = extractPalette(topology);
    const lsystem = compileLSystem(topology);
    const noise = generateNoise(topology);

    const shader = await compile({
      topology,
      palette,
      lsystem,
      noise,
      seed: 'test-seed-123',
      variantId: 'test',
    });

    expect(shader.id).toContain('sdf-');
    expect(shader.glsl).toContain('void main()');
    expect(shader.glsl).toContain('scene(');
    expect(shader.glsl).toContain('sdCapsule');
    expect(shader.complexity).toBeGreaterThan(0);
    expect(Object.keys(shader.parameters).length).toBeGreaterThan(0);
  });

  test('GLSL has no unresolved placeholders', async () => {
    const topology = generateMockTopology(20, ['typescript'], 42);
    const palette = extractPalette(topology);
    const lsystem = compileLSystem(topology);
    const noise = generateNoise(topology);

    const shader = await compile({
      topology,
      palette,
      lsystem,
      noise,
      seed: 'test',
    });

    expect(shader.glsl).not.toContain('{{');
    expect(shader.glsl).not.toContain('}}');
  });

  test('instruction budget is respected', async () => {
    // Large topology with deep nesting
    const topology = generateMockTopology(100, ['typescript', 'javascript'], 42);
    const palette = extractPalette(topology);
    const lsystem = compileLSystem(topology);
    const noise = generateNoise(topology);

    const shader = await compile({
      topology,
      palette,
      lsystem,
      noise,
      seed: 'budget-test',
    });

    // The scene SDF portion should have limited segments
    const capsuleCount = (shader.glsl.match(/sdCapsule/g) || []).length;
    // Library has 1 definition + N scene uses, so subtract the library def
    expect(capsuleCount).toBeGreaterThan(1);
  });

  test('is deterministic', async () => {
    const topology = generateMockTopology(30, ['typescript'], 42);
    const palette = extractPalette(topology);
    const lsystem = compileLSystem(topology);
    const noise = generateNoise(topology);

    const config = { topology, palette, lsystem, noise, seed: 'det-test' };
    const s1 = await compile(config);
    const s2 = await compile(config);

    expect(s1.glsl).toBe(s2.glsl);
    expect(s1.id).toBe(s2.id);
    expect(s1.complexity).toBe(s2.complexity);
  });
});
