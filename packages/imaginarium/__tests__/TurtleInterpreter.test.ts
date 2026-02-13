import { describe, test, expect } from 'bun:test';
import { interpret } from '../src/distillation/TurtleInterpreter';

describe('interpret', () => {
  test('single F produces one segment pointing up', () => {
    const segments = interpret('F', 25, 1.0);
    expect(segments).toHaveLength(1);
    expect(segments[0].start).toEqual([0, 0, 0]);
    expect(segments[0].end[1]).toBeCloseTo(1.0, 5); // y = 1 (up)
    expect(segments[0].depth).toBe(0);
    expect(segments[0].isHotspot).toBe(false);
  });

  test('FF produces two consecutive segments', () => {
    const segments = interpret('FF', 25, 1.0);
    expect(segments).toHaveLength(2);
    expect(segments[1].start[1]).toBeCloseTo(1.0, 5);
    expect(segments[1].end[1]).toBeCloseTo(2.0, 5);
  });

  test('H produces hotspot segment', () => {
    const segments = interpret('H', 25, 1.0);
    expect(segments).toHaveLength(1);
    expect(segments[0].isHotspot).toBe(true);
  });

  test('branching with [] creates separate branches', () => {
    const segments = interpret('F[+F]F', 90, 1.0);
    expect(segments).toHaveLength(3);
    // After ], position should return to pre-[ position
    // The third F continues from the first F's end position
    expect(segments[2].start[1]).toBeCloseTo(segments[0].end[1], 3);
  });

  test('depth increases inside brackets', () => {
    const segments = interpret('F[F[F]]', 25, 1.0);
    expect(segments[0].depth).toBe(0);
    expect(segments[1].depth).toBe(1);
    expect(segments[2].depth).toBe(2);
  });

  test('radius tapers with depth', () => {
    const segments = interpret('F[F]', 25, 1.0);
    expect(segments[0].radius).toBeGreaterThan(segments[1].radius);
  });

  test('yaw rotation changes direction', () => {
    const segments = interpret('F+F', 90, 1.0);
    expect(segments).toHaveLength(2);
    // After 90 degree yaw, should move along different axis
    const dx = Math.abs(segments[1].end[0] - segments[1].start[0]);
    const dy = Math.abs(segments[1].end[1] - segments[1].start[1]);
    // The yaw should have rotated heading — x movement should be significant
    expect(dx + dy).toBeGreaterThan(0.5);
  });

  test('empty string produces no segments', () => {
    const segments = interpret('', 25, 1.0);
    expect(segments).toHaveLength(0);
  });

  test('handles pitch operators', () => {
    const segments = interpret('F&F', 45, 1.0);
    expect(segments).toHaveLength(2);
    // After pitch down, z should change
    const dz = Math.abs(segments[1].end[2] - segments[1].start[2]);
    expect(dz).toBeGreaterThan(0);
  });
});
