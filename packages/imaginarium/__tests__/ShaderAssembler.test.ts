import { describe, test, expect } from 'bun:test';
import { assembleShader, buildColorParameters } from '../src/shaders/ShaderAssembler';
import type { ProceduralPalette } from '@dendrovia/shared';

const testPalette: ProceduralPalette = {
  primary: '#3178c6',
  secondary: '#235a9e',
  accent: '#66b2ff',
  background: '#0a1628',
  glow: '#4d9fff',
  mood: 'cool',
};

describe('assembleShader', () => {
  test('resolves all template placeholders', async () => {
    const result = await assembleShader({
      sceneSDF: 'float scene(vec3 p) { return sdSphere(p, 1.0); }',
      palette: testPalette,
      seed: 'test-seed',
      variantId: 'test',
    });

    expect(result.source).not.toContain('{{SDF_LIBRARY}}');
    expect(result.source).not.toContain('{{SCENE_SDF}}');
    expect(result.source).not.toContain('{{COLOR_UNIFORMS}}');
    expect(result.source).not.toContain('{{LIGHTING}}');
    expect(result.source).not.toContain('{{SEED}}');
    expect(result.source).not.toContain('{{VARIANT_ID}}');
  });

  test('includes SDF library primitives', async () => {
    const result = await assembleShader({
      sceneSDF: 'float scene(vec3 p) { return sdSphere(p, 1.0); }',
      palette: testPalette,
      seed: 'test',
      variantId: 'test',
    });

    expect(result.source).toContain('sdSphere');
    expect(result.source).toContain('sdCapsule');
    expect(result.source).toContain('opSmoothUnion');
  });

  test('includes lighting functions', async () => {
    const result = await assembleShader({
      sceneSDF: 'float scene(vec3 p) { return sdSphere(p, 1.0); }',
      palette: testPalette,
      seed: 'test',
      variantId: 'test',
    });

    expect(result.source).toContain('calcNormal');
    expect(result.source).toContain('calcAO');
    expect(result.source).toContain('applyLighting');
  });

  test('includes color uniforms', async () => {
    const result = await assembleShader({
      sceneSDF: 'float scene(vec3 p) { return sdSphere(p, 1.0); }',
      palette: testPalette,
      seed: 'test',
      variantId: 'test',
    });

    expect(result.source).toContain('uniform vec3 u_color1');
    expect(result.source).toContain('uniform vec3 u_glow');
    expect(result.source).toContain('uniform vec3 u_background');
  });

  test('counts instructions', async () => {
    const result = await assembleShader({
      sceneSDF: 'float scene(vec3 p) { return sdSphere(p, 1.0); }',
      palette: testPalette,
      seed: 'test',
      variantId: 'test',
    });

    expect(result.instructionCount).toBeGreaterThan(0);
  });
});

describe('buildColorParameters', () => {
  test('produces parameters for all colors', () => {
    const params = buildColorParameters(testPalette);

    expect(params['u_color1.r']).toBeGreaterThanOrEqual(0);
    expect(params['u_color1.r']).toBeLessThanOrEqual(1);
    expect(params['u_glow.r']).toBeDefined();
    expect(params['u_background.r']).toBeDefined();
  });
});
