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
import { distill } from './pipeline/DistillationPipeline.js';
import { chronosGenerated, imaginariumGenerated } from '@dendrovia/shared/paths';

const args = process.argv.slice(2);

const topologyPath = args[0]
  ? resolve(args[0])
  : join(chronosGenerated(), 'topology.json');

const outputDir = args[1]
  ? resolve(args[1])
  : imaginariumGenerated();

console.log('========================================');
console.log(' IMAGINARIUM - The Compiler');
console.log(' AI -> Shader Distillation');
console.log('========================================\n');

try {
  const result = await distill(topologyPath, outputDir);

  console.log('\n--- Results ---');
  console.log(`  Palettes: ${result.palettes.length}`);
  console.log(`  Shaders:  ${result.shaders.length}`);
  console.log(`  Noise:    ${result.noise.config.type} (${result.noise.config.octaves} octaves)`);
  console.log(`  L-System: ${result.lsystem.rule.iterations} iterations`);
  console.log(`  Manifest: ${result.manifestPath}`);
  console.log(`  Duration: ${result.durationMs}ms\n`);
} catch (err) {
  console.error('[IMAGINARIUM] Fatal error:', err);
  process.exit(1);
}
