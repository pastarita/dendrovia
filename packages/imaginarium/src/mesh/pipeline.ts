/**
 * Composable mesh pipeline — functional composition of mesh operations.
 *
 * Inspired by Grasshopper's dataflow wiring, Nervous System's simulation
 * pipelines, and Kangaroo Physics' goal-based solver. Each operation is
 * a pure function `HalfEdgeMesh -> HalfEdgeMesh`, composable via `pipe()`.
 *
 * Usage:
 *   const pipeline = pipe(subdivide(2), inflate(0.03, 50), relax(10));
 *   const result = pipeline(baseMesh);
 */

import type { HalfEdgeMesh } from './HalfEdgeMesh.js';
import { createLogger } from '@dendrovia/shared/logger';

const meshLog = createLogger('IMAGINARIUM', 'mesh-pipeline');

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

/** A synchronous mesh operation: takes a mesh, returns a new mesh. */
export type MeshOp = (mesh: HalfEdgeMesh) => HalfEdgeMesh;

/** An async mesh operation (for GPU-accelerated or Worker-based steps). */
export type AsyncMeshOp = (mesh: HalfEdgeMesh) => Promise<HalfEdgeMesh>;

/** Metadata about a pipeline step (for logging/debugging). */
export interface PipelineStep {
  name: string;
  op: MeshOp;
}

// ---------------------------------------------------------------------------
// Composition functions
// ---------------------------------------------------------------------------

/**
 * Compose multiple MeshOps into a single operation (left-to-right).
 *
 *   const combined = pipe(subdivide(2), relax(10), inflate(0.05));
 *   const result = combined(baseMesh);
 */
export function pipe(...ops: MeshOp[]): MeshOp {
  return (mesh: HalfEdgeMesh) => ops.reduce((m, op) => op(m), mesh);
}

/**
 * Compose async mesh operations sequentially.
 */
export function pipeAsync(...ops: (MeshOp | AsyncMeshOp)[]): AsyncMeshOp {
  return async (mesh: HalfEdgeMesh) => {
    let current = mesh;
    for (const op of ops) {
      current = await op(current);
    }
    return current;
  };
}

/**
 * Apply a MeshOp conditionally.
 *
 *   const maybeSubdivide = when(m => m.faces.length < 100, subdivide(1));
 */
export function when(predicate: (mesh: HalfEdgeMesh) => boolean, op: MeshOp): MeshOp {
  return (mesh) => predicate(mesh) ? op(mesh) : mesh;
}

/**
 * Apply a MeshOp N times.
 *
 *   const growThrice = repeat(3, growStep(config));
 */
export function repeat(n: number, op: MeshOp): MeshOp {
  return (mesh) => {
    let current = mesh;
    for (let i = 0; i < n; i++) {
      current = op(current);
    }
    return current;
  };
}

// ---------------------------------------------------------------------------
// Pipeline builder (fluent API for debugging/logging)
// ---------------------------------------------------------------------------

export class MeshPipeline {
  private steps: PipelineStep[] = [];

  /** Add a named operation to the pipeline. */
  add(name: string, op: MeshOp): this {
    this.steps.push({ name, op });
    return this;
  }

  /** Execute all steps, logging vertex/face counts and timing. */
  execute(mesh: HalfEdgeMesh, verbose = false): HalfEdgeMesh {
    let current = mesh;
    for (const { name, op } of this.steps) {
      const t0 = performance.now();
      current = op(current);
      if (verbose) {
        const dt = (performance.now() - t0).toFixed(1);
        meshLog.debug({ step: name, vertices: current.vertices.length, faces: current.faces.length, durationMs: dt }, 'Mesh step complete');
      }
    }
    return current;
  }

  /** Get the step count. */
  get length(): number {
    return this.steps.length;
  }

  /** Get step names for inspection. */
  get names(): string[] {
    return this.steps.map(s => s.name);
  }
}
