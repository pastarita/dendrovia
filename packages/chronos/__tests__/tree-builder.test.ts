import { describe, expect, test } from 'bun:test';
import type { FileTreeNode, ParsedFile } from '@dendrovia/shared';
import { buildFileTree, countDirectories, countFiles } from '../src/builder/TreeBuilder';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function makeFile(path: string): ParsedFile {
  return {
    path,
    hash: 'abc123',
    language: 'typescript',
    complexity: 1,
    loc: 10,
    lastModified: new Date('2025-01-01'),
    author: 'dev',
  };
}

// ---------------------------------------------------------------------------
// Tree construction
// ---------------------------------------------------------------------------
describe('buildFileTree — structure', () => {
  test('builds tree from single file', () => {
    const tree = buildFileTree([makeFile('index.ts')]);
    expect(tree.name).toBe('root');
    expect(tree.type).toBe('directory');
    expect(tree.children).toBeDefined();
    expect(tree.children!.length).toBe(1);
    expect(tree.children![0].name).toBe('index.ts');
    expect(tree.children![0].type).toBe('file');
    expect(tree.children![0].path).toBe('index.ts');
  });

  test('builds nested directory structure', () => {
    const files = [makeFile('src/utils/helpers.ts'), makeFile('src/index.ts')];
    const tree = buildFileTree(files);

    expect(tree.children!.length).toBe(1); // src
    const src = tree.children![0];
    expect(src.name).toBe('src');
    expect(src.type).toBe('directory');
    expect(src.children!.length).toBe(2); // utils dir + index.ts file
  });

  test('creates intermediate directories', () => {
    const files = [makeFile('a/b/c/d.ts')];
    const tree = buildFileTree(files);

    const a = tree.children![0];
    expect(a.name).toBe('a');
    expect(a.type).toBe('directory');

    const b = a.children![0];
    expect(b.name).toBe('b');
    expect(b.type).toBe('directory');

    const c = b.children![0];
    expect(c.name).toBe('c');
    expect(c.type).toBe('directory');

    const d = c.children![0];
    expect(d.name).toBe('d.ts');
    expect(d.type).toBe('file');
  });

  test('custom root name', () => {
    const tree = buildFileTree([makeFile('foo.ts')], 'project');
    expect(tree.name).toBe('project');
  });

  test('default root name is "root"', () => {
    const tree = buildFileTree([makeFile('foo.ts')]);
    expect(tree.name).toBe('root');
  });

  test('root path is empty string', () => {
    const tree = buildFileTree([makeFile('foo.ts')]);
    expect(tree.path).toBe('');
  });

  test('leaf nodes have metadata attached', () => {
    const file = makeFile('src/app.ts');
    const tree = buildFileTree([file]);
    const src = tree.children![0];
    const app = src.children![0];
    expect(app.metadata).toBeDefined();
    expect(app.metadata!.path).toBe('src/app.ts');
  });

  test('directory nodes do not have metadata', () => {
    const tree = buildFileTree([makeFile('src/app.ts')]);
    const src = tree.children![0];
    expect(src.metadata).toBeUndefined();
  });

  test('handles multiple files in same directory', () => {
    const files = [makeFile('src/a.ts'), makeFile('src/b.ts'), makeFile('src/c.ts')];
    const tree = buildFileTree(files);
    const src = tree.children![0];
    expect(src.children!.length).toBe(3);
  });

  test('file paths are built correctly', () => {
    const files = [makeFile('src/utils/format.ts'), makeFile('src/index.ts')];
    const tree = buildFileTree(files);

    const src = tree.children![0];
    expect(src.path).toBe('src');

    // Find format.ts in the tree
    const utils = src.children!.find((c) => c.name === 'utils')!;
    expect(utils.path).toBe('src/utils');

    const format = utils.children![0];
    expect(format.path).toBe('src/utils/format.ts');
  });
});

