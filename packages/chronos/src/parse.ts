#!/usr/bin/env bun

/**
 * CHRONOS CLI — Main parse pipeline
 *
 * Usage: bun run src/parse.ts [repo-path]
 *
 * If no repo-path is given, defaults to the current working directory.
 * Output goes to ./generated/
 */

import { resolve, join, basename } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { parseGitHistory, listFilesAtHead, getHeadHash, getFileChurnCounts, extractRepositoryMetadata } from './parser/GitParser.js';
import { parseFiles, buildStubFile, canParse, detectLanguage } from './parser/ASTParser.js';
import { detectHotspots } from './analyzer/HotspotDetector.js';
import { profileContributors } from './builder/ContributorProfiler.js';
import { buildFileTree, countFiles, countDirectories } from './builder/TreeBuilder.js';
import { buildTopology, writeOutputFiles } from './builder/TopologyBuilder.js';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import type { ParsedFile } from '@dendrovia/shared';
import type { FunctionComplexity } from './analyzer/ComplexityAnalyzer.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Separate named flags from positional args
const rawArgs = process.argv.slice(2);
const emitEvents = rawArgs.includes('--emit-events');
const positionalArgs = rawArgs.filter(a => !a.startsWith('--'));

const repoPath = resolve(positionalArgs[0] || process.cwd());
const outputDir = resolve(positionalArgs[1] || join(process.cwd(), 'generated'));

// Files/dirs to skip during AST parsing
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git\//,
  /dist\//,
  /build\//,
  /coverage\//,
  /\.next\//,
  /\.turbo\//,
  /\.cache\//,
  /generated\//,
  /\.min\.(js|css)$/,
  /\.d\.ts$/,
  /lock(file)?\.json$/i,
  /package-lock\.json$/,
  /bun\.lockb$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
];

