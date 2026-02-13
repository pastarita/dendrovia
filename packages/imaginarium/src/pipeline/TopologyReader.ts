/**
 * TopologyReader — reads and validates CHRONOS topology.json.
 * Falls back to MockTopology when the file is missing.
 */

import { existsSync } from 'fs';
import type { CodeTopology } from '@dendrovia/shared';
import { generateMockTopology } from './MockTopology.js';

export async function readTopology(path: string): Promise<CodeTopology> {
  if (!existsSync(path)) {
    console.warn(`[IMAGINARIUM] topology.json not found at ${path} — using mock topology`);
    return generateMockTopology();
  }

  try {
    const raw = await Bun.file(path).text();
    const data = JSON.parse(raw);

    // Basic validation
    if (!data.files || !Array.isArray(data.files)) {
      throw new Error('Invalid topology: missing "files" array');
    }
    if (!data.tree || typeof data.tree !== 'object') {
      throw new Error('Invalid topology: missing "tree" object');
    }

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
  } catch (err) {
    console.warn(`[IMAGINARIUM] Failed to read topology: ${err} — using mock`);
    return generateMockTopology();
  }
}
