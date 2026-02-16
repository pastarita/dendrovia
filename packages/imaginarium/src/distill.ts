#!/usr/bin/env bun

/**
 * CLI entry point for IMAGINARIUM distillation pipeline.
 *
 * Usage:
 *   bun run src/distill.ts [topology-path] [output-dir]
 *
 * Defaults:
 *   topology-path: ../chronos/generated/topology.json (or uses mock)
 *   output-dir: ./generated
 */

import { join, resolve } from 'path';
import { distill } from './pipeline/DistillationPipeline';
import { chronosGenerated, imaginariumGenerated } from '@dendrovia/shared/paths';
import { createLogger } from '@dendrovia/shared/logger';

const log = createLogger('IMAGINARIUM', 'distill');

const args = process.argv.slice(2);

const topologyPath = args[0]
  ? resolve(args[0])
  : join(chronosGenerated(), 'topology.json');

const outputDir = args[1]
  ? resolve(args[1])
  : imaginariumGenerated();

process.stdout.write('========================================\n');
process.stdout.write(' IMAGINARIUM - The Compiler\n');
process.stdout.write(' AI -> Shader Distillation\n');
process.stdout.write('========================================\n\n');

try {
  const result = await distill(topologyPath, outputDir);

  log.info({
    palettes: result.palettes.length,
    shaders: result.shaders.length,
    noiseType: result.noise.config.type,
    noiseOctaves: result.noise.config.octaves,
    lsystemIterations: result.lsystem.rule.iterations,
    manifest: result.manifestPath,
    durationMs: result.durationMs,
  }, 'Distillation results');
} catch (err: unknown) {
  log.fatal(err instanceof Error ? err : { error: String(err) }, 'Fatal error');
  process.exit(1);
}
