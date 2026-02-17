/**
 * ManifestGenerator — collects artifact paths and writes manifest.json.
 */

import { basename } from 'path';
import type { AssetManifest, SDFShader, ProceduralPalette, MeshManifestEntry, ChunkedManifest, SegmentChunkPaths } from '@dendrovia/shared';
import { hashString } from '../utils/hash';

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

/**
 * Input for generating a slim chunked manifest (~5KB instead of 4.7MB).
 * Mesh entries are extracted to a separate mesh-index.json.
 */
export interface ChunkedManifestInput {
  shaders: Array<{ id: string; path: string }>;
  palettes: Array<{ id: string; path: string }>;
  topologyHash: string;
  noisePath?: string;
  lsystemPath?: string;
  worldIndexPath: string;
  meshIndexPath?: string;
  segments: Record<string, SegmentChunkPaths>;
  storyArc?: {
    arc: string;
    segmentCount: number;
  };
  mycologyNetwork?: string;
}

/**
 * Generate a slim chunked manifest that references per-segment files
 * and world-index.json instead of embedding monolithic data.
 */
export function generateChunkedManifest(input: ChunkedManifestInput): ChunkedManifest {
  const shaders: Record<string, string> = {};
  for (const s of input.shaders) {
    shaders[s.id] = s.path;
  }

  const palettes: Record<string, string> = {};
  for (const p of input.palettes) {
    palettes[p.id] = p.path;
  }

  const checksumParts = [
    ...input.shaders.map(s => s.path),
    ...input.palettes.map(p => p.path),
    input.noisePath ?? '',
    input.lsystemPath ?? '',
    input.topologyHash,
    `world-index:${input.worldIndexPath}`,
    `segments:${Object.keys(input.segments).length}`,
  ].filter(Boolean);

  const checksum = hashString(checksumParts.sort().join(':'));

  const manifest: ChunkedManifest = {
    version: '2.0.0',
    shaders,
    palettes,
    checksum,
    worldIndex: input.worldIndexPath,
    segments: input.segments,
  };

  if (input.noisePath) manifest.noise = input.noisePath;
  if (input.lsystemPath) manifest.lsystem = input.lsystemPath;
  if (input.meshIndexPath) manifest.meshIndex = input.meshIndexPath;
  if (input.storyArc) manifest.storyArc = input.storyArc;
  if (input.mycologyNetwork) manifest.mycologyNetwork = input.mycologyNetwork;

  return manifest;
}
