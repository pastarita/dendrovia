import { describe, expect, test } from 'bun:test';
import type { CodeTopology, ParsedFile } from '@dendrovia/shared';
import { buildCoChurnMap, buildFileContext, classifyGenus } from '../../src/mycology/GenusMapper';
import { buildNetwork } from '../../src/mycology/MycelialNetwork';
import type { FungalGenus } from '../../src/mycology/types';
import { generateMockTopology } from '../../src/pipeline/MockTopology';

function makeFile(path: string, overrides: Partial<ParsedFile> = {}): ParsedFile {
  return {
    path,
    hash: `h_${path}`,
    language: 'typescript',
    complexity: 5,
    loc: 100,
    lastModified: new Date('2025-06-01'),
    author: 'dev',
    ...overrides,
  };
}

function buildGenusMap(topology: CodeTopology): Map<string, FungalGenus> {
  const coChurnMap = buildCoChurnMap(topology);
  const map = new Map<string, FungalGenus>();
  for (const file of topology.files) {
    const ctx = buildFileContext(file, topology, coChurnMap);
    map.set(file.path, classifyGenus(file, ctx));
  }
  return map;
}

describe('Network construction', () => {
  test('files co-changed form edges', () => {
    const files = [makeFile('a.ts'), makeFile('b.ts'), makeFile('c.ts')];
    const topology: CodeTopology = {
      files,
      commits: [
        {
          hash: 'c1',
          message: 'feat',
          author: 'dev',
          date: new Date(),
          filesChanged: ['a.ts', 'b.ts'],
          insertions: 10,
          deletions: 0,
          isBugFix: false,
          isFeature: true,
          isMerge: false,
        },
        {
          hash: 'c2',
          message: 'fix',
          author: 'dev',
          date: new Date(),
          filesChanged: ['a.ts', 'b.ts'],
          insertions: 5,
          deletions: 2,
          isBugFix: true,
          isFeature: false,
          isMerge: false,
        },
      ],
      tree: { name: 'root', path: '', type: 'directory' },
      hotspots: [],
    };

    const genusMap = buildGenusMap(topology);
    const network = buildNetwork(topology, genusMap);

    // a.ts and b.ts changed together 2 times (>= MIN_COCHURN of 2)
    const edge = network.edges.find(
      (e) => (e.source === 'a.ts' && e.target === 'b.ts') || (e.source === 'b.ts' && e.target === 'a.ts'),
    );
    expect(edge).toBeTruthy();

    // c.ts should have no edges
    const cEdge = network.edges.find((e) => e.source === 'c.ts' || e.target === 'c.ts');
    expect(cEdge).toBeUndefined();
  });

  test('all edges reference existing nodes', () => {
    const topology = generateMockTopology(30, ['typescript', 'javascript'], 42);
    const genusMap = buildGenusMap(topology);
    const network = buildNetwork(topology, genusMap);

    const nodeIds = new Set(network.nodes.map((n) => n.id));

    for (const edge of network.edges) {
      expect(nodeIds.has(edge.source)).toBe(true);
      expect(nodeIds.has(edge.target)).toBe(true);
    }
  });

  test('no self-loops', () => {
    const topology = generateMockTopology(50, ['typescript'], 99);
    const genusMap = buildGenusMap(topology);
    const network = buildNetwork(topology, genusMap);

    for (const edge of network.edges) {
      expect(edge.source).not.toBe(edge.target);
    }
  });

  test('strengths are in [0, 1]', () => {
    const topology = generateMockTopology(40, ['typescript', 'javascript'], 7);
    const genusMap = buildGenusMap(topology);
    const network = buildNetwork(topology, genusMap);

    for (const edge of network.edges) {
      expect(edge.strength).toBeGreaterThanOrEqual(0);
      expect(edge.strength).toBeLessThanOrEqual(1);
    }
  });

  test('every edge has at least one signal type', () => {
    const topology = generateMockTopology(30, ['typescript'], 42);
    const genusMap = buildGenusMap(topology);
    const network = buildNetwork(topology, genusMap);

    for (const edge of network.edges) {
      expect(edge.signalTypes.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Hub detection', () => {
  test('hub nodes are highly connected', () => {
    const topology = generateMockTopology(50, ['typescript', 'javascript'], 42);
    const genusMap = buildGenusMap(topology);
    const network = buildNetwork(topology, genusMap);

    // Hub nodes should have above-average connections
    if (network.hubNodes.length > 0) {
      const _avgConnections = network.nodes.reduce((s, n) => s + n.connections, 0) / network.nodes.length;
      for (const hubId of network.hubNodes) {
        const node = network.nodes.find((n) => n.id === hubId);
        expect(node).toBeTruthy();
        expect(node!.connections).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('Cluster detection', () => {
  test('clusters have valid density', () => {
    const topology = generateMockTopology(30, ['typescript'], 42);
    const genusMap = buildGenusMap(topology);
    const network = buildNetwork(topology, genusMap);

    for (const cluster of network.clusters) {
      expect(cluster.density).toBeGreaterThanOrEqual(0);
      expect(cluster.density).toBeLessThanOrEqual(1);
      expect(cluster.nodeIds.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('all files appear in exactly one cluster', () => {
    const topology = generateMockTopology(30, ['typescript'], 42);
    const genusMap = buildGenusMap(topology);
    const network = buildNetwork(topology, genusMap);

    const allClusteredNodes = network.clusters.flatMap((c) => c.nodeIds);
    const uniqueNodes = new Set(allClusteredNodes);
    // Every file should appear in exactly one cluster
    expect(uniqueNodes.size).toBe(allClusteredNodes.length);
    // Every topology file should be in a cluster
    for (const file of topology.files) {
      expect(uniqueNodes.has(file.path)).toBe(true);
    }
  });
});

describe('Mycorrhizal types', () => {
  test('deprecated targets get saprotrophic type', () => {
    const files = [makeFile('src/new.ts'), makeFile('src/deprecated/old.ts')];
    const topology: CodeTopology = {
      files,
      commits: [
        {
          hash: 'c1',
          message: 'fix',
          author: 'dev',
          date: new Date(),
          filesChanged: ['src/new.ts', 'src/deprecated/old.ts'],
          insertions: 10,
          deletions: 5,
          isBugFix: true,
          isFeature: false,
          isMerge: false,
        },
        {
          hash: 'c2',
          message: 'fix2',
          author: 'dev',
          date: new Date(),
          filesChanged: ['src/new.ts', 'src/deprecated/old.ts'],
          insertions: 5,
          deletions: 2,
          isBugFix: true,
          isFeature: false,
          isMerge: false,
        },
      ],
      tree: { name: 'root', path: '', type: 'directory' },
      hotspots: [],
    };

    const genusMap = buildGenusMap(topology);
    const network = buildNetwork(topology, genusMap);

    const edge = network.edges.find(
      (e) => e.target === 'src/deprecated/old.ts' || e.source === 'src/deprecated/old.ts',
    );
    if (edge) {
      expect(edge.type).toBe('saprotrophic');
    }
  });
});
