/**
 * World Detail — Mounts the full DendroviaQuest 3D experience.
 *
 * Server Component that reads the world entry from worlds/index.json,
 * extracts the character class from the ?class query param, then renders
 * the WorldExplorer client wrapper.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { notFound } from 'next/navigation';
import { findMonorepoRoot } from '@dendrovia/shared/paths';
import { WorldExplorer } from './WorldExplorer';
import type { CharacterClass } from '@dendrovia/shared';

interface Props {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ class?: string }>;
}

const VALID_CLASSES = new Set<string>(['dps', 'tank', 'healer']);

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

export default async function WorldDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { class: classParam } = await searchParams;
  const worldSlug = slug.join('/');
  const world = loadWorld(worldSlug);

  if (!world) {
    notFound();
  }

  const characterClass: CharacterClass = (
    classParam && VALID_CLASSES.has(classParam) ? classParam : 'dps'
  ) as CharacterClass;

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
      characterClass={characterClass}
    />
  );
}
