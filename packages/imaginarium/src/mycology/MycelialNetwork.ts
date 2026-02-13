/**
 * MycelialNetwork — constructs the underground hyphal network from
 * import/dependency graphs approximated via co-churn analysis.
 *
 * Real mycorrhizal networks connect trees underground; our networks
 * connect code modules via their observed relationships.
 */

import type { CodeTopology, ParsedFile } from '@dendrovia/shared';
import type {
  MycelialNetwork,
  MycelialNode,
  MycelialEdge,
  HyphalCluster,
  MycorrhizalType,
  SignalType,
  FungalGenus,
} from './types.js';
import { hashString } from '../utils/hash.js';

// ---------------------------------------------------------------------------
// Connection type derivation
// ---------------------------------------------------------------------------

function deriveMycorrhizalType(
  source: ParsedFile,
  target: ParsedFile,
): MycorrhizalType {
  // Deprecated source or target = saprotrophic
  if (source.path.match(/deprecated|legacy|old|dead/i) ||
      target.path.match(/deprecated|legacy|old|dead/i)) return 'saprotrophic';

  // Decorators/patches = parasitic
  if (source.path.match(/decorator|patch|plugin|hook|override/i) ||
      target.path.match(/decorator|patch|plugin|hook|override/i)) return 'parasitic';

  // If one has much higher complexity, likely deep modification
  if (source.complexity > target.complexity * 2 ||
      target.complexity > source.complexity * 2) return 'endomycorrhizal';

  // Default: external wrapping (read-only consumer)
  return 'ectomycorrhizal';
}

function deriveSignalTypes(
  source: ParsedFile,
  target: ParsedFile,
): SignalType[] {
  const signals: SignalType[] = ['nutrient']; // data flow is always present

  // Type files -> salicylic (type information flow)
  if (target.path.match(/type|interface|schema|\.d\.ts/i)) {
    signals.push('salicylic');
  }

  // Error-related -> jasmonic
  if (source.path.match(/error|exception|handler|boundary/i) ||
      target.path.match(/error|exception|handler|boundary/i)) {
    signals.push('jasmonic');
  }

  // Lazy/optional patterns -> strigolactone
  if (source.path.match(/lazy|dynamic|optional|deferred/i)) {
    signals.push('strigolactone');
  }

  return signals;
}

// ---------------------------------------------------------------------------
// Strength calculation
// ---------------------------------------------------------------------------

function calculateStrength(
  coChurnCount: number,
  maxCoChurn: number,
  source: ParsedFile,
  target: ParsedFile,
): number {
  // Normalize co-churn frequency
  const churnStrength = maxCoChurn > 0 ? coChurnCount / maxCoChurn : 0;

  // Boost for same-directory files (likely more tightly coupled)
  const sourceDir = source.path.split('/').slice(0, -1).join('/');
  const targetDir = target.path.split('/').slice(0, -1).join('/');
  const proximityBoost = sourceDir === targetDir ? 0.2 : 0;

  return Math.max(0, Math.min(1, churnStrength * 0.8 + proximityBoost));
}

// ---------------------------------------------------------------------------
// Network construction
// ---------------------------------------------------------------------------

export function buildNetwork(
  topology: CodeTopology,
  genusMap: Map<string, FungalGenus>,
): MycelialNetwork {
  const fileMap = new Map<string, ParsedFile>();
  for (const f of topology.files) {
    fileMap.set(f.path, f);
  }

  // Build co-churn frequency map
  const coChurnFreq = new Map<string, number>();
  for (const commit of topology.commits) {
    const changed = commit.filesChanged.filter(p => fileMap.has(p));
    for (let i = 0; i < changed.length; i++) {
      for (let j = i + 1; j < changed.length; j++) {
        const key = [changed[i], changed[j]].sort().join('|');
        coChurnFreq.set(key, (coChurnFreq.get(key) ?? 0) + 1);
      }
    }
  }

  // Find max co-churn for normalization
  let maxCoChurn = 0;
  for (const count of coChurnFreq.values()) {
    if (count > maxCoChurn) maxCoChurn = count;
  }

  // Build edges (only include connections above threshold)
  const MIN_COCHURN = 2; // at least 2 co-commits to form a connection
  const edges: MycelialEdge[] = [];
  const nodeConnections = new Map<string, number>();

  for (const [key, count] of coChurnFreq.entries()) {
    if (count < MIN_COCHURN) continue;

    const [sourcePath, targetPath] = key.split('|');
    const source = fileMap.get(sourcePath)!;
    const target = fileMap.get(targetPath)!;

    // Check for bidirectional (mutual co-churn above higher threshold)
    const bidirectional = count >= MIN_COCHURN * 3;

    const edge: MycelialEdge = {
      source: sourcePath,
      target: targetPath,
      type: deriveMycorrhizalType(source, target),
      signalTypes: deriveSignalTypes(source, target),
      strength: calculateStrength(count, maxCoChurn, source, target),
      bidirectional,
    };

    edges.push(edge);

    nodeConnections.set(sourcePath, (nodeConnections.get(sourcePath) ?? 0) + 1);
    nodeConnections.set(targetPath, (nodeConnections.get(targetPath) ?? 0) + 1);
  }

  // Determine hub threshold (top 10% by connections)
  const connectionCounts = [...nodeConnections.values()].sort((a, b) => b - a);
  const hubThreshold = connectionCounts.length > 0
    ? connectionCounts[Math.floor(connectionCounts.length * 0.1)] ?? 1
    : 1;

  // Build nodes
  const nodes: MycelialNode[] = topology.files.map(f => ({
    id: f.path,
    genus: genusMap.get(f.path) ?? 'Agaricus',
    connections: nodeConnections.get(f.path) ?? 0,
    isHub: (nodeConnections.get(f.path) ?? 0) >= hubThreshold,
  }));

  const hubNodes = nodes.filter(n => n.isHub).map(n => n.id);

  // Build clusters from directory structure
  const clusters = buildClusters(topology.files, edges);

  return { nodes, edges, clusters, hubNodes };
}

// ---------------------------------------------------------------------------
// Cluster detection (directory-based)
// ---------------------------------------------------------------------------

function buildClusters(
  files: ParsedFile[],
  edges: MycelialEdge[],
): HyphalCluster[] {
  // Group files by top-level directory
  const dirGroups = new Map<string, string[]>();

  for (const f of files) {
    const parts = f.path.split('/');
    // Use first 2 directory levels as cluster key
    const clusterKey = parts.length > 2
      ? parts.slice(0, 2).join('/')
      : parts[0] ?? 'root';

    if (!dirGroups.has(clusterKey)) {
      dirGroups.set(clusterKey, []);
    }
    dirGroups.get(clusterKey)!.push(f.path);
  }

  const clusters: HyphalCluster[] = [];

  for (const [dir, nodeIds] of dirGroups.entries()) {
    const nodeSet = new Set(nodeIds);

    let internalEdges = 0;
    let externalEdges = 0;

    for (const edge of edges) {
      const sourceIn = nodeSet.has(edge.source);
      const targetIn = nodeSet.has(edge.target);

      if (sourceIn && targetIn) {
        internalEdges++;
      } else if (sourceIn || targetIn) {
        externalEdges++;
      }
    }

    // Density: ratio of internal edges to max possible internal edges
    const maxEdges = (nodeIds.length * (nodeIds.length - 1)) / 2;
    const density = maxEdges > 0 ? internalEdges / maxEdges : 0;

    clusters.push({
      id: dir,
      nodeIds,
      internalEdges,
      externalEdges,
      density: Math.min(1, density),
    });
  }

  return clusters;
}
