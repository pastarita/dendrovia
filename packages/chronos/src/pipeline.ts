/**
 * CHRONOS Pipeline — Reusable 6-step codebase parsing pipeline
 *
 * Extracted from parse.ts so it can be invoked programmatically
 * by analyze.ts (external repos) or any other entry point.
 */

import { join, basename } from 'path';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { parseGitHistory, listFilesAtHead, getHeadHash, getFileAuthors, extractRepositoryMetadata } from './parser/GitParser.js';
import { parseFiles, buildStubFile, canParse } from './parser/ASTParser.js';
import { detectHotspots } from './analyzer/HotspotDetector.js';
import { profileContributors } from './builder/ContributorProfiler.js';
import { buildFileTree, countFiles, countDirectories } from './builder/TreeBuilder.js';
import { buildTopology, writeOutputFiles } from './builder/TopologyBuilder.js';
import { getEventBus, GameEvents } from '@dendrovia/shared';
import { createLogger } from '@dendrovia/shared/logger';
import type { ParsedFile } from '@dendrovia/shared';
import type { FunctionComplexity } from './analyzer/ComplexityAnalyzer.js';
import type { TopologyOutput, WriteOptions } from './builder/TopologyBuilder.js';

// ── Default ignore patterns ─────────────────────────────────────────────────

