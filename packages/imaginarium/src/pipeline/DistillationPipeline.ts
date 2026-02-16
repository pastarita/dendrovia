/**
 * DistillationPipeline — the main orchestrator.
 *
 * Reads topology, runs all distillation steps, writes artifacts,
 * generates manifest. Never throws — falls back to defaults on error.
 * Target: <5 seconds for 100-file topology.
 */

import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import type { CodeTopology, ProceduralPalette, SDFShader, NoiseFunction, LSystemRule, StoryArc, SegmentAssets } from '@dendrovia/shared';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import { createLogger } from '@dendrovia/shared/logger';
import { validatePalette } from '@dendrovia/shared/schemas';
import { readTopology } from './TopologyReader.js';
import { generateVariants } from './VariantGenerator.js';
import { generateManifest, type ManifestInput } from './ManifestGenerator.js';
import { extractPalette } from '../distillation/ColorExtractor.js';
import { compile as compileLSystem } from '../distillation/LSystemCompiler.js';
import { generate as generateNoise } from '../distillation/NoiseGenerator.js';
import { generate as generateArt } from '../generation/ArtGen.js';
import { DeterministicCache } from '../cache/DeterministicCache.js';
import { hashString } from '../utils/hash.js';
import { distillMycology } from '../mycology/MycologyPipeline.js';
import { generateMeshAssets } from '../mesh/generateMeshAssets.js';
import { deriveStoryArc } from '../storyarc/StoryArcDeriver.js';
import { distillSegments } from './SegmentPipeline.js';
import type { FungalSpecimen } from '../mycology/types.js';
import type { MeshManifestEntry } from '@dendrovia/shared';

const log = createLogger('IMAGINARIUM', 'pipeline');

export interface PipelineResult {
  palettes: Array<{ id: string; palette: ProceduralPalette; path: string }>;
  shaders: Array<{ id: string; shader: SDFShader; path: string }>;
  noise: { config: NoiseFunction; path: string };
  lsystem: { rule: LSystemRule; path: string };
  manifestPath: string;
  durationMs: number;
}

