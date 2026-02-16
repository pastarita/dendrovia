/**
 * DENDROVIA QUEST — World Launcher
 *
 * Server Component that loads worlds/index.json and renders a gallery
 * of analyzed codebases, each a playable world. Below the worlds,
 * the six-pillar dev server launcher provides access to playground apps.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { findMonorepoRoot } from '@dendrovia/shared/paths';
import { WorldCard } from './components/WorldCard';
import { PillarLauncher } from './components/PillarLauncher';

interface WorldEntry {
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

export default function Home() {
  const worlds = loadWorlds();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--background, #0a0a0a)',
        color: 'var(--foreground, #ededed)',
        fontFamily: 'var(--font-geist-sans), sans-serif',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '2rem' }}>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            fontFamily: 'var(--font-geist-mono), monospace',
            margin: 0,
          }}
        >
          DENDROVIA
        </h1>
        <p style={{ opacity: 0.5, marginTop: '0.5rem', fontSize: '0.95rem' }}>
          Choose Your World
        </p>
      </header>

      {/* Worlds */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          width: '100%',
          maxWidth: '740px',
        }}
      >
        {worlds.map((world, i) => (
          <WorldCard
            key={world.slug}
            slug={world.slug}
            name={world.name}
            owner={world.owner}
            repo={world.repo}
            description={world.description}
            status={world.status}
            stats={world.stats}
            magnitude={world.magnitude}
            tincture={world.tincture}
            framePillar={world.framePillar}
            index={i}
          />
        ))}
        {worlds.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              opacity: 0.4,
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.85rem',
            }}
          >
            No worlds analyzed yet. Run: bun run scripts/populate-worlds.ts
          </div>
        )}
      </section>

      {/* Divider */}
      <div
        style={{
          width: '100%',
          maxWidth: '740px',
          borderTop: '1px solid #222',
          marginTop: '2.5rem',
          marginBottom: '2rem',
          position: 'relative',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '-0.7em',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--background, #0a0a0a)',
            padding: '0 1rem',
            fontSize: '0.7rem',
            opacity: 0.4,
            whiteSpace: 'nowrap',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
        >
          Pillar Servers
        </span>
      </div>

      {/* Pillar Launcher */}
      <section style={{ width: '100%', maxWidth: '740px' }}>
        <PillarLauncher />
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: '3rem',
          opacity: 0.25,
          fontSize: '0.7rem',
          textAlign: 'center',
          fontFamily: 'var(--font-geist-mono), monospace',
        }}
      >
        Six-Pillar Architecture &middot; SDF + Hex Hybrid
      </footer>
    </main>
  );
}
