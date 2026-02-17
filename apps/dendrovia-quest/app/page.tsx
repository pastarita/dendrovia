/**
 * DENDROVIA QUEST — Home Page (Server Component)
 *
 * Thin server wrapper that loads worlds/index.json and passes data
 * to the HomePortal client component.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { findMonorepoRoot } from '@dendrovia/shared/paths';
import { HomePortal } from './components/HomePortal';
import type { WorldEntry } from './lib/design-tokens';

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
  return <HomePortal worlds={worlds} />;
}
