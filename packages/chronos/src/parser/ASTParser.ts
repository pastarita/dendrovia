/**
 * ASTParser — TypeScript/JavaScript code structure extraction via ts-morph
 *
 * Parses source files to produce ParsedFile objects with complexity metrics.
 * Uses skipFileDependencyResolution for maximum performance.
 */

import { Project, type SourceFile } from 'ts-morph';
import { statSync } from 'fs';
import { extname } from 'path';
import type { ParsedFile } from '@dendrovia/shared';
import { analyzeFileComplexity, type FunctionComplexity, analyzeFunctionComplexities } from '../analyzer/ComplexityAnalyzer';
import { parseGoFile } from './GoParser';

/** Languages we can parse with ts-morph */
const PARSEABLE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs',
  '.go',
]);

/** Extension → language name */
const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.json': 'json',
  '.md': 'markdown',
  '.css': 'css',
  '.scss': 'scss',
  '.html': 'html',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.java': 'java',
  '.rb': 'ruby',
  '.sh': 'shell',
  '.bash': 'shell',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.toml': 'toml',
  '.sql': 'sql',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.glsl': 'glsl',
  '.wgsl': 'wgsl',
};

export interface ASTParseResult {
  file: ParsedFile;
  functions: FunctionComplexity[];
}

/**
 * Create a shared ts-morph Project instance.
 * Reuse across multiple file parses to avoid re-init overhead.
 */
export function createProject(): Project {
  return new Project({
    compilerOptions: {
      allowJs: true,
      checkJs: false,
      noEmit: true,
    },
    skipFileDependencyResolution: true,
    skipLoadingLibFiles: true,
    skipAddingFilesFromTsConfig: true,
  });
}

/**
 * Detect language from file extension.
 */
export function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] || 'unknown';
}

/**
 * Check if we can perform AST analysis on a file.
 */
export function canParse(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return PARSEABLE_EXTENSIONS.has(ext);
}

/**
 * Parse a single file and extract its structure + complexity.
 */
export function parseFile(
  project: Project,
  filePath: string,
  repoRoot: string,
): ASTParseResult | null {
  if (!canParse(filePath)) return null;

  // Go files use regex-based parser (not ts-morph)
  if (extname(filePath).toLowerCase() === '.go') {
    return parseGoFile(filePath, repoRoot);
  }

  let sourceFile: SourceFile;
  try {
    sourceFile = project.addSourceFileAtPath(filePath);
  } catch {
    // File may not exist or may have syntax errors too severe to parse
    return null;
  }

  try {
    const complexity = analyzeFileComplexity(sourceFile);
    const functions = analyzeFunctionComplexities(sourceFile);

    let lastModified: Date;
    try {
      lastModified = statSync(filePath).mtime;
    } catch {
      lastModified = new Date();
    }

    // Compute content hash
    const content = sourceFile.getFullText();
    const hash = simpleHash(content);

    // Make path relative to repo root
    const relativePath = filePath.startsWith(repoRoot)
      ? filePath.slice(repoRoot.length).replace(/^\//, '')
      : filePath;

    const file: ParsedFile = {
      path: relativePath,
      hash,
      language: detectLanguage(filePath),
      complexity: complexity.cyclomatic,
      loc: complexity.loc,
      lastModified,
      author: '', // Filled in later from git blame
    };

    return { file, functions };
  } finally {
    // Remove from project to free memory
    project.removeSourceFile(sourceFile);
  }
}

/**
 * Parse all parseable files from a list of paths.
 */
export function parseFiles(
  filePaths: string[],
  repoRoot: string,
): ASTParseResult[] {
  const project = createProject();
  const results: ASTParseResult[] = [];

  for (const filePath of filePaths) {
    if (!canParse(filePath)) continue;

    const fullPath = filePath.startsWith('/')
      ? filePath
      : `${repoRoot}/${filePath}`;

    const result = parseFile(project, fullPath, repoRoot);
    if (result) results.push(result);
  }

  return results;
}

/**
 * Build a minimal ParsedFile for files we can't AST-parse
 * (JSON, Markdown, images, etc.)
 */
export function buildStubFile(
  filePath: string,
  repoRoot: string,
): ParsedFile {
  const fullPath = filePath.startsWith('/')
    ? filePath
    : `${repoRoot}/${filePath}`;

  let loc = 0;
  let lastModified = new Date();
  let hash = '00000000';

  try {
    const stat = statSync(fullPath);
    lastModified = stat.mtime;

    // Count lines for text files
    const content = require('fs').readFileSync(fullPath, 'utf-8');
    loc = content.split('\n').length;
    hash = simpleHash(content);
  } catch {
    // Binary file or doesn't exist
  }

  const relativePath = filePath.startsWith(repoRoot)
    ? filePath.slice(repoRoot.length).replace(/^\//, '')
    : filePath;

  return {
    path: relativePath,
    hash,
    language: detectLanguage(filePath),
    complexity: 0,
    loc,
    lastModified,
    author: '',
  };
}

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
