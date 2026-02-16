/**
 * TopologyReader — reads and validates CHRONOS topology.json.
 * Falls back to MockTopology when the file is missing (valid dev scenario).
 * Parse/validation errors throw — the pipeline should fail loud, not silent.
 */

import { existsSync } from 'fs';
import type { CodeTopology } from '@dendrovia/shared';
import { validateTopology } from '@dendrovia/shared/schemas';
import { generateMockTopology } from './MockTopology.js';

export async function readTopology(path: string): Promise<CodeTopology> {
  if (!existsSync(path)) {
    console.warn(`[IMAGINARIUM] topology.json not found at ${path} — using mock topology`);
    return generateMockTopology();
  }

  const raw = await Bun.file(path).text();
  const data = JSON.parse(raw);

  // Validate against the Zod contract — throws on invalid data
  validateTopology(data);

  // Ensure dates are Date objects
  const topology: CodeTopology = {
    files: data.files.map((f: Record<string, unknown>) => ({
      ...f,
      lastModified: new Date(f.lastModified as string),
    })),
    commits: (data.commits ?? []).map((c: Record<string, unknown>) => ({
      ...c,
      date: new Date(c.date as string),
    })),
    tree: data.tree,
    hotspots: data.hotspots ?? [],
  };

  return topology;
}
