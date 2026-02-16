/**
 * generateMeshAssets — mesh generation orchestrator for the distillation pipeline.
 *
 * For each FungalSpecimen:
 *   1. Generate base geometry via MeshGenerator (ProfileGeometry + CylinderGeometry)
 *   2. Apply genus-specific MeshOp pipeline (subdivide/smooth/displace)
 *   3. Serialize enriched mesh to JSON on disk
 *   4. Collect MeshManifestEntry for each asset
 *
 * Failure on one specimen never blocks others (try/catch per specimen).
 * The whole step is wrapped in the distillation pipeline's own try/catch
 * so mesh generation never blocks the overall pipeline.
 */

import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import type { MeshManifestEntry } from '@dendrovia/shared';
import type { FungalSpecimen } from '../mycology/types';
import { generateMeshData } from '../mycology/assets/MeshGenerator';
import { applyPipelineToProfile, applyPipelineToCylinder } from './adapters';
import { serialize } from './serialize';
import { buildFromIndexed } from './HalfEdgeMesh';
import { genusPipeline, STEM_PIPELINE } from './genusPipelines';
import { hashString } from '../utils/hash';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface MeshGenerationResult {
  /** Manifest entries keyed by "{specimenId}-cap" / "{specimenId}-stem" */
  meshEntries: Record<string, MeshManifestEntry>;
  /** Stats for pipeline logging */
  stats: MeshGenerationStats;
}

export interface MeshGenerationStats {
  totalSpecimens: number;
  successCount: number;
  failCount: number;
  totalVertices: number;
  totalFaces: number;
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateMeshAssets(
  specimens: FungalSpecimen[],
  outputDir: string,
): Promise<MeshGenerationResult> {
  const startTime = performance.now();

  const meshDir = join(outputDir, 'meshes');
  if (!existsSync(meshDir)) {
    mkdirSync(meshDir, { recursive: true });
  }

  const meshEntries: Record<string, MeshManifestEntry> = {};
  let successCount = 0;
  let failCount = 0;
  let totalVertices = 0;
  let totalFaces = 0;

  for (const specimen of specimens) {
    try {
      // 1. Generate base geometry (ProfileGeometry + CylinderGeometry)
      const meshData = generateMeshData(specimen);

      // 2. Get genus-specific pipeline
      const genus = specimen.taxonomy.genus;
      const capPipeline = genusPipeline(genus);

      // 3. Apply pipeline to cap (with automatic fallback)
      const capFlat = applyPipelineToProfile(meshData.cap, capPipeline);

      // 4. Apply pipeline to stem (with automatic fallback)
      const stemFlat = applyPipelineToCylinder(meshData.stem, STEM_PIPELINE);

      // 5. Serialize cap mesh
      const capMesh = buildFromIndexed(capFlat.positions, capFlat.indices);
      const capSerialized = serialize(capMesh, {
        format: 'indexed',
        meta: {
          genus,
          pipeline: ['genusPipeline', genus],
          generatedAt: Date.now(),
          sourceHash: hashString(specimen.id),
        },
      });
      const capJson = JSON.stringify(capSerialized);
      const capPath = `meshes/${specimen.id}-cap.json`;
      await Bun.write(join(outputDir, capPath), capJson);

      // 6. Serialize stem mesh
      const stemMesh = buildFromIndexed(stemFlat.positions, stemFlat.indices);
      const stemSerialized = serialize(stemMesh, {
        format: 'indexed',
        meta: {
          genus,
          pipeline: ['stemPipeline'],
          generatedAt: Date.now(),
          sourceHash: hashString(specimen.id),
        },
      });
      const stemJson = JSON.stringify(stemSerialized);
      const stemPath = `meshes/${specimen.id}-stem.json`;
      await Bun.write(join(outputDir, stemPath), stemJson);

      // 7. Collect manifest entries
      const capHash = hashString(capJson).slice(0, 16);
      const stemHash = hashString(stemJson).slice(0, 16);

      meshEntries[`${specimen.id}-cap`] = {
        path: capPath,
        hash: capHash,
        format: 'indexed',
        vertices: capSerialized.vertexCount,
        faces: capSerialized.faceCount,
        size: capJson.length,
        tier: 'enriched',
        genusId: genus,
      };

      meshEntries[`${specimen.id}-stem`] = {
        path: stemPath,
        hash: stemHash,
        format: 'indexed',
        vertices: stemSerialized.vertexCount,
        faces: stemSerialized.faceCount,
        size: stemJson.length,
        tier: 'enriched',
        genusId: genus,
      };

      totalVertices += capSerialized.vertexCount + stemSerialized.vertexCount;
      totalFaces += capSerialized.faceCount + stemSerialized.faceCount;
      successCount++;

      // Update specimen asset paths
      specimen.assets.meshDataPath = capPath;
    } catch {
      // Failure on one specimen never blocks others
      failCount++;
    }
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    meshEntries,
    stats: {
      totalSpecimens: specimens.length,
      successCount,
      failCount,
      totalVertices,
      totalFaces,
      durationMs,
    },
  };
}
