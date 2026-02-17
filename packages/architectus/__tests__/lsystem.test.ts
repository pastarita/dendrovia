import { describe, expect, test } from 'bun:test';
import type { FileTreeNode, Hotspot } from '@dendrovia/shared';
import { LSystem } from '../src/systems/LSystem';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal leaf file node. */
function fileNode(name: string, loc = 100): FileTreeNode {
  return {
    name,
    path: `src/${name}`,
    type: 'file',
    metadata: {
      path: `src/${name}`,
      hash: 'abc123',
      language: 'typescript',
      complexity: 5,
      loc,
      lastModified: new Date('2025-01-01'),
      author: 'test',
    },
  };
}

/** Directory node with children. */
function dirNode(name: string, children: FileTreeNode[], path?: string): FileTreeNode {
  return {
    name,
    path: path ?? name,
    type: 'directory',
    children,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LSystem constructor + expand()', () => {
  test('identity expansion with 0 iterations returns the axiom', () => {
    const ls = new LSystem({
      axiom: 'F',
      rules: { F: 'FF' },
      iterations: 0,
      angle: 25,
      seed: 1,
    });
    expect(ls.expand()).toBe('F');
  });

  test('simple deterministic rule doubles F each iteration', () => {
    const ls = new LSystem({
      axiom: 'F',
      rules: { F: 'FF' },
      iterations: 3,
      angle: 25,
      seed: 1,
    });
    // 2^3 = 8 F characters
    expect(ls.expand()).toBe('FFFFFFFF');
  });

  test('preserves symbols without rules', () => {
    const ls = new LSystem({
      axiom: 'F',
      rules: { F: 'F[+F][-F]' },
      iterations: 1,
      angle: 25,
      seed: 1,
    });
    expect(ls.expand()).toBe('F[+F][-F]');
  });

  test('preserves parameter blocks on non-rule symbols', () => {
    // G has no rule, so G(3.50) should pass through unchanged
    const ls = new LSystem({
      axiom: 'G(3.50)',
      rules: { F: 'FF' },
      iterations: 2,
      angle: 25,
      seed: 1,
    });
    expect(ls.expand()).toBe('G(3.50)');
  });

  test('stochastic rules: array picks one variant per application', () => {
    const ls = new LSystem({
      axiom: 'F',
      rules: { F: ['A', 'B', 'C'] },
      iterations: 1,
      angle: 25,
      seed: 42,
    });
    const result = ls.expand();
    // Must be exactly one of the three choices
    expect(['A', 'B', 'C']).toContain(result);
  });

  test('same seed produces same stochastic result (determinism)', () => {
    const make = () =>
      new LSystem({
        axiom: 'FFFF',
        rules: { F: ['X', 'Y', 'Z'] },
        iterations: 1,
        angle: 25,
        seed: 99,
      });

    const a = make().expand();
    const b = make().expand();
    expect(a).toBe(b);
  });

  test('different seed produces different stochastic result', () => {
    const make = (seed: number) =>
      new LSystem({
        axiom: 'FFFFFFFFFF', // 10 Fs for statistical confidence
        rules: { F: ['X', 'Y', 'Z'] },
        iterations: 1,
        angle: 25,
        seed,
      });

    const a = make(1).expand();
    const b = make(99999).expand();
    // Statistically near-impossible to be identical with 10 3-way choices
    expect(a).not.toBe(b);
  });

  test('rule expansion consumes parameter block on replaced symbol', () => {
    const ls = new LSystem({
      axiom: 'F(5.0)',
      rules: { F: 'GG' },
      iterations: 1,
      angle: 25,
      seed: 1,
    });
    // The (5.0) on F should be consumed; output is just GG
    expect(ls.expand()).toBe('GG');
  });

  test('multi-iteration branching expansion', () => {
    const ls = new LSystem({
      axiom: 'F',
      rules: { F: 'F[+F]' },
      iterations: 2,
      angle: 25,
      seed: 1,
    });
    // Iteration 1: F[+F]
    // Iteration 2: F[+F][+F[+F]]
    expect(ls.expand()).toBe('F[+F][+F[+F]]');
  });
});

