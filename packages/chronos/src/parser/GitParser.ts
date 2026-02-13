/**
 * GitParser — Hybrid git history extraction
 *
 * Uses Bun.spawn for bulk `git log --numstat` (fast), with isomorphic-git
 * available for targeted tree walks when needed.
 */

import type { ParsedCommit } from '@dendrovia/shared';
import { classifyCommit, commitFlags } from '../classifier/CommitClassifier.js';

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

  return stdout.trim().split('\n').filter(Boolean);
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
