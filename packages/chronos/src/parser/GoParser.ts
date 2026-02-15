/**
 * GoParser — Regex-based Go file parser
 *
 * Exploits gofmt-enforced formatting: top-level `func` at column 0,
 * tabs for nesting, predictable brace placement. Produces the same
 * ASTParseResult shape as the ts-morph TS/JS path.
 */

import { readFileSync, statSync } from 'fs';
import { extname } from 'path';
import type { ParsedFile } from '@dendrovia/shared';
import type { ASTParseResult } from './ASTParser.js';
import type { FunctionComplexity } from '../analyzer/ComplexityAnalyzer.js';
import { toDifficulty } from '../analyzer/ComplexityAnalyzer.js';

// ── Types ────────────────────────────────────────────────────────────────────

interface GoFunction {
  name: string;
  startLine: number; // 1-based
  endLine: number;   // 1-based
  body: string;      // raw source of the function body (between braces)
  bodyLines: string[];
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a Go source file and return AST-like results with complexity metrics.
 * Returns null if the file can't be read or has no functions.
 */
export function parseGoFile(filePath: string, repoRoot: string): ASTParseResult | null {
  if (extname(filePath).toLowerCase() !== '.go') return null;

  let source: string;
  try {
    source = readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  const lines = source.split('\n');
  const loc = lines.length;

  const cleaned = stripGoCommentsAndStrings(source);
  const functions = findFunctions(source, cleaned);

  const funcResults: FunctionComplexity[] = functions.map(fn => {
    const cleanedBody = stripGoCommentsAndStrings(fn.body);
    const cyc = countCyclomatic(cleanedBody);
    const cog = countCognitive(fn.bodyLines);
    return {
      name: fn.name,
      startLine: fn.startLine,
      endLine: fn.endLine,
      complexity: {
        cyclomatic: cyc,
        cognitive: cog,
        loc: fn.endLine - fn.startLine + 1,
        difficulty: toDifficulty(cyc),
      },
    };
  });

  // File-level complexity = sum of function complexities (Go has no top-level expressions)
  const fileCyclomatic = funcResults.reduce((sum, f) => sum + f.complexity.cyclomatic, 0) || 1;

  let lastModified: Date;
  try {
    lastModified = statSync(filePath).mtime;
  } catch {
    lastModified = new Date();
  }

  const hash = simpleHash(source);

  const relativePath = filePath.startsWith(repoRoot)
    ? filePath.slice(repoRoot.length).replace(/^\//, '')
    : filePath;

  const file: ParsedFile = {
    path: relativePath,
    hash,
    language: 'go',
    complexity: fileCyclomatic,
    loc,
    lastModified,
    author: '',
  };

  return { file, functions: funcResults };
}

// ── Stripping comments and strings ───────────────────────────────────────────

/**
 * Replace all string literals and comments with whitespace-equivalent placeholders.
 * This prevents false keyword matches inside strings/comments.
 */
export function stripGoCommentsAndStrings(source: string): string {
  const result: string[] = [];
  let i = 0;

  while (i < source.length) {
    // Line comment
    if (source[i] === '/' && source[i + 1] === '/') {
      const end = source.indexOf('\n', i);
      if (end === -1) {
        result.push(' '.repeat(source.length - i));
        break;
      }
      result.push(' '.repeat(end - i));
      i = end;
      continue;
    }

    // Block comment
    if (source[i] === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end === -1) {
        // Unterminated — blank the rest, preserving newlines
        for (let j = i; j < source.length; j++) {
          result.push(source[j] === '\n' ? '\n' : ' ');
        }
        break;
      }
      for (let j = i; j < end + 2; j++) {
        result.push(source[j] === '\n' ? '\n' : ' ');
      }
      i = end + 2;
      continue;
    }

    // Raw string literal (backtick)
    if (source[i] === '`') {
      const end = source.indexOf('`', i + 1);
      if (end === -1) {
        for (let j = i; j < source.length; j++) {
          result.push(source[j] === '\n' ? '\n' : ' ');
        }
        break;
      }
      for (let j = i; j <= end; j++) {
        result.push(source[j] === '\n' ? '\n' : ' ');
      }
      i = end + 1;
      continue;
    }

    // Interpreted string literal (double quote)
    if (source[i] === '"') {
      result.push(' ');
      i++;
      while (i < source.length && source[i] !== '"') {
        if (source[i] === '\\') {
          result.push(' ');
          i++;
        }
        if (i < source.length) {
          result.push(source[i] === '\n' ? '\n' : ' ');
          i++;
        }
      }
      if (i < source.length) {
        result.push(' '); // closing quote
        i++;
      }
      continue;
    }

    // Rune literal (single quote)
    if (source[i] === '\'') {
      result.push(' ');
      i++;
      while (i < source.length && source[i] !== '\'') {
        if (source[i] === '\\') {
          result.push(' ');
          i++;
        }
        if (i < source.length) {
          result.push(' ');
          i++;
        }
      }
      if (i < source.length) {
        result.push(' '); // closing quote
        i++;
      }
      continue;
    }

    result.push(source[i]);
    i++;
  }

  return result.join('');
}

// ── Function detection ───────────────────────────────────────────────────────

/**
 * Column-0 func regex: matches top-level functions and methods.
 * Handles:
 *   func Foo(
 *   func (s *Server) Foo(
 *   func Map[T any](
 *   func (s *Server) Map[T any](
 */
const FUNC_RE = /^func\s+(?:\([^)]*\)\s+)?(\w+)\s*(?:\[.*?\])?\s*\(/gm;

/**
 * Detect all top-level functions in Go source and determine their boundaries
 * via brace matching on the original source.
 */
export function findFunctions(source: string, cleaned: string): GoFunction[] {
  const lines = source.split('\n');
  const functions: GoFunction[] = [];

  let match: RegExpExecArray | null;
  FUNC_RE.lastIndex = 0;

  while ((match = FUNC_RE.exec(cleaned)) !== null) {
    const name = match[1];
    const matchOffset = match.index;

    // Find the line number (1-based) of the match
    const startLine = source.slice(0, matchOffset).split('\n').length;

    // Find the opening brace from the match position in the original source
    const openBrace = source.indexOf('{', matchOffset);
    if (openBrace === -1) continue;

    // Brace-match to find the closing brace (using original source, skip strings/comments)
    const closeBrace = findMatchingBrace(source, openBrace);
    if (closeBrace === -1) continue;

    const endLine = source.slice(0, closeBrace + 1).split('\n').length;

    const body = source.slice(openBrace + 1, closeBrace);
    const bodyLines = body.split('\n');

    functions.push({ name, startLine, endLine, body, bodyLines });
  }

  return functions;
}

/**
 * Find the matching closing brace for an opening brace, skipping
 * strings, comments, and rune literals.
 */
function findMatchingBrace(source: string, openPos: number): number {
  let depth = 0;
  let i = openPos;

  while (i < source.length) {
    const ch = source[i];

    // Skip line comments
    if (ch === '/' && source[i + 1] === '/') {
      const end = source.indexOf('\n', i);
      i = end === -1 ? source.length : end;
      continue;
    }

    // Skip block comments
    if (ch === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      continue;
    }

    // Skip raw strings
    if (ch === '`') {
      const end = source.indexOf('`', i + 1);
      i = end === -1 ? source.length : end + 1;
      continue;
    }

    // Skip interpreted strings
    if (ch === '"') {
      i++;
      while (i < source.length && source[i] !== '"') {
        if (source[i] === '\\') i++;
        i++;
      }
      i++; // past closing quote
      continue;
    }

    // Skip rune literals
    if (ch === '\'') {
      i++;
      while (i < source.length && source[i] !== '\'') {
        if (source[i] === '\\') i++;
        i++;
      }
      i++; // past closing quote
      continue;
    }

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }

    i++;
  }

  return -1;
}

// ── Complexity counting ──────────────────────────────────────────────────────

/** Tokens that add to cyclomatic complexity */
const CYCLOMATIC_RE = /\b(if|for|case|select)\b|&&|\|\|/g;

/**
 * Cyclomatic complexity: 1 + count of decision points in cleaned source.
 */
export function countCyclomatic(cleanedBody: string): number {
  let count = 1;
  let m: RegExpExecArray | null;
  CYCLOMATIC_RE.lastIndex = 0;
  while ((m = CYCLOMATIC_RE.exec(cleanedBody)) !== null) {
    count++;
  }
  return count;
}

/** Tokens that add structural + nesting to cognitive complexity */
const COGNITIVE_RE = /\b(if|for|switch|select)\b/g;

/**
 * Cognitive complexity: each if/for/switch/select adds (1 + nesting depth).
 * gofmt guarantees tabs = nesting level, so we count leading tabs.
 *
 * Takes the raw (un-stripped) body lines so we can count tabs accurately,
 * but we strip each line's comments/strings before keyword scanning.
 */
export function countCognitive(bodyLines: string[]): number {
  let total = 0;

  for (const line of bodyLines) {
    // Count leading tabs (gofmt nesting indicator)
    // Subtract 1 because function body is indented 1 tab at baseline
    const tabMatch = line.match(/^\t*/);
    const tabs = tabMatch ? tabMatch[0].length : 0;
    const depth = Math.max(0, tabs - 1);

    // Strip strings/comments from this line before scanning
    const cleanLine = stripGoCommentsAndStrings(line);

    COGNITIVE_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = COGNITIVE_RE.exec(cleanLine)) !== null) {
      total += 1 + depth;
    }
  }

  return total;
}

// ── Utilities ────────────────────────────────────────────────────────────────

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
