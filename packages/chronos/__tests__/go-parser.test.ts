import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import {
  parseGoFile,
  stripGoCommentsAndStrings,
  findFunctions,
  countCyclomatic,
  countCognitive,
} from '../src/parser/GoParser';

// ── Helpers ──────────────────────────────────────────────────────────────────

const TMP_DIR = join(import.meta.dir, '.tmp-go-parser');

function writeGoFile(name: string, content: string): string {
  const dir = join(TMP_DIR, name, '..');
  mkdirSync(dir, { recursive: true });
  const path = join(TMP_DIR, name);
  writeFileSync(path, content, 'utf-8');
  return path;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GoParser', () => {
  beforeAll(() => {
    mkdirSync(TMP_DIR, { recursive: true });
  });

  afterAll(() => {
    rmSync(TMP_DIR, { recursive: true, force: true });
  });

  // ── stripGoCommentsAndStrings ────────────────────────────────────────────

  describe('stripGoCommentsAndStrings', () => {
    test('removes line comments', () => {
      const result = stripGoCommentsAndStrings('x := 1 // this is if\ny := 2');
      expect(result).not.toContain('if');
      expect(result).toContain('x := 1');
      expect(result).toContain('y := 2');
    });

    test('removes block comments', () => {
      const result = stripGoCommentsAndStrings('x := 1 /* if for case */ y := 2');
      expect(result).not.toContain('if');
      expect(result).not.toContain('for');
      expect(result).toContain('x := 1');
      expect(result).toContain('y := 2');
    });

    test('removes interpreted strings', () => {
      const result = stripGoCommentsAndStrings('x := "if for case"');
      expect(result).not.toContain('if');
    });

    test('removes raw strings', () => {
      const result = stripGoCommentsAndStrings('x := `if for\ncase`');
      expect(result).not.toContain('if');
      expect(result).not.toContain('case');
    });

    test('handles escaped quotes in strings', () => {
      const result = stripGoCommentsAndStrings('x := "hello \\"if\\" world"');
      expect(result).not.toContain('if');
    });

    test('preserves newlines in block comments', () => {
      const input = 'a\n/* comment\nwith\nnewlines */\nb';
      const result = stripGoCommentsAndStrings(input);
      const inputLines = input.split('\n').length;
      const resultLines = result.split('\n').length;
      expect(resultLines).toBe(inputLines);
    });
  });

  // ── findFunctions ────────────────────────────────────────────────────────

  describe('findFunctions', () => {
    test('detects simple function', () => {
      const source = `package main

func main() {
\tfmt.Println("hello")
}
`;
      const cleaned = stripGoCommentsAndStrings(source);
      const fns = findFunctions(source, cleaned);
      expect(fns).toHaveLength(1);
      expect(fns[0].name).toBe('main');
      expect(fns[0].startLine).toBe(3);
      expect(fns[0].endLine).toBe(5);
    });

    test('detects method with receiver', () => {
      const source = `package server

func (s *Server) Start(ctx context.Context) error {
\ts.running = true
\treturn nil
}
`;
      const cleaned = stripGoCommentsAndStrings(source);
      const fns = findFunctions(source, cleaned);
      expect(fns).toHaveLength(1);
      expect(fns[0].name).toBe('Start');
    });

    test('detects generic function', () => {
      const source = `package util

func Map[T any](items []T, fn func(T) T) []T {
\tresult := make([]T, len(items))
\tfor i, item := range items {
\t\tresult[i] = fn(item)
\t}
\treturn result
}
`;
      const cleaned = stripGoCommentsAndStrings(source);
      const fns = findFunctions(source, cleaned);
      expect(fns).toHaveLength(1);
      expect(fns[0].name).toBe('Map');
    });

    test('detects multiple functions', () => {
      const source = `package main

func foo() {
\tx := 1
\t_ = x
}

func bar(a int, b int) int {
\treturn a + b
}

func baz() string {
\treturn "hello"
}
`;
      const cleaned = stripGoCommentsAndStrings(source);
      const fns = findFunctions(source, cleaned);
      expect(fns).toHaveLength(3);
      expect(fns.map(f => f.name)).toEqual(['foo', 'bar', 'baz']);
    });

    test('handles value receiver', () => {
      const source = `package main

func (p Point) Distance() float64 {
\treturn math.Sqrt(p.X*p.X + p.Y*p.Y)
}
`;
      const cleaned = stripGoCommentsAndStrings(source);
      const fns = findFunctions(source, cleaned);
      expect(fns).toHaveLength(1);
      expect(fns[0].name).toBe('Distance');
    });
  });

  // ── countCyclomatic ──────────────────────────────────────────────────────

  describe('countCyclomatic', () => {
    test('base complexity is 1 for empty body', () => {
      expect(countCyclomatic('')).toBe(1);
    });

    test('counts if statements', () => {
      const body = 'if x > 0 {\n\treturn x\n}';
      expect(countCyclomatic(body)).toBe(2); // 1 + 1 if
    });

    test('counts for loops', () => {
      const body = 'for i := 0; i < n; i++ {\n\tx += i\n}';
      expect(countCyclomatic(body)).toBe(2); // 1 + 1 for
    });

    test('counts case clauses', () => {
      const body = `switch x {
case 1:
\treturn "one"
case 2:
\treturn "two"
case 3:
\treturn "three"
}`;
      expect(countCyclomatic(body)).toBe(4); // 1 + 3 cases
    });

    test('counts && and || operators', () => {
      const body = 'if a && b || c {\n\treturn true\n}';
      expect(countCyclomatic(body)).toBe(4); // 1 + 1 if + 1 && + 1 ||
    });

    test('counts select', () => {
      const body = `select {
case msg := <-ch:
\tfmt.Println(msg)
case <-done:
\treturn
}`;
      // 1 base + 1 select + 2 case
      expect(countCyclomatic(body)).toBe(4);
    });

    test('does not count keywords in comments (after stripping)', () => {
      const raw = '// if for case\nx := 1';
      const cleaned = stripGoCommentsAndStrings(raw);
      expect(countCyclomatic(cleaned)).toBe(1);
    });

    test('does not count keywords in strings (after stripping)', () => {
      const raw = 'x := "if for case"';
      const cleaned = stripGoCommentsAndStrings(raw);
      expect(countCyclomatic(cleaned)).toBe(1);
    });
  });

  // ── countCognitive ─────────────────────────────────────────────────────

  describe('countCognitive', () => {
    test('zero for empty body', () => {
      expect(countCognitive([])).toBe(0);
    });

    test('if at depth 0 adds 1', () => {
      // Body lines inside a function — 1 tab is baseline
      const lines = ['\tif x > 0 {', '\t\treturn x', '\t}'];
      expect(countCognitive(lines)).toBe(1); // 1 + depth(0)
    });

    test('nested if adds 1 + depth', () => {
      const lines = [
        '\tif x > 0 {',       // depth 0 → +1
        '\t\tif y > 0 {',     // depth 1 → +2
        '\t\t\treturn x + y',
        '\t\t}',
        '\t}',
      ];
      expect(countCognitive(lines)).toBe(3); // 1 + 2
    });

    test('for loop contributes to cognitive', () => {
      const lines = [
        '\tfor i := 0; i < n; i++ {',  // depth 0 → +1
        '\t\tif items[i] > 0 {',        // depth 1 → +2
        '\t\t\tcount++',
        '\t\t}',
        '\t}',
      ];
      expect(countCognitive(lines)).toBe(3); // 1 + 2
    });

    test('deeply nested adds significant cognitive load', () => {
      const lines = [
        '\tif a {',             // depth 0 → +1
        '\t\tfor b {',          // depth 1 → +2
        '\t\t\tif c {',         // depth 2 → +3
        '\t\t\t\tswitch d {',   // depth 3 → +4
        '\t\t\t\t}',
        '\t\t\t}',
        '\t\t}',
        '\t}',
      ];
      expect(countCognitive(lines)).toBe(10); // 1 + 2 + 3 + 4
    });

    test('does not count keywords in comments', () => {
      const lines = ['\t// if for switch select'];
      expect(countCognitive(lines)).toBe(0);
    });
  });

  // ── parseGoFile (integration) ──────────────────────────────────────────

  describe('parseGoFile', () => {
    test('returns null for non-.go file', () => {
      const path = writeGoFile('test.ts', 'const x = 1;');
      expect(parseGoFile(path, TMP_DIR)).toBeNull();
    });

    test('returns null for missing file', () => {
      expect(parseGoFile('/nonexistent/file.go', '/nonexistent')).toBeNull();
    });

    test('parses simple Go file', () => {
      const source = `package main

import "fmt"

func main() {
\tif len(os.Args) > 1 {
\t\tfmt.Println(os.Args[1])
\t}
}
`;
      const path = writeGoFile('simple.go', source);
      const result = parseGoFile(path, TMP_DIR);

      expect(result).not.toBeNull();
      expect(result!.file.language).toBe('go');
      expect(result!.file.path).toBe('simple.go');
      expect(result!.file.complexity).toBeGreaterThan(0);
      expect(result!.file.loc).toBe(source.split('\n').length);
      expect(result!.functions).toHaveLength(1);
      expect(result!.functions[0].name).toBe('main');
      expect(result!.functions[0].complexity.cyclomatic).toBe(2); // 1 + 1 if
    });

    test('parses file with multiple functions and methods', () => {
      const source = `package server

type Server struct {
\trunning bool
}

func New() *Server {
\treturn &Server{}
}

func (s *Server) Start() error {
\tif s.running {
\t\treturn errors.New("already running")
\t}
\ts.running = true
\treturn nil
}

func (s *Server) Stop() {
\ts.running = false
}
`;
      const path = writeGoFile('server.go', source);
      const result = parseGoFile(path, TMP_DIR);

      expect(result).not.toBeNull();
      expect(result!.functions).toHaveLength(3);
      expect(result!.functions.map(f => f.name)).toEqual(['New', 'Start', 'Stop']);
      // Start has an if, so cyclomatic = 2
      const startFn = result!.functions.find(f => f.name === 'Start')!;
      expect(startFn.complexity.cyclomatic).toBe(2);
    });

    test('handles file with no functions', () => {
      const source = `package types

type Config struct {
\tHost string
\tPort int
}

var DefaultConfig = Config{
\tHost: "localhost",
\tPort: 8080,
}
`;
      const path = writeGoFile('types.go', source);
      const result = parseGoFile(path, TMP_DIR);

      expect(result).not.toBeNull();
      // File-level complexity is 1 when no functions (the fallback)
      expect(result!.file.complexity).toBe(1);
      expect(result!.functions).toHaveLength(0);
    });

    test('assigns correct difficulty tiers', () => {
      // Build a function with many decision points
      const cases = Array.from({ length: 25 }, (_, i) =>
        `\tcase ${i}:\n\t\treturn ${i}`,
      ).join('\n');
      const source = `package main

func complex(x int) int {
\tswitch x {
${cases}
\t}
\treturn -1
}
`;
      const path = writeGoFile('complex.go', source);
      const result = parseGoFile(path, TMP_DIR);

      expect(result).not.toBeNull();
      const fn = result!.functions[0];
      // 1 base + 25 cases = 26
      expect(fn.complexity.cyclomatic).toBe(26);
      expect(fn.complexity.difficulty).toBe('hard');
    });

    test('relative path strips repoRoot', () => {
      const subDir = join(TMP_DIR, 'sub', 'dir');
      mkdirSync(subDir, { recursive: true });
      const source = `package main\n\nfunc main() {}\n`;
      const fullPath = join(subDir, 'main.go');
      writeFileSync(fullPath, source, 'utf-8');

      const result = parseGoFile(fullPath, TMP_DIR);

      expect(result).not.toBeNull();
      expect(result!.file.path).toBe('sub/dir/main.go');
    });
  });

  // ── Real-world smoke test ──────────────────────────────────────────────

  describe('smoke test (opentelemetry-collector)', () => {
    const serviceGoPath =
      `${process.env.HOME}/.chronos/repos/open-telemetry/opentelemetry-collector/service/service.go`;

    test('parses service.go with non-zero complexity', () => {
      let result: ReturnType<typeof parseGoFile>;
      try {
        result = parseGoFile(
          serviceGoPath,
          `${process.env.HOME}/.chronos/repos/open-telemetry/opentelemetry-collector`,
        );
      } catch {
        // Skip if repo isn't cloned
        return;
      }

      if (!result) return; // File not present

      expect(result.file.language).toBe('go');
      expect(result.file.complexity).toBeGreaterThan(1);
      expect(result.functions.length).toBeGreaterThan(0);
      expect(result.file.loc).toBeGreaterThan(10);

      // At least one function should have non-trivial complexity
      const maxCyc = Math.max(...result.functions.map(f => f.complexity.cyclomatic));
      expect(maxCyc).toBeGreaterThan(1);
    });
  });
});