export async function distill(
  topologyPath: string,
  outputDir: string,
): Promise<PipelineResult> {
  const startTime = performance.now();
  const eventBus = getEventBus();

  log.info('Starting distillation pipeline');

  // Ensure output directories
  const dirs = ['palettes', 'shaders', 'noise', 'lsystems'];
  for (const d of dirs) {
    const dirPath = join(outputDir, d);
    if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
  }

  // 1. Read topology (falls back to mock if missing)
  const topology = await readTopology(topologyPath);
  log.info({ files: topology.files.length, hotspots: topology.hotspots.length }, 'Topology loaded');

  // 2. Init cache
  const cache = new DeterministicCache(outputDir);

  // 3. Extract global palette
  const globalPalette = extractPalette(topology);

  // Determine language-specific palettes
  const langCounts = new Map<string, number>();
  for (const f of topology.files) {
    langCounts.set(f.language, (langCounts.get(f.language) ?? 0) + 1);
  }
  const topLanguages = [...langCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([lang]) => lang);

  const paletteResults: PipelineResult['palettes'] = [];

  // Validate palette against contract before writing
  validatePalette(globalPalette);

  // Write global palette
  const globalPalettePath = join(outputDir, 'palettes', 'global.json');
  await Bun.write(globalPalettePath, JSON.stringify(globalPalette, null, 2));
  paletteResults.push({ id: 'global', palette: globalPalette, path: 'palettes/global.json' });

  // Per-language palettes
  for (const lang of topLanguages) {
    const langFiles = topology.files.filter(f => f.language === lang);
    const langTopology: CodeTopology = {
      files: langFiles,
      commits: topology.commits,
      tree: topology.tree,
      hotspots: topology.hotspots.filter(h => langFiles.some(f => f.path === h.path)),
    };
    const palette = extractPalette(langTopology);
    const palettePath = join(outputDir, 'palettes', `${lang}.json`);
    await Bun.write(palettePath, JSON.stringify(palette, null, 2));
    paletteResults.push({ id: lang, palette, path: `palettes/${lang}.json` });
  }

  await eventBus.emit(GameEvents.PALETTE_GENERATED, globalPalette);
  log.info({ count: paletteResults.length }, 'Palettes generated');

  // 4. Compile L-system
  const lsystem = compileLSystem(topology);
  const lsystemPath = join(outputDir, 'lsystems', 'global.json');
  await Bun.write(lsystemPath, JSON.stringify(lsystem, null, 2));
  log.info({ iterations: lsystem.iterations, angle: lsystem.angle }, 'L-System compiled');

  // 5. Generate noise config
  const noise = generateNoise(topology);
  const noisePath = join(outputDir, 'noise', 'global.json');
  await Bun.write(noisePath, JSON.stringify(noise, null, 2));
  log.info({ type: noise.type, octaves: noise.octaves }, 'Noise config generated');

  // 6. Optional AI art generation
  const artResult = await generateArt(topology);
  if (artResult.image) {
    await Bun.write(join(outputDir, 'art.png'), artResult.image);
    log.info({ provider: artResult.provider }, 'Art generated');
  } else {
    log.info('Art skipped (procedural pipeline only)');
  }

  // 7. Generate shader variants (up to 5)
  const shaders = await generateVariants(topology, 5);
  const shaderResults: PipelineResult['shaders'] = [];

  for (const shader of shaders) {
    const shaderPath = join(outputDir, 'shaders', `${shader.id}.glsl`);
    await Bun.write(shaderPath, shader.glsl);
    shaderResults.push({ id: shader.id, shader, path: `shaders/${shader.id}.glsl` });
  }

  await eventBus.emit(GameEvents.SHADERS_COMPILED, { shaders });
  log.info({ variants: shaderResults.length }, 'Shaders compiled');

  // 7.5. Story arc derivation and per-segment distillation
  let storyArcData: { arc: StoryArc; segmentAssets: SegmentAssets[] } | undefined;
  try {
    const storyArc = deriveStoryArc(topology);
    const segmentAssets = await distillSegments(topology, storyArc, outputDir);

    // Write story arc and segment assets manifest
    await Bun.write(join(outputDir, 'story-arc.json'), JSON.stringify(storyArc, null, 2));
    await Bun.write(join(outputDir, 'segment-assets.json'), JSON.stringify(segmentAssets, null, 2));

    storyArcData = { arc: storyArc, segmentAssets };

    await eventBus.emit(GameEvents.STORY_ARC_DERIVED, {
      arc: storyArc,
      segmentCount: storyArc.segments.length,
    });
    console.log(`[IMAGINARIUM]   Story Arc: ${storyArc.segments.length} segments`);
  } catch (e) {
    console.log(`[IMAGINARIUM]   Story Arc: skipped (${e instanceof Error ? e.message : 'unknown error'})`);
  }

  // 8. Mycology catalogization
  let mycologyData: ManifestInput['mycology'] | undefined;
  try {
    const mycologyManifest = await distillMycology(topology, outputDir);
    mycologyData = {
      specimens: mycologyManifest.specimens,
      network: mycologyManifest.network,
      assetDir: mycologyManifest.assetDir,
      specimenCount: mycologyManifest.specimenCount,
    };
    await eventBus.emit(GameEvents.MYCOLOGY_CATALOGED, {
      specimenCount: mycologyManifest.specimenCount,
      networkEdgeCount: mycologyManifest.networkEdgeCount,
      manifestPath: 'mycology/manifest.json',
    });
    log.info({ specimens: mycologyManifest.specimenCount, networkEdges: mycologyManifest.networkEdgeCount }, 'Mycology catalogized');
  } catch (e) {
    log.info({ err: e instanceof Error ? e.message : 'unknown error' }, 'Mycology skipped');
  }

  // 8.5. Mesh generation (enriched half-edge meshes for each specimen)
  let meshEntries: Record<string, MeshManifestEntry> | undefined;
  if (mycologyData) {
    try {
      const specimensPath = join(outputDir, mycologyData.specimens);
      const specimensRaw = await Bun.file(specimensPath).text();
      const specimens: FungalSpecimen[] = JSON.parse(specimensRaw);
      const meshResult = await generateMeshAssets(specimens, outputDir);
      meshEntries = meshResult.meshEntries;

      // Write updated specimens back to disk with meshDataPath populated
      const specimensOutPath = join(outputDir, mycologyData.specimens);
      await Bun.write(specimensOutPath, JSON.stringify(specimens, null, 2));

      log.info({ specimens: meshResult.stats.successCount, totalVertices: meshResult.stats.totalVertices, durationMs: meshResult.stats.durationMs }, 'Meshes generated');
      if (meshResult.stats.failCount > 0) {
        log.warn({ failCount: meshResult.stats.failCount }, 'Some mesh specimens failed (fallback to SVG)');
      }
    } catch (e) {
      log.info({ err: e instanceof Error ? e.message : 'unknown error' }, 'Meshes skipped');
    }
  }

  // 9. Generate manifest
  const manifestInput: ManifestInput = {
    shaders: shaderResults.map(s => ({ id: s.id, path: s.path })),
    palettes: paletteResults.map(p => ({ id: p.id, path: p.path })),
    topologyPath: topologyPath,
    noisePath: 'noise/global.json',
    lsystemPath: 'lsystems/global.json',
    mycology: mycologyData,
    meshes: meshEntries,
    storyArc: storyArcData ? {
      arc: 'story-arc.json',
      segmentAssets: 'segment-assets.json',
      segmentCount: storyArcData.arc.segments.length,
    } : undefined,
  };
  const manifest = generateManifest(manifestInput);
  const manifestPath = join(outputDir, 'manifest.json');
  await Bun.write(manifestPath, JSON.stringify(manifest, null, 2));

  const durationMs = Math.round(performance.now() - startTime);
  log.info({ durationMs }, 'Distillation complete');

  return {
    palettes: paletteResults,
    shaders: shaderResults,
    noise: { config: noise, path: 'noise/global.json' },
    lsystem: { rule: lsystem, path: 'lsystems/global.json' },
    manifestPath: 'manifest.json',
    durationMs,
  };
}
