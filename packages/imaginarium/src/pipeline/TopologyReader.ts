/**
 * TopologyReader — reads and validates CHRONOS topology.json.
 * Falls back to MockTopology when the file is missing (valid dev scenario).
 * Parse/validation errors throw — the pipeline should fail loud, not silent.
 *
 * Loads commits from commits.json and hotspots from hotspots.json (standalone
 * files) when present. Falls back to embedded arrays in topology.json for
 * backwards compatibility with older CHRONOS output.
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import type { CodeTopology } from '@dendrovia/shared';
import { validateTopology } from '@dendrovia/shared/schemas';
import { createLogger } from '@dendrovia/shared/logger';
import { generateMockTopology } from './MockTopology';

const log = createLogger('IMAGINARIUM', 'topology-reader');

export async function readTopology(path: string): Promise<CodeTopology> {
  if (!existsSync(path)) {
    log.warn({ path }, 'topology.json not found — using mock topology');
    return generateMockTopology();
  }

  const raw = await Bun.file(path).text();
  const data = JSON.parse(raw);

  // Validate against the Zod contract — throws on invalid data
  validateTopology(data);

  const topologyDir = dirname(path);

  // Load commits: prefer standalone commits.json, fall back to embedded
  let commits = data.commits ?? [];
  if (commits.length === 0) {
    const commitsPath = join(topologyDir, 'commits.json');
    if (existsSync(commitsPath)) {
      const commitsRaw = await Bun.file(commitsPath).text();
      const commitsData = JSON.parse(commitsRaw);
      // Support both envelope format { commits: [...] } and bare array
      commits = Array.isArray(commitsData) ? commitsData : (commitsData.commits ?? []);
      log.info({ count: commits.length }, 'Commits loaded from commits.json');
    }
  }

  // Load hotspots: prefer standalone hotspots.json, fall back to embedded
  let hotspots = data.hotspots ?? [];
  if (hotspots.length === 0) {
    const hotspotsPath = join(topologyDir, 'hotspots.json');
    if (existsSync(hotspotsPath)) {
      const hotspotsRaw = await Bun.file(hotspotsPath).text();
      const hotspotsData = JSON.parse(hotspotsRaw);
      hotspots = hotspotsData.hotspots ?? [];
      log.info({ count: hotspots.length }, 'Hotspots loaded from hotspots.json');
    }
  }

  // Ensure dates are Date objects
  const topology: CodeTopology = {
    files: data.files.map((f: Record<string, unknown>) => ({
      ...f,
      lastModified: new Date(f.lastModified as string),
    })),
    commits: commits.map((c: Record<string, unknown>) => ({
      ...c,
      date: new Date(c.date as string),
    })),
    tree: data.tree,
    hotspots,
  };

  return topology;
}
