/**
 * GitParser — Hybrid git history extraction
 *
 * Uses Bun.spawn for bulk `git log --numstat` (fast), with isomorphic-git
 * available for targeted tree walks when needed.
 */

import type { ParsedCommit, RepositoryMetadata } from '@dendrovia/shared';
import { classifyCommit, commitFlags } from '../classifier/CommitClassifier.js';
import { basename } from 'path';

// Sentinel separating fields within a single commit record
const FIELD_SEP = '|||';
// Sentinel separating commits from each other
const RECORD_SEP = '<<<COMMIT>>>';

const LOG_FORMAT = [
  '%H',   // hash
  '%P',   // parent hashes (space-separated)
  '%an',  // author name
  '%ae',  // author email
  '%at',  // author timestamp (unix)
  '%s',   // subject
  '%b',   // body
].join(FIELD_SEP);

export interface GitParserOptions {
  /** Maximum number of commits to retrieve. 0 = unlimited. */
  maxCommits?: number;
  /** Only include commits after this date. */
  since?: Date;
  /** Only include commits before this date. */
  until?: Date;
  /** Branch or ref to start from. Defaults to HEAD. */
  ref?: string;
}

export interface RawCommit {
  hash: string;
  parentHashes: string[];
  authorName: string;
  authorEmail: string;
  timestamp: number;
  subject: string;
  body: string;
  filesChanged: string[];
  insertions: number;
  deletions: number;
}

/**
 * Parse the full git history of a repository using native git CLI via Bun.spawn.
 */
export async function parseGitHistory(
  repoPath: string,
  opts: GitParserOptions = {},
): Promise<ParsedCommit[]> {
  const raw = await extractRawCommits(repoPath, opts);
  return raw.map(toCommit);
}

/**
 * Extract raw commit data from git log --numstat.
 */
export async function extractRawCommits(
  repoPath: string,
  opts: GitParserOptions = {},
): Promise<RawCommit[]> {
  const args = [
    'log',
    `--format=${RECORD_SEP}${LOG_FORMAT}`,
    '--numstat',
  ];

  if (opts.maxCommits && opts.maxCommits > 0) {
    args.push(`-n`, `${opts.maxCommits}`);
  }
  if (opts.since) {
    args.push(`--since=${opts.since.toISOString()}`);
  }
  if (opts.until) {
    args.push(`--until=${opts.until.toISOString()}`);
  }
  if (opts.ref) {
    args.push(opts.ref);
  }

  const proc = Bun.spawn(['git', ...args], {
    cwd: repoPath,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`git log failed (exit ${exitCode}): ${stderr.trim()}`);
  }

  return parseLogOutput(stdout);
}

function parseLogOutput(output: string): RawCommit[] {
  const records = output.split(RECORD_SEP).filter(r => r.trim());
  const commits: RawCommit[] = [];

  for (const record of records) {
    const commit = parseRecord(record);
    if (commit) commits.push(commit);
  }

  return commits;
}

function parseRecord(record: string): RawCommit | null {
  const lines = record.trim().split('\n');
  if (lines.length === 0) return null;

  // First line contains the formatted fields
  const headerLine = lines[0];
  const fields = headerLine.split(FIELD_SEP);
  if (fields.length < 6) return null;

  const [hash, parents, authorName, authorEmail, timestampStr, subject, ...bodyParts] = fields;

  // Remaining lines after header are numstat entries (after an empty line)
  let insertions = 0;
  let deletions = 0;
  const filesChanged: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // numstat format: <insertions>\t<deletions>\t<filename>
    const numstatMatch = /^(\d+|-)\t(\d+|-)\t(.+)$/.exec(line);
    if (numstatMatch) {
      const ins = numstatMatch[1] === '-' ? 0 : parseInt(numstatMatch[1], 10);
      const del = numstatMatch[2] === '-' ? 0 : parseInt(numstatMatch[2], 10);
      const file = numstatMatch[3];

      insertions += ins;
      deletions += del;

      // Handle renames: "old => new" or "{old => new}/path"
      const renameMatch = /\{?(.+?)\s*=>\s*(.+?)\}?/.exec(file);
      if (renameMatch) {
        filesChanged.push(file.replace(/\{.+?\s*=>\s*(.+?)\}/, '$1').replace(/\s*=>\s*/, ''));
      } else {
        filesChanged.push(file);
      }
    }
  }

  return {
    hash: hash.trim(),
    parentHashes: parents.trim() ? parents.trim().split(' ') : [],
    authorName: authorName.trim(),
    authorEmail: authorEmail.trim(),
    timestamp: parseInt(timestampStr.trim(), 10),
    subject: subject.trim(),
    body: bodyParts.join(FIELD_SEP).trim(),
    filesChanged,
    insertions,
    deletions,
  };
}

