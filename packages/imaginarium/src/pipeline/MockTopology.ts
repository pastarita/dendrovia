/**
 * MockTopology — generates realistic synthetic topology for testing
 * when CHRONOS isn't ready or topology.json is missing.
 */

import type { CodeTopology, ParsedFile, ParsedCommit, FileTreeNode, Hotspot } from '@dendrovia/shared';

const LANGUAGES = ['typescript', 'javascript', 'json', 'css', 'html', 'python', 'rust', 'go'];

const FILE_EXTENSIONS: Record<string, string> = {
  typescript: '.ts',
  javascript: '.js',
  json: '.json',
  css: '.css',
  html: '.html',
  python: '.py',
  rust: '.rs',
  go: '.go',
};

// Seeded PRNG for determinism
function createRNG(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateMockTopology(
  fileCount: number = 50,
  languages: string[] = ['typescript', 'javascript', 'json'],
  seed: number = 42,
): CodeTopology {
  const rng = createRNG(seed);

  const files: ParsedFile[] = [];
  const commits: ParsedCommit[] = [];
  const hotspots: Hotspot[] = [];

  // Build directory structure
  const dirs = ['src', 'src/components', 'src/utils', 'src/api', 'src/types', 'tests', 'config'];

  for (let i = 0; i < fileCount; i++) {
    const lang = languages[Math.floor(rng() * languages.length)]!;
    const dir = dirs[Math.floor(rng() * dirs.length)]!;
    const ext = FILE_EXTENSIONS[lang] ?? '.ts';
    const name = `file-${i}${ext}`;
    const path = `${dir}/${name}`;
    const complexity = Math.floor(rng() * 20) + 1;
    const loc = Math.floor(rng() * 300) + 10;

    const file: ParsedFile = {
      path,
      hash: `mock-${seed}-${i}-${(rng() * 0xffffffff >>> 0).toString(16)}`,
      language: lang,
      complexity,
      loc,
      lastModified: new Date(Date.now() - Math.floor(rng() * 30 * 24 * 60 * 60 * 1000)),
      author: `dev-${Math.floor(rng() * 5)}`,
    };
    files.push(file);

    // Some files are hotspots
    if (rng() < 0.15) {
      hotspots.push({
        path,
        churnRate: Math.floor(rng() * 30) + 5,
        complexity,
        riskScore: complexity * (Math.floor(rng() * 30) + 5) / 10,
      });
    }
  }

  // Generate mock commits
  for (let i = 0; i < Math.min(fileCount * 2, 100); i++) {
    const changedFiles = Array.from({ length: Math.floor(rng() * 5) + 1 }, () =>
      files[Math.floor(rng() * files.length)]!.path,
    );

    commits.push({
      hash: `commit-${seed}-${i}-${(rng() * 0xffffffff >>> 0).toString(16)}`,
      message: `Mock commit ${i}`,
      author: `dev-${Math.floor(rng() * 5)}`,
      date: new Date(Date.now() - Math.floor(rng() * 90 * 24 * 60 * 60 * 1000)),
      filesChanged: changedFiles,
      insertions: Math.floor(rng() * 100),
      deletions: Math.floor(rng() * 50),
      isBugFix: rng() < 0.3,
      isFeature: rng() < 0.4,
      isMerge: rng() < 0.1,
    });
  }

  // Build tree
  const tree = buildMockTree(files);

  return { files, commits, tree, hotspots };
}

function buildMockTree(files: ParsedFile[]): FileTreeNode {
  const root: FileTreeNode = { name: 'root', path: '.', type: 'directory', children: [] };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const isFile = i === parts.length - 1;

      if (isFile) {
        current.children!.push({
          name: part,
          path: file.path,
          type: 'file',
          metadata: file,
        });
      } else {
        let dir = current.children!.find(c => c.name === part && c.type === 'directory');
        if (!dir) {
          dir = {
            name: part,
            path: parts.slice(0, i + 1).join('/'),
            type: 'directory',
            children: [],
          };
          current.children!.push(dir);
        }
        current = dir;
      }
    }
  }

  return root;
}
