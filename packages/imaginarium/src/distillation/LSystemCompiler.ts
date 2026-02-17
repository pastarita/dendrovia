/**
 * LSystemCompiler — maps FileTreeNode structure to L-system branching rules.
 *
 * Each directory's child count determines the branching factor.
 * Iteration depth = min(maxDepth, 5) to respect instruction budget.
 * Hotspot files get special 'H' symbol for twisted/thick branches.
 */

import type { CodeTopology, FileTreeNode, LSystemRule } from '@dendrovia/shared';
import { hashString } from '../utils/hash';

const MAX_ITERATIONS = 5;
const BASE_ANGLE = 25;

export interface LSystemOverrides {
  angleMultiplier?: number;
  iterationOffset?: number;
}

export function compile(topology: CodeTopology, overrides?: LSystemOverrides): LSystemRule {
  const tree = topology.tree;
  const hotspotPaths = new Set((topology.hotspots ?? []).map((h) => h.path));

  // Compute max depth
  const maxDepth = computeDepth(tree);
  const iterationOffset = overrides?.iterationOffset ?? 0;
  const iterations = Math.max(1, Math.min(maxDepth + iterationOffset, MAX_ITERATIONS));

  // Build rules from tree structure
  const rules: Record<string, string> = {};

  // F = forward (draw segment)
  // + = yaw right, - = yaw left
  // & = pitch down, ^ = pitch up
  // [ = push state, ] = pop state
  // H = hotspot branch (thicker, twisted)

  // Main rule derived from root children
  const rootChildren = tree.children?.filter((c) => c.type === 'directory') ?? [];
  const childCount = Math.max(rootChildren.length, 2);

  rules.F = buildBranchRule(childCount, hotspotPaths, tree);

  // Hotspot expansion: thicker, with twist
  rules.H = 'FF[+&F][-^F]';

  // Angle narrows with depth — computed at interpretation time via the angle parameter
  const angleMultiplier = overrides?.angleMultiplier ?? 1;
  const angle = Math.round(BASE_ANGLE * angleMultiplier);

  // Seed-based determinism
  const _seed = hashString(JSON.stringify({ tree: tree.name, files: topology.files.length }));

  return {
    axiom: 'F',
    rules,
    iterations,
    angle,
  };
}

function buildBranchRule(childCount: number, hotspots: Set<string>, node: FileTreeNode): string {
  // Check if any direct children are hotspots
  const hasHotspot = node.children?.some((c) => hotspots.has(c.path)) ?? false;

  if (childCount <= 1) {
    return 'FF';
  } else if (childCount === 2) {
    return hasHotspot ? 'F[+F][-H]' : 'F[+F][-F]';
  } else if (childCount === 3) {
    return hasHotspot ? 'F[+F][-F][&H]' : 'F[+F][-F][&F]';
  } else if (childCount <= 5) {
    return hasHotspot ? 'F[+F][-F][&F][^H]' : 'F[+F][-F][&F][^F]';
  } else {
    // Dense: lots of branches
    return hasHotspot ? 'F[+F][-F][&F][^F][+&H]' : 'F[+F][-F][&F][^F][+&F]';
  }
}

function computeDepth(node: FileTreeNode): number {
  if (!node.children || node.children.length === 0) return 0;
  let max = 0;
  for (const child of node.children) {
    max = Math.max(max, computeDepth(child));
  }
  return 1 + max;
}

export function expandLSystem(rule: LSystemRule): string {
  let result = rule.axiom;
  for (let i = 0; i < rule.iterations; i++) {
    let next = '';
    for (const ch of result) {
      next += rule.rules[ch] ?? ch;
    }
    result = next;
  }
  return result;
}
