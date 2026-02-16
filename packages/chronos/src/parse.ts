#!/usr/bin/env bun

/**
 * CHRONOS CLI — Main parse pipeline
 *
 * Usage: bun run src/parse.ts [repo-path] [output-dir] [--emit-events]
 *
 * If no repo-path is given, defaults to the current working directory.
 * Output goes to ./generated/
 */

import { resolve } from 'path';
import { runPipeline } from './pipeline.js';
import { chronosGenerated } from '@dendrovia/shared/paths';
import { createLogger } from '@dendrovia/shared/logger';

const log = createLogger('CHRONOS', 'parse');

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const rawArgs = process.argv.slice(2);
const emitEvents = rawArgs.includes('--emit-events');
const positionalArgs = rawArgs.filter(a => !a.startsWith('--'));

const repoPath = resolve(positionalArgs[0] || process.cwd());
const outputDir = positionalArgs[1] ? resolve(positionalArgs[1]) : chronosGenerated();

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  process.stdout.write('='.repeat(60) + '\n');
  process.stdout.write('  CHRONOS — The Archaeologist\n');
  process.stdout.write('  Parsing codebase into game-ready data\n');
  process.stdout.write('='.repeat(60) + '\n\n');

  log.info({ repoPath, outputDir }, 'Starting CHRONOS parse');

  const result = await runPipeline({
    repoPath,
    outputDir,
    emitEvents,
  });

  process.stdout.write('='.repeat(60) + '\n');
  process.stdout.write('  CHRONOS Complete\n');
  process.stdout.write('='.repeat(60) + '\n');

  log.info({
    filesParsed: result.stats.fileCount,
    commitsAnalyzed: result.stats.commitCount,
    hotspotsFound: result.stats.hotspotCount,
    contributors: result.stats.contributorCount,
    totalTime: `${result.stats.duration.toFixed(2)}s`,
    outputDir,
  }, 'CHRONOS parse complete');
}

main().catch(err => {
  log.fatal(err, 'CHRONOS failed');
  process.exit(1);
});
