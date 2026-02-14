/**
 * DistillationPipeline — the main orchestrator.
 *
 * Reads topology, runs all distillation steps, writes artifacts,
 * generates manifest. Never throws — falls back to defaults on error.
 * Target: <5 seconds for 100-file topology.
 */

import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import type { CodeTopology, ProceduralPalette, SDFShader, NoiseFunction, LSystemRule } from '@dendrovia/shared';
import { getEventBus, GameEvents } from '@dendrovia/shared';
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
import type { FungalSpecimen } from '../mycology/types.js';
import type { MeshManifestEntry } from '@dendrovia/shared';

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

  console.log('[IMAGINARIUM] Starting distillation pipeline...');

  // Ensure output directories
  const dirs = ['palettes', 'shaders', 'noise', 'lsystems'];
  for (const d of dirs) {
    const dirPath = join(outputDir, d);
    if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });
  }

  // 1. Read topology (falls back to mock if missing)
  const topology = await readTopology(topologyPath);
  console.log(`[IMAGINARIUM]   Files: ${topology.files.length}, Hotspots: ${topology.hotspots.length}`);

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
  console.log(`[IMAGINARIUM]   Palettes: ${paletteResults.length}`);

  // 4. Compile L-system
  const lsystem = compileLSystem(topology);
  const lsystemPath = join(outputDir, 'lsystems', 'global.json');
  await Bun.write(lsystemPath, JSON.stringify(lsystem, null, 2));
  console.log(`[IMAGINARIUM]   L-System: iterations=${lsystem.iterations}, angle=${lsystem.angle}`);

  // 5. Generate noise config
  const noise = generateNoise(topology);
  const noisePath = join(outputDir, 'noise', 'global.json');
  await Bun.write(noisePath, JSON.stringify(noise, null, 2));
  console.log(`[IMAGINARIUM]   Noise: type=${noise.type}, octaves=${noise.octaves}`);

  // 6. Optional AI art generation
  const artResult = await generateArt(topology);
  if (artResult.image) {
    await Bun.write(join(outputDir, 'art.png'), artResult.image);
    console.log(`[IMAGINARIUM]   Art: generated via ${artResult.provider}`);
  } else {
    console.log(`[IMAGINARIUM]   Art: skipped (procedural pipeline only)`);
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
  console.log(`[IMAGINARIUM]   Shaders: ${shaderResults.length} variants`);

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
    console.log(`[IMAGINARIUM]   Mycology: ${mycologyManifest.specimenCount} specimens, ${mycologyManifest.networkEdgeCount} network edges`);
  } catch (e) {
    console.log(`[IMAGINARIUM]   Mycology: skipped (${e instanceof Error ? e.message : 'unknown error'})`);
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
      console.log(`[IMAGINARIUM]   Meshes: ${meshResult.stats.successCount} specimens, ${meshResult.stats.totalVertices} total vertices (${meshResult.stats.durationMs}ms)`);
      if (meshResult.stats.failCount > 0) {
        console.log(`[IMAGINARIUM]   Meshes: ${meshResult.stats.failCount} specimens failed (fallback to SVG)`);
      }
    } catch (e) {
      console.log(`[IMAGINARIUM]   Meshes: skipped (${e instanceof Error ? e.message : 'unknown error'})`);
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
  };
  const manifest = generateManifest(manifestInput);
  const manifestPath = join(outputDir, 'manifest.json');
  await Bun.write(manifestPath, JSON.stringify(manifest, null, 2));

  const durationMs = Math.round(performance.now() - startTime);
  console.log(`[IMAGINARIUM] Distillation complete in ${durationMs}ms`);

  return {
    palettes: paletteResults,
    shaders: shaderResults,
    noise: { config: noise, path: 'noise/global.json' },
    lsystem: { rule: lsystem, path: 'lsystems/global.json' },
    manifestPath: 'manifest.json',
    durationMs,
  };
}
