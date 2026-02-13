/**
 * ComplexityAnalyzer — Cyclomatic & cognitive complexity via ts-morph
 *
 * Cyclomatic: count decision points (if, for, while, case, catch, &&, ||, ternary)
 * Cognitive: structural increment + nesting penalty (SonarSource method)
 */

import { SyntaxKind, type Node, type SourceFile } from 'ts-morph';

export interface ComplexityResult {
  cyclomatic: number;
  cognitive: number;
  loc: number;
  /** Game difficulty tier derived from cyclomatic complexity */
  difficulty: DifficultyTier;
}

export type DifficultyTier =
  | 'trivial'     // 1-5
  | 'easy'        // 6-10
  | 'medium'      // 11-20
  | 'hard'        // 21-50
  | 'epic'        // 51-100
  | 'legendary';  // 100+

export interface FunctionComplexity {
  name: string;
  startLine: number;
  endLine: number;
  complexity: ComplexityResult;
}

// SyntaxKinds that increment cyclomatic complexity
const CYCLOMATIC_KINDS = new Set([
  SyntaxKind.IfStatement,
  SyntaxKind.ConditionalExpression,
  SyntaxKind.CaseClause,
  SyntaxKind.ForStatement,
  SyntaxKind.ForInStatement,
  SyntaxKind.ForOfStatement,
  SyntaxKind.WhileStatement,
  SyntaxKind.DoStatement,
  SyntaxKind.CatchClause,
]);

// Binary operators that increment cyclomatic complexity
const LOGICAL_OPERATORS = new Set([
  SyntaxKind.AmpersandAmpersandToken,
  SyntaxKind.BarBarToken,
]);

// Kinds that increment cognitive complexity and add nesting
const COGNITIVE_NESTING_KINDS = new Set([
  SyntaxKind.IfStatement,
  SyntaxKind.ForStatement,
  SyntaxKind.ForInStatement,
  SyntaxKind.ForOfStatement,
  SyntaxKind.WhileStatement,
  SyntaxKind.DoStatement,
  SyntaxKind.CatchClause,
  SyntaxKind.SwitchStatement,
  SyntaxKind.ConditionalExpression,
]);

/**
 * Calculate complexity for an entire source file.
 */
export function analyzeFileComplexity(sourceFile: SourceFile): ComplexityResult {
  const cyclomatic = calculateCyclomatic(sourceFile);
  const cognitive = calculateCognitive(sourceFile);
  const loc = sourceFile.getEndLineNumber();

  return {
    cyclomatic,
    cognitive,
    loc,
    difficulty: toDifficulty(cyclomatic),
  };
}

/**
 * Calculate complexity per function/method in a source file.
 */
export function analyzeFunctionComplexities(sourceFile: SourceFile): FunctionComplexity[] {
  const results: FunctionComplexity[] = [];

  // Top-level functions
  for (const fn of sourceFile.getFunctions()) {
    results.push({
      name: fn.getName() || '<anonymous>',
      startLine: fn.getStartLineNumber(),
      endLine: fn.getEndLineNumber(),
      complexity: {
        cyclomatic: calculateCyclomatic(fn),
        cognitive: calculateCognitive(fn),
        loc: fn.getEndLineNumber() - fn.getStartLineNumber() + 1,
        difficulty: toDifficulty(calculateCyclomatic(fn)),
      },
    });
  }

  // Class methods
  for (const cls of sourceFile.getClasses()) {
    for (const method of cls.getMethods()) {
      results.push({
        name: `${cls.getName() || '<anon>'}.${method.getName()}`,
        startLine: method.getStartLineNumber(),
        endLine: method.getEndLineNumber(),
        complexity: {
          cyclomatic: calculateCyclomatic(method),
          cognitive: calculateCognitive(method),
          loc: method.getEndLineNumber() - method.getStartLineNumber() + 1,
          difficulty: toDifficulty(calculateCyclomatic(method)),
        },
      });
    }
  }

  // Arrow functions / variable declarations with function expressions
  for (const varDecl of sourceFile.getVariableDeclarations()) {
    const init = varDecl.getInitializer();
    if (
      init &&
      (init.getKind() === SyntaxKind.ArrowFunction ||
        init.getKind() === SyntaxKind.FunctionExpression)
    ) {
      results.push({
        name: varDecl.getName(),
        startLine: varDecl.getStartLineNumber(),
        endLine: varDecl.getEndLineNumber(),
        complexity: {
          cyclomatic: calculateCyclomatic(init),
          cognitive: calculateCognitive(init),
          loc: init.getEndLineNumber() - init.getStartLineNumber() + 1,
          difficulty: toDifficulty(calculateCyclomatic(init)),
        },
      });
    }
  }

  return results;
}

/**
 * Cyclomatic complexity: 1 + count of decision points + logical operators
 */
function calculateCyclomatic(node: Node): number {
  let complexity = 1;

  node.forEachDescendant((child) => {
    if (CYCLOMATIC_KINDS.has(child.getKind())) {
      complexity++;
    }

    // Count && and || in binary expressions
    if (child.getKind() === SyntaxKind.BinaryExpression) {
      const opToken = child.getChildAtIndex(1);
      if (opToken && LOGICAL_OPERATORS.has(opToken.getKind())) {
        complexity++;
      }
    }
  });

  return complexity;
}

/**
 * Cognitive complexity: structural increments + nesting penalties
 */
function calculateCognitive(node: Node): number {
  let total = 0;

  function walk(n: Node, nesting: number) {
    const kind = n.getKind();

    if (COGNITIVE_NESTING_KINDS.has(kind)) {
      // Structural increment
      total += 1;
      // Nesting increment (but not for top-level)
      total += nesting;

      // Recurse children with increased nesting
      for (const child of n.getChildren()) {
        walk(child, nesting + 1);
      }
      return;
    }

    // else/else if: +1 structural, no nesting increment
    if (kind === SyntaxKind.ElseKeyword) {
      total += 1;
    }

    // Logical operator sequences: +1 per change in operator type
    if (kind === SyntaxKind.BinaryExpression) {
      const opToken = n.getChildAtIndex(1);
      if (opToken && LOGICAL_OPERATORS.has(opToken.getKind())) {
        total += 1;
      }
    }

    for (const child of n.getChildren()) {
      walk(child, nesting);
    }
  }

  walk(node, 0);
  return total;
}

function toDifficulty(cyclomatic: number): DifficultyTier {
  if (cyclomatic <= 5) return 'trivial';
  if (cyclomatic <= 10) return 'easy';
  if (cyclomatic <= 20) return 'medium';
  if (cyclomatic <= 50) return 'hard';
  if (cyclomatic <= 100) return 'epic';
  return 'legendary';
}
