/**
 * World Detail — Placeholder page for individual world exploration.
 *
 * Server Component that reads the world entry from worlds/index.json
 * and displays metadata with a "coming soon" message for the 3D experience.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { notFound } from 'next/navigation';
import { findMonorepoRoot } from '@dendrovia/shared/paths';

interface Props {
  params: Promise<{ slug: string[] }>;
}

function loadWorld(slug: string) {
  try {
    const root = findMonorepoRoot();
    const indexPath = join(root, 'worlds', 'index.json');
    const data = JSON.parse(readFileSync(indexPath, 'utf-8'));
    return (data.worlds ?? []).find((w: any) => w.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export default async function WorldDetailPage({ params }: Props) {
  const { slug } = await params;
  const worldSlug = slug.join('/');
  const world = loadWorld(worldSlug);

  if (!world) {
    notFound();
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ededed',
        fontFamily: 'var(--font-geist-sans), sans-serif',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <a
          href="/"
          style={{
            fontSize: '0.8rem',
            opacity: 0.4,
            fontFamily: 'var(--font-geist-mono), monospace',
            marginBottom: '2rem',
            display: 'inline-block',
          }}
        >
          &larr; Back to World Launcher
        </a>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: world.tincture.hex,
            marginTop: '1rem',
          }}
        >
          {world.name}
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.8rem',
            opacity: 0.4,
            marginTop: '0.25rem',
          }}
        >
          {world.owner}/{world.repo}
        </p>

        <p style={{ opacity: 0.6, marginTop: '1rem', lineHeight: 1.5 }}>
          {world.description}
        </p>

        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: '0.8rem',
            opacity: 0.5,
          }}
        >
          <span>{world.stats.fileCount.toLocaleString()} files</span>
          <span>{world.stats.commitCount} commits</span>
          <span>{world.stats.languageCount ?? world.stats.languages?.length ?? 0} languages</span>
        </div>

        <div
          style={{
            marginTop: '3rem',
            padding: '2rem',
            border: `1px solid ${world.tincture.hex}33`,
            borderRadius: '12px',
            background: `${world.tincture.hex}08`,
          }}
        >
          <p
            style={{
              fontSize: '1.1rem',
              fontWeight: 600,
              color: world.tincture.hex,
            }}
          >
            Coming Soon
          </p>
          <p
            style={{
              fontSize: '0.85rem',
              opacity: 0.5,
              marginTop: '0.5rem',
            }}
          >
            3D world experience is under construction.
          </p>
        </div>
      </div>
    </main>
  );
}
