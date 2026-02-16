/**
 * World Detail — Mounts the full DendroviaQuest 3D experience.
 *
 * Server Component that reads the world entry from worlds/index.json,
 * then renders the WorldExplorer client wrapper with the appropriate
 * topology and manifest paths routed through the API.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { notFound } from 'next/navigation';
import { findMonorepoRoot } from '@dendrovia/shared/paths';
import { WorldExplorer } from './WorldExplorer';

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

  const topologyPath = `/api/worlds/${worldSlug}/chronos/topology.json`;
  const manifestPath = `/api/worlds/${worldSlug}/imaginarium/manifest.json`;

  return (
    <WorldExplorer
      slug={worldSlug}
      topologyPath={topologyPath}
      manifestPath={manifestPath}
      worldMeta={{
        name: world.name,
        owner: world.owner,
        repo: world.repo,
        description: world.description,
        tincture: world.tincture,
      }}
    />
  );
}
