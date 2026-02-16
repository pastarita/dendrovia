#!/usr/bin/env bun

/**
 * Populate Worlds — Copies CHRONOS data into worlds/ and generates index.json
 *
 * Reads:
 *   - ~/.chronos/registry.json for external repos
 *   - packages/chronos/generated/ for Dendrovia itself
 *
 * Writes:
 *   - worlds/{owner}/{repo}/chronos/*.json
 *   - worlds/dendrovia/chronos/*.json
 *   - worlds/index.json
 */

import { join, resolve, dirname } from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'fs';
import { homedir } from 'os';

// ── Inline path resolution (avoids workspace import issues) ─────────────────

function findMonorepoRoot(): string {
  let dir = import.meta.dir;
  for (let i = 0; i < 20; i++) {
    if (existsSync(join(dir, 'turbo.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Could not find monorepo root');
}

// ── Inline magnitude computation ────────────────────────────────────────────

type MagnitudeTier = 'hamlet' | 'village' | 'town' | 'city' | 'metropolis';

function computeWorldMagnitude(stats: {
  fileCount: number;
  commitCount: number;
  languageCount: number;
  hotspotCount: number;
}): { score: number; tier: MagnitudeTier; symbol: string } {
  const score =
    Math.min(Math.ceil(stats.fileCount / 1000), 5) +
    Math.min(Math.ceil(stats.commitCount / 50), 5) +
    Math.min(stats.languageCount, 4) +
    Math.min(Math.ceil(stats.hotspotCount / 20), 3);

  let tier: MagnitudeTier;
  let symbol: string;

  if (score <= 4) { tier = 'hamlet'; symbol = '+'; }
  else if (score <= 8) { tier = 'village'; symbol = '*'; }
  else if (score <= 12) { tier = 'town'; symbol = '**'; }
  else if (score <= 16) { tier = 'city'; symbol = '***'; }
  else { tier = 'metropolis'; symbol = '****'; }

  return { score, tier, symbol };
}

// ── Constants ────────────────────────────────────────────────────────────────

const root = findMonorepoRoot();
const worldsDir = join(root, 'worlds');
const registryPath = join(homedir(), '.chronos', 'registry.json');
const dendroviaGenerated = join(root, 'packages', 'chronos', 'generated');

const CHRONOS_FILES = [
  'topology.json',
  'commits.json',
  'complexity.json',
  'contributors.json',
  'hotspots.json',
];

// ── World definitions ────────────────────────────────────────────────────────

interface WorldDef {
  name: string;
  description: string;
  tincture: { hex: string; name: string };
  framePillar: string;
}

const EXTERNAL_WORLDS: Record<string, WorldDef> = {
  'facebook/react': {
    name: 'React',
    description: 'A JavaScript library for building user interfaces',
    tincture: { hex: '#3B82F6', name: 'Azure' },
    framePillar: 'architectus',
  },
  'anthropics/claude-code': {
    name: 'Claude Code',
    description: 'An agentic coding tool by Anthropic',
    tincture: { hex: '#A855F7', name: 'Purpure' },
    framePillar: 'imaginarium',
  },
};

const DENDROVIA_DEF = {
  slug: 'dendrovia',
  name: 'Dendrovia',
  owner: 'dendrovia',
  repo: 'dendrovia',
  description: 'Autogamification of codebase archaeologization',
  tincture: { hex: '#c77b3f', name: 'Amber' },
  framePillar: 'chronos',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function extractLanguageDistribution(topology: any): Array<{ language: string; fileCount: number; percentage: number }> {
  const files: any[] = topology.files ?? [];
  const langCounts: Record<string, number> = {};

  for (const f of files) {
    const lang = f.language ?? 'unknown';
    langCounts[lang] = (langCounts[lang] ?? 0) + 1;
  }

  const total = files.length || 1;
  return Object.entries(langCounts)
    .map(([language, fileCount]) => ({
      language: language.charAt(0).toUpperCase() + language.slice(1),
      fileCount,
      percentage: Math.round((fileCount / total) * 1000) / 10,
    }))
    .sort((a, b) => b.fileCount - a.fileCount);
}

function copyChronosData(sourceDir: string, destDir: string) {
  mkdirSync(destDir, { recursive: true });
  for (const file of CHRONOS_FILES) {
    const src = join(sourceDir, file);
    if (existsSync(src)) {
      cpSync(src, join(destDir, file));
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface WorldEntry {
  slug: string;
  name: string;
  owner: string;
  repo: string;
  description: string;
  status: 'playable' | 'analyzing' | 'pending';
  analyzedAt: string;
  headHash: string;
  stats: {
    fileCount: number;
    commitCount: number;
    hotspotCount: number;
    languageCount: number;
    contributorCount: number;
    languages: Array<{ language: string; fileCount: number; percentage: number }>;
  };
  magnitude: { score: number; tier: string; symbol: string };
  tincture: { hex: string; name: string };
  framePillar: string;
}

const worlds: WorldEntry[] = [];

console.log('Populate Worlds');
console.log('================\n');

// ── 1. External repos from registry ──────────────────────────────────────────

if (existsSync(registryPath)) {
  const registry = readJson(registryPath);
  for (const entry of registry.entries ?? []) {
    const key = `${entry.owner}/${entry.repo}`;
    const def = EXTERNAL_WORLDS[key];
    if (!def) continue;
    if (entry.status !== 'complete') continue;

    const sourceDir = entry.outputDir;
    if (!existsSync(join(sourceDir, 'topology.json'))) {
      console.warn(`  Skipping ${key}: no topology.json in ${sourceDir}`);
      continue;
    }

    const destDir = join(worldsDir, entry.owner, entry.repo, 'chronos');
    console.log(`  Copying ${key} → worlds/${entry.owner}/${entry.repo}/chronos/`);
    copyChronosData(sourceDir, destDir);

    const topology = readJson(join(sourceDir, 'topology.json'));
    const contributors = existsSync(join(sourceDir, 'contributors.json'))
      ? readJson(join(sourceDir, 'contributors.json'))
      : { contributors: [] };
    const hotspots = existsSync(join(sourceDir, 'hotspots.json'))
      ? readJson(join(sourceDir, 'hotspots.json'))
      : { hotspots: [] };

    const languages = extractLanguageDistribution(topology);
    const stats = {
      fileCount: topology.repository?.fileCount ?? topology.files?.length ?? 0,
      commitCount: topology.repository?.commitCount ?? entry.stats?.commitCount ?? 0,
      hotspotCount: hotspots.hotspots?.length ?? entry.stats?.hotspotCount ?? 0,
      languageCount: topology.repository?.languages?.length ?? languages.length,
      contributorCount: topology.repository?.contributorCount ?? contributors.contributors?.length ?? 0,
      languages,
    };

    const magnitude = computeWorldMagnitude(stats);

    worlds.push({
      slug: key,
      name: def.name,
      owner: entry.owner,
      repo: entry.repo,
      description: def.description,
      status: 'playable',
      analyzedAt: entry.analyzedAt ?? topology.analyzedAt,
      headHash: entry.headHash ?? topology.repository?.headHash ?? '',
      stats,
      magnitude,
      tincture: def.tincture,
      framePillar: def.framePillar,
    });
  }
} else {
  console.warn('  No ~/.chronos/registry.json found — skipping external repos');
}

// ── 2. Dendrovia itself ──────────────────────────────────────────────────────

if (existsSync(join(dendroviaGenerated, 'topology.json'))) {
  const destDir = join(worldsDir, 'dendrovia', 'chronos');
  console.log('  Copying dendrovia → worlds/dendrovia/chronos/');
  copyChronosData(dendroviaGenerated, destDir);

  const topology = readJson(join(dendroviaGenerated, 'topology.json'));
  const contributors = existsSync(join(dendroviaGenerated, 'contributors.json'))
    ? readJson(join(dendroviaGenerated, 'contributors.json'))
    : { contributors: [] };
  const hotspots = existsSync(join(dendroviaGenerated, 'hotspots.json'))
    ? readJson(join(dendroviaGenerated, 'hotspots.json'))
    : { hotspots: [] };

  const languages = extractLanguageDistribution(topology);
  const stats = {
    fileCount: topology.repository?.fileCount ?? topology.files?.length ?? 0,
    commitCount: topology.repository?.commitCount ?? 0,
    hotspotCount: hotspots.hotspots?.length ?? 0,
    languageCount: topology.repository?.languages?.length ?? languages.length,
    contributorCount: topology.repository?.contributorCount ?? contributors.contributors?.length ?? 0,
    languages,
  };

  const magnitude = computeWorldMagnitude(stats);

  worlds.push({
    slug: DENDROVIA_DEF.slug,
    name: DENDROVIA_DEF.name,
    owner: DENDROVIA_DEF.owner,
    repo: DENDROVIA_DEF.repo,
    description: DENDROVIA_DEF.description,
    status: 'playable',
    analyzedAt: topology.analyzedAt,
    headHash: topology.repository?.headHash ?? '',
    stats,
    magnitude,
    tincture: DENDROVIA_DEF.tincture,
    framePillar: DENDROVIA_DEF.framePillar,
  });
} else {
  console.warn('  No Dendrovia topology found at', dendroviaGenerated);
}

// ── 3. Write index.json ──────────────────────────────────────────────────────

// Sort by magnitude score descending
worlds.sort((a, b) => b.magnitude.score - a.magnitude.score);

const index = {
  version: '1.0.0',
  worlds,
};

mkdirSync(worldsDir, { recursive: true });
writeFileSync(join(worldsDir, 'index.json'), JSON.stringify(index, null, 2) + '\n');

console.log(`\n  Wrote worlds/index.json with ${worlds.length} world(s):`);
for (const w of worlds) {
  console.log(`    ${w.slug} — ${w.magnitude.tier} (score ${w.magnitude.score})`);
}
console.log('');