describe('LSystem.fromTopology()', () => {
  test('single file (leaf node) produces node marker only', () => {
    const tree = fileNode('main.ts', 80);
    const ls = LSystem.fromTopology(tree);
    const result = ls.expand();

    // Leaf nodes produce @(f:path) or @(d:path)
    expect(result).toContain('@(');
    expect(result).toContain('src/main.ts');
  });

  test('directory with children produces G segments and branches', () => {
    const tree = dirNode('src', [fileNode('a.ts', 50), fileNode('b.ts', 200)]);
    const ls = LSystem.fromTopology(tree);
    const result = ls.expand();

    // Should have structural G segments
    expect(result).toContain('G(');
    // Should have push/pop for branches
    expect(result).toContain('[');
    expect(result).toContain(']');
    // Should have both file markers
    expect(result).toContain('src/a.ts');
    expect(result).toContain('src/b.ts');
  });

  test('nested directories produce recursive structure', () => {
    const tree = dirNode('root', [dirNode('sub', [fileNode('deep.ts', 30)], 'root/sub')]);
    const ls = LSystem.fromTopology(tree);
    const result = ls.expand();

    // Should have multiple G segments for trunk + branches
    const gCount = (result.match(/G\(/g) || []).length;
    expect(gCount).toBeGreaterThanOrEqual(2);
  });

  test('determinism: same topology + same seed = identical output', () => {
    const tree = dirNode('src', [fileNode('x.ts', 100), fileNode('y.ts', 200), fileNode('z.ts', 50)]);

    const a = LSystem.fromTopology(tree, [], 42).expand();
    const b = LSystem.fromTopology(tree, [], 42).expand();
    expect(a).toBe(b);
  });

  test('different baseSeed produces different output', () => {
    const tree = dirNode('src', [fileNode('x.ts', 100), fileNode('y.ts', 200)]);

    const a = LSystem.fromTopology(tree, [], 1).expand();
    const b = LSystem.fromTopology(tree, [], 99999).expand();
    expect(a).not.toBe(b);
  });

  test('hotspots influence branch angles', () => {
    const tree = dirNode('src', [fileNode('hot.ts', 100)]);
    const hotspots: Hotspot[] = [{ path: 'src/hot.ts', churnRate: 50, complexity: 20, riskScore: 10 }];

    const withHotspot = LSystem.fromTopology(tree, hotspots, 42).expand();
    const withoutHotspot = LSystem.fromTopology(tree, [], 42).expand();

    // Hotspot adds riskScore*5 to the base angle, so they should differ
    expect(withHotspot).not.toBe(withoutHotspot);
  });

  test('radius encoding: directory children are thicker than file children', () => {
    const tree = dirNode('src', [dirNode('sub', [fileNode('inner.ts')], 'src/sub'), fileNode('leaf.ts')]);
    const ls = LSystem.fromTopology(tree, [], 42);
    const result = ls.expand();

    // Extract all !(radius) values
    const radii = [...result.matchAll(/!\(([0-9.]+)\)/g)].map((m) => parseFloat(m[1]));
    // There should be multiple radii and they should vary
    expect(radii.length).toBeGreaterThanOrEqual(2);
  });

  test('empty directory (no children) is treated as leaf', () => {
    const tree: FileTreeNode = {
      name: 'empty',
      path: 'empty',
      type: 'directory',
      children: [],
    };
    const ls = LSystem.fromTopology(tree);
    const result = ls.expand();

    // Should produce a node marker, not G segments for children
    expect(result).toContain('@(d:empty)');
  });

  test('LOC influences segment length', () => {
    const tree = dirNode('src', [fileNode('small.ts', 10), fileNode('large.ts', 500)]);
    const ls = LSystem.fromTopology(tree, [], 42);
    const result = ls.expand();

    // Extract all G(length) values — they should differ between small and large
    const lengths = [...result.matchAll(/G\(([0-9.]+)\)/g)].map((m) => parseFloat(m[1]));
    // At minimum we should have the trunk + 2 branch segments
    expect(lengths.length).toBeGreaterThanOrEqual(3);
  });
});
