/**
 * Mesh adapters — bridge between existing IMAGINARIUM types and
 * the new half-edge mesh pipeline.
 *
 * These converters ensure backward compatibility:
 * - ProfileGeometry (old MeshGenerator output) → HalfEdgeMesh
 * - CylinderGeometry (old MeshGenerator output) → HalfEdgeMesh
 * - HalfEdgeMesh → FlatMeshData (already exists via toFlatArrays)
 *
 * The adapters also provide fallback mesh generation:
 * If the enriched pipeline fails, these produce valid base-tier meshes
 * from the same morphological parameters (ProfileGeometry/CylinderGeometry).
 */

import type { HalfEdgeMesh, FlatMeshData } from './HalfEdgeMesh';
import { buildFromProfile, buildFromCylinder, toFlatArrays } from './HalfEdgeMesh';
import type { MeshOp } from './pipeline';

// Re-import the existing MeshGenerator types
import type {
  ProfileGeometry,
  CylinderGeometry,
  MushroomMeshData,
} from '../mycology/assets/MeshGenerator';

// ---------------------------------------------------------------------------
// ProfileGeometry → HalfEdgeMesh
// ---------------------------------------------------------------------------

/**
 * Convert a ProfileGeometry (LatheGeometry parameters) to a HalfEdgeMesh.
 * This bridges the existing MeshGenerator output to the new pipeline.
 *
 *   const profileGeo = generateMeshData(specimen).cap;
 *   const mesh = profileToHalfEdge(profileGeo);
 *   const enriched = pipe(subdivide(1), smooth(3))(mesh);
 */
export function profileToHalfEdge(profile: ProfileGeometry): HalfEdgeMesh {
  return buildFromProfile(profile.points, profile.segments);
}

// ---------------------------------------------------------------------------
// CylinderGeometry → HalfEdgeMesh
// ---------------------------------------------------------------------------

/**
 * Convert a CylinderGeometry (stem parameters) to a HalfEdgeMesh.
 *
 *   const stemGeo = generateMeshData(specimen).stem;
 *   const mesh = cylinderToHalfEdge(stemGeo);
 */
export function cylinderToHalfEdge(cyl: CylinderGeometry): HalfEdgeMesh {
  return buildFromCylinder(
    cyl.radiusTop,
    cyl.radiusBottom,
    cyl.height,
    cyl.radialSegments,
  );
}

// ---------------------------------------------------------------------------
// Full specimen → HalfEdgeMesh (cap + stem)
// ---------------------------------------------------------------------------

/**
 * Convert a full MushroomMeshData (cap + stem) to a pair of HalfEdgeMeshes.
 * Returns cap and stem as separate meshes — they can be composed via
 * MeshOps independently (e.g., subdivide cap more than stem).
 *
 *   const { cap, stem } = specimenToHalfEdge(meshData);
 *   const enrichedCap = pipe(subdivide(2), smooth(3))(cap);
 *   const enrichedStem = pipe(subdivide(1))(stem);
 */
export function specimenToHalfEdge(data: MushroomMeshData): {
  cap: HalfEdgeMesh;
  stem: HalfEdgeMesh;
} {
  return {
    cap: profileToHalfEdge(data.cap),
    stem: cylinderToHalfEdge(data.stem),
  };
}

// ---------------------------------------------------------------------------
// Fallback mesh generation
// ---------------------------------------------------------------------------

/**
 * Generate a minimal fallback mesh from ProfileGeometry.
 * Used when the enriched pipeline fails — produces a valid but
 * un-enriched mesh from the same morphological parameters.
 *
 * Fallback chain:
 *   enriched (subdivide + smooth + displace) FAILED
 *   → base (direct revolution from profile)
 *   → parametric (this function)
 *   → billboard (SVG sprite — handled by ARCHITECTUS)
 */
export function fallbackMeshFromProfile(profile: ProfileGeometry): FlatMeshData {
  const mesh = buildFromProfile(profile.points, profile.segments);
  return toFlatArrays(mesh);
}

/**
 * Generate a minimal fallback mesh from CylinderGeometry.
 */
export function fallbackMeshFromCylinder(cyl: CylinderGeometry): FlatMeshData {
  const mesh = buildFromCylinder(
    cyl.radiusTop,
    cyl.radiusBottom,
    cyl.height,
    cyl.radialSegments,
  );
  return toFlatArrays(mesh);
}

// ---------------------------------------------------------------------------
// Pipeline-aware conversion
// ---------------------------------------------------------------------------

/**
 * Apply a MeshOp pipeline to ProfileGeometry, with automatic fallback
 * to un-enriched mesh if the pipeline throws.
 *
 *   const flat = applyPipelineToProfile(capProfile, pipe(subdivide(2), smooth(3)));
 *   // If pipeline fails, returns base mesh from profile (never throws)
 */
export function applyPipelineToProfile(
  profile: ProfileGeometry,
  pipeline: MeshOp,
): FlatMeshData {
  try {
    const mesh = profileToHalfEdge(profile);
    const enriched = pipeline(mesh);
    return toFlatArrays(enriched);
  } catch {
    // Pipeline failed — fall back to base mesh
    return fallbackMeshFromProfile(profile);
  }
}

/**
 * Apply a MeshOp pipeline to CylinderGeometry, with automatic fallback.
 */
export function applyPipelineToCylinder(
  cyl: CylinderGeometry,
  pipeline: MeshOp,
): FlatMeshData {
  try {
    const mesh = cylinderToHalfEdge(cyl);
    const enriched = pipeline(mesh);
    return toFlatArrays(enriched);
  } catch {
    return fallbackMeshFromCylinder(cyl);
  }
}
