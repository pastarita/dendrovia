/**
 * NoiseGenerator — produces procedural texture configuration.
 *
 * Maps code topology metrics to noise parameters.
 * IMAGINARIUM only produces the config JSON;
 * actual noise computation happens GPU-side in ARCHITECTUS.
 */

import type { CodeTopology, NoiseFunction } from '@dendrovia/shared';
import { hashString } from '../utils/hash';

export interface NoiseOverrides {
  typeOverride?: NoiseFunction['type'];
  octaveMultiplier?: number;
}

export function generate(topology: CodeTopology, overrides?: NoiseOverrides): NoiseFunction {
  const files = topology.files;
  const avgComplexity = files.length > 0
    ? files.reduce((sum, f) => sum + f.complexity, 0) / files.length
    : 5;

  const hotspots = topology.hotspots ?? [];
  const avgChurn = hotspots.length > 0
    ? hotspots.reduce((sum, h) => sum + h.churnRate, 0) / hotspots.length
    : 0;

  // Map complexity to noise type (overridable)
  let type: NoiseFunction['type'];
  if (overrides?.typeOverride) {
    type = overrides.typeOverride;
  } else if (avgComplexity <= 4) {
    type = 'simplex';
  } else if (avgComplexity <= 8) {
    type = 'perlin';
  } else if (avgComplexity <= 15) {
    type = 'fbm';
  } else {
    type = 'worley';
  }

  // Octaves: more complex = more detail layers (overridable multiplier)
  const octaveMultiplier = overrides?.octaveMultiplier ?? 1;
  const octaves = Math.max(1, Math.min(8, Math.ceil(avgComplexity / 3 * octaveMultiplier)));

  // Frequency: higher churn = higher frequency (more "noise" in the code)
  const frequency = Math.max(0.5, Math.min(4.0, 1.0 + avgChurn * 0.1));

  // Amplitude: moderate — scales with file count
  const amplitude = Math.max(0.1, Math.min(1.0, 0.3 + Math.log10(files.length + 1) * 0.2));

  // Deterministic seed from topology
  const seedStr = hashString(JSON.stringify({
    fileCount: files.length,
    avgComplexity,
    avgChurn,
  }));
  const seed = parseInt(seedStr.substring(0, 8), 16) % 100000;

  return { type, octaves, frequency, amplitude, seed };
}
