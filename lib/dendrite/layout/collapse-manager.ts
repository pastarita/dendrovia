/**
 * Collapse Manager — Pure functions for collapse/expand state.
 *
 * Collapsed nodes hide their children from the layout.
 */

import type { SourceDiagram, SourceNode } from '../types';

/**
 * Returns the set of node IDs that are descendants of any collapsed node.
 */
export function getHiddenNodeIds(diagram: SourceDiagram, collapsed: Set<string>): Set<string> {
  const hidden = new Set<string>();
  const nodeMap = new Map(diagram.nodes.map((n) => [n.id, n]));

  function hideDescendants(parentId: string) {
    const parent = nodeMap.get(parentId);
    if (!parent?.children) return;
    for (const childId of parent.children) {
      hidden.add(childId);
      // Recursively hide grandchildren regardless of their own collapse state
      hideDescendants(childId);
    }
  }

  for (const nodeId of collapsed) {
    hideDescendants(nodeId);
  }

  return hidden;
}

/**
 * Returns the visible nodes after applying collapse state.
 */
export function getVisibleNodes(diagram: SourceDiagram, collapsed: Set<string>): SourceNode[] {
  const hidden = getHiddenNodeIds(diagram, collapsed);
  return diagram.nodes.filter((n) => !hidden.has(n.id));
}

/**
 * Returns all collapsible node IDs (nodes that have children).
 */
export function getCollapsibleIds(diagram: SourceDiagram): string[] {
  return diagram.nodes.filter((n) => n.children && n.children.length > 0).map((n) => n.id);
}

/**
 * Collapse all collapsible nodes.
 */
export function collapseAllIds(diagram: SourceDiagram): Set<string> {
  return new Set(getCollapsibleIds(diagram));
}
