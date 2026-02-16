/**
 * SegmentMapper — maps ARCHITECTUS NodeMarkers to StoryArc segments.
 *
 * Matches each node's file path against the segment's filePaths,
 * then computes centroid and bounding radius for each segment's
 * placement in the 3D world.
 */

import type { StoryArc, SegmentPlacement } from '@dendrovia/shared';
import type { NodeMarker } from './TurtleInterpreter';

/**
 * Map node markers to story arc segments, producing placement data
 * for each segment (centroid position and bounding radius).
 */
export function mapNodesToSegments(
  nodes: NodeMarker[],
  storyArc: StoryArc,
): Map<string, SegmentPlacement> {
  const placements = new Map<string, SegmentPlacement>();

  for (const segment of storyArc.segments) {
    const fileSet = new Set(segment.filePaths);

    // Find all nodes that belong to this segment
    const matchingNodes = nodes.filter(n => fileSet.has(n.path));
    const matchedPaths = matchingNodes.map(n => n.path);

    if (matchingNodes.length === 0) {
      // No matching nodes — place at origin with zero radius
      placements.set(segment.id, {
        segmentId: segment.id,
        nodePaths: [],
        centroid: [0, 0, 0],
        radius: 0,
      });
      continue;
    }

    // Compute centroid
    let cx = 0, cy = 0, cz = 0;
    for (const node of matchingNodes) {
      cx += node.position.x;
      cy += node.position.y;
      cz += node.position.z;
    }
    const count = matchingNodes.length;
    cx /= count;
    cy /= count;
    cz /= count;

    // Compute radius (max distance from centroid to any node)
    let maxDist = 0;
    for (const node of matchingNodes) {
      const dx = node.position.x - cx;
      const dy = node.position.y - cy;
      const dz = node.position.z - cz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > maxDist) maxDist = dist;
    }

    placements.set(segment.id, {
      segmentId: segment.id,
      nodePaths: matchedPaths,
      centroid: [cx, cy, cz],
      radius: maxDist,
    });
  }

  return placements;
}