// ---------------------------------------------------------------------------
// Sorting (directories first, then alphabetical)
// ---------------------------------------------------------------------------
describe('buildFileTree — sorting', () => {
  test('directories come before files', () => {
    const files = [makeFile('src/b.ts'), makeFile('src/utils/helper.ts'), makeFile('src/a.ts')];
    const tree = buildFileTree(files);
    const src = tree.children![0];
    // "utils" dir should come before "a.ts" and "b.ts"
    expect(src.children![0].name).toBe('utils');
    expect(src.children![0].type).toBe('directory');
  });

  test('files are alphabetically sorted within same type', () => {
    const files = [makeFile('src/zebra.ts'), makeFile('src/alpha.ts'), makeFile('src/middle.ts')];
    const tree = buildFileTree(files);
    const src = tree.children![0];
    const names = src.children!.map((c) => c.name);
    expect(names).toEqual(['alpha.ts', 'middle.ts', 'zebra.ts']);
  });

  test('directories are alphabetically sorted', () => {
    const files = [makeFile('c/file.ts'), makeFile('a/file.ts'), makeFile('b/file.ts')];
    const tree = buildFileTree(files);
    const names = tree.children!.map((c) => c.name);
    expect(names).toEqual(['a', 'b', 'c']);
  });

  test('sorting is recursive', () => {
    const files = [makeFile('pkg/src/z.ts'), makeFile('pkg/src/a.ts'), makeFile('pkg/src/m.ts')];
    const tree = buildFileTree(files);
    const pkg = tree.children![0];
    const src = pkg.children![0];
    const names = src.children!.map((c) => c.name);
    expect(names).toEqual(['a.ts', 'm.ts', 'z.ts']);
  });
});

// ---------------------------------------------------------------------------
// countFiles
// ---------------------------------------------------------------------------
describe('countFiles', () => {
  test('counts all files in a tree', () => {
    const files = [makeFile('src/a.ts'), makeFile('src/b.ts'), makeFile('src/lib/c.ts'), makeFile('readme.md')];
    const tree = buildFileTree(files);
    expect(countFiles(tree)).toBe(4);
  });

  test('returns 0 for empty tree', () => {
    const tree = buildFileTree([]);
    expect(countFiles(tree)).toBe(0);
  });

  test('counts 1 for single file', () => {
    const tree = buildFileTree([makeFile('solo.ts')]);
    expect(countFiles(tree)).toBe(1);
  });

  test('a file node counts as 1', () => {
    const fileNode: FileTreeNode = {
      name: 'test.ts',
      path: 'test.ts',
      type: 'file',
    };
    expect(countFiles(fileNode)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// countDirectories
// ---------------------------------------------------------------------------
describe('countDirectories', () => {
  test('counts root + nested directories', () => {
    const files = [makeFile('src/lib/util.ts'), makeFile('src/index.ts')];
    const tree = buildFileTree(files);
    // root + src + lib = 3
    expect(countDirectories(tree)).toBe(3);
  });

  test('returns 1 for empty root directory', () => {
    const tree = buildFileTree([]);
    // Just the root
    expect(countDirectories(tree)).toBe(1);
  });

  test('file node contributes 0 directories', () => {
    const fileNode: FileTreeNode = {
      name: 'test.ts',
      path: 'test.ts',
      type: 'file',
    };
    expect(countDirectories(fileNode)).toBe(0);
  });

  test('deeply nested path creates correct directory count', () => {
    const files = [makeFile('a/b/c/d/e.ts')];
    const tree = buildFileTree(files);
    // root + a + b + c + d = 5
    expect(countDirectories(tree)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe('buildFileTree — edge cases', () => {
  test('empty file list produces root-only tree', () => {
    const tree = buildFileTree([]);
    expect(tree.name).toBe('root');
    expect(tree.type).toBe('directory');
    expect(tree.children).toEqual([]);
    expect(countFiles(tree)).toBe(0);
  });

  test('handles duplicate paths gracefully (last metadata wins)', () => {
    const file1 = makeFile('src/dup.ts');
    const file2 = { ...makeFile('src/dup.ts'), complexity: 99 };
    const tree = buildFileTree([file1, file2]);
    const src = tree.children![0];
    const dup = src.children![0];
    expect(dup.type).toBe('file');
    // Second file's metadata should overwrite
    expect(dup.metadata!.complexity).toBe(99);
  });

  test('handles single-segment paths (root-level files)', () => {
    const files = [makeFile('package.json'), makeFile('tsconfig.json')];
    const tree = buildFileTree(files);
    expect(tree.children!.length).toBe(2);
    expect(tree.children!.every((c) => c.type === 'file')).toBe(true);
  });

  test('handles mixed depths', () => {
    const files = [makeFile('shallow.ts'), makeFile('a/medium.ts'), makeFile('a/b/c/deep.ts')];
    const tree = buildFileTree(files);
    expect(countFiles(tree)).toBe(3);
    // root has: a/ dir and shallow.ts file
    // a/ dir comes first (dir before file)
    expect(tree.children![0].type).toBe('directory');
    expect(tree.children![1].type).toBe('file');
  });
});
