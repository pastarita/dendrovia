/**
 * TreeBuilder — Converts a flat file list into a dendritic FileTreeNode hierarchy
 */

import type { FileTreeNode, ParsedFile } from '@dendrovia/shared';

/**
 * Build a FileTreeNode tree from a list of parsed files.
 * Paths are split on '/' to create the directory hierarchy.
 */
export function buildFileTree(files: ParsedFile[], rootName: string = 'root'): FileTreeNode {
  const root: FileTreeNode = {
    name: rootName,
    path: '',
    type: 'directory',
    children: [],
  };

  // Index files by path for metadata lookup
  const fileMap = new Map<string, ParsedFile>();
  for (const file of files) {
    fileMap.set(file.path, file);
  }

  for (const file of files) {
    insertPath(root, file.path.split('/'), file);
  }

  // Sort children recursively (directories first, then alphabetical)
  sortTree(root);

  return root;
}

function insertPath(node: FileTreeNode, segments: string[], metadata: ParsedFile): void {
  if (segments.length === 0) return;

  if (!node.children) node.children = [];

  const [head, ...rest] = segments;
  const currentPath = node.path ? `${node.path}/${head}` : head;

  // Find or create child
  let child = node.children.find((c) => c.name === head);

  if (!child) {
    child = {
      name: head,
      path: currentPath,
      type: rest.length === 0 ? 'file' : 'directory',
      children: rest.length === 0 ? undefined : [],
    };
    node.children.push(child);
  }

  if (rest.length === 0) {
    // Leaf node — attach metadata
    child.type = 'file';
    child.metadata = metadata;
  } else {
    // Intermediate directory — ensure it has children array
    if (!child.children) child.children = [];
    child.type = 'directory';
    insertPath(child, rest, metadata);
  }
}

function sortTree(node: FileTreeNode): void {
  if (!node.children) return;

  node.children.sort((a, b) => {
    // Directories before files
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    // Alphabetical within same type
    return a.name.localeCompare(b.name);
  });

  for (const child of node.children) {
    sortTree(child);
  }
}

/**
 * Count total files in a tree.
 */
export function countFiles(node: FileTreeNode): number {
  if (node.type === 'file') return 1;
  if (!node.children) return 0;
  return node.children.reduce((sum, child) => sum + countFiles(child), 0);
}

/**
 * Count total directories in a tree.
 */
export function countDirectories(node: FileTreeNode): number {
  if (node.type === 'file') return 0;
  const self = 1;
  if (!node.children) return self;
  return self + node.children.reduce((sum, child) => sum + countDirectories(child), 0);
}
