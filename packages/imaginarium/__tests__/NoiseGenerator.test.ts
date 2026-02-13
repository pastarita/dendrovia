import { describe, test, expect } from 'bun:test';
import { generate } from '../src/distillation/NoiseGenerator';
import { generateMockTopology } from '../src/pipeline/MockTopology';

describe('generate', () => {
  test('low complexity -> simplex', () => {
    const topology = generateMockTopology(10, ['json'], 42);
    // Override complexities to be low
    for (const f of topology.files) f.complexity = 2;
    const noise = generate(topology);
    expect(noise.type).toBe('simplex');
  });

  test('medium complexity -> perlin', () => {
    const topology = generateMockTopology(10, ['typescript'], 42);
    for (const f of topology.files) f.complexity = 6;
    const noise = generate(topology);
    expect(noise.type).toBe('perlin');
  });

  test('high complexity -> fbm', () => {
    const topology = generateMockTopology(10, ['typescript'], 42);
    for (const f of topology.files) f.complexity = 12;
    const noise = generate(topology);
    expect(noise.type).toBe('fbm');
  });

  test('extreme complexity -> worley', () => {
    const topology = generateMockTopology(10, ['typescript'], 42);
    for (const f of topology.files) f.complexity = 20;
    const noise = generate(topology);
    expect(noise.type).toBe('worley');
  });

  test('octaves are in valid range', () => {
    const topology = generateMockTopology(50);
    const noise = generate(topology);
    expect(noise.octaves).toBeGreaterThanOrEqual(1);
    expect(noise.octaves).toBeLessThanOrEqual(8);
  });

  test('frequency is in valid range', () => {
    const topology = generateMockTopology(50);
    const noise = generate(topology);
    expect(noise.frequency).toBeGreaterThanOrEqual(0.5);
    expect(noise.frequency).toBeLessThanOrEqual(4.0);
  });

  test('amplitude is in valid range', () => {
    const topology = generateMockTopology(50);
    const noise = generate(topology);
    expect(noise.amplitude).toBeGreaterThanOrEqual(0.1);
    expect(noise.amplitude).toBeLessThanOrEqual(1.0);
  });

  test('is deterministic', () => {
    const topology = generateMockTopology(50, ['typescript'], 42);
    const n1 = generate(topology);
    const n2 = generate(topology);
    expect(n1).toEqual(n2);
  });
});
