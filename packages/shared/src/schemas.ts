/**
 * Zod Contract Validation
 *
 * Runtime validators for the three pipeline contracts:
 *   - TopologyZod   (CHRONOS output)
 *   - PaletteZod    (IMAGINARIUM output)
 *   - ManifestZod   (OPERATUS output)
 *
 * These complement (not replace) the existing TypeScript types
 * and JSON Schema contracts. They enforce contracts at runtime
 * so the pipeline fails fast on invalid data instead of silently
 * propagating malformed artifacts.
 */

import { z } from 'zod';

// ── Topology ────────────────────────────────────────────────────

export const TopologyFileZod = z.object({
  path: z.string(),
  hash: z.string(),
  language: z.string(),
  complexity: z.number(),
  loc: z.number(),
  lastModified: z.union([z.string(), z.date()]),
  author: z.string(),
});

export const TopologyCommitZod = z.object({
  hash: z.string(),
  message: z.string(),
  author: z.string(),
  date: z.union([z.string(), z.date()]),
  filesChanged: z.array(z.string()),
  insertions: z.number(),
  deletions: z.number(),
  isMerge: z.boolean(),
  type: z.string(),
  scope: z.string().optional(),
  isBreaking: z.boolean().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
});

export const TopologyHotspotZod = z.object({
  path: z.string(),
  churnRate: z.number(),
  complexity: z.number(),
  riskScore: z.number(),
});

export const TopologyTreeNodeZod = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(['file', 'directory']),
}).passthrough(); // allows recursive children + metadata

export const TopologyZod = z.object({
  version: z.string().optional(),
  analyzedAt: z.string().optional(),
  files: z.array(TopologyFileZod),
  commits: z.array(TopologyCommitZod).optional().default([]),
  tree: TopologyTreeNodeZod,
  hotspots: z.array(TopologyHotspotZod).optional().default([]),
  repository: z.unknown().optional(),
  languageDistribution: z.array(z.unknown()).optional(),
  contributorSummary: z.unknown().optional(),
  temporalCouplings: z.array(z.unknown()).optional(),
  commitCount: z.number().optional(),
  hotspotCount: z.number().optional(),
  deepwiki: z.unknown().optional(),
});

// ── Palette ─────────────────────────────────────────────────────

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const PaletteZod = z.object({
  primary: hexColor,
  secondary: hexColor,
  accent: hexColor,
  background: hexColor,
  glow: hexColor,
  mood: z.enum(['warm', 'cool', 'neutral']),
});

// ── Manifest ────────────────────────────────────────────────────

export const ManifestZod = z.object({
  version: z.string(),
  checksum: z.string(),
  shaders: z.record(z.string()).default({}),
  palettes: z.record(z.string()).default({}),
  topology: z.string().default(''),
  mycology: z.unknown().optional(),
  meshes: z.record(z.unknown()).optional(),
});

// ── Validation Functions ────────────────────────────────────────

/**
 * Validate data against the Topology contract.
 * Returns parsed data on success, throws ZodError on failure.
 */
export function validateTopology(data: unknown): z.infer<typeof TopologyZod> {
  return TopologyZod.parse(data);
}

/**
 * Validate data against the Palette contract.
 * Returns parsed data on success, throws ZodError on failure.
 */
export function validatePalette(data: unknown): z.infer<typeof PaletteZod> {
  return PaletteZod.parse(data);
}

/**
 * Validate data against the Manifest contract.
 * Returns parsed data on success, throws ZodError on failure.
 */
export function validateManifest(data: unknown): z.infer<typeof ManifestZod> {
  return ManifestZod.parse(data);
}
