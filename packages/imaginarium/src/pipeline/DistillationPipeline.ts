/**
 * DistillationPipeline — the main orchestrator.
 *
 * Reads topology, runs all distillation steps, writes artifacts,
 * generates manifest. Never throws — falls back to defaults on error.
 * Target: <5 seconds for 100-file topology.
 */

import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import type { CodeTopology, ProceduralPalette, SDFShader, NoiseFunction, LSystemRule, StoryArc, SegmentAssets, WorldIndex, TopologyChunk, SegmentChunkPaths } from '@dendrovia/shared';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import { createLogger } from '@dendrovia/shared/logger';
import { validatePalette } from '@dendrovia/shared/schemas';
import { readTopology } from './TopologyReader';
import { generateVariants } from './VariantGenerator';
import { generateManifest, generateChunkedManifest, type ManifestInput, type ChunkedManifestInput } from './ManifestGenerator';
import { extractPalette } from '../distillation/ColorExtractor';
import { compile as compileLSystem } from '../distillation/LSystemCompiler';
import { generate as generateNoise } from '../distillation/NoiseGenerator';
import { generate as generateArt } from '../generation/ArtGen';
import { DeterministicCache } from '../cache/DeterministicCache';
import { hashObject } from '../utils/hash';
import { distillMycology } from '../mycology/MycologyPipeline';
import { generateMeshAssets } from '../mesh/generateMeshAssets';
import { deriveStoryArc } from '../storyarc/StoryArcDeriver';
import { distillSegments } from './SegmentPipeline';
import { chunkTopology } from './TopologyChunker';
import { precomputePlacements } from './SegmentPlacementPrecomputer';
import type { FungalSpecimen } from '../mycology/types';
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
  log.info({ files: topology.files.length, hotspots: (topology.hotspots ?? []).length }, 'Topology loaded');

  // 2. Init cache + topology hash for cache keys
  const cache = new DeterministicCache(outputDir);
  const topologyHash = hashObject({
    files: topology.files.map(f => ({ path: f.path, hash: f.hash })),
    hotspots: (topology.hotspots ?? []).map(h => h.path),
  });

  // 3. Extract global palette (with cache)
  let paletteResults: PipelineResult['palettes'] = [];
  const paletteCacheKey = `palettes:${topologyHash}`;
  const cachedPalettes = await cache.get<PipelineResult['palettes']>(paletteCacheKey);

  if (cachedPalettes) {
    paletteResults = cachedPalettes;
    // Ensure files exist on disk from cache
    for (const p of paletteResults) {
      const diskPath = join(outputDir, p.path);
      if (!existsSync(diskPath)) {
        await Bun.write(diskPath, JSON.stringify(p.palette, null, 2));
      }
    }
    log.info({ count: paletteResults.length, cached: true }, 'Palettes loaded');
  } else {
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
        hotspots: (topology.hotspots ?? []).filter(h => langFiles.some(f => f.path === h.path)),
      };
      const palette = extractPalette(langTopology);
      const palettePath = join(outputDir, 'palettes', `${lang}.json`);
      await Bun.write(palettePath, JSON.stringify(palette, null, 2));
      paletteResults.push({ id: lang, palette, path: `palettes/${lang}.json` });
    }

    await cache.set(paletteCacheKey, paletteResults);
    log.info({ count: paletteResults.length }, 'Palettes generated');
  }

  const globalPalette = paletteResults.find(p => p.id === 'global')!.palette;
  await eventBus.emit(GameEvents.PALETTE_GENERATED, globalPalette);

  // 4. Compile L-system (with cache)
  const lsystemCacheKey = `lsystem:${topologyHash}`;
  let lsystem: LSystemRule;
  const cachedLSystem = await cache.get<LSystemRule>(lsystemCacheKey);
  if (cachedLSystem) {
    lsystem = cachedLSystem;
    const diskPath = join(outputDir, 'lsystems', 'global.json');
    if (!existsSync(diskPath)) {
      await Bun.write(diskPath, JSON.stringify(lsystem, null, 2));
    }
    log.info({ iterations: lsystem.iterations, angle: lsystem.angle, cached: true }, 'L-System loaded');
  } else {
    lsystem = compileLSystem(topology);
    const lsystemPath = join(outputDir, 'lsystems', 'global.json');
    await Bun.write(lsystemPath, JSON.stringify(lsystem, null, 2));
    await cache.set(lsystemCacheKey, lsystem);
    log.info({ iterations: lsystem.iterations, angle: lsystem.angle }, 'L-System compiled');
  }

  // 5. Generate noise config (with cache)
  const noiseCacheKey = `noise:${topologyHash}`;
  let noise: NoiseFunction;
  const cachedNoise = await cache.get<NoiseFunction>(noiseCacheKey);
  if (cachedNoise) {
    noise = cachedNoise;
    const diskPath = join(outputDir, 'noise', 'global.json');
    if (!existsSync(diskPath)) {
      await Bun.write(diskPath, JSON.stringify(noise, null, 2));
    }
    log.info({ type: noise.type, octaves: noise.octaves, cached: true }, 'Noise config loaded');
  } else {
    noise = generateNoise(topology);
    const noisePath = join(outputDir, 'noise', 'global.json');
    await Bun.write(noisePath, JSON.stringify(noise, null, 2));
    await cache.set(noiseCacheKey, noise);
    log.info({ type: noise.type, octaves: noise.octaves }, 'Noise config generated');
  }

  // 6. Optional AI art generation
  const artResult = await generateArt(topology);
  if (artResult.image) {
    await Bun.write(join(outputDir, 'art.png'), artResult.image);
    log.info({ provider: artResult.provider }, 'Art generated');
  } else {
    log.info('Art skipped (procedural pipeline only)');
  }

  // 7. Generate shader variants (up to 5, with cache)
  const shaderCacheKey = `shaders:${topologyHash}`;
  const shaderResults: PipelineResult['shaders'] = [];
  const cachedShaderSources = await cache.get<Array<{ id: string; glsl: string; parameters: Record<string, number>; complexity: number }>>(shaderCacheKey);

  if (cachedShaderSources) {
    for (const s of cachedShaderSources) {
      const shaderPath = join(outputDir, 'shaders', `${s.id}.glsl`);
      if (!existsSync(shaderPath)) {
        await Bun.write(shaderPath, s.glsl);
      }
      shaderResults.push({ id: s.id, shader: s as SDFShader, path: `shaders/${s.id}.glsl` });
    }
    log.info({ variants: shaderResults.length, cached: true }, 'Shaders loaded');
  } else {
    const shaders = await generateVariants(topology, 5);
    for (const shader of shaders) {
      const shaderPath = join(outputDir, 'shaders', `${shader.id}.glsl`);
      await Bun.write(shaderPath, shader.glsl);
      shaderResults.push({ id: shader.id, shader, path: `shaders/${shader.id}.glsl` });
    }
    // Cache serializable shader data (id, glsl, parameters, complexity — no methods)
    await cache.set(shaderCacheKey, shaders.map(s => ({
      id: s.id, glsl: s.glsl, parameters: s.parameters, complexity: s.complexity,
    })));
    log.info({ variants: shaderResults.length }, 'Shaders compiled');
  }

  await eventBus.emit(GameEvents.SHADERS_COMPILED, { shaders: shaderResults.map(s => s.shader) });

  // 7.5. Story arc derivation and per-segment distillation (with cache)
  let storyArcData: { arc: StoryArc; segmentAssets: SegmentAssets[] } | undefined;
  const storyArcCacheKey = `storyarc:${topologyHash}`;
  try {
    const cachedStoryArc = await cache.get<{ arc: StoryArc; segmentAssets: SegmentAssets[] }>(storyArcCacheKey);
    if (cachedStoryArc) {
      storyArcData = cachedStoryArc;
      // Ensure files on disk
      const arcPath = join(outputDir, 'story-arc.json');
      const segPath = join(outputDir, 'segment-assets.json');
      if (!existsSync(arcPath)) await Bun.write(arcPath, JSON.stringify(cachedStoryArc.arc, null, 2));
      if (!existsSync(segPath)) await Bun.write(segPath, JSON.stringify(cachedStoryArc.segmentAssets, null, 2));
      log.info({ segments: cachedStoryArc.arc.segments.length, cached: true }, 'Story arc loaded');
    } else {
      const storyArc = deriveStoryArc(topology);
      const segmentAssets = await distillSegments(topology, storyArc, outputDir);

      // Write story arc and segment assets manifest
      await Bun.write(join(outputDir, 'story-arc.json'), JSON.stringify(storyArc, null, 2));
      await Bun.write(join(outputDir, 'segment-assets.json'), JSON.stringify(segmentAssets, null, 2));

      storyArcData = { arc: storyArc, segmentAssets };
      await cache.set(storyArcCacheKey, storyArcData);

      log.info({ segments: storyArc.segments.length }, 'Story arc derived');
    }

    await eventBus.emit(GameEvents.STORY_ARC_DERIVED, {
      arc: storyArcData!.arc,
      segmentCount: storyArcData!.arc.segments.length,
    });
  } catch (e) {
    log.info({ err: e instanceof Error ? e.message : 'unknown error' }, 'Story arc skipped');
  }

  // 7.6. Chunk topology into per-segment files
  let topologyChunks: TopologyChunk[] | undefined;
  let worldIndex: WorldIndex | undefined;
  let segmentChunkPaths: Record<string, SegmentChunkPaths> | undefined;
  if (storyArcData) {
    try {
      const chunkCacheKey = `chunks:${topologyHash}`;
      const cachedChunks = await cache.get<TopologyChunk[]>(chunkCacheKey);

      if (cachedChunks) {
        topologyChunks = cachedChunks;
        // Ensure files on disk
        for (const chunk of topologyChunks) {
          const chunkDir = join(outputDir, 'segments', chunk.segmentId);
          const chunkPath = join(chunkDir, 'topology-chunk.json');
          if (!existsSync(chunkPath)) {
            if (!existsSync(chunkDir)) mkdirSync(chunkDir, { recursive: true });
            await Bun.write(chunkPath, JSON.stringify(chunk, null, 2));
          }
        }
        log.info({ chunks: topologyChunks.length, cached: true }, 'Topology chunks loaded');
      } else {
        topologyChunks = chunkTopology(topology, storyArcData.arc);

        // Write per-segment topology chunks
        for (const chunk of topologyChunks) {
          const chunkDir = join(outputDir, 'segments', chunk.segmentId);
          if (!existsSync(chunkDir)) mkdirSync(chunkDir, { recursive: true });
          await Bun.write(
            join(chunkDir, 'topology-chunk.json'),
            JSON.stringify(chunk, null, 2),
          );
        }

        await cache.set(chunkCacheKey, topologyChunks);
        log.info({ chunks: topologyChunks.length }, 'Topology chunked');
      }

      // 7.7. Precompute segment placements → world-index.json
      const placementCacheKey = `placements:${topologyHash}`;
      const cachedWorldIndex = await cache.get<WorldIndex>(placementCacheKey);

      if (cachedWorldIndex) {
        worldIndex = cachedWorldIndex;
        const wiPath = join(outputDir, 'world-index.json');
        if (!existsSync(wiPath)) {
          await Bun.write(wiPath, JSON.stringify(worldIndex, null, 2));
        }
        log.info({ segments: worldIndex.segmentCount, cached: true }, 'World index loaded');
      } else {
        worldIndex = precomputePlacements(topologyChunks, storyArcData.arc);
        await Bun.write(
          join(outputDir, 'world-index.json'),
          JSON.stringify(worldIndex, null, 2),
        );
        await cache.set(placementCacheKey, worldIndex);
        log.info({ segments: worldIndex.segmentCount, worldRadius: Math.round(worldIndex.worldRadius) }, 'World index computed');
      }

      // 7.8. Build segment chunk paths map for chunked manifest
      segmentChunkPaths = {};
      for (const segment of storyArcData.arc.segments) {
        const segDir = `segments/${segment.id}`;
        segmentChunkPaths[segment.id] = {
          topology: `${segDir}/topology-chunk.json`,
          palette: `${segDir}/palette.json`,
          noise: `${segDir}/noise.json`,
          lsystem: `${segDir}/lsystem.json`,
          shader: `${segDir}/shader.glsl`,
        };
      }
    } catch (e) {
      log.info({ err: e instanceof Error ? e.message : 'unknown error' }, 'World segmentation skipped');
    }
  }

  // 8. Mycology catalogization (with cache)
  let mycologyData: ManifestInput['mycology'] | undefined;
  const mycologyCacheKey = `mycology:${topologyHash}`;
  try {
    const cachedMycology = await cache.get<ManifestInput['mycology'] & { networkEdgeCount: number }>(mycologyCacheKey);
    if (cachedMycology) {
      mycologyData = {
        specimens: cachedMycology.specimens,
        network: cachedMycology.network,
        assetDir: cachedMycology.assetDir,
        specimenCount: cachedMycology.specimenCount,
      };
      log.info({ specimens: cachedMycology.specimenCount, cached: true }, 'Mycology loaded');
      await eventBus.emit(GameEvents.MYCOLOGY_CATALOGED, {
        specimenCount: cachedMycology.specimenCount,
        networkEdgeCount: cachedMycology.networkEdgeCount,
        manifestPath: 'mycology/manifest.json',
      });
    } else {
      const mycologyManifest = await distillMycology(topology, outputDir, storyArcData?.arc);
      mycologyData = {
        specimens: mycologyManifest.specimens,
        network: mycologyManifest.network,
        assetDir: mycologyManifest.assetDir,
        specimenCount: mycologyManifest.specimenCount,
      };
      await cache.set(mycologyCacheKey, {
        ...mycologyData,
        networkEdgeCount: mycologyManifest.networkEdgeCount,
      });
      await eventBus.emit(GameEvents.MYCOLOGY_CATALOGED, {
        specimenCount: mycologyManifest.specimenCount,
        networkEdgeCount: mycologyManifest.networkEdgeCount,
        manifestPath: 'mycology/manifest.json',
      });
      log.info({ specimens: mycologyManifest.specimenCount, networkEdges: mycologyManifest.networkEdgeCount }, 'Mycology catalogized');
    }
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

  // 8.7. Update segment chunk paths with specimens (if both mycology and segmentation ran)
  if (segmentChunkPaths && storyArcData) {
    for (const segment of storyArcData.arc.segments) {
      const segDir = `segments/${segment.id}`;
      const specimensPath = join(outputDir, segDir, 'specimens.json');
      if (existsSync(specimensPath) && segmentChunkPaths[segment.id]) {
        segmentChunkPaths[segment.id].specimens = `${segDir}/specimens.json`;
      }
    }
  }

  // 9. Generate manifest (backward-compatible monolithic)
  const manifestInput: ManifestInput = {
    shaders: shaderResults.map(s => ({ id: s.id, path: s.path })),
    palettes: paletteResults.map(p => ({ id: p.id, path: p.path })),
    topologyPath: topologyPath,
    topologyHash,
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

  // 9.5. Generate chunked manifest (slim, ~5KB) alongside monolithic one
  if (worldIndex && segmentChunkPaths) {
    const meshIndexPath = meshEntries ? 'mesh-index.json' : undefined;

    // Write mesh entries to separate mesh-index.json (the 4.7MB blob, deferred)
    if (meshEntries) {
      await Bun.write(
        join(outputDir, 'mesh-index.json'),
        JSON.stringify(meshEntries, null, 2),
      );
    }

    const chunkedInput: ChunkedManifestInput = {
      shaders: shaderResults.map(s => ({ id: s.id, path: s.path })),
      palettes: paletteResults.map(p => ({ id: p.id, path: p.path })),
      topologyHash,
      noisePath: 'noise/global.json',
      lsystemPath: 'lsystems/global.json',
      worldIndexPath: 'world-index.json',
      meshIndexPath,
      segments: segmentChunkPaths,
      storyArc: storyArcData ? {
        arc: 'story-arc.json',
        segmentCount: storyArcData.arc.segments.length,
      } : undefined,
      mycologyNetwork: mycologyData ? mycologyData.network : undefined,
    };

    const chunkedManifest = generateChunkedManifest(chunkedInput);
    await Bun.write(
      join(outputDir, 'manifest-chunked.json'),
      JSON.stringify(chunkedManifest, null, 2),
    );
    log.info('Chunked manifest generated');
  }

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
