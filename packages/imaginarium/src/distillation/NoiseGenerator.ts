/**
 * NoiseGenerator — produces procedural texture configuration.
 *
 * Maps code topology metrics to noise parameters.
 * IMAGINARIUM only produces the config JSON;
 * actual noise computation happens GPU-side in ARCHITECTUS.
 */

import type { CodeTopology, NoiseFunction } from '@dendrovia/shared';
import { hashString } from '../utils/hash.js';

export function generate(topology: CodeTopology): NoiseFunction {
  const files = topology.files;
  const avgComplexity = files.length > 0
    ? files.reduce((sum, f) => sum + f.complexity, 0) / files.length
    : 5;

  const hotspots = topology.hotspots ?? [];
  const avgChurn = hotspots.length > 0
    ? hotspots.reduce((sum, h) => sum + h.churnRate, 0) / hotspots.length
    : 0;

  // Map complexity to noise type
  let type: NoiseFunction['type'];
  if (avgComplexity <= 4) type = 'simplex';
  else if (avgComplexity <= 8) type = 'perlin';
  else if (avgComplexity <= 15) type = 'fbm';
  else type = 'worley';

  // Octaves: more complex = more detail layers
  const octaves = Math.max(1, Math.min(8, Math.ceil(avgComplexity / 3)));

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
