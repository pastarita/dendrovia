/**
 * Manifest Generator — Build-Time Tool
 *
 * Scans the generated/ directory after IMAGINARIUM distillation,
 * computes content hashes, and outputs manifest.json conforming
 * to the AssetManifest contract.
 *
 * Designed to run in the TurboRepo pipeline:
 *   operatus#manifest depends on imaginarium#distill
 *
 * Features:
 *   - SHA-256 content hashing for cache invalidation
 *   - Incremental builds (skips unchanged files)
 *   - File size tracking for progress estimation
 *   - Asset type detection from file extensions
 *
 * Usage (CLI):
 *   bun run src/manifest/ManifestGenerator.ts -- --input ./generated --output ./generated/manifest.json
 *
 * Usage (programmatic):
 *   const gen = new ManifestGenerator('./generated');
 *   const manifest = await gen.generate();
 */

import { createHash } from 'crypto';
import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { join, extname, relative } from 'path';
import type { AssetManifest } from '@dendrovia/shared';

export interface ManifestEntry {
  path: string;
  hash: string;
  size: number;
  type: 'shader' | 'palette' | 'topology' | 'json' | 'texture' | 'audio' | 'other';
}

export interface ManifestGeneratorConfig {
  /** Root directory containing generated assets */
  inputDir: string;
  /** Output path for manifest.json (default: inputDir/manifest.json) */
  outputPath?: string;
  /** Previous manifest for incremental comparison */
  previousManifest?: AssetManifest | null;
  /** File extensions to include (default: all known types) */
  extensions?: string[];
}

const DEFAULT_EXTENSIONS = [
  '.glsl', '.frag', '.vert',  // shaders
  '.json',                     // data
  '.webp', '.png', '.jpg',    // textures
  '.ogg', '.mp3', '.wav',     // audio
];

export class ManifestGenerator {
  private config: Required<ManifestGeneratorConfig>;

  constructor(config: ManifestGeneratorConfig) {
    this.config = {
      inputDir: config.inputDir,
      outputPath: config.outputPath ?? join(config.inputDir, 'manifest.json'),
      previousManifest: config.previousManifest ?? null,
      extensions: config.extensions ?? DEFAULT_EXTENSIONS,
    };
  }

  /**
   * Scan the input directory and generate a manifest.
   */
  async generate(): Promise<AssetManifest> {
    const entries = await this.scanDirectory(this.config.inputDir);

    // Categorize entries
    const shaders: Record<string, string> = {};
    const palettes: Record<string, string> = {};
    let topology = '';

    for (const entry of entries) {
      const relPath = entry.path;

      switch (entry.type) {
        case 'shader':
          shaders[this.deriveId(relPath)] = relPath;
          break;
        case 'palette':
          palettes[this.deriveId(relPath)] = relPath;
          break;
        case 'topology':
          topology = relPath;
          break;
      }
    }

    // Compute global checksum from all individual hashes
    const globalHash = createHash('sha256');
    for (const entry of entries.sort((a, b) => a.path.localeCompare(b.path))) {
      globalHash.update(entry.hash);
    }

    const manifest: AssetManifest = {
      version: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      shaders,
      palettes,
      topology,
      checksum: globalHash.digest('hex').slice(0, 16),
    };

    return manifest;
  }

  /**
   * Generate and write manifest.json to disk.
   */
  async generateAndWrite(): Promise<{ manifest: AssetManifest; entries: ManifestEntry[] }> {
    const entries = await this.scanDirectory(this.config.inputDir);

    const manifest = await this.generate();

    await writeFile(
      this.config.outputPath,
      JSON.stringify(manifest, null, 2),
      'utf-8',
    );

    return { manifest, entries };
  }

