/**
 * ASSET BRIDGE
 *
 * Loads IMAGINARIUM-generated assets at runtime so ARCHITECTUS can consume
 * palettes, L-system rules, noise configs, and shader sources instead of
 * relying on hardcoded defaults.
 *
 * Design principles:
 *   - Never blocks rendering: every fetch is wrapped in a try/catch that
 *     falls back to null for the individual asset.
 *   - Typed output: GeneratedAssets gives the consumer a single object
 *     with optional fields — the store/components decide what to do when
 *     a field is missing.
 *   - Works with both file:// (dev/Bun) and http:// (production) URLs.
 *   - When an assetLoader is provided (from OPERATUS), all fetches route
 *     through the 4-tier cache (memory → OPFS → IDB → network).
 */

import type {
  AssetManifest,
  ProceduralPalette,
  LSystemRule,
  NoiseFunction,
  FungalSpecimen,
  MycelialNetwork,
  SerializedMeshData,
  StoryArc,
  SegmentAssets,
  ChunkedManifest,
  WorldIndex,
  TopologyChunk,
  Hotspot,
  ParsedFile,
} from '@dendrovia/shared';
import { createLogger } from '@dendrovia/shared/logger';
import { deserializeToFlat } from '@dendrovia/imaginarium';
import type { FlatMeshData } from '@dendrovia/imaginarium';

const log = createLogger('ARCHITECTUS', 'asset-bridge');

/** The typed shape returned to consumers. Every field is optional — callers
 *  must fall back to their own defaults when a field is null/undefined. */
export interface GeneratedAssets {
  manifest: AssetManifest;
  palette: ProceduralPalette | null;
  palettes: Record<string, ProceduralPalette>;
  lsystem: LSystemRule | null;
  noise: NoiseFunction | null;
  shaders: Record<string, string>;
  mycology: {
    specimens: FungalSpecimen[];
    network: MycelialNetwork | null;
  } | null;
  /** Deserialized mesh data keyed by specimen/genus ID. Loaded from
   *  manifest.meshes entries via deserializeToFlat(). Null until loaded,
   *  empty map if no meshes are referenced in the manifest. */
  meshes: Map<string, FlatMeshData> | null;
  /** Story arc data loaded from story-arc.json. Null if not available. */
  storyArc: StoryArc | null;
  /** Per-segment distilled assets. Null if not available. */
  segmentAssets: SegmentAssets[] | null;
}

// ---------------------------------------------------------------------------
// Cacheable Loader Interface
// ---------------------------------------------------------------------------

/**
 * Minimal interface that OPERATUS AssetLoader satisfies.
 * Defined here to avoid a hard dependency from ARCHITECTUS → OPERATUS.
 */
export interface CacheableAssetLoader {
  loadAsset(descriptor: {
    path: string;
    hash?: string;
    priority: number;
    type: string;
    size?: number;
  }): Promise<string>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a relative asset path against the manifest directory.
 * e.g. manifestUrl = "/generated/manifest.json", rel = "palettes/global.json"
 *      => "/generated/palettes/global.json"
 */
function resolveAssetUrl(manifestUrl: string, relativePath: string): string {
  const base = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);
  return base + relativePath;
}

/** Fetch JSON with a per-request timeout. Returns null on any failure. */
async function fetchJson<T>(url: string, timeoutMs = 5000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) {
      // 404s are expected for optional resources (e.g. chunked manifest) — debug only
      const msg = `fetchJson failed: ${response.status} ${response.statusText} for ${url}`;
      if (response.status === 404) {
        log.debug(msg);
      } else {
        log.warn(msg);
      }
      return null;
    }
    return (await response.json()) as T;
  } catch (err) {
    log.warn({ err, url }, 'fetchJson error');
    return null;
  }
}

/** Fetch plain text (for .glsl shaders). Returns null on failure. */
async function fetchText(url: string, timeoutMs = 5000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) {
      log.warn(`fetchText failed: ${response.status} ${response.statusText} for ${url}`);
      return null;
    }
    return await response.text();
  } catch (err) {
    log.warn({ err, url }, 'fetchText error');
    return null;
  }
}

