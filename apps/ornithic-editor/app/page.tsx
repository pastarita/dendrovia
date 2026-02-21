/**
 * Ornithic Editor — Home Page (Server Component)
 *
 * Loads worlds from the monorepo worlds/index.json at build time,
 * with a local fallback copy for standalone Vercel deployments.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { ClientApp } from "./components/ClientApp";

export interface WorldEntry {
  slug: string;
  name: string;
  owner: string;
  repo: string;
  description: string;
  status: "playable" | "analyzing" | "pending";
  analyzedAt: string;
  stats: {
    fileCount: number;
    commitCount: number;
    hotspotCount: number;
    contributorCount: number;
    languages: Array<{
      language: string;
      fileCount: number;
      percentage: number;
    }>;
  };
  magnitude: { score: number; tier: string; symbol: string };
  tincture: { hex: string; name: string };
  framePillar: string;
}

function loadWorlds(): WorldEntry[] {
  // Strategy 1: Read from monorepo root worlds/index.json
  try {
    let dir = process.cwd();
    for (let i = 0; i < 10; i++) {
      const candidate = join(dir, "worlds", "index.json");
      try {
        const data = JSON.parse(readFileSync(candidate, "utf-8"));
        if (data.worlds) return data.worlds;
      } catch { /* try parent */ }

      const turboCheck = join(dir, "turbo.json");
      try {
        readFileSync(turboCheck);
        // Found monorepo root but no worlds — fall through
        break;
      } catch { /* keep walking */ }

      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch { /* fall through to local copy */ }

  // Strategy 2: Local bundled copy (for Vercel / standalone)
  try {
    const localPath = join(process.cwd(), "app", "data", "worlds.json");
    const data = JSON.parse(readFileSync(localPath, "utf-8"));
    return data.worlds ?? [];
  } catch {
    return [];
  }
}

export default function Home() {
  const worlds = loadWorlds();
  return <ClientApp worlds={worlds} />;
}
