import { describe, expect, test } from 'bun:test';
import {
  countInstructions,
  glslFloat,
  glslFunction,
  glslUniform,
  glslVec3,
  glslVec3FromHex,
  validateGLSL,
} from '../src/utils/glsl';

describe('glsl helpers', () => {
  test('glslFloat adds decimal point', () => {
    expect(glslFloat(1)).toBe('1.0');
    expect(glslFloat(1.5)).toBe('1.5');
    expect(glslFloat(0)).toBe('0.0');
  });

  test('glslVec3 formats correctly', () => {
    expect(glslVec3(1, 0, 0.5)).toBe('vec3(1.0, 0.0, 0.5)');
  });

  test('glslVec3FromHex converts hex to vec3', () => {
    const result = glslVec3FromHex('#ff0000');
    expect(result).toContain('1.0');
    expect(result).toContain('0.0');
    expect(result).toMatch(/^vec3\(/);
  });

  test('glslUniform formats correctly', () => {
    expect(glslUniform('time', 'float')).toBe('uniform float time;');
  });

  test('glslFunction wraps body', () => {
    const result = glslFunction('test', 'float', 'vec3 p', '  return 1.0;');
    expect(result).toContain('float test(vec3 p)');
    expect(result).toContain('return 1.0;');
  });
});

describe('validateGLSL', () => {
  test('valid shader passes', () => {
    const shader = `
uniform float time;
float scene(vec3 p) {
  return length(p) - 1.0;
}
void main() {
  gl_FragColor = vec4(1.0);
}`;
    const result = validateGLSL(shader);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('detects unresolved placeholders', () => {
    const result = validateGLSL('void main() { {{BODY}} }');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('placeholder'))).toBe(true);
  });

  test('detects unclosed braces', () => {
    const result = validateGLSL('void main() { float x = 1.0;');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('brace'))).toBe(true);
  });

  test('detects missing entry point', () => {
    const result = validateGLSL('float helper(vec3 p) { return 1.0; }');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('entry point') || e.includes('main'))).toBe(true);
  });

  test('accepts scene() as entry point', () => {
    const result = validateGLSL('float scene(vec3 p) { return 1.0; }');
    expect(result.valid).toBe(true);
  });
});

describe('countInstructions', () => {
  test('counts SDF primitives', () => {
    const count = countInstructions('sdSphere(p, 1.0) + sdCapsule(p, a, b, r)');
    expect(count).toBeGreaterThanOrEqual(8); // 3 + 5
  });

  test('counts blend operations', () => {
    const count = countInstructions('opSmoothUnion(d1, d2, k)');
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('empty shader has 0 instructions', () => {
    expect(countInstructions('')).toBe(0);
  });
});