function shouldIgnore(path: string): boolean {
  return IGNORE_PATTERNS.some(p => p.test(path));
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

async function main() {
  const t0 = performance.now();

  console.log('='.repeat(60));
  console.log('  CHRONOS — The Archaeologist');
  console.log('  Parsing codebase into game-ready data');
  console.log('='.repeat(60));
  console.log();
  console.log(`  Repository: ${repoPath}`);
  console.log(`  Output:     ${outputDir}`);
  console.log();

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // ── Step 1: Git metadata ──────────────────────────────────────────────
  const t1 = performance.now();
  console.log('[1/6] Extracting git history...');

  const headHash = await getHeadHash(repoPath);
  console.log(`  HEAD: ${headHash.slice(0, 8)}`);

  const commits = await parseGitHistory(repoPath);
  console.log(`  ${commits.length} commits parsed`);

  // Extract unique languages from commits will happen after AST parsing;
  // pre-fetch repo metadata (remote, branch info)
  const repoMetaBase = await extractRepositoryMetadata(repoPath, { headHash });
  console.log(`  Branch: ${repoMetaBase.currentBranch} (${repoMetaBase.branchCount} branches)`);

  const elapsed1 = ((performance.now() - t1) / 1000).toFixed(2);
  console.log(`  Done in ${elapsed1}s\n`);

  // ── Step 2: File inventory ────────────────────────────────────────────
  const t2 = performance.now();
  console.log('[2/6] Building file inventory...');

  const allFiles = await listFilesAtHead(repoPath);
  const relevantFiles = allFiles.filter(f => !shouldIgnore(f));
  console.log(`  ${allFiles.length} tracked files, ${relevantFiles.length} after filtering`);

  const elapsed2 = ((performance.now() - t2) / 1000).toFixed(2);
  console.log(`  Done in ${elapsed2}s\n`);

  // ── Step 3: AST parsing ───────────────────────────────────────────────
  const t3 = performance.now();
  console.log('[3/6] Parsing code structure (AST)...');

  const parseableFiles = relevantFiles.filter(f => canParse(f));
  const nonParseableFiles = relevantFiles.filter(f => !canParse(f));
  console.log(`  ${parseableFiles.length} parseable (TS/JS), ${nonParseableFiles.length} other`);

  const astResults = parseFiles(
    parseableFiles.map(f => join(repoPath, f)),
    repoPath,
  );

  // Build stub files for non-parseable files
  const stubFiles: ParsedFile[] = nonParseableFiles.map(f =>
    buildStubFile(f, repoPath),
  );

  const allParsedFiles: ParsedFile[] = [
    ...astResults.map(r => r.file),
    ...stubFiles,
  ];

  // Build function complexity map keyed by file path
  const functionsByFile = new Map<string, FunctionComplexity[]>();
  let totalFunctions = 0;
  for (const result of astResults) {
    if (result.functions.length > 0) {
      functionsByFile.set(result.file.path, result.functions);
      totalFunctions += result.functions.length;
    }
  }

  console.log(`  ${astResults.length} files AST-parsed, ${totalFunctions} functions analyzed`);

  const elapsed3 = ((performance.now() - t3) / 1000).toFixed(2);
  console.log(`  Done in ${elapsed3}s\n`);

  // Emit parse-complete event when --emit-events is active
  if (emitEvents) {
    await getEventBus().emit(GameEvents.PARSE_COMPLETE, { files: allParsedFiles });
  }

  // ── Step 4: Hotspot detection ─────────────────────────────────────────
  const t4 = performance.now();
  console.log('[4/6] Detecting hotspots...');

  const { hotspots, temporalCouplings } = detectHotspots(allParsedFiles, commits);

  const dangerZones = hotspots.filter(h => h.riskScore > 0.5).length;
  console.log(`  ${hotspots.length} hotspots ranked, ${dangerZones} in danger zone (risk > 0.5)`);
  console.log(`  ${temporalCouplings.length} temporal couplings detected`);

  const elapsed4 = ((performance.now() - t4) / 1000).toFixed(2);
  console.log(`  Done in ${elapsed4}s\n`);

  // ── Step 5: Contributor profiling ─────────────────────────────────────
  const t5 = performance.now();
  console.log('[5/6] Profiling contributors...');

  const contributors = profileContributors(commits);

  for (const c of contributors.slice(0, 5)) {
    console.log(`  ${c.name}: ${c.archetype} (${c.commitCount} commits)`);
  }
  if (contributors.length > 5) {
    console.log(`  ... and ${contributors.length - 5} more`);
  }

  const elapsed5 = ((performance.now() - t5) / 1000).toFixed(2);
  console.log(`  Done in ${elapsed5}s\n`);

  // ── Step 6: Assembly & output ─────────────────────────────────────────
  const t6 = performance.now();
  console.log('[6/6] Assembling topology...');

  const tree = buildFileTree(allParsedFiles, basename(repoPath));
  console.log(`  Tree: ${countFiles(tree)} files in ${countDirectories(tree)} directories`);

  // Finalize repository metadata with counts from the pipeline
  const uniqueLanguages = [...new Set(allParsedFiles.map(f => f.language))].sort();
  const uniqueContributors = new Set(commits.map(c => c.author)).size;
  const repositoryMetadata = {
    ...repoMetaBase,
    fileCount: allParsedFiles.length,
    commitCount: commits.length,
    contributorCount: uniqueContributors,
    languages: uniqueLanguages,
  };

  const output = buildTopology({
    files: allParsedFiles,
    commits,
    tree,
    hotspots,
    temporalCouplings,
    functionsByFile,
    contributors,
    repository: repoPath,
    repositoryMetadata,
    headHash,
  });

  const writtenFiles = await writeOutputFiles(output, outputDir);
  for (const f of writtenFiles) {
    const size = (Bun.file(f).size / 1024).toFixed(1);
    console.log(`  Wrote ${basename(f)} (${size} KB)`);
  }

  const elapsed6 = ((performance.now() - t6) / 1000).toFixed(2);
  console.log(`  Done in ${elapsed6}s\n`);

  // Emit topology-generated event when --emit-events is active
  if (emitEvents) {
    await getEventBus().emit(GameEvents.TOPOLOGY_GENERATED, {
      topology: output.topology,
      tree,
      hotspots,
    });
  }

  // ── Summary ───────────────────────────────────────────────────────────
  const totalTime = ((performance.now() - t0) / 1000).toFixed(2);
  console.log('='.repeat(60));
  console.log('  CHRONOS Complete');
  console.log('='.repeat(60));
  console.log(`  Files parsed:     ${allParsedFiles.length}`);
  console.log(`  Commits analyzed: ${commits.length}`);
  console.log(`  Hotspots found:   ${hotspots.length}`);
  console.log(`  Contributors:     ${contributors.length}`);
  console.log(`  Total time:       ${totalTime}s`);
  console.log(`  Output:           ${outputDir}`);
  console.log();

  // Write state file for cache invalidation
  await Bun.write(
    join(outputDir, '.chronos-state'),
    JSON.stringify({
      head: headHash,
      timestamp: new Date().toISOString(),
      files: allParsedFiles.length,
      commits: commits.length,
    }),
  );
}

main().catch(err => {
  console.error('CHRONOS failed:', err);
  process.exit(1);
});
