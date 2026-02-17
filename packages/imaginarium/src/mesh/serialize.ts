/**
 * Mesh serialization — versioned, OPERATUS-compatible persistence.
 *
 * Converts between HalfEdgeMesh (in-memory topology-aware) and
 * SerializedMeshData (JSON-safe, cacheable, versionable).
 *
 * Design decisions:
 * - Plain number[] (not Float32Array) for JSON serialization
 * - Optional topology field — omit for GPU-only consumers (saves ~40% size)
 * - Version field enables future migration (OPERATUS registerMigration pattern)
 * - Meta.sourceHash enables determinism verification across builds
 * - Meta.pipeline records which MeshOps produced the mesh (debugging)
 *
 * Fallback chain: enriched → base → parametric → billboard
 * If deserialize fails, consumers fall back to the next tier.
 */

import type { MeshFormat, SerializedMeshData } from '@dendrovia/shared';
import type { FlatMeshData, HalfEdgeMesh, HEVertex } from './HalfEdgeMesh';
import { buildFromIndexed, toFlatArrays } from './HalfEdgeMesh';

// ---------------------------------------------------------------------------
// Serialize: HalfEdgeMesh → SerializedMeshData
// ---------------------------------------------------------------------------

export interface SerializeOptions {
  /** Include half-edge topology for consumers needing adjacency queries.
   *  Set false for GPU-only consumers (saves ~40% file size). Default: false. */
  includeTopology?: boolean;
  /** Mesh format tag. Default: 'halfedge' if topology included, 'indexed' otherwise. */
  format?: MeshFormat;
  /** Generation metadata for debugging and versioning */
  meta?: SerializedMeshData['meta'];
}

/**
 * Serialize a HalfEdgeMesh to a JSON-safe SerializedMeshData.
 * The output is ready for Bun.write() / JSON.stringify() / OPERATUS cache.
 */
export function serialize(mesh: HalfEdgeMesh, options: SerializeOptions = {}): SerializedMeshData {
  const flat = toFlatArrays(mesh);
  const includeTopology = options.includeTopology ?? false;
  const format = options.format ?? (includeTopology ? 'halfedge' : 'indexed');

  const data: SerializedMeshData = {
    version: 1,
    format,
    positions: Array.from(flat.positions),
    normals: Array.from(flat.normals),
    indices: Array.from(flat.indices),
    vertexCount: mesh.vertices.length,
    faceCount: mesh.faces.length,
  };

  if (includeTopology) {
    data.topology = {
      halfedges: mesh.halfedges.map((he) => ({
        vertex: he.vertex,
        face: he.face,
        next: he.next,
        prev: he.prev,
        twin: he.twin,
      })),
      vertexHalfedges: mesh.vertices.map((v) => v.halfedge),
      faceHalfedges: mesh.faces.map((f) => f.halfedge),
    };
  }

  if (options.meta) {
    data.meta = options.meta;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Deserialize: SerializedMeshData → HalfEdgeMesh | FlatMeshData
// ---------------------------------------------------------------------------

/**
 * Deserialize to a full HalfEdgeMesh (topology-aware).
 *
 * If the serialized data includes topology, it's reconstructed directly.
 * If topology was omitted, rebuilds from indexed data (slower but lossless).
 *
 * Returns null if data is malformed (enables fallback chain).
 */
export function deserializeToHalfEdge(data: unknown): HalfEdgeMesh | null {
  try {
    const d = data as SerializedMeshData;

    // Version check
    if (d.version !== 1) return null;
    if (!d.positions?.length || !d.indices?.length) return null;

    // If topology is present, reconstruct directly (fast path)
    if (d.topology) {
      const vertices: HEVertex[] = [];
      for (let i = 0; i < d.vertexCount; i++) {
        vertices.push({
          x: d.positions[i * 3]!,
          y: d.positions[i * 3 + 1]!,
          z: d.positions[i * 3 + 2]!,
          halfedge: d.topology.vertexHalfedges[i]!,
        });
      }

      const halfedges = d.topology.halfedges.map((he) => ({ ...he }));
      const faces = d.topology.faceHalfedges.map((he) => ({ halfedge: he }));

      return { vertices, halfedges, faces };
    }

    // No topology — rebuild from indexed data (slow path)
    return buildFromIndexed(new Float32Array(d.positions), new Uint32Array(d.indices));
  } catch {
    return null; // Malformed data → fallback
  }
}

/**
 * Deserialize to FlatMeshData (GPU-ready typed arrays).
 * This is the fast path for consumers that only need to render
 * (ARCHITECTUS) — skips topology reconstruction entirely.
 *
 * Returns null if data is malformed (enables fallback chain).
 */
export function deserializeToFlat(data: unknown): FlatMeshData | null {
  try {
    const d = data as SerializedMeshData;

    if (d.version !== 1) return null;
    if (!d.positions?.length || !d.indices?.length) return null;

    return {
      positions: new Float32Array(d.positions),
      normals: new Float32Array(d.normals),
      indices: new Uint32Array(d.indices),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fallback helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to load a mesh from serialized data with a fallback chain.
 *
 * Tries: deserializeToFlat (fastest) → deserializeToHalfEdge + toFlatArrays → null
 *
 * If both fail, consumer should fall back to the next MeshTier:
 *   enriched → base → parametric (regenerate from ProfileGeometry) → billboard (SVG sprite)
 */
export function deserializeWithFallback(data: unknown): FlatMeshData | null {
  // Try fast path first
  const flat = deserializeToFlat(data);
  if (flat) return flat;

  // Try full reconstruction
  const mesh = deserializeToHalfEdge(data);
  if (mesh) return toFlatArrays(mesh);

  // Both failed — consumer should try next tier
  return null;
}
