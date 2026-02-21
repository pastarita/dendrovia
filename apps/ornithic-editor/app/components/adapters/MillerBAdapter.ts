/**
 * MillerBAdapter — Bridges CHRONOS topology data to breadcrumb/tree UI.
 * Transforms TopologyNode[] → BreadcrumbSegment[] for ornithicus-ui.
 */

import type { BreadcrumbSegment } from "@ornithicus/ui";

export interface TopologyNode {
  path: string;
  name: string;
  depth: number;
  children?: TopologyNode[];
}

/**
 * Convert a path through the topology tree into breadcrumb segments.
 */
export function topologyToBreadcrumbs(
  path: TopologyNode[]
): BreadcrumbSegment[] {
  return path.map((node) => ({
    label: node.name,
    path: node.path,
    depth: node.depth,
  }));
}