// ---------------------------------------------------------------------------
// Cached loading helpers (route through AssetLoader when available)
// ---------------------------------------------------------------------------

/** Asset priority constants matching OPERATUS AssetPriority enum */
const PRIORITY = { CRITICAL: 0, VISIBLE: 1 } as const;

/** Load JSON via AssetLoader cache, falling back to direct fetch. */
async function loadJson<T>(
  path: string,
  manifestPath: string,
  loader: CacheableAssetLoader | null,
  priority: number,
  type: string,
  hash?: string,
  size?: number,
): Promise<T | null> {
  if (loader) {
    try {
      const raw = await loader.loadAsset({ path, hash, priority, type, size });
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return fetchJson<T>(resolveAssetUrl(manifestPath, path));
}

/** Load text (shaders) via AssetLoader cache, falling back to direct fetch. */
async function loadText(
  path: string,
  manifestPath: string,
  loader: CacheableAssetLoader | null,
  priority: number,
  hash?: string,
): Promise<string | null> {
  if (loader) {
    try {
      return await loader.loadAsset({ path, hash, priority, type: 'shader' });
    } catch {
      return null;
    }
  }
  return fetchText(resolveAssetUrl(manifestPath, path));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LoadGeneratedAssetsOptions {
  /** OPERATUS AssetLoader for cached loading. When null, falls back to
   *  direct fetch (no caching). */
  assetLoader?: CacheableAssetLoader | null;
}

/**
 * Load all generated assets referenced by an IMAGINARIUM manifest.
 *
 * @param manifestPath  URL or relative path to `manifest.json`.
 *                      In dev this is typically `/generated/manifest.json`.
 * @param options       Optional configuration including an OPERATUS AssetLoader
 *                      for cached loading.
 * @returns GeneratedAssets on success, null if the manifest itself cannot be
 *          loaded (individual sub-assets may still be null inside a
 *          successful result).
 */
export async function loadGeneratedAssets(
  manifestPath: string,
  options: LoadGeneratedAssetsOptions = {},
): Promise<GeneratedAssets | null> {
  const loader = options.assetLoader ?? null;

  // 1. Fetch the manifest — this is the only hard requirement.
  //    The manifest itself is always fetched fresh (or from AssetLoader cache
  //    if available) since it drives all subsequent loading.
  let manifest: AssetManifest | null;
  if (loader) {
    try {
      const raw = await loader.loadAsset({
        path: 'manifest.json',
        priority: PRIORITY.CRITICAL,
        type: 'json',
      });
      manifest = JSON.parse(raw) as AssetManifest;
    } catch {
      manifest = null;
    }
  } else {
    manifest = await fetchJson<AssetManifest>(manifestPath);
  }

  if (!manifest) {
    log.warn({ manifestPath }, 'Could not load asset manifest');
    return null;
  }

  log.info('Loaded asset manifest v' + manifest.version);

  // Health summary: surface phantom references early
  const shaderCount = Object.keys(manifest.shaders).length;
  const paletteCount = Object.keys(manifest.palettes).length;
  const meshCount = manifest.meshes ? Object.keys(manifest.meshes).length : 0;
  log.info({ shaderCount, paletteCount, meshCount }, 'Manifest health');
  if (meshCount > 0) {
    log.warn({ meshCount }, 'Manifest references mesh files — verify they exist on disk');
  }

  // 2. Load palettes (global + per-language) in parallel.
  const paletteEntries = Object.entries(manifest.palettes);
  const paletteResults = await Promise.all(
    paletteEntries.map(async ([id, path]) => {
      const palette = await loadJson<ProceduralPalette>(
        path, manifestPath, loader, PRIORITY.VISIBLE, 'palette',
      );
      return [id, palette] as const;
    }),
  );

  const palettes: Record<string, ProceduralPalette> = {};
  let globalPalette: ProceduralPalette | null = null;

  for (const [id, palette] of paletteResults) {
    if (palette) {
      palettes[id] = palette;
      if (id === 'global') {
        globalPalette = palette;
      }
    }
  }

  // 3. Load shaders in parallel.
  const shaderEntries = Object.entries(manifest.shaders);
  const shaderResults = await Promise.all(
    shaderEntries.map(async ([id, path]) => {
      const source = await loadText(
        path, manifestPath, loader, PRIORITY.CRITICAL,
      );
      return [id, source] as const;
    }),
  );

  const shaders: Record<string, string> = {};
  for (const [id, source] of shaderResults) {
    if (source) {
      shaders[id] = source;
    }
  }

  // 4. Load L-system and noise configs (small files, parallel).
  //    Prefer paths from manifest, fall back to hardcoded defaults for backwards compat.
  const lsystemPath = manifest.lsystem ?? 'lsystems/global.json';
  const noisePath = manifest.noise ?? 'noise/global.json';
  const [lsystem, noise] = await Promise.all([
    loadJson<LSystemRule>(
      lsystemPath, manifestPath, loader, PRIORITY.VISIBLE, 'json',
    ),
    loadJson<NoiseFunction>(
      noisePath, manifestPath, loader, PRIORITY.VISIBLE, 'json',
    ),
  ]);

  // 5. Load mycology data if referenced in the manifest.
  let mycology: GeneratedAssets['mycology'] = null;
  if (manifest.mycology) {
    const [specimens, network] = await Promise.all([
      loadJson<FungalSpecimen[]>(
        manifest.mycology.specimens, manifestPath, loader,
        PRIORITY.VISIBLE, 'json',
      ),
      loadJson<MycelialNetwork>(
        manifest.mycology.network, manifestPath, loader,
        PRIORITY.VISIBLE, 'json',
      ),
    ]);
    mycology = {
      specimens: specimens ?? [],
      network: network,
    };
  }

  // 6. Load mesh data if referenced in the manifest.
  //    Each entry is a serialized mesh JSON file — we fetch and deserialize
  //    to FlatMeshData (GPU-ready typed arrays) in parallel.
  //    Failures are per-mesh (missing file, bad data) and never block other
  //    meshes or overall asset loading.
  let meshes: Map<string, FlatMeshData> | null = null;
  if (manifest.meshes) {
    meshes = new Map<string, FlatMeshData>();
    const meshEntries = Object.entries(manifest.meshes);
    const meshResults = await Promise.all(
      meshEntries.map(async ([id, entry]) => {
        const raw = await loadJson<SerializedMeshData>(
          entry.path, manifestPath, loader,
          PRIORITY.VISIBLE, 'mesh', entry.hash, entry.size,
        );
        if (!raw) return [id, null] as const;
        const flat = deserializeToFlat(raw);
        return [id, flat] as const;
      }),
    );

    for (const [id, flat] of meshResults) {
      if (flat) {
        meshes.set(id, flat);
      }
    }

    if (meshes.size > 0) {
      log.info({ count: meshes.size }, 'Loaded mesh assets');
    }
  }

  // 7. Load story arc and segment assets if referenced in the manifest.
  let storyArc: StoryArc | null = null;
  let segmentAssets: SegmentAssets[] | null = null;
  if (manifest.storyArc) {
    [storyArc, segmentAssets] = await Promise.all([
      loadJson<StoryArc>(
        manifest.storyArc.arc, manifestPath, loader,
        PRIORITY.VISIBLE, 'json',
      ),
      loadJson<SegmentAssets[]>(
        manifest.storyArc.segmentAssets, manifestPath, loader,
        PRIORITY.VISIBLE, 'json',
      ),
    ]);
    if (storyArc) {
      log.info({ segments: storyArc.segments.length }, 'Loaded story arc');
    }
  }

  const assetCount =
    Object.keys(palettes).length +
    Object.keys(shaders).length +
    (lsystem ? 1 : 0) +
    (noise ? 1 : 0) +
    (mycology ? 1 : 0) +
    (meshes ? meshes.size : 0) +
    (storyArc ? 1 : 0);

  log.info({ assetCount }, 'Loaded generated assets');

  return {
    manifest,
    palette: globalPalette,
    palettes,
    lsystem,
    noise,
    shaders,
    mycology,
    meshes,
    storyArc,
    segmentAssets,
  };
}

// ---------------------------------------------------------------------------
// Stage 1: World Index Loading (~15KB total, <100ms)
// ---------------------------------------------------------------------------

/** Lightweight initial load result — enough to render hulls and decide
 *  which segments to load on demand. */
export interface WorldIndexResult {
  manifest: ChunkedManifest;
  worldIndex: WorldIndex;
  palette: ProceduralPalette | null;
  palettes: Record<string, ProceduralPalette>;
  shaders: Record<string, string>;
  storyArc: StoryArc | null;
  lsystem: LSystemRule | null;
  noise: NoiseFunction | null;
}

/**
 * Stage 1: Load only the world index, manifest, and global palette.
 * This is ~15KB total and completes in <100ms, enabling immediate hull rendering.
 *
 * Falls back to loadGeneratedAssets() if chunked manifest is unavailable.
 *
 * @param manifestPath  Base path (the chunked manifest is at `manifest-chunked.json`
 *                      relative to this path's directory).
 */
export async function loadWorldIndex(
  manifestPath: string,
  options: LoadGeneratedAssetsOptions = {},
): Promise<WorldIndexResult | null> {
  const loader = options.assetLoader ?? null;
  const chunkedManifestPath = manifestPath.replace(/manifest\.json$/, 'manifest-chunked.json');

  // Try chunked manifest first
  let manifest: ChunkedManifest | null;
  if (loader) {
    try {
      const raw = await loader.loadAsset({
        path: 'manifest-chunked.json',
        priority: PRIORITY.CRITICAL,
        type: 'json',
      });
      manifest = JSON.parse(raw) as ChunkedManifest;
    } catch {
      manifest = null;
    }
  } else {
    manifest = await fetchJson<ChunkedManifest>(chunkedManifestPath);
  }

  if (!manifest) {
    log.debug('No chunked manifest found, world segmentation unavailable');
    return null;
  }

  log.info('Loaded chunked manifest v' + manifest.version);

  // Load world index, palettes, shaders, story arc in parallel (~15KB total)
  const [worldIndex, storyArc, lsystem, noise, ...paletteAndShaderResults] = await Promise.all([
    // World index (~2KB)
    loadJson<WorldIndex>(
      manifest.worldIndex, manifestPath, loader, PRIORITY.CRITICAL, 'json',
    ),
    // Story arc (small metadata)
    manifest.storyArc
      ? loadJson<StoryArc>(manifest.storyArc.arc, manifestPath, loader, PRIORITY.CRITICAL, 'json')
      : Promise.resolve(null),
    // Global L-system
    manifest.lsystem
      ? loadJson<LSystemRule>(manifest.lsystem, manifestPath, loader, PRIORITY.VISIBLE, 'json')
      : Promise.resolve(null),
    // Global noise
    manifest.noise
      ? loadJson<NoiseFunction>(manifest.noise, manifestPath, loader, PRIORITY.VISIBLE, 'json')
      : Promise.resolve(null),
    // Palettes
    ...Object.entries(manifest.palettes).map(async ([id, path]) => {
      const palette = await loadJson<ProceduralPalette>(path, manifestPath, loader, PRIORITY.VISIBLE, 'palette');
      return { type: 'palette' as const, id, data: palette };
    }),
    // Shaders
    ...Object.entries(manifest.shaders).map(async ([id, path]) => {
      const source = await loadText(path, manifestPath, loader, PRIORITY.CRITICAL);
      return { type: 'shader' as const, id, data: source };
    }),
  ]);

  if (!worldIndex) {
    log.warn('Could not load world index');
    return null;
  }

  const palettes: Record<string, ProceduralPalette> = {};
  const shaders: Record<string, string> = {};
  let globalPalette: ProceduralPalette | null = null;

  for (const result of paletteAndShaderResults) {
    if (result.type === 'palette' && result.data) {
      palettes[result.id] = result.data as ProceduralPalette;
      if (result.id === 'global') globalPalette = result.data as ProceduralPalette;
    } else if (result.type === 'shader' && result.data) {
      shaders[result.id] = result.data as string;
    }
  }

  log.info(
    { segments: worldIndex.segmentCount, radius: Math.round(worldIndex.worldRadius) },
    'World index loaded',
  );

  // Probe: verify segment chunk files are actually deployed.
  // If the manifest promises segments but the files don't exist on disk,
  // return null so the app falls back to monolithic rendering.
  const firstSegmentId = Object.keys(manifest.segments)[0];
  if (firstSegmentId) {
    const probePaths = manifest.segments[firstSegmentId];
    const probeUrl = resolveAssetUrl(manifestPath, probePaths.topology);
    const probeResult = await fetchJson(probeUrl, 2000);
    if (!probeResult) {
      log.info('Segment chunk files not deployed — falling back to monolithic rendering');
      return null;
    }
  }

  return {
    manifest,
    worldIndex,
    palette: globalPalette,
    palettes,
    shaders,
    storyArc,
    lsystem,
    noise,
  };
}

// ---------------------------------------------------------------------------
// Stage 2: Per-Segment Loading (triggered by camera proximity)
// ---------------------------------------------------------------------------

/** Data loaded for a single segment on demand. */
export interface SegmentLoadResult {
  segmentId: string;
  topology: TopologyChunk | null;
  specimens: FungalSpecimen[] | null;
  palette: ProceduralPalette | null;
  lsystem: LSystemRule | null;
  noise: NoiseFunction | null;
}

/**
 * Stage 2: Load data for a specific segment on demand.
 * Called when camera moves close enough to warrant rendering the segment's
 * branches and/or full detail.
 *
 * @param segmentId     The segment to load.
 * @param manifest      The chunked manifest (from Stage 1).
 * @param manifestPath  Base manifest URL for resolving relative paths.
 */
export async function loadSegmentData(
  segmentId: string,
  manifest: ChunkedManifest,
  manifestPath: string,
  options: LoadGeneratedAssetsOptions = {},
): Promise<SegmentLoadResult | null> {
  const loader = options.assetLoader ?? null;
  const segPaths = manifest.segments[segmentId];

  if (!segPaths) {
    log.warn({ segmentId }, 'No segment paths found');
    return null;
  }

  // Load topology, specimens, palette, lsystem, noise in parallel
  const [topology, specimens, palette, lsystem, noise] = await Promise.all([
    loadJson<TopologyChunk>(
      segPaths.topology, manifestPath, loader, PRIORITY.CRITICAL, 'json',
    ),
    segPaths.specimens
      ? loadJson<FungalSpecimen[]>(segPaths.specimens, manifestPath, loader, PRIORITY.VISIBLE, 'json')
      : Promise.resolve(null),
    loadJson<ProceduralPalette>(
      segPaths.palette, manifestPath, loader, PRIORITY.VISIBLE, 'palette',
    ),
    loadJson<LSystemRule>(
      segPaths.lsystem, manifestPath, loader, PRIORITY.VISIBLE, 'json',
    ),
    loadJson<NoiseFunction>(
      segPaths.noise, manifestPath, loader, PRIORITY.VISIBLE, 'json',
    ),
  ]);

  log.info(
    { segmentId, files: topology?.fileCount ?? 0, specimens: specimens?.length ?? 0 },
    'Segment loaded',
  );

  return {
    segmentId,
    topology,
    specimens,
    palette,
    lsystem,
    noise,
  };
}