const DEFAULT_IGNORE_PATTERNS = [
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

// ── Manifest types ──────────────────────────────────────────────────────────

const PIPELINE_VERSION = '1.0.0';
const MANIFEST_FILENAME = '.chronos-manifest.json';

interface ManifestStats {
  files: number;
  commits: number;
  hotspots: number;
  contributors: number;
  languages: number;
}

interface ManifestDelta {
  newCommits: number;
  filesAdded: string[];
  filesRemoved: string[];
  statsChange: Record<string, string>;
}

interface ManifestChecksums {
  topology: string;
  commits: string;
  complexity: string;
  hotspots: string;
  contributors: string;
}

export interface ChronosManifest {
  head: string;
  previousHead: string;
  timestamp: string;
  pipelineVersion: string;
  stats: ManifestStats;
  delta: ManifestDelta;
  checksums: ManifestChecksums;
}

// ── Public types ─────────────────────────────────────────────────────────────

export interface PipelineOptions {
  repoPath: string;
  outputDir: string;
  ignorePatterns?: RegExp[];
  emitEvents?: boolean;
  /** If true, suppress console output */
  silent?: boolean;
  /** Force pretty-printed JSON regardless of file size */
  pretty?: boolean;
}

export interface PipelineResult {
  output: TopologyOutput;
  writtenFiles: string[];
  headHash: string;
  stats: {
    commitCount: number;
    fileCount: number;
    hotspotCount: number;
    contributorCount: number;
    languageCount: number;
    duration: number;
  };
}

const log = createLogger('CHRONOS', 'pipeline');

// ── Helpers ──────────────────────────────────────────────────────────────────

async function computeFileChecksum(path: string): Promise<string> {
  if (!existsSync(path)) return '';
  const content = await Bun.file(path).arrayBuffer();
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(new Uint8Array(content));
  return `sha256:${hasher.digest('hex').slice(0, 16)}`;
}

function loadPreviousManifest(outputDir: string): ChronosManifest | null {
  const manifestPath = join(outputDir, MANIFEST_FILENAME);
  if (!existsSync(manifestPath)) {
    // Also check legacy .chronos-state
    const legacyPath = join(outputDir, '.chronos-state');
    if (existsSync(legacyPath)) {
      try {
        const legacy = JSON.parse(readFileSync(legacyPath, 'utf-8'));
        return {
          head: legacy.head ?? '',
          previousHead: '',
          timestamp: legacy.timestamp ?? '',
          pipelineVersion: '0.0.0',
          stats: {
            files: legacy.files ?? 0,
            commits: legacy.commits ?? 0,
            hotspots: 0,
            contributors: 0,
            languages: 0,
          },
          delta: { newCommits: 0, filesAdded: [], filesRemoved: [], statsChange: {} },
          checksums: { topology: '', commits: '', complexity: '', hotspots: '', contributors: '' },
        };
      } catch { return null; }
    }
    return null;
  }
  try {
    return JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch { return null; }
}

function computeDelta(
  prev: ChronosManifest | null,
  currentStats: ManifestStats,
  prevFiles: string[],
  currentFiles: string[],
): ManifestDelta {
  if (!prev) {
    return {
      newCommits: currentStats.commits,
      filesAdded: currentFiles,
      filesRemoved: [],
      statsChange: {
        files: `+${currentStats.files}`,
        commits: `+${currentStats.commits}`,
      },
    };
  }

  const prevFileSet = new Set(prevFiles);
  const currentFileSet = new Set(currentFiles);

  const filesAdded = currentFiles.filter(f => !prevFileSet.has(f));
  const filesRemoved = prevFiles.filter(f => !currentFileSet.has(f));

  const fileDiff = currentStats.files - prev.stats.files;
  const commitDiff = currentStats.commits - prev.stats.commits;

  return {
    newCommits: Math.max(0, commitDiff),
    filesAdded,
    filesRemoved,
    statsChange: {
      files: fileDiff >= 0 ? `+${fileDiff}` : `${fileDiff}`,
      commits: commitDiff >= 0 ? `+${commitDiff}` : `${commitDiff}`,
    },
  };
}

// ── Pipeline ─────────────────────────────────────────────────────────────────

export async function runPipeline(options: PipelineOptions): Promise<PipelineResult> {
  const {
    repoPath,
    outputDir,
    ignorePatterns = DEFAULT_IGNORE_PATTERNS,
    emitEvents = false,
    silent = false,
    pretty = false,
  } = options;

  const savedLevel = log.level;
  if (silent) log.level = 'silent';

  const t0 = performance.now();

  function shouldIgnore(path: string): boolean {
    return ignorePatterns.some(p => p.test(path));
  }

  // Ensure output directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Load previous manifest for delta computation
  const previousManifest = loadPreviousManifest(outputDir);

  // ── Step 1: Git metadata ────────────────────────────────────────────────
  const t1 = performance.now();
  log.info({ step: '1/6' }, 'Extracting git history');

  const headHash = await getHeadHash(repoPath);
  log.info({ head: headHash.slice(0, 8) }, 'HEAD resolved');

  const commits = await parseGitHistory(repoPath);
  log.info({ commits: commits.length }, 'Commits parsed');

  const repoMetaBase = await extractRepositoryMetadata(repoPath, { headHash });
  log.info({ branch: repoMetaBase.currentBranch, branchCount: repoMetaBase.branchCount }, 'Branch info');

  const elapsed1 = ((performance.now() - t1) / 1000).toFixed(2);
  log.info({ step: '1/6', elapsed: elapsed1 }, 'Git metadata complete');

  // ── Step 2: File inventory ──────────────────────────────────────────────
  const t2 = performance.now();
  log.info({ step: '2/6' }, 'Building file inventory');

  const allFiles = await listFilesAtHead(repoPath);
  const relevantFiles = allFiles.filter(f => !shouldIgnore(f));
  log.info({ total: allFiles.length, filtered: relevantFiles.length }, 'File inventory built');

  const elapsed2 = ((performance.now() - t2) / 1000).toFixed(2);
  log.info({ step: '2/6', elapsed: elapsed2 }, 'File inventory complete');

  // ── Step 3: AST parsing ─────────────────────────────────────────────────
  const t3 = performance.now();
  log.info({ step: '3/6' }, 'Parsing code structure (AST)');

  const parseableFiles = relevantFiles.filter(f => canParse(f));
  const nonParseableFiles = relevantFiles.filter(f => !canParse(f));
  log.info({ parseable: parseableFiles.length, other: nonParseableFiles.length }, 'File categorization');

  const astResults = parseFiles(
    parseableFiles.map(f => join(repoPath, f)),
    repoPath,
  );

  const stubFiles: ParsedFile[] = nonParseableFiles.map(f =>
    buildStubFile(f, repoPath),
  );

  const allParsedFiles: ParsedFile[] = [
    ...astResults.map(r => r.file),
    ...stubFiles,
  ];

  const functionsByFile = new Map<string, FunctionComplexity[]>();
  let totalFunctions = 0;
  for (const result of astResults) {
    if (result.functions.length > 0) {
      functionsByFile.set(result.file.path, result.functions);
      totalFunctions += result.functions.length;
    }
  }

  log.info({ astParsed: astResults.length, functions: totalFunctions }, 'AST parsing done');

  // ── Step 3.5: Enrich file authors ──────────────────────────────────────
  const fileAuthors = await getFileAuthors(repoPath);
  let authorHits = 0;
  for (const pf of allParsedFiles) {
    const author = fileAuthors.get(pf.path);
    if (author) {
      pf.author = author;
      authorHits++;
    }
  }
  log.info({ enriched: authorHits, total: allParsedFiles.length }, 'File authors enriched');

  const elapsed3 = ((performance.now() - t3) / 1000).toFixed(2);
  log.info({ step: '3/6', elapsed: elapsed3 }, 'AST parsing complete');

  if (emitEvents) {
    await getEventBus().emit(GameEvents.PARSE_COMPLETE, { files: allParsedFiles });
  }

  // ── Step 4: Hotspot detection ───────────────────────────────────────────
  const t4 = performance.now();
  log.info({ step: '4/6' }, 'Detecting hotspots');

  const { hotspots, temporalCouplings } = detectHotspots(allParsedFiles, commits);

  const dangerZones = hotspots.filter(h => h.riskScore > 0.5).length;
  log.info({ hotspots: hotspots.length, dangerZones, temporalCouplings: temporalCouplings.length }, 'Hotspots detected');

  const elapsed4 = ((performance.now() - t4) / 1000).toFixed(2);
  log.info({ step: '4/6', elapsed: elapsed4 }, 'Hotspot detection complete');

  // ── Step 5: Contributor profiling ───────────────────────────────────────
  const t5 = performance.now();
  log.info({ step: '5/6' }, 'Profiling contributors');

  const contributors = profileContributors(commits);

  for (const c of contributors.slice(0, 5)) {
    log.info({ contributor: c.name, archetype: c.archetype, commits: c.commitCount }, 'Contributor profiled');
  }
  if (contributors.length > 5) {
    log.info({ remaining: contributors.length - 5 }, 'Additional contributors');
  }

  const elapsed5 = ((performance.now() - t5) / 1000).toFixed(2);
  log.info({ step: '5/6', elapsed: elapsed5 }, 'Contributor profiling complete');

  // ── Step 6: Assembly & output ───────────────────────────────────────────
  const t6 = performance.now();
  log.info({ step: '6/6' }, 'Assembling topology');

  const tree = buildFileTree(allParsedFiles, basename(repoPath));
  log.info({ files: countFiles(tree), directories: countDirectories(tree) }, 'File tree built');

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

  const writeOptions: WriteOptions = { pretty };
  const writtenFiles = await writeOutputFiles(output, outputDir, writeOptions);

  for (const f of writtenFiles) {
    const size = (Bun.file(f).size / 1024).toFixed(1);
    log.info({ file: basename(f), sizeKB: size }, 'Output written');
  }

  const elapsed6 = ((performance.now() - t6) / 1000).toFixed(2);
  log.info({ step: '6/6', elapsed: elapsed6 }, 'Assembly complete');

  if (emitEvents) {
    await getEventBus().emit(GameEvents.TOPOLOGY_GENERATED, {
      topology: output.topology,
      tree,
      hotspots,
    });
  }

  // ── Write .chronos-manifest.json with delta tracking ────────────────────

  const currentStats: ManifestStats = {
    files: allParsedFiles.length,
    commits: commits.length,
    hotspots: hotspots.length,
    contributors: contributors.length,
    languages: uniqueLanguages.length,
  };

  // Gather file paths for delta computation
  const previousFilePaths = previousManifest
    ? (previousManifest as any)._filePaths ?? []
    : [];
  const currentFilePaths = allParsedFiles.map(f => f.path);

  const delta = computeDelta(previousManifest, currentStats, previousFilePaths, currentFilePaths);

  // Compute checksums of output files
  const checksums: ManifestChecksums = {
    topology: await computeFileChecksum(join(outputDir, 'topology.json')),
    commits: await computeFileChecksum(join(outputDir, 'commits.json')),
    complexity: await computeFileChecksum(join(outputDir, 'complexity.json')),
    hotspots: await computeFileChecksum(join(outputDir, 'hotspots.json')),
    contributors: await computeFileChecksum(join(outputDir, 'contributors.json')),
  };

  const manifest: ChronosManifest & { _filePaths: string[] } = {
    head: headHash,
    previousHead: previousManifest?.head ?? '',
    timestamp: new Date().toISOString(),
    pipelineVersion: PIPELINE_VERSION,
    stats: currentStats,
    delta,
    checksums,
    // Stored for next run's delta computation (not part of public interface)
    _filePaths: currentFilePaths,
  };

  await Bun.write(
    join(outputDir, MANIFEST_FILENAME),
    JSON.stringify(manifest, null, 2),
  );

  // Log delta summary
  log.info({
    head: headHash.slice(0, 8),
    previousHead: (previousManifest?.head ?? '').slice(0, 8) || '(none)',
    files: currentStats.files,
    commits: currentStats.commits,
    hotspots: currentStats.hotspots,
    newCommits: delta.newCommits,
    filesAdded: delta.filesAdded.length,
    filesRemoved: delta.filesRemoved.length,
    filesChange: delta.statsChange.files,
    commitsChange: delta.statsChange.commits,
  }, 'Delta summary');

  const duration = (performance.now() - t0) / 1000;

  log.level = savedLevel;

  return {
    output,
    writtenFiles,
    headHash,
    stats: {
      commitCount: commits.length,
      fileCount: allParsedFiles.length,
      hotspotCount: hotspots.length,
      contributorCount: contributors.length,
      languageCount: uniqueLanguages.length,
      duration,
    },
  };
}
