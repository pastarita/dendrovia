#!/usr/bin/env bun

/**
 * CHRONOS CLI — Main parse pipeline
 *
 * Usage: bun run src/parse.ts [repo-path] [output-dir] [--emit-events] [--install] [--pretty]
 *
 * If no repo-path is given, defaults to the current working directory.
 * Output goes to ./generated/
 *
 * Flags:
 *   --install       After parsing, install output to worlds/ (runs populate-worlds)
 *   --pretty        Force pretty-printed JSON regardless of file size
 *   --emit-events   Emit game events during pipeline
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
const installToWorldsFlag = rawArgs.includes('--install');
const prettyFlag = rawArgs.includes('--pretty');
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
    pretty: prettyFlag,
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

  // --install: copy output to worlds/ directory
  if (installToWorldsFlag) {
    process.stdout.write('\n');
    const { installToWorlds } = await import('../../../scripts/populate-worlds.js');
    installToWorlds();
    log.info('Worlds installed');
  }
}

main().catch(err => {
  log.fatal(err, 'CHRONOS failed');
  process.exit(1);
});
