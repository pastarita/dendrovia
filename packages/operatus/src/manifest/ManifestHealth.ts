/**
 * Manifest Health — Runtime and build-time manifest validation
 *
 * Provides structural validation of loaded manifests and
 * optional disk-state verification for build pipelines.
 */

import type { AssetManifest } from '@dendrovia/shared';

export interface ManifestHealthReport {
  valid: boolean;
  entryCount: number;
  totalSizeBytes: number;
  checksumValid: boolean;
  generatedAt: string;
  stalenessDays: number;
  errors: string[];
}

/**
 * Validate a loaded manifest structure (no disk access).
 * Suitable for runtime use in the browser.
 */
export function validateManifestStructure(manifest: AssetManifest): ManifestHealthReport {
  const errors: string[] = [];
  let entryCount = 0;

  // Version check
  if (!manifest.version) {
    errors.push('Missing version field');
  }

  // Checksum check
  const checksumValid = typeof manifest.checksum === 'string' && manifest.checksum.length > 0;
  if (!checksumValid) {
    errors.push('Missing or empty checksum');
  }

  // Count entries
  const shaderCount = Object.keys(manifest.shaders ?? {}).length;
  const paletteCount = Object.keys(manifest.palettes ?? {}).length;
  const meshCount = Object.keys(manifest.meshes ?? {}).length;
  const hasTopology = typeof manifest.topology === 'string' && manifest.topology.length > 0;

  entryCount = shaderCount + paletteCount + meshCount + (hasTopology ? 1 : 0);

  if (entryCount === 0) {
    errors.push('Manifest contains no asset entries');
  }

  if (!hasTopology) {
    errors.push('Missing topology path');
  }

  // Calculate staleness from version (format: YYYY-MM-DD or semver)
  let generatedAt = '';
  let stalenessDays = 0;
  const dateMatch = manifest.version?.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    generatedAt = dateMatch[1];
    const generated = new Date(dateMatch[1]);
    const now = new Date();
    stalenessDays = Math.floor((now.getTime() - generated.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    generatedAt = manifest.version ?? 'unknown';
  }

  // Mesh entry validation
  if (manifest.meshes) {
    for (const [id, entry] of Object.entries(manifest.meshes)) {
      if (!entry.path) {
        errors.push(`Mesh entry '${id}' missing path`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    entryCount,
    totalSizeBytes: 0, // Cannot determine without disk access
    checksumValid,
    generatedAt,
    stalenessDays,
    errors,
  };
}

/**
 * Verify disk state matches manifest (build-time only, requires Node APIs).
 */
export async function validateManifestOnDisk(
  manifestPath: string,
  inputDir: string,
): Promise<ManifestHealthReport> {
  const { readFile, stat } = await import('node:fs/promises');
  const { join } = await import('node:path');

  const errors: string[] = [];
  let totalSizeBytes = 0;

  // Load manifest
  let manifest: AssetManifest;
  try {
    const raw = await readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(raw) as AssetManifest;
  } catch (err) {
    return {
      valid: false,
      entryCount: 0,
      totalSizeBytes: 0,
      checksumValid: false,
      generatedAt: 'unknown',
      stalenessDays: 0,
      errors: [`Failed to read manifest: ${err}`],
    };
  }

  // First validate structure
  const structureReport = validateManifestStructure(manifest);
  errors.push(...structureReport.errors);

  // Then verify files on disk
  const allPaths = [
    ...Object.values(manifest.shaders ?? {}),
    ...Object.values(manifest.palettes ?? {}),
    ...(manifest.topology ? [manifest.topology] : []),
    ...Object.values(manifest.meshes ?? {}).map((e) => e.path),
  ];

  for (const path of allPaths) {
    try {
      const fullPath = join(inputDir, path);
      const s = await stat(fullPath);
      totalSizeBytes += s.size;
    } catch {
      errors.push(`Missing file: ${path}`);
    }
  }

  return {
    ...structureReport,
    valid: errors.length === 0,
    totalSizeBytes,
    errors,
  };
}
