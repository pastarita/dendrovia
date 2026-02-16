/**
 * DENDROVIA QUEST — Landing Page
 *
 * Server Component. Hero section with DendriteIcon, tagline, description,
 * pillar dots. ComingSoonInput. World gallery. Footer.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { findMonorepoRoot } from '@dendrovia/shared/paths';
import { WorldCardCompact } from '../components/WorldCardCompact';
import { DendriteIcon } from '../components/DendriteIcon';
import { ComingSoonInput } from '../components/ComingSoonInput';

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

const PILLAR_COLORS = ['#c77b3f', '#6b7280', '#A855F7', '#3B82F6', '#EF4444', '#22C55E'];

export default function Home() {
  const worlds = loadWorlds();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'var(--font-geist-sans), sans-serif',
        color: 'var(--foreground, #ededed)',
        padding: '1rem 0',
      }}
    >
      {/* Hero section */}
      <section
        className="oculus-stagger"
        style={{
          textAlign: 'center',
          marginBottom: '2rem',
          marginTop: '1.5rem',
          maxWidth: '560px',
        }}
      >
        <div><DendriteIcon size={56} /></div>
        <h1
          style={{
            fontSize: '2.2rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            fontFamily: 'var(--font-geist-mono), monospace',
            margin: '0.75rem 0 0.25rem',
          }}
        >
          DENDROVIA
        </h1>
        <p
          style={{
            fontSize: '0.95rem',
            opacity: 0.5,
            fontStyle: 'italic',
            marginBottom: '0.75rem',
          }}
        >
          &ldquo;Every codebase tells a story&rdquo;
        </p>
        <p
          style={{
            fontSize: '0.85rem',
            opacity: 0.4,
            lineHeight: 1.6,
            maxWidth: '440px',
            margin: '0 auto',
          }}
        >
          Transform git repositories into explorable 3D forests.
          Files become branches, commits become quests, and the
          most volatile code glows with danger.
        </p>
        {/* Pillar dots */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            justifyContent: 'center',
            marginTop: '1rem',
          }}
        >
          {PILLAR_COLORS.map((c) => (
            <div
              key={c}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: c,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      </section>

      {/* Coming Soon input */}
      <ComingSoonInput />

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
        {worlds.length > 0 && (
          <h2
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: 0.4,
              fontFamily: 'var(--font-geist-mono), monospace',
              marginBottom: '0.25rem',
            }}
          >
            Available Worlds
          </h2>
        )}
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
              opacity: 0.35,
              fontFamily: 'var(--font-geist-mono), monospace',
              fontSize: '0.82rem',
              lineHeight: 1.6,
            }}
          >
            No worlds grown yet. Worlds appear here once analyzed.
          </div>
        )}
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: '3rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '4px',
            justifyContent: 'center',
            marginBottom: '0.5rem',
          }}
        >
          {PILLAR_COLORS.map((c) => (
            <div
              key={c}
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: c,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
        <div
          style={{
            opacity: 0.2,
            fontSize: '0.6rem',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
        >
          Autogamification of Codebase Archaeologization
        </div>
      </footer>
    </div>
  );
}
