/**
 * /worlds — World Library
 *
 * Server Component that loads worlds/index.json and passes the data
 * to the interactive WorldLibrary client component.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { findMonorepoRoot } from '@dendrovia/shared/paths';
import { WorldLibrary } from './WorldLibrary';

export interface WorldEntry {
  slug: string;
  name: string;
  owner: string;
  repo: string;
  description: string;
  status: 'playable' | 'analyzing' | 'pending';
  stats: {
    fileCount: number;
    commitCount: number;
    hotspotCount: number;
    contributorCount: number;
    languages: Array<{ language: string; fileCount: number; percentage: number }>;
  };
  magnitude: { score: number; tier: string; symbol: string };
  tincture: { hex: string; name: string };
  framePillar: string;
}

function loadWorlds(): WorldEntry[] {
  try {
    const root = findMonorepoRoot();
    const indexPath = join(root, 'worlds', 'index.json');
    const data = JSON.parse(readFileSync(indexPath, 'utf-8'));
    return data.worlds ?? [];
  } catch {
    return [];
  }
}

export default function WorldsPage() {
  const worlds = loadWorlds();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div className="shader-bg" />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1.5rem',
        }}
      >
        <WorldLibrary worlds={worlds} />
      </div>
    </div>
  );
}
