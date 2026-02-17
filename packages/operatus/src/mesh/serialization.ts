/**
 * Binary mesh serialization for cache storage.
 *
 * Encodes FlatMeshData as a compact binary format (~73% smaller than JSON).
 * Used by MeshFactory for OPERATUS tiered cache (OPFS + IndexedDB).
 *
 * Binary layout:
 *   Header (16 bytes):
 *     [0-3]   magic:       0x4D455348 ("MESH")
 *     [4-7]   version:     uint32
 *     [8-11]  vertexCount: uint32
 *     [12-15] faceCount:   uint32
 *
 *   Body (contiguous typed arrays):
 *     positions: Float32Array (vertexCount * 3 floats)
 *     normals:   Float32Array (vertexCount * 3 floats)
 *     indices:   Uint32Array  (faceCount * 3 uints)
 */

import type { FlatMeshData } from '@dendrovia/imaginarium/mesh-runtime';

/** Magic number: ASCII "MESH" = 0x4D455348 */
const MESH_MAGIC = 0x4d455348;

/** Header size in bytes */
const HEADER_SIZE = 16;

/**
 * Encode FlatMeshData into a compact binary ArrayBuffer.
 */
export function encodeMesh(flat: FlatMeshData, version: number): ArrayBuffer {
  const vertexCount = flat.positions.length / 3;
  const faceCount = flat.indices.length / 3;

  const posBytes = flat.positions.byteLength;
  const normBytes = flat.normals.byteLength;
  const idxBytes = flat.indices.byteLength;

  const totalSize = HEADER_SIZE + posBytes + normBytes + idxBytes;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // Write header
  view.setUint32(0, MESH_MAGIC, true);
  view.setUint32(4, version, true);
  view.setUint32(8, vertexCount, true);
  view.setUint32(12, faceCount, true);

  // Write body — copy typed arrays into contiguous buffer
  const bytes = new Uint8Array(buffer);
  bytes.set(new Uint8Array(flat.positions.buffer, flat.positions.byteOffset, posBytes), HEADER_SIZE);
  bytes.set(new Uint8Array(flat.normals.buffer, flat.normals.byteOffset, normBytes), HEADER_SIZE + posBytes);
  bytes.set(new Uint8Array(flat.indices.buffer, flat.indices.byteOffset, idxBytes), HEADER_SIZE + posBytes + normBytes);

  return buffer;
}

/**
 * Decode a binary ArrayBuffer back into FlatMeshData.
 * Returns null on magic mismatch, version mismatch, or corrupted data.
 */
export function decodeMesh(buffer: ArrayBuffer, expectedVersion: number): FlatMeshData | null {
  if (buffer.byteLength < HEADER_SIZE) return null;

  const view = new DataView(buffer);

  // Validate magic
  const magic = view.getUint32(0, true);
  if (magic !== MESH_MAGIC) return null;

  // Validate version
  const version = view.getUint32(4, true);
  if (version !== expectedVersion) return null;

  const vertexCount = view.getUint32(8, true);
  const faceCount = view.getUint32(12, true);

  const posFloats = vertexCount * 3;
  const normFloats = vertexCount * 3;
  const idxUints = faceCount * 3;

  const expectedSize = HEADER_SIZE + posFloats * 4 + normFloats * 4 + idxUints * 4;
  if (buffer.byteLength < expectedSize) return null;

  // Read typed arrays (copy out of the shared buffer)
  const posOffset = HEADER_SIZE;
  const normOffset = posOffset + posFloats * 4;
  const idxOffset = normOffset + normFloats * 4;

  const positions = new Float32Array(buffer.slice(posOffset, posOffset + posFloats * 4));
  const normals = new Float32Array(buffer.slice(normOffset, normOffset + normFloats * 4));
  const indices = new Uint32Array(buffer.slice(idxOffset, idxOffset + idxUints * 4));

  return { positions, normals, indices };
}
