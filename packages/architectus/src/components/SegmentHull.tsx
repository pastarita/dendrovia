import { useMemo } from 'react';
import * as THREE from 'three';
import type { PrecomputedPlacement, SegmentMood } from '@dendrovia/shared';

/**
 * SEGMENT HULL
 *
 * Renders a translucent convex hull mesh from precomputed vertices.
 * Single draw call per segment. Used as a distant placeholder before
 * the segment's full geometry loads.
 *
 * Visual: Ghostly silhouette with mood-based tinting, fog-affected.
 */

interface SegmentHullProps {
  placement: PrecomputedPlacement;
  opacity: number;
}

const MOOD_COLORS: Record<SegmentMood, string> = {
  serene: '#4a9eff',
  tense: '#ff6b4a',
  chaotic: '#ff4aff',
  triumphant: '#ffd700',
  mysterious: '#8a4aff',
};

/**
 * Build a BufferGeometry from hull vertices using triangle fan from centroid.
 * The hull vertices are in XZ plane order (from convex hull 2D).
 */
function buildHullGeometry(
  vertices: Array<[number, number, number]>,
  centroid: [number, number, number],
): THREE.BufferGeometry {
  if (vertices.length < 3) {
    // Fallback: create a simple box at the centroid
    const geo = new THREE.BoxGeometry(2, 4, 2);
    geo.translate(centroid[0], centroid[1], centroid[2]);
    return geo;
  }

  // Triangle fan from centroid to hull edges
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Add centroid as vertex 0
  positions.push(centroid[0], centroid[1], centroid[2]);
  normals.push(0, 1, 0);

  // Add hull vertices
  for (const v of vertices) {
    positions.push(v[0], v[1], v[2]);
    normals.push(0, 1, 0);
  }

  // Create triangles: centroid → vertex[i] → vertex[i+1]
  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    indices.push(0, i + 1, next + 1);
  }

  // Also create side faces for depth (extrude downward)
  const baseY = centroid[1] - 2;
  const offset = vertices.length + 1;

  // Bottom centroid
  positions.push(centroid[0], baseY, centroid[2]);
  normals.push(0, -1, 0);

  // Bottom hull vertices
  for (const v of vertices) {
    positions.push(v[0], baseY, v[2]);
    normals.push(0, -1, 0);
  }

  // Bottom face triangles (reversed winding)
  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    indices.push(offset, offset + next + 1, offset + i + 1);
  }

  // Side faces connecting top and bottom
  for (let i = 0; i < vertices.length; i++) {
    const next = (i + 1) % vertices.length;
    const topA = i + 1;
    const topB = next + 1;
    const botA = offset + i + 1;
    const botB = offset + next + 1;

    indices.push(topA, botA, topB);
    indices.push(topB, botA, botB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

export function SegmentHull({ placement, opacity }: SegmentHullProps) {
  const geometry = useMemo(
    () => buildHullGeometry(placement.hullVertices, placement.centroid),
    [placement.hullVertices, placement.centroid],
  );

  const color = MOOD_COLORS[placement.mood] ?? '#4a9eff';

  return (
    <mesh geometry={geometry} frustumCulled>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={opacity * 0.15}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