function toCommit(raw: RawCommit): ParsedCommit {
  const fullMessage = raw.body ? `${raw.subject}\n\n${raw.body}` : raw.subject;
  const classified = classifyCommit(fullMessage);
  const flags = commitFlags(classified);

  return {
    hash: raw.hash,
    message: raw.subject,
    author: raw.authorName,
    date: new Date(raw.timestamp * 1000),
    filesChanged: raw.filesChanged,
    insertions: raw.insertions,
    deletions: raw.deletions,
    isBugFix: flags.isBugFix,
    isFeature: flags.isFeature,
    isMerge: raw.parentHashes.length > 1 || flags.isMerge,
    type: classified.type,
    scope: classified.scope,
    isBreaking: classified.isBreaking,
    confidence: classified.confidence,
  };
}

/**
 * Get the list of tracked files at HEAD.
 */
export async function listFilesAtHead(repoPath: string): Promise<string[]> {
  const proc = Bun.spawn(['git', 'ls-files'], {
    cwd: repoPath,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error('git ls-files failed');
  }

  return stdout.trim().split('\n').filter(Boolean).map(unquoteGitPath);
}

/**
 * Git quotes paths containing special characters by wrapping them in
 * double quotes with octal escapes (e.g. \342\200\223 for an en-dash).
 * Strip the quotes and decode the octal sequences back to UTF-8 bytes.
 */
function unquoteGitPath(path: string): string {
  if (!path.startsWith('"') || !path.endsWith('"')) return path;

  // Strip surrounding quotes
  const inner = path.slice(1, -1);

  // Replace octal escape sequences (\NNN) with the corresponding byte
  const bytes: number[] = [];
  let i = 0;
  while (i < inner.length) {
    if (inner[i] === '\\' && i + 3 < inner.length && /^[0-7]{3}$/.test(inner.slice(i + 1, i + 4))) {
      bytes.push(parseInt(inner.slice(i + 1, i + 4), 8));
      i += 4;
    } else if (inner[i] === '\\' && i + 1 < inner.length) {
      // Handle standard escapes: \\ \" \n \t
      const esc = inner[i + 1];
      if (esc === '\\') bytes.push(0x5c);
      else if (esc === '"') bytes.push(0x22);
      else if (esc === 'n') bytes.push(0x0a);
      else if (esc === 't') bytes.push(0x09);
      else bytes.push(inner.charCodeAt(i + 1));
      i += 2;
    } else {
      // Regular ASCII char — push its byte value
      bytes.push(inner.charCodeAt(i));
      i += 1;
    }
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Get the HEAD commit hash (used for caching).
 */
export async function getHeadHash(repoPath: string): Promise<string> {
  const proc = Bun.spawn(['git', 'rev-parse', 'HEAD'], {
    cwd: repoPath,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error('git rev-parse HEAD failed');
  }

  return stdout.trim();
}

/**
 * Get per-file commit counts (churn) in a single pass.
 */
export async function getFileChurnCounts(
  repoPath: string,
  opts: { since?: Date } = {},
): Promise<Map<string, number>> {
  const args = ['log', '--name-only', '--format='];
  if (opts.since) {
    args.push(`--since=${opts.since.toISOString()}`);
  }

  const proc = Bun.spawn(['git', ...args], {
    cwd: repoPath,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error('git log --name-only failed');
  }

  const counts = new Map<string, number>();
  for (const line of stdout.split('\n')) {
    const file = line.trim();
    if (file) {
      counts.set(file, (counts.get(file) || 0) + 1);
    }
  }

  return counts;
}

/**
 * Extract repository metadata using git CLI.
 */
export async function extractRepositoryMetadata(
  repoPath: string,
  opts: { headHash?: string; fileCount?: number; commitCount?: number; contributorCount?: number; languages?: string[] } = {},
): Promise<RepositoryMetadata> {
  const spawn = (args: string[]) =>
    Bun.spawn(['git', ...args], { cwd: repoPath, stdout: 'pipe', stderr: 'pipe' });

  // Run git commands in parallel
  const [remoteProc, branchProc, branchListProc] = [
    spawn(['remote', 'get-url', 'origin']),
    spawn(['branch', '--show-current']),
    spawn(['branch', '-a']),
  ];

  const [remoteOut, branchOut, branchListOut] = await Promise.all([
    new Response(remoteProc.stdout).text(),
    new Response(branchProc.stdout).text(),
    new Response(branchListProc.stdout).text(),
  ]);

  await Promise.all([remoteProc.exited, branchProc.exited, branchListProc.exited]);

  const remoteUrl = remoteOut.trim() || 'unknown';
  const currentBranch = branchOut.trim() || 'unknown';
  const branchCount = branchListOut.trim().split('\n').filter(l => l.trim()).length;

  return {
    name: basename(repoPath),
    remoteUrl,
    currentBranch,
    branchCount,
    fileCount: opts.fileCount ?? 0,
    commitCount: opts.commitCount ?? 0,
    contributorCount: opts.contributorCount ?? 0,
    languages: opts.languages ?? [],
    analyzedAt: new Date().toISOString(),
    headHash: opts.headHash ?? '',
  };
}
