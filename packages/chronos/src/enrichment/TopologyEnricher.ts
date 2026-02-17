/**
 * TopologyEnricher — Merge DeepWiki data into topology output
 *
 * Adds an optional `deepwiki` field to the topology. The pipeline
 * produces complete, valid output without it — this is purely additive.
 */

import type { DeepWikiEnrichment } from '@dendrovia/shared';
import type { TopologyOutput } from '../builder/TopologyBuilder.js';

/**
 * Enrich a TopologyOutput with DeepWiki documentation data.
 * Returns a new TopologyOutput with the `deepwiki` field attached.
 */
export function enrichTopology(output: TopologyOutput, deepwiki: DeepWikiEnrichment): TopologyOutput {
  return {
    ...output,
    topology: {
      ...output.topology,
      deepwiki,
    },
  };
}