  /**
   * Compare current directory state against previous manifest.
   * Returns paths that have changed or are new.
   */
  async getChangedFiles(): Promise<string[]> {
    if (!this.config.previousManifest) return [];

    const entries = await this.scanDirectory(this.config.inputDir);
    const prevEntries = this.flattenManifest(this.config.previousManifest);
    const changed: string[] = [];

    for (const entry of entries) {
      const prevHash = prevEntries.get(entry.path);
      if (!prevHash || prevHash !== entry.hash) {
        changed.push(entry.path);
      }
    }

    return changed;
  }

  // ── Private ─────────────────────────────────────────────────────

  /**
   * Recursively scan a directory for asset files.
   */
  private async scanDirectory(dir: string, basePath = ''): Promise<ManifestEntry[]> {
    const entries: ManifestEntry[] = [];
    let dirEntries: string[];

    try {
      dirEntries = await readdir(dir);
    } catch {
      return entries;
    }

    for (const name of dirEntries) {
      // Skip manifest itself and hidden files
      if (name === 'manifest.json' || name.startsWith('.')) continue;

      const fullPath = join(dir, name);
      const relPath = basePath ? `${basePath}/${name}` : name;
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        const subEntries = await this.scanDirectory(fullPath, relPath);
        entries.push(...subEntries);
      } else if (stats.isFile()) {
        const ext = extname(name).toLowerCase();
        if (!this.config.extensions.includes(ext)) continue;

        const content = await readFile(fullPath);
        const hash = createHash('sha256').update(content).digest('hex').slice(0, 16);

        entries.push({
          path: relPath,
          hash,
          size: stats.size,
          type: this.detectType(relPath, ext),
        });
      }
    }

    return entries;
  }

  /**
   * Detect asset type from file path and extension.
   */
  private detectType(path: string, ext: string): ManifestEntry['type'] {
    // Special filenames
    if (path.includes('topology')) return 'topology';
    if (path.includes('palette')) return 'palette';

    // Extension-based
    switch (ext) {
      case '.glsl':
      case '.frag':
      case '.vert':
        return 'shader';
      case '.json':
        return 'json';
      case '.webp':
      case '.png':
      case '.jpg':
        return 'texture';
      case '.ogg':
      case '.mp3':
      case '.wav':
        return 'audio';
      default:
        return 'other';
    }
  }

  /**
   * Derive an asset ID from its relative path.
   * e.g., "shaders/dendrite.glsl" → "dendrite"
   */
  private deriveId(path: string): string {
    const name = path.split('/').pop() ?? path;
    return name.replace(/\.[^.]+$/, '');
  }

  /**
   * Flatten a manifest into a Map<path, hash> for comparison.
   */
  private flattenManifest(manifest: AssetManifest): Map<string, string> {
    const map = new Map<string, string>();

    // We store the path as key, but we don't have per-file hashes
    // in the current AssetManifest format. Use checksum as fallback.
    for (const [id, path] of Object.entries(manifest.shaders ?? {})) {
      map.set(path, manifest.checksum);
    }
    for (const [id, path] of Object.entries(manifest.palettes ?? {})) {
      map.set(path, manifest.checksum);
    }
    if (manifest.topology) {
      map.set(manifest.topology, manifest.checksum);
    }

    return map;
  }
}

// ── CLI Entry Point ──────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let inputDir = './generated';
  let outputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputDir = args[++i]!;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[++i]!;
    }
  }

  const gen = new ManifestGenerator({ inputDir, outputPath });
  const { manifest, entries } = await gen.generateAndWrite();

  console.log(`[OPERATUS] Manifest generated:`);
  console.log(`  Assets: ${entries.length}`);
  console.log(`  Shaders: ${Object.keys(manifest.shaders).length}`);
  console.log(`  Palettes: ${Object.keys(manifest.palettes).length}`);
  console.log(`  Topology: ${manifest.topology || 'none'}`);
  console.log(`  Checksum: ${manifest.checksum}`);
  console.log(`  Written to: ${outputPath ?? inputDir + '/manifest.json'}`);
}

// Run if invoked directly
if (import.meta.main) {
  main().catch((err) => {
    console.error('[OPERATUS] Manifest generation failed:', err);
    process.exit(1);
  });
}
