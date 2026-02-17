/**
 * Dendrite Store — Zustand + Immer state management.
 *
 * Manages fixture selection, layout direction, color mode,
 * collapse state, phase filtering, and ReactFlow node/edge state.
 */

import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

enableMapSet();

import type { EdgeChange, NodeChange } from '@xyflow/react';
import { collapseAllIds } from '../layout/collapse-manager';
import { buildDendriteLayout } from '../layout/layout-engine';
import type { ColorMode, DendriteState, LayoutDirection, RuntimeHealth, SourceDiagram } from '../types';

function relayoutFromState(state: DendriteState): void {
  const diagram = state.fixtures[state.activeFixtureId];
  if (!diagram) return;

  const { nodes, edges } = buildDendriteLayout(
    diagram,
    state.collapseState.collapsed,
    state.direction,
    state.colorMode,
    state.phaseFilter,
    state.runtimeHealthMap ?? undefined,
  );

  state.nodes = nodes;
  state.edges = edges;
  state.fitViewTrigger += 1;
}

export function createDendriteStore(fixtures: Record<string, SourceDiagram>, initialFixtureId: string) {
  return create<DendriteState>()(
    immer((set) => {
      const initial = fixtures[initialFixtureId];
      const collapsed = new Set<string>();
      const { nodes, edges } = initial
        ? buildDendriteLayout(initial, collapsed, 'TB', 'status', null)
        : { nodes: [], edges: [] };

      return {
        activeFixtureId: initialFixtureId,
        fixtures,
        direction: 'TB' as LayoutDirection,
        colorMode: 'status' as ColorMode,
        collapseState: { collapsed },
        nodes,
        edges,
        fitViewTrigger: 0,
        phaseFilter: null,
        selectedNodeId: null,
        selectedEdgeId: null,
        runtimeHealthMap: null,

        setFixture: (id: string) =>
          set((state) => {
            state.activeFixtureId = id;
            state.collapseState.collapsed = new Set();
            state.phaseFilter = null;
            relayoutFromState(state);
          }),

        setDirection: (dir: LayoutDirection) =>
          set((state) => {
            state.direction = dir;
            relayoutFromState(state);
          }),

        setColorMode: (mode: ColorMode) =>
          set((state) => {
            state.colorMode = mode;
            relayoutFromState(state);
          }),

        toggleCollapse: (nodeId: string) =>
          set((state) => {
            const c = state.collapseState.collapsed;
            if (c.has(nodeId)) {
              c.delete(nodeId);
            } else {
              c.add(nodeId);
            }
            relayoutFromState(state);
          }),

        collapseAll: () =>
          set((state) => {
            const diagram = state.fixtures[state.activeFixtureId];
            if (!diagram) return;
            state.collapseState.collapsed = collapseAllIds(diagram);
            relayoutFromState(state);
          }),

        expandAll: () =>
          set((state) => {
            state.collapseState.collapsed = new Set();
            relayoutFromState(state);
          }),

        setPhaseFilter: (phase: string | null) =>
          set((state) => {
            state.phaseFilter = phase;
            relayoutFromState(state);
          }),

        selectNode: (nodeId: string) =>
          set((state) => {
            state.selectedNodeId = nodeId;
            state.selectedEdgeId = null;
          }),

        selectEdge: (edgeId: string) =>
          set((state) => {
            state.selectedEdgeId = edgeId;
            state.selectedNodeId = null;
          }),

        clearSelection: () =>
          set((state) => {
            state.selectedNodeId = null;
            state.selectedEdgeId = null;
          }),

        setRuntimeHealthMap: (map: Map<string, RuntimeHealth> | null) =>
          set((state) => {
            state.runtimeHealthMap = map;
            if (state.colorMode === 'runtime') {
              relayoutFromState(state);
            }
          }),

        relayout: () =>
          set((state) => {
            relayoutFromState(state);
          }),

        onNodesChange: (changes: NodeChange[]) =>
          set((state) => {
            state.nodes = applyNodeChanges(changes, state.nodes);
          }),

        onEdgesChange: (changes: EdgeChange[]) =>
          set((state) => {
            state.edges = applyEdgeChanges(changes, state.edges);
          }),
      };
    }),
  );
}
