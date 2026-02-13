/**
 * OKLCH color utilities for perceptually uniform color generation.
 *
 * OKLCH is a modern perceptual color space where equal numeric distance
 * corresponds to equal perceived difference — unlike HSL.
 *
 * Based on Bjorn Ottosson's OKLAB specification:
 * https://bottosson.github.io/posts/oklab/
 */

export interface OklchColor {
  L: number; // Lightness: 0..1
  C: number; // Chroma: 0..~0.4
  h: number; // Hue: 0..360
}

export interface RgbColor {
  r: number; // 0..255
  g: number; // 0..255
  b: number; // 0..255
}

// --- Linear sRGB <-> sRGB gamma ---

function srgbToLinear(c: number): number {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  c = Math.max(0, Math.min(1, c));
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(v * 255);
}

// --- Linear sRGB -> OKLAB ---

function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

// --- OKLAB -> Linear sRGB ---

function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

// --- Public API ---

export function rgbToOklch(rgb: RgbColor): OklchColor {
  const lr = srgbToLinear(rgb.r);
  const lg = srgbToLinear(rgb.g);
  const lb = srgbToLinear(rgb.b);

  const [L, a, b] = linearRgbToOklab(lr, lg, lb);
  const C = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { L, C, h };
}

export function oklchToRgb(oklch: OklchColor): RgbColor {
  const hRad = (oklch.h * Math.PI) / 180;
  const a = oklch.C * Math.cos(hRad);
  const b = oklch.C * Math.sin(hRad);

  const [lr, lg, lb] = oklabToLinearRgb(oklch.L, a, b);

  return {
    r: linearToSrgb(lr),
    g: linearToSrgb(lg),
    b: linearToSrgb(lb),
  };
}

export function oklchToHex(oklch: OklchColor): string {
  const rgb = oklchToRgb(oklch);
  return rgbToHex(rgb);
}

export function hexToRgb(hex: string): RgbColor {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export function rgbToHex(rgb: RgbColor): string {
  const r = Math.max(0, Math.min(255, rgb.r));
  const g = Math.max(0, Math.min(255, rgb.g));
  const b = Math.max(0, Math.min(255, rgb.b));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function hexToOklch(hex: string): OklchColor {
  return rgbToOklch(hexToRgb(hex));
}

export type HarmonyScheme = 'complementary' | 'analogous' | 'triadic' | 'split-complementary';

export function harmonize(baseHue: number, scheme: HarmonyScheme): number[] {
  const wrap = (h: number) => ((h % 360) + 360) % 360;

  switch (scheme) {
    case 'complementary':
      return [baseHue, wrap(baseHue + 180)];
    case 'analogous':
      return [wrap(baseHue - 30), baseHue, wrap(baseHue + 30)];
    case 'triadic':
      return [baseHue, wrap(baseHue + 120), wrap(baseHue + 240)];
    case 'split-complementary':
      return [baseHue, wrap(baseHue + 150), wrap(baseHue + 210)];
  }
}

export function colorTemperature(rgb: RgbColor): number {
  // 0.0 = cool (blue-heavy), 1.0 = warm (red-heavy)
  const warmth = (rgb.r * 2 + rgb.g) / (rgb.r * 2 + rgb.g + rgb.b * 3 + 1);
  return Math.max(0, Math.min(1, warmth));
}

export function blendColors(a: string, b: string, t: number): string {
  const ca = hexToOklch(a);
  const cb = hexToOklch(b);

  // Interpolate in OKLCH for perceptual uniformity
  // Handle hue wrapping
  let dh = cb.h - ca.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;

  return oklchToHex({
    L: ca.L + (cb.L - ca.L) * t,
    C: ca.C + (cb.C - ca.C) * t,
    h: ((ca.h + dh * t) % 360 + 360) % 360,
  });
}

// Legacy HSL support (ported from POC)
export function hslToHex(h: number, s: number, l: number): string {
  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = Math.round(hueToRgb(p, q, h + 1 / 3) * 255);
  const g = Math.round(hueToRgb(p, q, h) * 255);
  const b = Math.round(hueToRgb(p, q, h - 1 / 3) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
