/**
 * ColorExtractor — topology-driven palette generation.
 *
 * Analyzes CodeTopology metadata to produce perceptually uniform
 * OKLCH-based color palettes. Falls back to DefaultPalettes on error.
 */

import type { CodeTopology, ParsedFile, ProceduralPalette } from '@dendrovia/shared';
import { oklchToHex, harmonize, type OklchColor, type HarmonyScheme } from '../utils/color.js';
import { getDefaultPalette, getLanguageHue } from '../fallback/DefaultPalettes.js';

export interface PaletteOverrides {
  harmonyScheme?: HarmonyScheme;
  saturationMultiplier?: number;
  lightnessOffset?: number;
  hueShift?: number;
}

export function extractPalette(topology: CodeTopology, overrides?: PaletteOverrides): ProceduralPalette {
  try {
    const files = topology.files;
    if (files.length === 0) return getDefaultPalette('default');

    // Determine dominant language
    const langCounts = new Map<string, number>();
    for (const f of files) {
      langCounts.set(f.language, (langCounts.get(f.language) ?? 0) + 1);
    }
    const dominantLang = [...langCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

    // Compute aggregate metrics
    const avgComplexity = files.reduce((sum, f) => sum + f.complexity, 0) / files.length;
    const hotspots = topology.hotspots ?? [];
    const avgChurn = hotspots.length > 0
      ? hotspots.reduce((sum, h) => sum + h.churnRate, 0) / hotspots.length
      : 0;

    // Base hue from dominant language (+ optional shift)
    const baseHue = (getLanguageHue(dominantLang) + (overrides?.hueShift ?? 0) + 360) % 360;

    // Saturation from complexity: low complexity = muted, high = vivid
    const saturation = Math.max(0.05, Math.min(0.35,
      (0.05 + avgComplexity * 0.01) * (overrides?.saturationMultiplier ?? 1),
    ));

    // Lightness from churn: high churn = darker/moodier
    const lightness = Math.max(0.3, Math.min(0.8,
      0.65 - avgChurn * 0.01 + (overrides?.lightnessOffset ?? 0),
    ));

    // Generate harmony
    const scheme: HarmonyScheme = overrides?.harmonyScheme
      ?? (files.length < 20 ? 'analogous' : 'split-complementary');
    const hues = harmonize(baseHue, scheme);

    const primary: OklchColor = { L: lightness, C: saturation, h: hues[0] };
    const secondary: OklchColor = { L: lightness * 0.8, C: saturation * 0.85, h: hues[1] };
    const accent: OklchColor = { L: lightness * 1.2, C: saturation * 1.3, h: hues[hues.length - 1] };
    const glow: OklchColor = { L: lightness * 1.4, C: saturation * 1.5, h: hues[0] };
    const background: OklchColor = { L: 0.1, C: saturation * 0.3, h: hues[0] };

    // Mood from temperature
    const mood: ProceduralPalette['mood'] =
      baseHue >= 0 && baseHue < 60 ? 'warm' :
      baseHue >= 60 && baseHue < 180 ? 'neutral' :
      'cool';

    return {
      primary: oklchToHex(primary),
      secondary: oklchToHex(secondary),
      accent: oklchToHex(accent),
      background: oklchToHex(background),
      glow: oklchToHex(glow),
      mood,
    };
  } catch {
    return getDefaultPalette('default');
  }
}

export function extractFilePalette(file: ParsedFile): ProceduralPalette {
  try {
    const baseHue = getLanguageHue(file.language);
    const saturation = Math.max(0.05, Math.min(0.2, 0.05 + file.complexity * 0.01));
    const lightness = Math.max(0.4, Math.min(0.7, 0.6));

    const hues = harmonize(baseHue, 'analogous');

    return {
      primary: oklchToHex({ L: lightness, C: saturation, h: hues[0] }),
      secondary: oklchToHex({ L: lightness * 0.8, C: saturation * 0.85, h: hues[1] }),
      accent: oklchToHex({ L: lightness * 1.2, C: saturation * 1.3, h: hues[2] }),
      background: oklchToHex({ L: 0.1, C: saturation * 0.3, h: hues[0] }),
      glow: oklchToHex({ L: lightness * 1.4, C: saturation * 1.5, h: hues[0] }),
      mood: baseHue >= 0 && baseHue < 60 ? 'warm' : baseHue < 180 ? 'neutral' : 'cool',
    };
  } catch {
    return getDefaultPalette(file.language);
  }
}
