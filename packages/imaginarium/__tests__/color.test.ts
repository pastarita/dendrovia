import { describe, test, expect } from 'bun:test';
import {
  rgbToOklch, oklchToRgb, oklchToHex, hexToRgb, rgbToHex, hexToOklch,
  harmonize, colorTemperature, blendColors, hslToHex,
  type OklchColor,
} from '../src/utils/color';

describe('OKLCH round-trip', () => {
  test('RGB -> OKLCH -> RGB preserves colors', () => {
    const testColors = [
      { r: 255, g: 0, b: 0 },    // Red
      { r: 0, g: 255, b: 0 },    // Green
      { r: 0, g: 0, b: 255 },    // Blue
      { r: 128, g: 128, b: 128 }, // Gray
      { r: 255, g: 255, b: 0 },   // Yellow
    ];

    for (const rgb of testColors) {
      const oklch = rgbToOklch(rgb);
      const back = oklchToRgb(oklch);
      // Allow 1 unit tolerance for rounding
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(1);
    }
  });

  test('hex -> OKLCH -> hex round-trips', () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#808080', '#ff8800'];
    for (const hex of colors) {
      const oklch = hexToOklch(hex);
      const back = oklchToHex(oklch);
      // Close but may differ by 1 in component due to rounding
      const origRgb = hexToRgb(hex);
      const backRgb = hexToRgb(back);
      expect(Math.abs(origRgb.r - backRgb.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(origRgb.g - backRgb.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(origRgb.b - backRgb.b)).toBeLessThanOrEqual(1);
    }
  });

  test('oklchToHex produces valid hex', () => {
    const result = oklchToHex({ L: 0.5, C: 0.1, h: 180 });
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('harmonize', () => {
  test('complementary returns 2 hues 180 degrees apart', () => {
    const hues = harmonize(0, 'complementary');
    expect(hues).toHaveLength(2);
    expect(hues[0]).toBe(0);
    expect(hues[1]).toBe(180);
  });

  test('analogous returns 3 hues 30 degrees apart', () => {
    const hues = harmonize(120, 'analogous');
    expect(hues).toHaveLength(3);
    expect(hues[0]).toBe(90);
    expect(hues[1]).toBe(120);
    expect(hues[2]).toBe(150);
  });

  test('triadic returns 3 hues 120 degrees apart', () => {
    const hues = harmonize(0, 'triadic');
    expect(hues).toHaveLength(3);
    expect(hues[1]).toBe(120);
    expect(hues[2]).toBe(240);
  });

  test('split-complementary returns 3 hues', () => {
    const hues = harmonize(0, 'split-complementary');
    expect(hues).toHaveLength(3);
    expect(hues[1]).toBe(150);
    expect(hues[2]).toBe(210);
  });

  test('wraps around 360', () => {
    const hues = harmonize(350, 'analogous');
    expect(hues[0]).toBe(320);
    expect(hues[2]).toBe(20);
  });
});

describe('colorTemperature', () => {
  test('blue is cool (close to 0)', () => {
    const temp = colorTemperature({ r: 0, g: 0, b: 255 });
    expect(temp).toBeLessThan(0.3);
  });

  test('red is warm (close to 1)', () => {
    const temp = colorTemperature({ r: 255, g: 0, b: 0 });
    expect(temp).toBeGreaterThan(0.5);
  });
});

describe('blendColors', () => {
  test('t=0 returns first color', () => {
    const result = blendColors('#ff0000', '#0000ff', 0);
    const rgb = hexToRgb(result);
    expect(rgb.r).toBeGreaterThan(200);
    expect(rgb.b).toBeLessThan(50);
  });

  test('t=1 returns second color', () => {
    const result = blendColors('#ff0000', '#0000ff', 1);
    const rgb = hexToRgb(result);
    expect(rgb.b).toBeGreaterThan(200);
    expect(rgb.r).toBeLessThan(50);
  });
});

describe('hslToHex (legacy)', () => {
  test('produces valid hex', () => {
    expect(hslToHex(0, 1, 0.5)).toMatch(/^#[0-9a-f]{6}$/);
  });

  test('red hue', () => {
    const hex = hslToHex(0, 1, 0.5);
    const rgb = hexToRgb(hex);
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(0);
  });
});

describe('edge cases', () => {
  test('black', () => {
    const oklch = rgbToOklch({ r: 0, g: 0, b: 0 });
    expect(oklch.L).toBeCloseTo(0, 1);
  });

  test('white', () => {
    const oklch = rgbToOklch({ r: 255, g: 255, b: 255 });
    expect(oklch.L).toBeCloseTo(1, 1);
  });

  test('hex conversion handles uppercase', () => {
    const rgb = hexToRgb('#FF8800');
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(136);
    expect(rgb.b).toBe(0);
  });
});
