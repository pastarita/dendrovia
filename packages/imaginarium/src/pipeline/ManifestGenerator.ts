/**
 * ManifestGenerator — collects artifact paths and writes manifest.json.
 */

import type { AssetManifest, SDFShader, ProceduralPalette } from '@dendrovia/shared';
import { hashString } from '../utils/hash.js';

export interface ManifestInput {
  shaders: Array<{ id: string; path: string }>;
  palettes: Array<{ id: string; path: string }>;
  topologyPath: string;
  noisePath?: string;
  lsystemPath?: string;
}

export function generateManifest(input: ManifestInput): AssetManifest {
  const shaders: Record<string, string> = {};
  for (const s of input.shaders) {
    shaders[s.id] = s.path;
  }

  const palettes: Record<string, string> = {};
  for (const p of input.palettes) {
    palettes[p.id] = p.path;
  }

  // Compute overall checksum from all artifact paths
  const allPaths = [
    ...input.shaders.map(s => s.path),
    ...input.palettes.map(p => p.path),
    input.topologyPath,
    input.noisePath ?? '',
    input.lsystemPath ?? '',
  ].filter(Boolean);

  const checksum = hashString(allPaths.sort().join(':'));

  return {
    version: '1.0.0',
    shaders,
    palettes,
    topology: input.topologyPath,
    checksum,
  };
}
