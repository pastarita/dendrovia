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
 */

import type {
  AssetManifest,
  ProceduralPalette,
  LSystemRule,
  NoiseFunction,
  FungalSpecimen,
  MycelialNetwork,
  SerializedMeshData,
} from '@dendrovia/shared';
import { deserializeToFlat } from '@dendrovia/imaginarium';
import type { FlatMeshData } from '@dendrovia/imaginarium';

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
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
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
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load all generated assets referenced by an IMAGINARIUM manifest.
 *
 * @param manifestPath  URL or relative path to `manifest.json`.
 *                      In dev this is typically `/generated/manifest.json`.
 * @returns GeneratedAssets on success, null if the manifest itself cannot be
 *          loaded (individual sub-assets may still be null inside a
 *          successful result).
 */
export async function loadGeneratedAssets(
  manifestPath: string,
): Promise<GeneratedAssets | null> {
  // 1. Fetch the manifest — this is the only hard requirement.
  const manifest = await fetchJson<AssetManifest>(manifestPath);
  if (!manifest) {
    console.warn('[ARCHITECTUS] Could not load asset manifest from', manifestPath);
    return null;
  }

  console.log('[ARCHITECTUS] Loaded asset manifest v' + manifest.version);

  // 2. Load palettes (global + per-language) in parallel.
  const paletteEntries = Object.entries(manifest.palettes);
  const paletteResults = await Promise.all(
    paletteEntries.map(async ([id, path]) => {
      const palette = await fetchJson<ProceduralPalette>(
        resolveAssetUrl(manifestPath, path),
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
      const source = await fetchText(resolveAssetUrl(manifestPath, path));
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
  const [lsystem, noise] = await Promise.all([
    fetchJson<LSystemRule>(resolveAssetUrl(manifestPath, 'lsystems/global.json')),
    fetchJson<NoiseFunction>(resolveAssetUrl(manifestPath, 'noise/global.json')),
  ]);

  // 5. Load mycology data if referenced in the manifest.
  let mycology: GeneratedAssets['mycology'] = null;
  if (manifest.mycology) {
    const [specimens, network] = await Promise.all([
      fetchJson<FungalSpecimen[]>(
        resolveAssetUrl(manifestPath, manifest.mycology.specimens),
      ),
      fetchJson<MycelialNetwork>(
        resolveAssetUrl(manifestPath, manifest.mycology.network),
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
        const raw = await fetchJson<SerializedMeshData>(
          resolveAssetUrl(manifestPath, entry.path),
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
      console.log(`[ARCHITECTUS] Loaded ${meshes.size} mesh assets`);
    }
  }

  const assetCount =
    Object.keys(palettes).length +
    Object.keys(shaders).length +
    (lsystem ? 1 : 0) +
    (noise ? 1 : 0) +
    (mycology ? 1 : 0) +
    (meshes ? meshes.size : 0);

  console.log(`[ARCHITECTUS] Loaded ${assetCount} generated assets`);

  return {
    manifest,
    palette: globalPalette,
    palettes,
    lsystem,
    noise,
    shaders,
    mycology,
    meshes,
  };
}
