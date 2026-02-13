import { describe, test, expect } from 'bun:test';
import { Project, SyntaxKind } from 'ts-morph';
import {
  analyzeFileComplexity,
  analyzeFunctionComplexities,
  type ComplexityResult,
  type DifficultyTier,
} from '../src/analyzer/ComplexityAnalyzer';

/**
 * Helper: create a ts-morph SourceFile from raw TypeScript source text.
 */
function createSourceFile(code: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  return project.createSourceFile('test.ts', code);
}

// ---------------------------------------------------------------------------
// Difficulty tier mapping
// ---------------------------------------------------------------------------
describe('difficulty tier assignment', () => {
  test('empty file (cyclomatic = 1) -> trivial', () => {
    const sf = createSourceFile('// empty file\n');
    const result = analyzeFileComplexity(sf);
    expect(result.cyclomatic).toBe(1);
    expect(result.difficulty).toBe('trivial');
  });

  test('simple function with no branches -> trivial (1)', () => {
    const sf = createSourceFile(`
      function greet(name: string) {
        return "hello " + name;
      }
    `);
    const result = analyzeFileComplexity(sf);
    expect(result.cyclomatic).toBe(1);
    expect(result.difficulty).toBe('trivial');
  });

  test('cyclomatic 5 -> trivial', () => {
    // 4 if statements = cyclomatic 5 at file level (1 base + 4)
    const sf = createSourceFile(`
      function classify(x: number) {
        if (x > 100) return 'a';
        if (x > 50)  return 'b';
        if (x > 20)  return 'c';
        if (x > 0)   return 'd';
        return 'e';
      }
    `);
    const result = analyzeFileComplexity(sf);
    expect(result.cyclomatic).toBe(5);
    expect(result.difficulty).toBe('trivial');
  });

  test('cyclomatic 6 -> easy', () => {
    // 5 if statements -> 1 + 5 = 6
    const sf = createSourceFile(`
      function classify(x: number) {
        if (x > 100) return 'a';
        if (x > 50)  return 'b';
        if (x > 20)  return 'c';
        if (x > 10)  return 'd';
        if (x > 0)   return 'e';
        return 'f';
      }
    `);
    const result = analyzeFileComplexity(sf);
    expect(result.cyclomatic).toBe(6);
    expect(result.difficulty).toBe('easy');
  });

  test('cyclomatic 10 -> easy', () => {
    // 9 if statements -> 1 + 9 = 10
    const ifs = Array.from({ length: 9 }, (_, i) =>
      `if (x > ${(9 - i) * 10}) return '${String.fromCharCode(97 + i)}';`
    ).join('\n        ');
    const sf = createSourceFile(`
      function classify(x: number) {
        ${ifs}
        return 'z';
      }
    `);
    const result = analyzeFileComplexity(sf);
    expect(result.cyclomatic).toBe(10);
    expect(result.difficulty).toBe('easy');
  });

  test('cyclomatic 11 -> medium', () => {
    const ifs = Array.from({ length: 10 }, (_, i) =>
      `if (x > ${(10 - i) * 10}) return '${String.fromCharCode(97 + i)}';`
    ).join('\n        ');
    const sf = createSourceFile(`
      function classify(x: number) {
        ${ifs}
        return 'z';
      }
    `);
    const result = analyzeFileComplexity(sf);
    expect(result.cyclomatic).toBe(11);
    expect(result.difficulty).toBe('medium');
  });
});

