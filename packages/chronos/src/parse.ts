#!/usr/bin/env bun

/**
 * CHRONOS CLI — Main parse pipeline
 *
 * Usage: bun run src/parse.ts [repo-path] [output-dir] [--emit-events]
 *
 * If no repo-path is given, defaults to the current working directory.
 * Output goes to ./generated/
 */

import { resolve, join } from 'path';
import { runPipeline } from './pipeline.js';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const rawArgs = process.argv.slice(2);
const emitEvents = rawArgs.includes('--emit-events');
const positionalArgs = rawArgs.filter(a => !a.startsWith('--'));

const repoPath = resolve(positionalArgs[0] || process.cwd());
const outputDir = resolve(positionalArgs[1] || join(process.cwd(), 'generated'));

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(60));
  console.log('  CHRONOS — The Archaeologist');
  console.log('  Parsing codebase into game-ready data');
  console.log('='.repeat(60));
  console.log();
  console.log(`  Repository: ${repoPath}`);
  console.log(`  Output:     ${outputDir}`);
  console.log();

  const result = await runPipeline({
    repoPath,
    outputDir,
    emitEvents,
  });

  console.log('='.repeat(60));
  console.log('  CHRONOS Complete');
  console.log('='.repeat(60));
  console.log(`  Files parsed:     ${result.stats.fileCount}`);
  console.log(`  Commits analyzed: ${result.stats.commitCount}`);
  console.log(`  Hotspots found:   ${result.stats.hotspotCount}`);
  console.log(`  Contributors:     ${result.stats.contributorCount}`);
  console.log(`  Total time:       ${result.stats.duration.toFixed(2)}s`);
  console.log(`  Output:           ${outputDir}`);
  console.log();
}

main().catch(err => {
  console.error('CHRONOS failed:', err);
  process.exit(1);
});
