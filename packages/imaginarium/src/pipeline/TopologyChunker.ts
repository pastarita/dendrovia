/**
 * TopologyChunker — splits monolithic topology into per-segment chunks.
 *
 * For each StorySegment, prunes the FileTreeNode to only contain nodes
 * belonging to that segment's filePaths[]. Writes per-segment topology
 * chunks (~200KB-1.5MB each instead of 8.8MB monolith).
 *
 * Deterministic: same topology + storyArc always produces the same chunks.
 */

import type {
  CodeTopology,
  StoryArc,
  StorySegment,
  FileTreeNode,
  TopologyChunk,
  ParsedFile,
  Hotspot,
} from '@dendrovia/shared';

/**
 * Chunk topology into per-segment subsets.
 *
 * Each chunk contains a pruned FileTreeNode, filtered files, and filtered hotspots
 * — everything the runtime needs to build geometry for one segment.
 */
export function chunkTopology(
  topology: CodeTopology,
  storyArc: StoryArc,
): TopologyChunk[] {
  const chunks: TopologyChunk[] = [];

  for (const segment of storyArc.segments) {
    const fileSet = new Set(segment.filePaths);

    // Filter files and hotspots to this segment
    const files = topology.files.filter(f => fileSet.has(f.path));
    const hotspots = (topology.hotspots ?? []).filter(h => fileSet.has(h.path));

    // Prune tree to only contain paths in this segment
    const prunedTree = pruneTree(topology.tree, fileSet);

    chunks.push({
      segmentId: segment.id,
      tree: prunedTree ?? buildEmptyTree(segment),
      files,
      hotspots,
      fileCount: files.length,
    });
  }

  return chunks;
}

/**
 * Recursively prune a FileTreeNode, keeping only directories that contain
 * files in the fileSet, and only files that are in the fileSet.
 *
 * Returns null if the entire subtree should be removed.
 */
function pruneTree(
  node: FileTreeNode,
  fileSet: Set<string>,
): FileTreeNode | null {
  if (node.type === 'file') {
    return fileSet.has(node.path) ? { ...node } : null;
  }

  // Directory: recurse into children, keep only non-null results
  if (!node.children || node.children.length === 0) {
    return null;
  }

  const prunedChildren: FileTreeNode[] = [];
  for (const child of node.children) {
    const pruned = pruneTree(child, fileSet);
    if (pruned) {
      prunedChildren.push(pruned);
    }
  }

  if (prunedChildren.length === 0) {
    return null;
  }

  return {
    ...node,
    children: prunedChildren,
  };
}

/**
 * Build an empty tree node for a segment that has no matching tree structure.
 * This is a fallback — should rarely happen.
 */
function buildEmptyTree(segment: StorySegment): FileTreeNode {
  return {
    name: segment.label,
    path: segment.treePath,
    type: 'directory',
    children: [],
  };
}
