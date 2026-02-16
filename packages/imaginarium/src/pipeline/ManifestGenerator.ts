/**
 * ManifestGenerator — collects artifact paths and writes manifest.json.
 */

import { basename } from 'path';
import type { AssetManifest, SDFShader, ProceduralPalette, MeshManifestEntry } from '@dendrovia/shared';
import { hashString } from '../utils/hash.js';

export interface ManifestInput {
  shaders: Array<{ id: string; path: string }>;
  palettes: Array<{ id: string; path: string }>;
  topologyPath: string;
  topologyHash?: string;
  noisePath?: string;
  lsystemPath?: string;
  mycology?: {
    specimens: string;
    network: string;
    assetDir: string;
    specimenCount: number;
  };
  meshes?: Record<string, MeshManifestEntry>;
  storyArc?: {
    arc: string;
    segmentAssets: string;
    segmentCount: number;
  };
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

  // Content-based checksum: includes paths, topology hash, and asset counts
  const checksumParts = [
    ...input.shaders.map(s => s.path),
    ...input.palettes.map(p => p.path),
    input.noisePath ?? '',
    input.lsystemPath ?? '',
    input.topologyHash ?? '',
    `mycology:${input.mycology?.specimenCount ?? 0}`,
    `meshes:${input.meshes ? Object.keys(input.meshes).length : 0}`,
    `segments:${input.storyArc?.segmentCount ?? 0}`,
  ].filter(Boolean);

  const checksum = hashString(checksumParts.sort().join(':'));

  const manifest: AssetManifest = {
    version: '1.0.0',
    shaders,
    palettes,
    topology: basename(input.topologyPath),
    checksum,
  };

  if (input.noisePath) {
    manifest.noise = input.noisePath;
  }

  if (input.lsystemPath) {
    manifest.lsystem = input.lsystemPath;
  }

  if (input.mycology) {
    manifest.mycology = input.mycology;
  }

  if (input.meshes && Object.keys(input.meshes).length > 0) {
    manifest.meshes = input.meshes;
  }

  if (input.storyArc) {
    manifest.storyArc = input.storyArc;
  }

  return manifest;
}
