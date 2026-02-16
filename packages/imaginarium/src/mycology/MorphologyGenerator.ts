/**
 * MorphologyGenerator — translates code metrics into mushroom physical traits.
 *
 * Every dimension of a mushroom's appearance encodes a property of the
 * source code it represents. Deterministic: same file -> same morphology.
 */

import type { ParsedFile, Hotspot } from '@dendrovia/shared';
import type {
  MushroomMorphology,
  CapShape,
  GillAttachment,
  StemForm,
  SporePrintColor,
  BioluminescenceLevel,
  SizeClass,
  FungalGenus,
} from './types';
import type { FileContext } from './GenusMapper';
import { oklchToHex } from '../utils/color';
import { getLanguageHue } from '../fallback/DefaultPalettes';

// ---------------------------------------------------------------------------
// Cap Shape <- complexity profile
// ---------------------------------------------------------------------------

function deriveCapShape(file: ParsedFile, ctx: FileContext, genus: FungalGenus): CapShape {
  // Genus overrides for characteristic shapes
  switch (genus) {
    case 'Cantharellus': return 'infundibuliform'; // funnel for event sinks
    case 'Mycena': return 'campanulate';           // bell for tiny helpers
    case 'Trametes': return 'plane';               // flat shelf for middleware
    case 'Ganoderma': return 'plane';              // flat bracket for core modules
    case 'Morchella': return 'umbonate';           // pitted for complex algorithms
  }

  // Complexity-driven for other genera
  if (ctx.dependentCount > 8) return 'depressed';        // heavily consumed
  if (file.complexity > 15) return 'umbonate';            // dominant function
  if (file.complexity > 10) return 'campanulate';         // high entry complexity
  if (ctx.isEntryPoint) return 'convex';                  // standard entry
  if (ctx.dependentCount > 3) return 'plane';             // many small exports

  return 'convex'; // default: balanced
}

// ---------------------------------------------------------------------------
// Gill Attachment <- coupling tightness
// ---------------------------------------------------------------------------

function deriveGillAttachment(ctx: FileContext): GillAttachment {
  const totalConnections = ctx.dependentCount + ctx.dependencyCount;

  if (totalConnections <= 1) return 'free';
  if (totalConnections <= 4) return 'adnexed';
  if (totalConnections <= 8) return 'adnate';
  return 'decurrent';
}

// ---------------------------------------------------------------------------
// Stem Form <- stability / age / depth
// ---------------------------------------------------------------------------

function deriveStemForm(file: ParsedFile, ctx: FileContext): StemForm {
  return {
    height: Math.max(0.1, Math.min(1.0, Math.log2(Math.max(1, file.loc)) / 11)), // log2(2048) = 11
    thickness: Math.max(0.1, Math.min(1.0, ctx.dependentCount / 15)),
    bulbous: file.complexity > 10 && ctx.isEntryPoint,
    rooting: ctx.dependencyCount > 5,
    ringed: ctx.dependentCount >= 3 && ctx.dependencyCount >= 3, // pass-through pattern
  };
}

// ---------------------------------------------------------------------------
// Spore Print Color <- language
// ---------------------------------------------------------------------------

const LANGUAGE_SPORE_MAP: Record<string, SporePrintColor> = {
  typescript: 'white',
  javascript: 'brown',
  rust: 'black',
  python: 'purple',
  ruby: 'pink',
  go: 'cream',
  java: 'ochre',
  kotlin: 'ochre',
  scala: 'ochre',
  c: 'black',
  cpp: 'black',
};

function deriveSporePrintColor(language: string): SporePrintColor {
  return LANGUAGE_SPORE_MAP[language.toLowerCase()] ?? 'ochre';
}

// ---------------------------------------------------------------------------
// Bioluminescence <- hotspot status
// ---------------------------------------------------------------------------

function deriveBioluminescence(ctx: FileContext): BioluminescenceLevel {
  if (!ctx.hotspot) return 'none';

  const churn = ctx.hotspot.churnRate;
  if (churn > 15) return 'pulsing';
  if (churn > 8) return 'bright';
  if (churn > 3) return 'faint';
  return 'none';
}

// ---------------------------------------------------------------------------
// Size Class <- LOC
// ---------------------------------------------------------------------------

function deriveSizeClass(loc: number): SizeClass {
  if (loc < 30) return 'tiny';
  if (loc < 100) return 'small';
  if (loc < 500) return 'medium';
  if (loc < 2000) return 'large';
  return 'massive';
}

// ---------------------------------------------------------------------------
// Cap dimensions <- complexity + dependents
// ---------------------------------------------------------------------------

function deriveCapDimensions(file: ParsedFile, ctx: FileContext): { width: number; height: number } {
  // Width: more exports/dependents = wider cap
  const width = Math.max(0.2, Math.min(1.0, 0.3 + ctx.dependentCount * 0.07));
  // Height: more complexity = taller cap
  const height = Math.max(0.1, Math.min(1.0, 0.2 + file.complexity * 0.03));
  return { width, height };
}

// ---------------------------------------------------------------------------
// Gill count <- number of exports approximated by dependents
// ---------------------------------------------------------------------------

function deriveGillCount(ctx: FileContext): number {
  return Math.max(4, Math.min(24, 4 + ctx.dependentCount * 2));
}

// ---------------------------------------------------------------------------
// Colors <- language hue + palette
// ---------------------------------------------------------------------------

function deriveColors(file: ParsedFile, genus: FungalGenus): { scaleColor: string; gillColor: string } {
  const hue = getLanguageHue(file.language);

  // Scale (cap) color: saturated, medium lightness
  const scaleColor = oklchToHex({ L: 0.55, C: 0.12, h: hue });

  // Gill color: lighter, less saturated
  const gillHue = (hue + 30) % 360;
  const gillColor = oklchToHex({ L: 0.7, C: 0.06, h: gillHue });

  return { scaleColor, gillColor };
}

// ---------------------------------------------------------------------------
// Spots <- Amanita-type genera
// ---------------------------------------------------------------------------

function hasSpots(genus: FungalGenus): boolean {
  return genus === 'Amanita' || genus === 'Psilocybe';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateMorphology(
  file: ParsedFile,
  ctx: FileContext,
  genus: FungalGenus,
): MushroomMorphology {
  const capShape = deriveCapShape(file, ctx, genus);
  const { width: capWidth, height: capHeight } = deriveCapDimensions(file, ctx);
  const gillAttachment = deriveGillAttachment(ctx);
  const gillCount = deriveGillCount(ctx);
  const stem = deriveStemForm(file, ctx);
  const sporePrintColor = deriveSporePrintColor(file.language);
  const bioluminescence = deriveBioluminescence(ctx);
  const sizeClass = deriveSizeClass(file.loc);
  const spots = hasSpots(genus);
  const { scaleColor, gillColor } = deriveColors(file, genus);

  return {
    capShape,
    capWidth,
    capHeight,
    gillAttachment,
    gillCount,
    stem,
    sporePrintColor,
    bioluminescence,
    sizeClass,
    spots,
    scaleColor,
    gillColor,
  };
}
