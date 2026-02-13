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

import { resolve, dirname } from 'path';
import { stat } from 'fs/promises';
import { ManifestGenerator } from './ManifestGenerator.js';

// ── Resolve Paths ───────────────────────────────────────────────

const PACKAGE_ROOT = resolve(dirname(import.meta.dir), '..');
const IMAGINARIUM_GENERATED = resolve(PACKAGE_ROOT, '..', 'imaginarium', 'generated');

function parseArgs(): { inputDir: string; outputPath: string } {
  const args = process.argv.slice(2);
  let inputDir = IMAGINARIUM_GENERATED;
  let outputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && args[i + 1]) {
      inputDir = resolve(args[++i]);
    } else if (args[i] === '--output' && args[i + 1]) {
      outputPath = resolve(args[++i]);
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

  console.log('[OPERATUS] Manifest generation starting...');
  console.log(`  Input:  ${inputDir}`);
  console.log(`  Output: ${outputPath}`);

  // Verify the input directory exists
  try {
    const dirStat = await stat(inputDir);
    if (!dirStat.isDirectory()) {
      console.error(`[OPERATUS] Error: "${inputDir}" is not a directory.`);
      process.exit(1);
    }
  } catch {
    console.error(`[OPERATUS] Error: Input directory "${inputDir}" does not exist.`);
    console.error('  Ensure imaginarium#distill has run first.');
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

  console.log('[OPERATUS] Manifest generated successfully.');
  console.log(`  Assets:   ${entries.length}`);
  console.log(`  Shaders:  ${shaderCount}`);
  console.log(`  Palettes: ${paletteCount}`);
  console.log(`  Topology: ${manifest.topology || 'none'}`);
  console.log(`  Size:     ${(totalSize / 1024).toFixed(1)} KB total`);
  console.log(`  Checksum: ${manifest.checksum}`);
  console.log(`  Written:  ${outputPath}`);
}

main().catch((err) => {
  console.error('[OPERATUS] Manifest generation failed:', err);
  process.exit(1);
});
