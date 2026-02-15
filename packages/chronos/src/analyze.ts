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
import { resolveRepo, upsertRegistryEntry, getOutputDirForRepo } from './resolver/index.js';
import { runPipeline } from './pipeline.js';
import { fetchDeepWikiEnrichment } from './enrichment/DeepWikiFetcher.js';
import { enrichTopology } from './enrichment/TopologyEnricher.js';
import { writeOutputFiles } from './builder/TopologyBuilder.js';
import type { RegistryEntry } from './resolver/index.js';

// ── Argument parsing ─────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
const noDeepwiki = rawArgs.includes('--no-deepwiki');
const emitEvents = rawArgs.includes('--emit-events');
const positionalArgs = rawArgs.filter(a => !a.startsWith('--'));

const input = positionalArgs[0];
const outputOverride = positionalArgs[1];

if (!input) {
  console.error('Usage: bun run analyze <github-url-or-owner/repo> [output-dir] [--no-deepwiki] [--emit-events]');
  process.exit(1);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const t0 = performance.now();

  console.log('='.repeat(60));
  console.log('  CHRONOS — Analyze External Repository');
  console.log('='.repeat(60));
  console.log();

  // ── Step 1: Resolve repo ────────────────────────────────────────────────
  console.log('[resolve] Resolving repository...');
  const resolved = await resolveRepo(input);

  const isRemote = !resolved.isLocal;
  const displayName = isRemote
    ? `${resolved.owner}/${resolved.repo}`
    : basename(resolved.localPath);

  console.log(`  Repo:   ${displayName}`);
  console.log(`  Path:   ${resolved.localPath}`);
  console.log(`  Source: ${isRemote ? 'GitHub (cached)' : 'local'}`);
  console.log();

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
    console.log('[deepwiki] Fetching DeepWiki enrichment...');
    try {
      const enrichment = await fetchDeepWikiEnrichment(resolved.owner, resolved.repo);
      if (enrichment) {
        const enriched = enrichTopology(result.output, enrichment);
        // Re-write output files with enriched data
        await writeOutputFiles(enriched, outputDir);
        deepwikiAvailable = true;
        console.log(`  Overview: ${enrichment.overview ? 'available' : 'none'}`);
        console.log(`  Topics:   ${enrichment.topics?.length ?? 0}`);
        console.log();
      } else {
        console.log('  Not available for this repo (skipping)\n');
      }
    } catch (err) {
      console.log(`  DeepWiki fetch failed (non-fatal): ${err instanceof Error ? err.message : err}\n`);
    }
  } else if (!noDeepwiki && !isRemote) {
    console.log('[deepwiki] Skipped (local repos not supported)\n');
  } else {
    console.log('[deepwiki] Skipped (--no-deepwiki)\n');
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
    console.log('[registry] Updated ~/.chronos/registry.json');
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  const totalTime = ((performance.now() - t0) / 1000).toFixed(2);

  console.log();
  console.log('='.repeat(60));
  console.log('  CHRONOS Analysis Complete');
  console.log('='.repeat(60));
  console.log(`  Repository:     ${displayName}`);
  console.log(`  Files parsed:   ${result.stats.fileCount}`);
  console.log(`  Commits:        ${result.stats.commitCount}`);
  console.log(`  Hotspots:       ${result.stats.hotspotCount}`);
  console.log(`  Contributors:   ${result.stats.contributorCount}`);
  console.log(`  Languages:      ${result.stats.languageCount}`);
  console.log(`  DeepWiki:       ${deepwikiAvailable ? 'enriched' : 'none'}`);
  console.log(`  Total time:     ${totalTime}s`);
  console.log(`  Output:         ${outputDir}`);
  console.log();
}

main().catch(err => {
  console.error('CHRONOS analyze failed:', err);
  process.exit(1);
});
