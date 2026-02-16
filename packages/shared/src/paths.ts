/**
 * Unified Generated Paths
 *
 * Centralized path resolution for all generated artifact directories.
 * Finds the monorepo root by walking up from a starting directory
 * looking for turbo.json (the monorepo-unique marker).
 *
 * Consumers import from '@dendrovia/shared/paths' instead of
 * hardcoding relative traversals like '../../chronos/generated'.
 */

import { join, dirname } from 'path';
import { existsSync } from 'fs';

let cachedRoot: string | null = null;

/**
 * Find the monorepo root by walking up from `from` looking for turbo.json.
 * Result is cached after the first successful call.
 *
 * @param from - Starting directory (defaults to process.cwd())
 * @throws if turbo.json is not found in any ancestor directory
 */
export function findMonorepoRoot(from?: string): string {
  if (cachedRoot) return cachedRoot;

  let dir = from ?? process.cwd();

  // Walk up at most 20 levels to avoid infinite loops on weird filesystems
  for (let i = 0; i < 20; i++) {
    if (existsSync(join(dir, 'turbo.json'))) {
      cachedRoot = dir;
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break; // hit filesystem root
    dir = parent;
  }

  throw new Error(
    `Could not find monorepo root (turbo.json) starting from "${from ?? process.cwd()}". ` +
    'Ensure you are running from within the Dendrovia monorepo.',
  );
}

/**
 * Canonical path to CHRONOS generated/ directory.
 */
export function chronosGenerated(from?: string): string {
  return join(findMonorepoRoot(from), 'packages', 'chronos', 'generated');
}

/**
 * Canonical path to IMAGINARIUM generated/ directory.
 */
export function imaginariumGenerated(from?: string): string {
  return join(findMonorepoRoot(from), 'packages', 'imaginarium', 'generated');
}

/**
 * Canonical path to the monorepo-level generated/ directory.
 */
export function monorepoGenerated(from?: string): string {
  return join(findMonorepoRoot(from), 'generated');
}
