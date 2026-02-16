import type { FileTreeNode, Hotspot } from '@dendrovia/shared';

/**
 * L-SYSTEM ENGINE
 *
 * Parametric + Stochastic L-System for generating dendrite tree structures
 * from code topology data. Production rules carry code metrics as parameters
 * (complexity, churn, LOC), with stochastic variation seeded by file hashes
 * for organic feel.
 *
 * Standard turtle symbols:
 *   F(len)     - Move forward, draw segment of length `len`
 *   +(angle)   - Yaw left
 *   -(angle)   - Yaw right
 *   ^(angle)   - Pitch up
 *   &(angle)   - Pitch down
 *   /(angle)   - Roll right
 *   \(angle)   - Roll left
 *   [          - Push turtle state
 *   ]          - Pop turtle state
 *   !(radius)  - Set branch radius
 *   @(id)      - Place node marker (file/directory)
 */

export interface LSystemParams {
  /** Starting string */
  axiom: string;
  /** Production rules: symbol → replacement string */
  rules: Record<string, string | string[]>;
  /** Number of expansion iterations */
  iterations: number;
  /** Default branch angle in degrees */
  angle: number;
  /** Stochastic seed for reproducibility */
  seed: number;
}

/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Ensures deterministic stochastic variation per-file.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Simple hash function for strings → deterministic seed.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

export class LSystem {
  private params: LSystemParams;
  private rng: () => number;

  constructor(params: LSystemParams) {
    this.params = params;
    this.rng = mulberry32(params.seed);
  }

  /**
   * Expand the L-system axiom by applying production rules.
   *
   * Only symbols with matching rules are expanded. Symbols like G (topology-
   * encoded forward) pass through unchanged with their parameters preserved.
   * When a rule replaces a symbol, any following parameter block is consumed
   * (dropped) — the rule's own symbols carry their own parameters.
   */
  expand(): string {
    let current = this.params.axiom;

    for (let iter = 0; iter < this.params.iterations; iter++) {
      let next = '';
      let i = 0;

      while (i < current.length) {
        const char = current[i]!;

        // Skip parameter blocks — copy them through unchanged
        if (char === '(' || char === '[' || char === ']') {
          if (char === '(') {
            const closeIdx = current.indexOf(')', i);
            next += current.slice(i, closeIdx + 1);
            i = closeIdx + 1;
          } else {
            next += char;
            i++;
          }
          continue;
        }

        // Look up production rule
        const rule = this.params.rules[char];
        if (rule) {
          if (Array.isArray(rule)) {
            const idx = Math.floor(this.rng() * rule.length);
            next += rule[idx];
          } else {
            next += rule;
          }
          // Consume following parameter block (replaced by rule output)
          if (i + 1 < current.length && current[i + 1] === '(') {
            const closeIdx = current.indexOf(')', i + 1);
            if (closeIdx !== -1) i = closeIdx;
          }
        } else {
          // No rule → identity (pass through with parameters)
          next += char;
        }

        i++;
      }

      current = next;
    }

    return current;
  }

  /**
   * Generate L-System parameters from a FileTreeNode (code topology).
   *
   * Uses G (structural forward) for topology-encoded segments that preserve
   * their parametric lengths/radii through expansion. Adds F (organic forward)
   * at leaf tips, which rules expand into small branching clusters.
   */
  static fromTopology(
    tree: FileTreeNode,
    hotspots: Hotspot[] = [],
    baseSeed = 42
  ): LSystem {
    const seed = hashString(tree.path) + baseSeed;
    const rng = mulberry32(seed);

    // Build axiom from directory structure (G = structural, F = organic tips)
    const axiom = LSystem.buildAxiom(tree, hotspots, 0.3, rng);

    // Only F is expanded — G passes through unchanged, preserving topology
    const rules: Record<string, string | string[]> = {
      F: [
        'G[+G][-G]',           // Symmetric branching cluster
        'G[+G]G[-G]',          // Alternating cluster
        'G[^G][&G]',           // Vertical spread
      ],
    };

    // 1 iteration: just expand F tips into small clusters
    return new LSystem({ axiom, rules, iterations: 1, angle: 25, seed });
  }

  /**
   * Build axiom string from file tree structure.
   *
   * G = structural forward (topology-encoded, not expanded by rules)
   * F = organic tips at leaf nodes (expanded into small clusters)
   * Parameters on G segments preserve LOC-based lengths and radii.
   */
  private static buildAxiom(
    tree: FileTreeNode,
    hotspots: Hotspot[],
    parentRadius: number,
    rng: () => number,
  ): string {
    if (!tree.children || tree.children.length === 0) {
      const t = tree.type === 'directory' ? 'd' : 'f';
      return `@(${t}:${tree.path})`;
    }

    const parts: string[] = [];

    // Trunk segment — radius scales with depth, length slightly varied
    const trunkRadius = parentRadius;
    const trunkLen = 2.5 + rng() * 1.5; // 2.5–4.0
    parts.push(`!(${trunkRadius.toFixed(3)})G(${trunkLen.toFixed(2)})`);

    const angleStep = 360 / Math.max(tree.children.length, 1);

    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i]!;
      const hotspot = hotspots.find((h) => h.path === child.path);

      // Radius: directories thicker, files thinner, scaled from parent
      const radius = child.type === 'directory'
        ? parentRadius * 0.7
        : parentRadius * 0.4;

      // Length from LOC (files) or default (directories), scaled up for visibility
      const baseLength = child.metadata
        ? Math.max(1.5, Math.min(6, child.metadata.loc / 40))
        : 2.5;
      // Organic perturbation: ±20%
      const length = baseLength * (0.8 + rng() * 0.4);

      // Branch angle: wider spread for visible tree shape
      const riskTwist = hotspot ? hotspot.riskScore * 5 : 0;
      const baseAngle = 45 + riskTwist;
      const angle = baseAngle + (rng() - 0.5) * 15; // ±7.5° random

      // Random pitch for 3D spread (not all in XZ plane)
      const pitch = (rng() - 0.5) * 30; // ±15° pitch variation

      parts.push('['); // Push state
      parts.push(`/(${(angleStep * i).toFixed(1)})`); // Distribute around trunk
      parts.push(`+(${angle.toFixed(1)})`); // Yaw angle
      if (Math.abs(pitch) > 2) {
        parts.push(`^(${pitch.toFixed(1)})`); // Pitch variation (skip if tiny)
      }
      parts.push(`!(${radius.toFixed(3)})`); // Set radius
      parts.push(`G(${length.toFixed(2)})`); // Structural branch segment

      if (child.type === 'directory' && child.children?.length) {
        // Recurse: child directories build their own sub-axioms
        parts.push(LSystem.buildAxiom(child, hotspots, radius, rng));
      } else {
        // File leaf: node marker + organic tip for visual richness
        parts.push(`@(f:${child.path})`);
        parts.push(`!(${(radius * 0.5).toFixed(3)})F`); // Tiny F tip → expanded by rules
      }

      parts.push(']'); // Pop state
    }

    return parts.join('');
  }
}
