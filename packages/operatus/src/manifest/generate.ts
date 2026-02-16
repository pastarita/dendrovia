/**
 * OPERATUS Manifest Generation — CLI Entry Point
 *
 * Standalone script that bridges IMAGINARIUM's generated/ artifacts
 * with OPERATUS's ManifestGenerator, producing a runtime-loadable
 * manifest with SHA-256 content hashes for cache busting.
 *
 * Pipeline position:
 *   chronos#parse -> imaginarium#distill -> operatus#manifest
 *
 * Usage:
 *   bun run src/manifest/generate.ts [--input <dir>] [--output <path>]
 *
 * Defaults:
 *   --input  ../imaginarium/generated
 *   --output ../imaginarium/generated/operatus-manifest.json
 */

import { resolve } from 'path';
import { stat } from 'fs/promises';
import { ManifestGenerator } from './ManifestGenerator';
import { imaginariumGenerated } from '@dendrovia/shared/paths';
import { createLogger } from '@dendrovia/shared/logger';

const log = createLogger('OPERATUS', 'manifest-gen');

// ── Resolve Paths ───────────────────────────────────────────────

const IMAGINARIUM_GENERATED = imaginariumGenerated();

function parseArgs(): { inputDir: string; outputPath: string } {
  const args = process.argv.slice(2);
  let inputDir = IMAGINARIUM_GENERATED;
  let outputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputDir = resolve(args[++i]!);
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = resolve(args[++i]!);
    }
  }

  return {
    inputDir,
    outputPath: outputPath ?? resolve(inputDir, 'operatus-manifest.json'),
  };
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const { inputDir, outputPath } = parseArgs();

  log.info({ inputDir, outputPath }, 'Manifest generation starting');

  // Verify the input directory exists
  try {
    const dirStat = await stat(inputDir);
    if (!dirStat.isDirectory()) {
      log.error({ inputDir }, 'Input path is not a directory');
      process.exit(1);
    }
  } catch {
    log.error({ inputDir }, 'Input directory does not exist. Ensure imaginarium#distill has run first.');
    process.exit(1);
  }

  const generator = new ManifestGenerator({
    inputDir,
    outputPath,
  });

  const { manifest, entries } = await generator.generateAndWrite();

  // Summary
  const shaderCount = Object.keys(manifest.shaders).length;
  const paletteCount = Object.keys(manifest.palettes).length;
  const totalSize = entries.reduce((sum, e) => sum + e.size, 0);

  log.info({
    assets: entries.length,
    shaders: shaderCount,
    palettes: paletteCount,
    topology: manifest.topology || 'none',
    sizeKB: (totalSize / 1024).toFixed(1),
    checksum: manifest.checksum,
    outputPath,
  }, 'Manifest generated successfully');
}

main().catch((err) => {
  log.fatal(err, 'Manifest generation failed');
  process.exit(1);
});
