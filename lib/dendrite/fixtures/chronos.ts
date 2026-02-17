import type { SourceDiagram } from '../types';

export const chronosFixture: SourceDiagram = {
  id: 'chronos',
  title: 'CHRONOS',
  nodes: [
    { id: 'chronos-root', label: 'CHRONOS', kind: 'root', status: 'implemented', domain: 'chronos' },

    // Phase: Parse
    {
      id: 'chronos-parse',
      label: 'Parse',
      kind: 'phase',
      status: 'implemented',
      domain: 'chronos',
      children: ['chronos-git-parser', 'chronos-ast-parser'],
    },
    {
      id: 'chronos-git-parser',
      label: 'GitParser',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'Hybrid git log parser via Bun.spawn',
    },
    {
      id: 'chronos-ast-parser',
      label: 'ASTParser',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'TypeScript AST analysis',
    },

    // Phase: Analyze
    {
      id: 'chronos-analyze',
      label: 'Analyze',
      kind: 'phase',
      status: 'implemented',
      domain: 'chronos',
      children: ['chronos-complexity', 'chronos-hotspot'],
    },
    {
      id: 'chronos-complexity',
      label: 'ComplexityAnalyzer',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'Cyclomatic complexity scoring',
    },
    {
      id: 'chronos-hotspot',
      label: 'HotspotDetector',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'Change frequency hotspot detection',
    },

    // Phase: Build
    {
      id: 'chronos-build',
      label: 'Build',
      kind: 'phase',
      status: 'implemented',
      domain: 'chronos',
      children: ['chronos-topo', 'chronos-tree', 'chronos-contrib'],
    },
    {
      id: 'chronos-topo',
      label: 'TopologyBuilder',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'Builds topology.json from parsed data',
    },
    {
      id: 'chronos-tree',
      label: 'TreeBuilder',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'Directory tree construction',
    },
    {
      id: 'chronos-contrib',
      label: 'ContributorProfiler',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'Author contribution profiles',
    },

    // Phase: Classify
    {
      id: 'chronos-classify',
      label: 'Classify',
      kind: 'phase',
      status: 'implemented',
      domain: 'chronos',
      children: ['chronos-commit-classifier'],
    },
    {
      id: 'chronos-commit-classifier',
      label: 'CommitClassifier',
      kind: 'section',
      status: 'implemented',
      domain: 'chronos',
      description: 'Conventional commit type classifier',
    },
  ],
  edges: [
    // Pipeline flow
    { source: 'chronos-root', target: 'chronos-parse', relation: 'pipeline-flow' },
    { source: 'chronos-parse', target: 'chronos-analyze', relation: 'pipeline-flow' },
    { source: 'chronos-analyze', target: 'chronos-build', relation: 'pipeline-flow' },
    { source: 'chronos-build', target: 'chronos-classify', relation: 'pipeline-flow' },

    // Containment
    { source: 'chronos-parse', target: 'chronos-git-parser', relation: 'containment' },
    { source: 'chronos-parse', target: 'chronos-ast-parser', relation: 'containment' },
    { source: 'chronos-analyze', target: 'chronos-complexity', relation: 'containment' },
    { source: 'chronos-analyze', target: 'chronos-hotspot', relation: 'containment' },
    { source: 'chronos-build', target: 'chronos-topo', relation: 'containment' },
    { source: 'chronos-build', target: 'chronos-tree', relation: 'containment' },
    { source: 'chronos-build', target: 'chronos-contrib', relation: 'containment' },
    { source: 'chronos-classify', target: 'chronos-commit-classifier', relation: 'containment' },
  ],
};
