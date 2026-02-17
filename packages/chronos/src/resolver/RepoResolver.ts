/**
 * RepoResolver — Parse GitHub URLs, clone/cache repos, manage registry
 *
 * Supports:
 *   - https://github.com/owner/repo
 *   - https://github.com/owner/repo.git
 *   - git@github.com:owner/repo.git
 *   - owner/repo  (shorthand)
 *   - Local paths  (passthrough)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ResolvedRepo {
  owner: string;
  repo: string;
  localPath: string;
  remoteUrl: string;
  clonedFresh: boolean;
  isLocal: boolean;
}

export interface RegistryEntry {
  owner: string;
  repo: string;
  analyzedAt: string;
  headHash: string;
  stats: {
    commitCount: number;
    fileCount: number;
    hotspotCount: number;
    languageCount: number;
  };
  deepwikiAvailable: boolean;
  outputDir: string;
  status: 'complete' | 'failed' | 'in-progress';
}

export interface Registry {
  version: string;
  entries: RegistryEntry[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const CHRONOS_HOME = join(homedir(), '.chronos');
const REPOS_DIR = join(CHRONOS_HOME, 'repos');
const GENERATED_DIR = join(CHRONOS_HOME, 'generated');
const REGISTRY_PATH = join(CHRONOS_HOME, 'registry.json');
const CLONE_DEPTH = 100;

// ── URL parsing ──────────────────────────────────────────────────────────────

interface ParsedGitHub {
  owner: string;
  repo: string;
}

function parseGitHubUrl(input: string): ParsedGitHub | null {
  // HTTPS: https://github.com/owner/repo or https://github.com/owner/repo.git
  const httpsMatch = input.match(/^https?:\/\/github\.com\/([^/]+)\/([^/.]+?)(?:\.git)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // SSH: git@github.com:owner/repo.git
  const sshMatch = input.match(/^git@github\.com:([^/]+)\/([^/.]+?)(?:\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // Shorthand: owner/repo (no slashes beyond the one separator, no dots before it)
  const shortMatch = input.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2] };
  }

  return null;
}

function isLocalPath(input: string): boolean {
  // Starts with / or ./ or ../ or ~ — treat as local path
  if (/^[/.~]/.test(input)) return true;
  // Contains no slash at all — could be a directory name
  if (!input.includes('/')) return existsSync(resolve(input));
  return false;
}

// ── Clone / fetch ────────────────────────────────────────────────────────────

async function runGit(args: string[], cwd?: string): Promise<{ stdout: string; exitCode: number }> {
  const proc = Bun.spawn(['git', ...args], {
    cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  return { stdout: stdout.trim(), exitCode };
}

async function cloneRepo(remoteUrl: string, localPath: string): Promise<void> {
  mkdirSync(localPath, { recursive: true });

  const { exitCode } = await runGit(['clone', '--depth', String(CLONE_DEPTH), remoteUrl, localPath]);

  if (exitCode !== 0) {
    throw new Error(`Failed to clone ${remoteUrl} (exit code ${exitCode})`);
  }
}

async function refreshRepo(localPath: string): Promise<boolean> {
  // Fetch latest from origin
  const fetchResult = await runGit(['fetch', 'origin'], localPath);
  if (fetchResult.exitCode !== 0) return false;

  // Check if we're behind
  const localHead = await runGit(['rev-parse', 'HEAD'], localPath);
  const remoteHead = await runGit(['rev-parse', 'FETCH_HEAD'], localPath);

  if (localHead.stdout === remoteHead.stdout) {
    return false; // Already up-to-date
  }

  // Reset to match remote
  await runGit(['reset', '--hard', 'FETCH_HEAD'], localPath);
  return true;
}

async function _getRemoteHeadHash(remoteUrl: string): Promise<string | null> {
  const { stdout, exitCode } = await runGit(['ls-remote', remoteUrl, 'HEAD']);
  if (exitCode !== 0) return null;
  return stdout.split('\t')[0] || null;
}

// ── Registry management ──────────────────────────────────────────────────────

export function getChronosHome(): string {
  return CHRONOS_HOME;
}

export function getReposDir(): string {
  return REPOS_DIR;
}

export function getGeneratedDir(): string {
  return GENERATED_DIR;
}

export function getOutputDirForRepo(owner: string, repo: string): string {
  return join(GENERATED_DIR, owner, repo);
}

export function loadRegistry(): Registry {
  if (!existsSync(REGISTRY_PATH)) {
    return { version: '1.0.0', entries: [] };
  }
  try {
    const raw = readFileSync(REGISTRY_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { version: '1.0.0', entries: [] };
  }
}

export function saveRegistry(registry: Registry): void {
  mkdirSync(CHRONOS_HOME, { recursive: true });
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

export function upsertRegistryEntry(entry: RegistryEntry): void {
  const registry = loadRegistry();
  const idx = registry.entries.findIndex((e) => e.owner === entry.owner && e.repo === entry.repo);
  if (idx >= 0) {
    registry.entries[idx] = entry;
  } else {
    registry.entries.push(entry);
  }
  saveRegistry(registry);
}

// ── Main resolver ────────────────────────────────────────────────────────────

export async function resolveRepo(input: string): Promise<ResolvedRepo> {
  // 1. Check if local path
  if (isLocalPath(input)) {
    const localPath = resolve(input);
    if (!existsSync(localPath)) {
      throw new Error(`Local path does not exist: ${localPath}`);
    }
    return {
      owner: '',
      repo: '',
      localPath,
      remoteUrl: '',
      clonedFresh: false,
      isLocal: true,
    };
  }

  // 2. Parse GitHub URL/shorthand
  const parsed = parseGitHubUrl(input);
  if (!parsed) {
    throw new Error(
      `Cannot parse input: "${input}"\n` +
        `Expected: GitHub URL (https://github.com/owner/repo), SSH URL, owner/repo shorthand, or local path`,
    );
  }

  const { owner, repo } = parsed;
  const remoteUrl = `https://github.com/${owner}/${repo}.git`;
  const localPath = join(REPOS_DIR, owner, repo);

  // 3. Clone or refresh
  let clonedFresh: boolean;

  if (existsSync(join(localPath, '.git'))) {
    // Repo already cloned — check if refresh is needed
    console.log(`  Cache hit: ${owner}/${repo}`);
    const refreshed = await refreshRepo(localPath);
    clonedFresh = refreshed;
    if (refreshed) {
      console.log(`  Refreshed to latest HEAD`);
    } else {
      console.log(`  Already up-to-date`);
    }
  } else {
    // Fresh clone
    console.log(`  Cloning ${owner}/${repo} (depth ${CLONE_DEPTH})...`);
    await cloneRepo(remoteUrl, localPath);
    clonedFresh = true;
    console.log(`  Cloned to ${localPath}`);
  }

  return {
    owner,
    repo,
    localPath,
    remoteUrl,
    clonedFresh,
    isLocal: false,
  };
}
