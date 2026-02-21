#!/usr/bin/env bun

/**
 * CHRONOS Analyze CLI — Parse any public GitHub repo
 *
 * Usage:
 *   bun run analyze https://github.com/facebook/react
 *   bun run analyze facebook/react
 *   bun run analyze facebook/react ./output
 *   bun run analyze facebook/react --no-deepwiki
 *   bun run analyze .                                  # local repo
 */

import { resolve, basename, join } from 'path';
import { resolveRepo, upsertRegistryEntry, getOutputDirForRepo } from './resolver/index';
import { runPipeline } from './pipeline';
import { fetchDeepWikiEnrichment } from './enrichment/DeepWikiFetcher';
import { enrichTopology } from './enrichment/TopologyEnricher';
import { writeOutputFiles } from './builder/TopologyBuilder';
import { createLogger } from '@dendrovia/shared/logger';
import type { RegistryEntry } from './resolver/index';

const log = createLogger('CHRONOS', 'analyze');

// ── Argument parsing ─────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
const noDeepwiki = rawArgs.includes('--no-deepwiki');
const emitEvents = rawArgs.includes('--emit-events');
const positionalArgs = rawArgs.filter(a => !a.startsWith('--'));

const input = positionalArgs[0];
const outputOverride = positionalArgs[1];

if (!input) {
  log.fatal('Usage: bun run analyze <github-url-or-owner/repo> [output-dir] [--no-deepwiki] [--emit-events]');
  process.exit(1);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = performance.now();

  process.stdout.write('='.repeat(60) + '\n');
  process.stdout.write('  CHRONOS — Analyze External Repository\n');
  process.stdout.write('='.repeat(60) + '\n\n');

  // ── Step 1: Resolve repo ────────────────────────────────────────────────
  log.info('Resolving repository');
  const resolved = await resolveRepo(input);

  const isRemote = !resolved.isLocal;
  const displayName = isRemote
    ? `${resolved.owner}/${resolved.repo}`
    : basename(resolved.localPath);

  log.info({ repo: displayName, path: resolved.localPath, source: isRemote ? 'GitHub (cached)' : 'local' }, 'Repository resolved');

  // ── Step 2: Determine output directory ──────────────────────────────────
  let outputDir: string;
  if (outputOverride) {
    outputDir = resolve(outputOverride);
  } else if (isRemote) {
    outputDir = getOutputDirForRepo(resolved.owner, resolved.repo);
  } else {
    outputDir = join(resolved.localPath, 'generated');
  }

  // ── Step 3: Run pipeline ────────────────────────────────────────────────
  const result = await runPipeline({
    repoPath: resolved.localPath,
    outputDir,
    emitEvents,
  });

  // ── Step 4: DeepWiki enrichment (optional) ──────────────────────────────
  let deepwikiAvailable = false;

  if (!noDeepwiki && isRemote) {
    log.info('Fetching DeepWiki enrichment');
    try {
      const enrichment = await fetchDeepWikiEnrichment(resolved.owner, resolved.repo);
      if (enrichment) {
        const enriched = enrichTopology(result.output, enrichment);
        await writeOutputFiles(enriched, outputDir);
        deepwikiAvailable = true;
        log.info({ overview: enrichment.overview ? 'available' : 'none', topics: enrichment.topics?.length ?? 0 }, 'DeepWiki enrichment applied');
      } else {
        log.info('DeepWiki not available for this repo (skipping)');
      }
    } catch (err) {
      log.warn({ err }, 'DeepWiki fetch failed (non-fatal)');
    }
  } else if (!noDeepwiki && !isRemote) {
    log.info('DeepWiki skipped (local repos not supported)');
  } else {
    log.info('DeepWiki skipped (--no-deepwiki)');
  }

  // ── Step 5: Update registry ─────────────────────────────────────────────
  if (isRemote) {
    const entry: RegistryEntry = {
      owner: resolved.owner,
      repo: resolved.repo,
      analyzedAt: new Date().toISOString(),
      headHash: result.headHash,
      stats: {
        commitCount: result.stats.commitCount,
        fileCount: result.stats.fileCount,
        hotspotCount: result.stats.hotspotCount,
        languageCount: result.stats.languageCount,
      },
      deepwikiAvailable,
      outputDir,
      status: 'complete',
    };
    upsertRegistryEntry(entry);
    log.info('Updated ~/.chronos/registry.json');
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  const totalTime = ((performance.now() - t0) / 1000).toFixed(2);

  process.stdout.write('\n' + '='.repeat(60) + '\n');
  process.stdout.write('  CHRONOS Analysis Complete\n');
  process.stdout.write('='.repeat(60) + '\n');

  log.info({
    repository: displayName,
    filesParsed: result.stats.fileCount,
    commits: result.stats.commitCount,
    hotspots: result.stats.hotspotCount,
    contributors: result.stats.contributorCount,
    languages: result.stats.languageCount,
    deepwiki: deepwikiAvailable ? 'enriched' : 'none',
    totalTime: `${totalTime}s`,
    outputDir,
  }, 'CHRONOS analysis complete');
}

main().catch(err => {
  log.fatal(err, 'CHRONOS analyze failed');
  process.exit(1);
});
