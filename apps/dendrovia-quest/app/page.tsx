/**
 * DENDROVIA QUEST — Home Page
 *
 * Server Component that loads worlds/index.json and renders:
 * 1. Header with title
 * 2. Repo URL input (non-functional shell)
 * 3. Compact world entry cards
 * 4. Footer
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { findMonorepoRoot } from '@dendrovia/shared/paths';
import { WorldCardCompact } from './components/WorldCardCompact';

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
      <header style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '2rem' }}>
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
          Explore codebases as 3D worlds
        </p>
      </header>

      {/* Repo URL input (shell — non-functional) */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          marginBottom: '2.5rem',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          placeholder="Paste a GitHub URL or local path..."
          disabled
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #333',
            background: '#141414',
            color: '#ededed',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.8rem',
            outline: 'none',
            opacity: 0.5,
          }}
        />
        <button
          disabled
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: '1px solid #333',
            background: '#1a1a1a',
            color: '#ededed',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'default',
            opacity: 0.35,
          }}
        >
          Analyze
        </button>
      </div>

      {/* World cards */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
          maxWidth: '560px',
        }}
      >
        {worlds.map((world, i) => (
          <WorldCardCompact
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

      {/* Browse World Library link */}
      {worlds.length > 0 && (
        <a
          href="/worlds"
          className="browse-worlds-link"
          style={{
            marginTop: '1.5rem',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-geist-mono), monospace',
            color: 'var(--oculus-amber, #c77b3f)',
            opacity: 0.6,
            transition: 'opacity 150ms',
          }}
        >
          Browse World Library &rarr;
        </a>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: '3rem',
          opacity: 0.2,
          fontSize: '0.65rem',
          textAlign: 'center',
          fontFamily: 'var(--font-geist-mono), monospace',
        }}
      >
        Six-Pillar Architecture
      </footer>
    </main>
  );
}
