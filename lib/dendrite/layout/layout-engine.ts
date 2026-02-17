/**
 * Layout Engine — Transforms source fixtures into positioned ReactFlow nodes/edges.
 *
 * Pipeline:
 *   1. transformFixtureToFlow() — source nodes → ReactFlow nodes + edges
 *   2. applyDagreLayout()       — positions nodes via dagre
 *   3. buildDendriteLayout()    — orchestrates the full pipeline
 */

import dagre from '@dagrejs/dagre';
import type { Edge, Node } from '@xyflow/react';
import { resolveNodeColor } from '../coloring';
import { resolveRuntimeColor } from '../coloring/modes';
import { DT } from '../design-tokens';
import type { ColorMode, LayoutDirection, RuntimeHealth, SourceDiagram, SourceEdge } from '../types';
import { getHiddenNodeIds, getVisibleNodes } from './collapse-manager';

// ---------------------------------------------------------------------------
// Dimension lookup by node kind
// ---------------------------------------------------------------------------

function getDimensions(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'root':
      return { width: DT.rootWidth, height: DT.rootHeight };
    case 'phase':
      return { width: DT.phaseWidth, height: DT.phaseHeight };
    default:
      return { width: DT.sectionWidth, height: DT.sectionHeight };
  }
}

// ---------------------------------------------------------------------------
// Step 1: Source → ReactFlow nodes + edges
// ---------------------------------------------------------------------------

export function transformFixtureToFlow(
  diagram: SourceDiagram,
  collapsed: Set<string>,
  colorMode: ColorMode,
  phaseFilter: string | null,
  runtimeHealthMap?: Map<string, RuntimeHealth>,
): { nodes: Node[]; edges: Edge[] } {
  const hidden = getHiddenNodeIds(diagram, collapsed);
  let visible = getVisibleNodes(diagram, collapsed);

  // Apply phase filter: if set, only show root + matching phase + its children
  if (phaseFilter) {
    const phaseNode = diagram.nodes.find((n) => n.id === phaseFilter && n.kind === 'phase');
    if (phaseNode) {
      const phaseChildIds = new Set(phaseNode.children ?? []);
      visible = visible.filter(
        (n) => n.kind === 'root' || n.id === phaseFilter || (phaseChildIds.has(n.id) && !hidden.has(n.id)),
      );
    }
  }

  const visibleIds = new Set(visible.map((n) => n.id));

  const nodes: Node[] = visible.map((sn) => {
    let colors = resolveNodeColor(colorMode, sn);
    const dims = getDimensions(sn.kind);
    const isCollapsed = collapsed.has(sn.id);
    const hasChildren = (sn.children?.length ?? 0) > 0;

    // In runtime mode, override colors with runtime health if available
    const runtimeHealth = runtimeHealthMap?.get(sn.id);
    if (colorMode === 'runtime' && runtimeHealth) {
      colors = resolveRuntimeColor(runtimeHealth);
    }

    return {
      id: sn.id,
      type: sn.kind === 'root' ? 'pipelineRoot' : sn.kind,
      position: { x: 0, y: 0 }, // dagre will set this
      data: {
        label: sn.label,
        kind: sn.kind,
        status: sn.status,
        domain: sn.domain,
        description: sn.description,
        fill: colors.fill,
        textColor: colors.text,
        isCollapsed,
        hasChildren,
        runtimeHealth,
      },
      style: {
        width: dims.width,
        height: dims.height,
      },
    };
  });

  // Filter edges to only include those between visible nodes
  const edges: Edge[] = diagram.edges
    .filter((se) => visibleIds.has(se.source) && visibleIds.has(se.target))
    .map((se) => toFlowEdge(se));

  return { nodes, edges };
}

function toFlowEdge(se: SourceEdge): Edge {
  return {
    id: `${se.source}->${se.target}`,
    source: se.source,
    target: se.target,
    type: 'flowEdge',
    data: {
      relation: se.relation,
      label: se.label,
      contracts: se.contracts,
    },
    animated: se.relation === 'pipeline-flow',
  };
}

// ---------------------------------------------------------------------------
// Step 2: Dagre layout
// ---------------------------------------------------------------------------

export function applyDagreLayout(nodes: Node[], edges: Edge[], direction: LayoutDirection): Node[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    ranksep: 60,
    nodesep: 30,
    marginx: 20,
    marginy: 20,
  });

  for (const node of nodes) {
    const w = (node.style?.width as number) ?? 160;
    const h = (node.style?.height as number) ?? 36;
    g.setNode(node.id, { width: w, height: h });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const w = (node.style?.width as number) ?? 160;
    const h = (node.style?.height as number) ?? 36;
    return {
      ...node,
      position: {
        x: pos.x - w / 2,
        y: pos.y - h / 2,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Step 3: Full pipeline
// ---------------------------------------------------------------------------

export function buildDendriteLayout(
  diagram: SourceDiagram,
  collapsed: Set<string>,
  direction: LayoutDirection,
  colorMode: ColorMode,
  phaseFilter: string | null,
  runtimeHealthMap?: Map<string, RuntimeHealth>,
): { nodes: Node[]; edges: Edge[] } {
  const { nodes, edges } = transformFixtureToFlow(diagram, collapsed, colorMode, phaseFilter, runtimeHealthMap);
  const positioned = applyDagreLayout(nodes, edges, direction);
  return { nodes: positioned, edges };
}