// ---------------------------------------------------------------------------
// Cyclomatic complexity counting
// ---------------------------------------------------------------------------
describe('cyclomatic complexity counting', () => {
  test('counts if statements', () => {
    const sf = createSourceFile(`
      function test(x: number) {
        if (x > 0) return 'pos';
        if (x < 0) return 'neg';
        return 'zero';
      }
    `);
    const result = analyzeFileComplexity(sf);
    // base 1 + 2 if = 3
    expect(result.cyclomatic).toBe(3);
  });

  test('counts for loops', () => {
    const sf = createSourceFile(`
      function test(arr: number[]) {
        for (let i = 0; i < arr.length; i++) {
          console.log(arr[i]);
        }
      }
    `);
    const result = analyzeFileComplexity(sf);
    // base 1 + 1 for = 2
    expect(result.cyclomatic).toBe(2);
  });

  test('counts for-in loops', () => {
    const sf = createSourceFile(`
      function test(obj: Record<string, unknown>) {
        for (const key in obj) {
          console.log(key);
        }
      }
    `);
    const result = analyzeFileComplexity(sf);
    expect(result.cyclomatic).toBe(2);
  });

  test('counts for-of loops', () => {
    const sf = createSourceFile(`
      function test(arr: string[]) {
        for (const item of arr) {
          console.log(item);
        }
      }
    `);
    const result = analyzeFileComplexity(sf);
    expect(result.cyclomatic).toBe(2);
  });

  test('counts while loops', () => {
    const sf = createSourceFile(`
      function test() {
        let i = 0;
        while (i < 10) {
          i++;
        }
      }
    `);
    const result = analyzeFileComplexity(sf);
    expect(result.cyclomatic).toBe(2);
  });

  test('counts do-while loops', () => {
    const sf = createSourceFile(`
      function test() {
        let i = 0;
        do {
          i++;
        } while (i < 10);
      }
    `);
    const result = analyzeFileComplexity(sf);
    expect(result.cyclomatic).toBe(2);
  });

  test('counts switch/case clauses', () => {
    const sf = createSourceFile(`
      function test(x: string) {
        switch (x) {
          case 'a': return 1;
          case 'b': return 2;
          case 'c': return 3;
          default: return 0;
        }
      }
    `);
    const result = analyzeFileComplexity(sf);
    // base 1 + 3 case clauses = 4 (default is DefaultClause not CaseClause)
    expect(result.cyclomatic).toBe(4);
  });

  test('counts catch clauses', () => {
    const sf = createSourceFile(`
      function test() {
        try {
          riskyOp();
        } catch (e) {
          handleError(e);
        }
      }
    `);
    const result = analyzeFileComplexity(sf);
    // base 1 + 1 catch = 2
    expect(result.cyclomatic).toBe(2);
  });

  test('counts && operators', () => {
    const sf = createSourceFile(`
      function test(a: boolean, b: boolean) {
        if (a && b) return true;
        return false;
      }
    `);
    const result = analyzeFileComplexity(sf);
    // base 1 + 1 if + 1 && = 3
    expect(result.cyclomatic).toBe(3);
  });

  test('counts || operators', () => {
    const sf = createSourceFile(`
      function test(a: boolean, b: boolean) {
        if (a || b) return true;
        return false;
      }
    `);
    const result = analyzeFileComplexity(sf);
    // base 1 + 1 if + 1 || = 3
    expect(result.cyclomatic).toBe(3);
  });

  test('counts ternary expressions', () => {
    const sf = createSourceFile(`
      function test(x: number) {
        return x > 0 ? 'pos' : 'non-pos';
      }
    `);
    const result = analyzeFileComplexity(sf);
    // base 1 + 1 ternary = 2
    expect(result.cyclomatic).toBe(2);
  });

  test('combined: multiple decision points', () => {
    const sf = createSourceFile(`
      function complexFn(x: number, y: boolean) {
        if (x > 0) {
          for (let i = 0; i < x; i++) {
            if (y && i > 5) {
              console.log('deep');
            }
          }
        } else {
          while (x < 0) {
            x++;
          }
        }
      }
    `);
    const result = analyzeFileComplexity(sf);
    // base 1 + if + for + if + && + while = 6
    expect(result.cyclomatic).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// Cognitive complexity
// ---------------------------------------------------------------------------
describe('cognitive complexity', () => {
  test('flat function has 0 cognitive complexity', () => {
    const sf = createSourceFile(`
      function greet(name: string) {
        return "hello " + name;
      }
    `);
    const result = analyzeFileComplexity(sf);
    expect(result.cognitive).toBe(0);
  });

  test('single if adds 1 cognitive (structural, 0 nesting)', () => {
    const sf = createSourceFile(`
      function test(x: number) {
        if (x > 0) return 'pos';
        return 'neg';
      }
    `);
    const result = analyzeFileComplexity(sf);
    expect(result.cognitive).toBeGreaterThanOrEqual(1);
  });

  test('nested if adds nesting penalty', () => {
    const sf = createSourceFile(`
      function test(x: number, y: number) {
        if (x > 0) {
          if (y > 0) {
            return 'both positive';
          }
        }
      }
    `);
    const result = analyzeFileComplexity(sf);
    // outer if: +1 (structural) + 0 (nesting=0) = 1
    // inner if: +1 (structural) + 1 (nesting=1) = 2
    // Total >= 3
    expect(result.cognitive).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// LOC counting
// ---------------------------------------------------------------------------
describe('loc counting', () => {
  test('counts lines of code', () => {
    const code = `const a = 1;
const b = 2;
const c = a + b;
`;
    const sf = createSourceFile(code);
    const result = analyzeFileComplexity(sf);
    expect(result.loc).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// Per-function analysis
// ---------------------------------------------------------------------------
describe('analyzeFunctionComplexities', () => {
  test('returns empty array for file with no functions', () => {
    const sf = createSourceFile('const x = 1;\n');
    const fns = analyzeFunctionComplexities(sf);
    expect(fns).toEqual([]);
  });

  test('analyzes named functions', () => {
    const sf = createSourceFile(`
      function simple() { return 1; }
      function branchy(x: number) {
        if (x > 0) return 'pos';
        if (x < 0) return 'neg';
        return 'zero';
      }
    `);
    const fns = analyzeFunctionComplexities(sf);
    expect(fns.length).toBe(2);

    const simple = fns.find(f => f.name === 'simple');
    expect(simple).toBeDefined();
    expect(simple!.complexity.cyclomatic).toBe(1);

    const branchy = fns.find(f => f.name === 'branchy');
    expect(branchy).toBeDefined();
    expect(branchy!.complexity.cyclomatic).toBe(3);
  });

  test('analyzes class methods', () => {
    const sf = createSourceFile(`
      class Calculator {
        add(a: number, b: number) { return a + b; }
        divide(a: number, b: number) {
          if (b === 0) throw new Error('div by zero');
          return a / b;
        }
      }
    `);
    const fns = analyzeFunctionComplexities(sf);
    expect(fns.length).toBe(2);

    const add = fns.find(f => f.name === 'Calculator.add');
    expect(add).toBeDefined();
    expect(add!.complexity.cyclomatic).toBe(1);

    const divide = fns.find(f => f.name === 'Calculator.divide');
    expect(divide).toBeDefined();
    expect(divide!.complexity.cyclomatic).toBe(2);
  });

  test('analyzes arrow functions assigned to const', () => {
    const sf = createSourceFile(`
      const isPositive = (x: number) => x > 0;
      const classify = (x: number) => {
        if (x > 0) return 'pos';
        return 'non-pos';
      };
    `);
    const fns = analyzeFunctionComplexities(sf);
    expect(fns.length).toBe(2);

    const isPos = fns.find(f => f.name === 'isPositive');
    expect(isPos).toBeDefined();
    expect(isPos!.complexity.cyclomatic).toBe(1);

    const classify = fns.find(f => f.name === 'classify');
    expect(classify).toBeDefined();
    expect(classify!.complexity.cyclomatic).toBe(2);
  });

  test('records start and end lines', () => {
    const sf = createSourceFile(`function test() {
  return 1;
}
`);
    const fns = analyzeFunctionComplexities(sf);
    expect(fns.length).toBe(1);
    expect(fns[0].startLine).toBe(1);
    expect(fns[0].endLine).toBe(3);
  });

  test('each function gets its own difficulty tier', () => {
    const ifs = Array.from({ length: 10 }, (_, i) =>
      `if (x > ${i}) console.log(${i});`
    ).join('\n        ');
    const sf = createSourceFile(`
      function simple() { return 1; }
      function complex(x: number) {
        ${ifs}
      }
    `);
    const fns = analyzeFunctionComplexities(sf);
    const simple = fns.find(f => f.name === 'simple')!;
    const complex = fns.find(f => f.name === 'complex')!;
    expect(simple.complexity.difficulty).toBe('trivial');
    // 1 + 10 = 11 -> medium
    expect(complex.complexity.difficulty).toBe('medium');
  });
});
