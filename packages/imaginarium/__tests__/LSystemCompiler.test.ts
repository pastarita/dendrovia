import { describe, test, expect } from 'bun:test';
import { compile, expandLSystem } from '../src/distillation/LSystemCompiler';
import { generateMockTopology } from '../src/pipeline/MockTopology';

describe('compile', () => {
  test('produces valid LSystemRule', () => {
    const topology = generateMockTopology(50);
    const rule = compile(topology);

    expect(rule.axiom).toBe('F');
    expect(rule.rules).toBeDefined();
    expect(rule.rules['F']).toBeDefined();
    expect(rule.iterations).toBeGreaterThanOrEqual(1);
    expect(rule.iterations).toBeLessThanOrEqual(5);
    expect(rule.angle).toBe(25);
  });

  test('iterations are capped at 5', () => {
    // Deep tree
    const topology = generateMockTopology(100);
    const rule = compile(topology);
    expect(rule.iterations).toBeLessThanOrEqual(5);
  });

  test('is deterministic', () => {
    const topology = generateMockTopology(50, ['typescript'], 42);
    const rule1 = compile(topology);
    const rule2 = compile(topology);
    expect(rule1).toEqual(rule2);
  });

  test('produces hotspot rule', () => {
    const topology = generateMockTopology(50);
    const rule = compile(topology);
    expect(rule.rules['H']).toBeDefined();
  });
});

describe('expandLSystem', () => {
  test('expands simple rule', () => {
    const result = expandLSystem({
      axiom: 'F',
      rules: { 'F': 'FF' },
      iterations: 3,
      angle: 25,
    });
    expect(result).toBe('FFFFFFFF'); // 2^3 = 8 F's
  });

  test('preserves non-rule characters', () => {
    const result = expandLSystem({
      axiom: 'F',
      rules: { 'F': 'F[+F][-F]' },
      iterations: 1,
      angle: 25,
    });
    expect(result).toBe('F[+F][-F]');
  });

  test('iteration 0 returns axiom', () => {
    const result = expandLSystem({
      axiom: 'F',
      rules: { 'F': 'FF' },
      iterations: 0,
      angle: 25,
    });
    expect(result).toBe('F');
  });

  test('multi-iteration expansion', () => {
    const result = expandLSystem({
      axiom: 'F',
      rules: { 'F': 'F[+F]' },
      iterations: 2,
      angle: 25,
    });
    // Iteration 1: F[+F]
    // Iteration 2: F[+F][+F[+F]]
    expect(result).toBe('F[+F][+F[+F]]');
  });
});
