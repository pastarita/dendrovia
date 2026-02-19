/**
 * SegmentPipeline — per-segment distillation with mood-based overrides.
 *
 * For each segment in the story arc, produces distinct visual assets
 * (palette, noise, L-system, shader) written to segments/{segmentId}/.
 *
 * Mood-based visual strategy:
 *   serene     → low saturation, analogous harmony, simplex noise
 *   tense      → high saturation, split-complementary, FBM noise
 *   chaotic    → max saturation, triadic harmony, worley noise
 *   triumphant → warm hues, high lightness, perlin noise
 *   mysterious → cool hues, low lightness, high-octave simplex
 */

import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import type { CodeTopology, StoryArc, SegmentAssets, SegmentMood } from '@dendrovia/shared';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import { createLogger } from '@dendrovia/shared/logger';

const log = createLogger('IMAGINARIUM', 'segment-pipeline');
import { extractPalette } from '../distillation/ColorExtractor';
import { generate as generateNoise } from '../distillation/NoiseGenerator';
import { compile as compileLSystem } from '../distillation/LSystemCompiler';
import { compile as compileSDF } from '../distillation/SDFCompiler';
import { hashString } from '../utils/hash';
import type { GlobalGenerationContext, SegmentGenerationContext, MoodStrategy } from './types';

export type { MoodStrategy };

export const MOOD_STRATEGIES: Record<SegmentMood, MoodStrategy> = {
  serene: {
    palette: { harmonyScheme: 'analogous', saturationMultiplier: 0.7, lightnessOffset: 0.1 },
    noise: { typeOverride: 'simplex' },
    lsystem: { angleMultiplier: 0.8 },
  },
  tense: {
    palette: { harmonyScheme: 'split-complementary', saturationMultiplier: 1.4 },
    noise: { typeOverride: 'fbm', octaveMultiplier: 1.3 },
    lsystem: { angleMultiplier: 1.2 },
  },
  chaotic: {
    palette: { harmonyScheme: 'triadic', saturationMultiplier: 1.8 },
    noise: { typeOverride: 'worley', octaveMultiplier: 1.5 },
    lsystem: { angleMultiplier: 1.5, iterationOffset: 1 },
  },
  triumphant: {
    palette: { harmonyScheme: 'analogous', hueShift: -30, lightnessOffset: 0.15, saturationMultiplier: 1.2 },
    noise: { typeOverride: 'perlin' },
    lsystem: { angleMultiplier: 0.9 },
  },
  mysterious: {
    palette: { harmonyScheme: 'split-complementary', hueShift: 120, lightnessOffset: -0.15, saturationMultiplier: 0.9 },
    noise: { typeOverride: 'simplex', octaveMultiplier: 2.0 },
    lsystem: { angleMultiplier: 1.1, iterationOffset: -1 },
  },
};

/**
 * Run per-segment distillation, writing assets to segments/{segmentId}/ directories.
 *
 * When `ctx` is provided, a SegmentGenerationContext is constructed per segment
 * for future utilization by downstream directive branches.
 */
export async function distillSegments(
  topology: CodeTopology,
  storyArc: StoryArc,
  outputDir: string,
  ctx?: GlobalGenerationContext,
): Promise<SegmentAssets[]> {
  const eventBus = getEventBus();
  const results: SegmentAssets[] = [];

  for (const segment of storyArc.segments) {
    try {
      // Create output directory
      const segDir = join(outputDir, 'segments', segment.id);
      if (!existsSync(segDir)) mkdirSync(segDir, { recursive: true });

      // Filter topology to this segment's files
      const fileSet = new Set(segment.filePaths);
      const segFiles = topology.files.filter(f => fileSet.has(f.path));
      const segHotspots = (topology.hotspots ?? []).filter(h => fileSet.has(h.path));

      // Build a sub-topology for this segment
      const subTopology: CodeTopology = {
        files: segFiles.length > 0 ? segFiles : topology.files.slice(0, 3),
        commits: topology.commits,
        tree: topology.tree,
        hotspots: segHotspots,
      };

      // Get mood-based strategy
      const strategy = MOOD_STRATEGIES[segment.mood];

      // Build per-segment generation context (used by future directive branches)
      if (ctx) {
        const _segCtx: SegmentGenerationContext = {
          global: ctx,
          segment,
          subTopology,
          strategy,
          segmentOutputDir: segDir,
        };
        // _segCtx will be threaded through sub-steps in directive branches
      }

      // 1. Extract palette with overrides
      const palette = extractPalette(subTopology, strategy.palette);
      await Bun.write(join(segDir, 'palette.json'), JSON.stringify(palette, null, 2));

      // 2. Generate noise with overrides
      const noise = generateNoise(subTopology, strategy.noise);
      await Bun.write(join(segDir, 'noise.json'), JSON.stringify(noise, null, 2));

      // 3. Compile L-system with overrides
      const lsystem = compileLSystem(subTopology, strategy.lsystem);
      await Bun.write(join(segDir, 'lsystem.json'), JSON.stringify(lsystem, null, 2));

      // 4. Compile shader
      const shader = await compileSDF({
        topology: subTopology,
        palette,
        lsystem,
        noise,
        seed: hashString(`segment-${segment.id}-${storyArc.seed}`),
        variantId: `segment-${segment.id}`,
      });
      await Bun.write(join(segDir, 'shader.glsl'), shader.glsl);

      const assets: SegmentAssets = {
        segmentId: segment.id,
        palette,
        noise,
        lsystem,
        shader,
      };

      results.push(assets);

      await eventBus.emit(GameEvents.SEGMENT_DISTILLED, {
        segmentId: segment.id,
        assets,
      });
    } catch (e) {
      log.info({ segmentId: segment.id, err: e instanceof Error ? e.message : 'unknown error' }, 'Segment skipped');
    }
  }

  return results;
}
